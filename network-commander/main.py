from __future__ import annotations

import asyncio
import json
import os
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel


DEFAULT_INTERFACE = os.environ.get("CAPTIVE_INTERFACE", "wlp2s0")
DEFAULT_GATEWAY = os.environ.get("CAPTIVE_GATEWAY", "192.168.77.1")
DEFAULT_CIDR = os.environ.get("CAPTIVE_CIDR", "24")
DEFAULT_SSID = os.environ.get("CAPTIVE_SSID", "Mark-Attendence")
DEFAULT_CHANNEL = os.environ.get("CAPTIVE_CHANNEL", "6")
DEFAULT_BACKEND = os.environ.get("CAPTIVE_BACKEND_URL", "http://127.0.0.1:8090")
COMMANDER_SECRET = os.environ.get("CAPTIVE_COMMANDER_SECRET", "dev-captive-secret")
WORK_DIR = Path(os.environ.get("CAPTIVE_WORK_DIR", "/tmp/nuked-arp-lock"))


class StartRequest(BaseModel):
    sessionId: int
    courseCode: str | None = None
    section: str | None = None
    topic: str | None = None
    endsAt: str | None = None
    backendBaseUrl: str | None = None
    interface: str | None = None
    gateway: str | None = None
    ssid: str | None = None


class StopRequest(BaseModel):
    sessionId: int | None = None


class MarkRequest(BaseModel):
    rollNo: str
    deviceUuid: str | None = None
    clientFingerprint: str | None = None


@dataclass
class ActiveSession:
    session_id: int
    backend_base_url: str
    interface: str
    gateway: str
    ssid: str
    course_code: str | None = None
    section: str | None = None
    topic: str | None = None
    ends_at: str | None = None
    hostapd_pid: int | None = None
    dnsmasq_pid: int | None = None
    started_at: float = time.time()


app = FastAPI(title="NUKED Automated Attendence Network Commander")
active: ActiveSession | None = None
hostapd_proc: subprocess.Popen[bytes] | None = None
dnsmasq_proc: subprocess.Popen[bytes] | None = None
expiry_task: asyncio.Task[Any] | None = None


def require_secret(secret: str | None) -> None:
    if secret != COMMANDER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid captive commander secret.")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, text=True, capture_output=True, check=check)


def is_root() -> bool:
    return hasattr(os, "geteuid") and os.geteuid() == 0


def ensure_root() -> None:
    if not is_root():
        raise HTTPException(status_code=500, detail="Network commander must be started with sudo/root.")


def write_configs(session: ActiveSession) -> tuple[Path, Path]:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    hostapd_conf = WORK_DIR / "hostapd.conf"
    dnsmasq_conf = WORK_DIR / "dnsmasq.conf"

    hostapd_conf.write_text(
        "\n".join(
            [
                f"interface={session.interface}",
                "driver=nl80211",
                f"ssid={session.ssid}",
                "hw_mode=g",
                f"channel={DEFAULT_CHANNEL}",
                "auth_algs=1",
                "ignore_broadcast_ssid=0",
                "ieee80211n=1",
                "wmm_enabled=1",
                "",
            ]
        ),
        encoding="utf-8",
    )

    dnsmasq_conf.write_text(
        "\n".join(
            [
                f"interface={session.interface}",
                "bind-interfaces",
                "domain-needed",
                "bogus-priv",
                "no-resolv",
                "log-dhcp",
                f"dhcp-range={dhcp_range(session.gateway)},12h",
                f"dhcp-option=3,{session.gateway}",
                f"dhcp-option=6,{session.gateway}",
                f"dhcp-option=114,http://attendence.fast/portal",
                "address=/#/" + session.gateway,
                "address=/attendance.fast/" + session.gateway,
                "address=/attendence.fast/" + session.gateway,
                "",
            ]
        ),
        encoding="utf-8",
    )
    return hostapd_conf, dnsmasq_conf


def dhcp_range(gateway: str) -> str:
    parts = gateway.split(".")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail=f"Invalid gateway IP: {gateway}")
    prefix = ".".join(parts[:3])
    return f"{prefix}.10,{prefix}.200,255.255.255.0"


def configure_interface(interface: str, gateway: str) -> None:
    run(["nmcli", "device", "disconnect", interface], check=False)
    run(["nmcli", "device", "set", interface, "managed", "no"], check=False)
    run(["ip", "link", "set", interface, "down"])
    run(["ip", "addr", "flush", "dev", interface], check=False)
    run(["ip", "addr", "add", f"{gateway}/{DEFAULT_CIDR}", "dev", interface])
    run(["ip", "link", "set", interface, "up"])


def restore_interface(interface: str) -> None:
    run(["ip", "addr", "flush", "dev", interface], check=False)
    run(["ip", "link", "set", interface, "down"], check=False)
    run(["nmcli", "device", "set", interface, "managed", "yes"], check=False)
    run(["nmcli", "radio", "wifi", "on"], check=False)
    run(["nmcli", "device", "connect", interface], check=False)


def start_processes(hostapd_conf: Path, dnsmasq_conf: Path) -> tuple[subprocess.Popen[bytes], subprocess.Popen[bytes]]:
    hostapd_log = open(WORK_DIR / "hostapd.log", "ab", buffering=0)
    dnsmasq_log = open(WORK_DIR / "dnsmasq.log", "ab", buffering=0)
    hostapd = subprocess.Popen(["hostapd", str(hostapd_conf)], stdout=hostapd_log, stderr=subprocess.STDOUT)
    time.sleep(1)
    if hostapd.poll() is not None:
        raise HTTPException(status_code=500, detail="hostapd failed to start. Check /tmp/nuked-arp-lock/hostapd.log.")
    dnsmasq = subprocess.Popen(["dnsmasq", "--keep-in-foreground", "--conf-file=" + str(dnsmasq_conf)], stdout=dnsmasq_log, stderr=subprocess.STDOUT)
    time.sleep(1)
    if dnsmasq.poll() is not None:
        stop_process(hostapd)
        raise HTTPException(status_code=500, detail="dnsmasq failed to start. Check /tmp/nuked-arp-lock/dnsmasq.log.")
    return hostapd, dnsmasq


def stop_process(proc: subprocess.Popen[bytes] | None) -> None:
    if proc is None or proc.poll() is not None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()


def stop_network() -> None:
    global active, hostapd_proc, dnsmasq_proc
    interface = active.interface if active else DEFAULT_INTERFACE
    stop_process(dnsmasq_proc)
    stop_process(hostapd_proc)
    dnsmasq_proc = None
    hostapd_proc = None
    restore_interface(interface)
    active = None


def parse_ends_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


async def expiry_watch() -> None:
    while True:
        await asyncio.sleep(2)
        session = active
        if not session:
            continue
        ends_at = parse_ends_at(session.ends_at)
        if ends_at and datetime.now(timezone.utc) >= ends_at:
            stop_network()


def mac_for_ip(ip: str) -> str | None:
    try:
        with open("/proc/net/arp", "r", encoding="utf-8") as arp:
            next(arp, None)
            for line in arp:
                cols = line.split()
                if len(cols) >= 6 and cols[0] == ip:
                    mac = cols[3].lower()
                    if mac != "00:00:00:00:00:00":
                        return mac
    except FileNotFoundError:
        return None
    return None


def backend_mark_url() -> str:
    if not active:
        raise HTTPException(status_code=409, detail="No active attendance session.")
    return active.backend_base_url.rstrip("/") + "/api/captive/attendance/mark"


def post_to_backend(payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        backend_mark_url(),
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Captive-Secret": COMMANDER_SECRET,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        text = err.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(text)
            detail = parsed.get("message") or parsed.get("detail") or text
        except json.JSONDecodeError:
            detail = text or str(err)
        raise HTTPException(status_code=err.code, detail=detail)
    except urllib.error.URLError as err:
        raise HTTPException(status_code=502, detail=f"Backend is not reachable: {err.reason}")


@app.post("/control/start")
def control_start(req: StartRequest, x_captive_secret: str | None = Header(default=None)) -> dict[str, Any]:
    global active, hostapd_proc, dnsmasq_proc
    require_secret(x_captive_secret)
    ensure_root()
    if active:
        stop_network()

    session = ActiveSession(
        session_id=req.sessionId,
        backend_base_url=req.backendBaseUrl or DEFAULT_BACKEND,
        interface=req.interface or DEFAULT_INTERFACE,
        gateway=req.gateway or DEFAULT_GATEWAY,
        ssid=req.ssid or DEFAULT_SSID,
        course_code=req.courseCode,
        section=req.section,
        topic=req.topic,
        ends_at=req.endsAt,
        started_at=time.time(),
    )
    hostapd_conf, dnsmasq_conf = write_configs(session)
    configure_interface(session.interface, session.gateway)
    hostapd_proc, dnsmasq_proc = start_processes(hostapd_conf, dnsmasq_conf)
    session.hostapd_pid = hostapd_proc.pid
    session.dnsmasq_pid = dnsmasq_proc.pid
    active = session
    return status_payload()


@app.post("/control/stop")
def control_stop(_: StopRequest, x_captive_secret: str | None = Header(default=None)) -> dict[str, Any]:
    require_secret(x_captive_secret)
    ensure_root()
    stop_network()
    return status_payload()


@app.get("/control/status")
def control_status(x_captive_secret: str | None = Header(default=None)) -> dict[str, Any]:
    require_secret(x_captive_secret)
    return status_payload()


def status_payload() -> dict[str, Any]:
    return {
        "active": active is not None,
        "sessionId": active.session_id if active else None,
        "ssid": active.ssid if active else DEFAULT_SSID,
        "gateway": active.gateway if active else DEFAULT_GATEWAY,
        "interface": active.interface if active else DEFAULT_INTERFACE,
        "url": "http://attendence.fast",
        "hostapdPid": active.hostapd_pid if active else None,
        "dnsmasqPid": active.dnsmasq_pid if active else None,
    }


@app.post("/api/mark")
async def mark(request: Request, mark_req: MarkRequest) -> JSONResponse:
    if not active:
        raise HTTPException(status_code=409, detail="Attendence is not open right now.")
    client_ip = request.client.host if request.client else ""
    client_mac = mac_for_ip(client_ip)
    payload = {
        "sessionId": active.session_id,
        "rollNo": mark_req.rollNo,
        "deviceUuid": mark_req.deviceUuid,
        "clientFingerprint": mark_req.clientFingerprint,
        "clientIp": client_ip,
        "clientMac": client_mac,
    }
    data = post_to_backend(payload)
    return JSONResponse({"ok": True, "message": "Attendence marked.", "data": data})


@app.get("/portal", response_class=HTMLResponse)
def portal() -> str:
    return portal_html()


@app.get("/")
def root(request: Request):
    host = request.headers.get("host", "")
    if "attendence.fast" in host or "attendance.fast" in host:
        return HTMLResponse(content=portal_html())
    return RedirectResponse(url="http://attendence.fast/portal", status_code=302)


@app.get("/generate_204")
@app.get("/gen_204")
@app.get("/hotspot-detect.html")
@app.get("/ncsi.txt")
@app.get("/connecttest.txt")
@app.get("/canonical.html")
@app.get("/success.txt")
def captive_probe():
    return RedirectResponse(url="http://attendence.fast/portal", status_code=302)


@app.get("/{_:path}")
def catch_all(request: Request, _: str):
    host = request.headers.get("host", "")
    if "attendence.fast" in host or "attendance.fast" in host:
        return HTMLResponse(content=portal_html())
    return RedirectResponse(url="http://attendence.fast/portal", status_code=302)


def portal_html() -> str:
    session_label = "Attendance"
    if active and active.course_code:
        session_label = active.course_code + (f" · {active.section}" if active.section else "")
    topic = active.topic if active and active.topic else ""
    session_id = active.session_id if active else 0
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NUKED Automated Attendence</title>
  <style>
    * {{ box-sizing: border-box; }}
    :root {{
      --ink: #07152d;
      --ink-2: #0b2346;
      --paper: #eef5ff;
      --card: #f8fbff;
      --line: #061227;
      --accent: #0ea5e9;
      --burn: #f59e0b;
      --good: #10b981;
      --bad: #dc2626;
      --muted: #64748b;
    }}
    body {{
      margin: 0;
      min-height: 100vh;
      color: var(--line);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 1px 1px, rgba(7, 21, 45, .14) 1px, transparent 0) 0 0 / 22px 22px,
        linear-gradient(180deg, #eaf3ff 0%, #f7fbff 100%);
    }}
    .topbar {{
      background: var(--ink);
      color: white;
      border-bottom: 2px solid var(--line);
      padding: 16px max(18px, env(safe-area-inset-left));
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .bolt {{
      width: 42px;
      height: 42px;
      border: 2px solid #020817;
      border-radius: 8px;
      background: #132f5f;
      display: grid;
      place-items: center;
      box-shadow: 4px 4px 0 #020817;
      font-weight: 1000;
      color: #7dd3fc;
    }}
    .brand {{ line-height: 1.1; }}
    .brand strong {{ display: block; font-size: 18px; letter-spacing: .04em; }}
    .brand span {{ display: block; font-size: 11px; color: #bfdbfe; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; margin-top: 3px; }}
    .wrap {{
      width: min(100%, 520px);
      margin: 0 auto;
      padding: 22px 16px 28px;
    }}
    main {{
      background: var(--card);
      border: 2px solid var(--line);
      border-radius: 8px;
      box-shadow: 6px 6px 0 var(--line);
      overflow: hidden;
    }}
    .head {{
      background: #dbe7f5;
      border-bottom: 2px solid var(--line);
      padding: 18px;
    }}
    .label {{ font-size: 11px; font-weight: 1000; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); }}
    h1 {{ margin: 10px 0 6px; font-size: clamp(28px, 8vw, 42px); line-height: 1.03; letter-spacing: 0; }}
    p {{ margin: 0; color: #334155; font-size: 14px; line-height: 1.45; font-weight: 750; }}
    form {{ padding: 18px; }}
    .field-label {{ display: block; margin-bottom: 8px; font-size: 11px; font-weight: 1000; letter-spacing: .14em; text-transform: uppercase; color: var(--ink); }}
    input {{
      width: 100%;
      border: 2px solid var(--line);
      border-radius: 8px;
      background: white;
      padding: 16px 14px;
      font-size: clamp(24px, 8vw, 34px);
      line-height: 1;
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: .04em;
      outline: none;
      box-shadow: inset 3px 3px 0 #dbe7f5;
    }}
    input:focus {{ border-color: var(--accent); box-shadow: inset 3px 3px 0 #dbe7f5, 0 0 0 4px rgba(14, 165, 233, .18); }}
    button {{
      width: 100%;
      min-height: 54px;
      margin-top: 14px;
      border: 2px solid var(--line);
      border-radius: 8px;
      background: var(--ink);
      color: white;
      padding: 14px 12px;
      font-size: 13px;
      font-weight: 1000;
      letter-spacing: .12em;
      text-transform: uppercase;
      box-shadow: 4px 4px 0 var(--line);
    }}
    button:active {{ transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--line); }}
    button:disabled {{ opacity: .6; }}
    .msg {{ margin-top: 14px; border: 2px solid var(--line); border-radius: 8px; padding: 13px; font-size: 13px; font-weight: 900; display: none; line-height: 1.35; }}
    .ok {{ display: block; background: var(--good); color: white; }}
    .err {{ display: block; background: var(--bad); color: white; }}
    .hint {{
      margin-top: 14px;
      background: #e0f2fe;
      border: 2px dashed #075985;
      border-radius: 8px;
      padding: 11px 12px;
      color: #075985;
      font-size: 12px;
      font-weight: 900;
      line-height: 1.35;
    }}
    .footer {{
      text-align: center;
      color: var(--muted);
      font-size: 11px;
      font-weight: 850;
      margin-top: 16px;
      text-transform: uppercase;
      letter-spacing: .12em;
    }}
    @media (max-width: 380px) {{
      .wrap {{ padding: 14px 10px 22px; }}
      .head, form {{ padding: 14px; }}
      button {{ font-size: 12px; letter-spacing: .08em; }}
    }}
  </style>
</head>
<body>
  <div class="topbar">
    <div class="bolt">N</div>
    <div class="brand"><strong>NUKED</strong><span>Automated Attendence</span></div>
  </div>
  <div class="wrap">
    <main>
      <section class="head">
        <div class="label">{session_label}</div>
        <h1>Mark Attendence</h1>
        <p>{topic or "Enter your roll number exactly as shown on your student record."}</p>
      </section>
      <form id="markForm">
        <label class="field-label" for="roll">Roll Number</label>
        <input id="roll" autocomplete="off" inputmode="text" placeholder="24L-3072" maxlength="8" required>
        <button id="submit" type="submit">Mark Attendence</button>
        <div id="message" class="msg"></div>
        <div class="hint">Connected to Mark-Attendence. Open attendence.fast, enter roll no, then tap Mark Attendence.</div>
      </form>
    </main>
    <div class="footer">NUKED academic system</div>
  </div>
  <script>
    const SESSION_ID = {session_id};
    const roll = document.getElementById('roll');
    const form = document.getElementById('markForm');
    const button = document.getElementById('submit');
    const message = document.getElementById('message');
    const rollRegex = /^[0-9]{{2}}[A-Z]-[0-9]{{4}}$/;

    function deviceUuid() {{
      const key = 'nuked_attendence_device_id_' + SESSION_ID;
      let id = localStorage.getItem(key);
      if (!id) {{
        id = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
        localStorage.setItem(key, id);
      }}
      return id;
    }}

    function fingerprint() {{
      const screenValue = `${{screen.width || 0}}x${{screen.height || 0}}@${{window.devicePixelRatio || 1}}`;
      const lang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      let tz = '';
      try {{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }} catch (_) {{}}
      return `${{screenValue}}|${{lang}}|${{tz}}`;
    }}

    function show(kind, text) {{
      message.className = 'msg ' + kind;
      message.textContent = text;
    }}

    roll.addEventListener('input', () => {{
      let value = roll.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3, 7);
      roll.value = value;
    }});

    form.addEventListener('submit', async (event) => {{
      event.preventDefault();
      const rollNo = roll.value.trim().toUpperCase();
      if (!rollRegex.test(rollNo)) {{
        show('err', 'Enter a valid roll number like 24L-3072.');
        return;
      }}
      button.disabled = true;
      button.textContent = 'Marking...';
      try {{
        const res = await fetch('/api/mark', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{
            rollNo,
            deviceUuid: deviceUuid(),
            clientFingerprint: fingerprint()
          }})
        }});
        const data = await res.json().catch(() => ({{}}));
        if (!res.ok) throw new Error(data.detail || data.message || 'Attendence failed.');
        show('ok', 'Attendence marked for ' + rollNo + '.');
      }} catch (err) {{
        show('err', err.message || 'Attendence failed.');
      }} finally {{
        button.disabled = false;
        button.textContent = 'Mark Attendence';
      }}
    }});
  </script>
</body>
</html>"""


@app.on_event("shutdown")
def cleanup_network() -> None:
    if active:
        stop_network()


@app.on_event("startup")
async def start_expiry_watch() -> None:
    global expiry_task
    expiry_task = asyncio.create_task(expiry_watch())
