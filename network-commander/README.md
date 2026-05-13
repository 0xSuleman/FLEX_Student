# Automated Attendence Network Commander

Local privileged service for the `Mark-Attendence` captive Wi-Fi network.

The faculty portal starts and stops the hotspot automatically:

- Click **Automated Attendence** on the faculty attendance page.
- Click **Open** to start `Mark-Attendence`, `dnsmasq`, and the captive portal.
- Students join `Mark-Attendence`, open `attendence.fast`, enter roll no, and mark attendence.
- Click **Close & Save**, or wait for the timer to finish, to stop the hotspot and restore the Wi-Fi interface.

## Setup

```bash
sudo apt update
sudo apt install -y hostapd dnsmasq-base net-tools python3-pip python3-venv
cd network-commander
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Start The Commander

Run this once before using Automated Attendence from the faculty portal:

```bash
cd network-commander
./run.sh
```

The service must run as root because it controls `hostapd`, `dnsmasq`, and the
Wi-Fi interface. The helper script runs `sudo` for you.

Optional environment variables:

- `CAPTIVE_INTERFACE=wlp2s0`
- `CAPTIVE_GATEWAY=192.168.77.1`
- `CAPTIVE_SSID=Mark-Attendence`
- `CAPTIVE_BACKEND_URL=http://127.0.0.1:8090`
- `CAPTIVE_COMMANDER_SECRET=dev-captive-secret`

Both `attendence.fast` and `attendance.fast` resolve to the same captive page.

## Manually Start Mark-Attendence

Use this only when you want to start the hotspot without the faculty portal.
Replace `sessionId`, `courseCode`, `section`, and `endsAt` with the active
Spring attendance session values.

```bash
curl -X POST http://127.0.0.1/control/start \
  -H 'Content-Type: application/json' \
  -H 'X-Captive-Secret: dev-captive-secret' \
  -d '{
    "sessionId": 1,
    "courseCode": "CS3001",
    "section": "BSE-243A",
    "topic": "Automated Attendence",
    "endsAt": "2026-05-13T12:56:04Z",
    "backendBaseUrl": "http://127.0.0.1:8090",
    "interface": "wlp2s0",
    "gateway": "192.168.77.1",
    "ssid": "Mark-Attendence"
  }'
```

Check status:

```bash
curl -H 'X-Captive-Secret: dev-captive-secret' http://127.0.0.1/control/status
```

Stop manually:

```bash
curl -X POST http://127.0.0.1/control/stop \
  -H 'Content-Type: application/json' \
  -H 'X-Captive-Secret: dev-captive-secret' \
  -d '{"sessionId":1}'
```

## Recover Wi-Fi In Ubuntu Settings

If the laptop still shows no Wi-Fi networks after attendance closes, run:

```bash
sudo pkill hostapd || true
sudo pkill dnsmasq || true
sudo ip addr flush dev wlp2s0 || true
sudo ip link set wlp2s0 down || true
sudo nmcli device set wlp2s0 managed yes
sudo nmcli radio wifi on
sudo ip link set wlp2s0 up
sudo systemctl restart NetworkManager
nmcli device wifi rescan
nmcli device status
```

Then open Ubuntu Wi-Fi settings again. The normal Wi-Fi networks should be
visible.
