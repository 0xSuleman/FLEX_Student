import { useEffect, useState, useRef } from 'react'
import { Bluetooth, BluetoothConnected, BluetoothOff, CheckCircle2, AlertTriangle, Radio, Clock } from 'lucide-react'
import api from '../services/api'

const POLL_MS = 8000

// Real BLE connection lifecycle:
//   - click "Connect Bluetooth" → navigator.bluetooth.requestDevice → user picks → device.gatt.connect()
//   - keep `device` + listen to 'gattserverdisconnected' so we flip back to disconnected automatically
//   - "Mark Attendance" is disabled unless `bleConnected === true`
export default function LiveAttendanceWidget() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(null)
  const [toast, setToast] = useState(null)
  const [now, setNow] = useState(Date.now())
  const pollRef = useRef(null)
  const tickRef = useRef(null)

  // BLE state
  const [bleSupported] = useState(typeof navigator !== 'undefined' && 'bluetooth' in navigator)
  const [bleDevice, setBleDevice] = useState(null)
  const [bleConnected, setBleConnected] = useState(false)
  const [bleConnecting, setBleConnecting] = useState(false)
  const [bleError, setBleError] = useState(null)

  const poll = () => {
    api.get('/student/attendance/open-sessions')
      .then(res => setSessions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    poll()
    pollRef.current = setInterval(poll, POLL_MS)
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(pollRef.current); clearInterval(tickRef.current) }
  }, [])

  // ── BLE connection flow ──
  // Filter to FLEX-* devices only — that's the convention the teacher uses
  // when broadcasting from their phone (nRF Connect Advertiser). The picker
  // therefore ONLY shows classroom devices, not random AirPods nearby.
  const connectBluetooth = async () => {
    setBleError(null)
    if (!bleSupported) {
      setBleError('Web Bluetooth not available. Use Chrome/Edge over HTTPS or localhost.')
      return
    }
    setBleConnecting(true)
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'FLEX-' }],
        optionalServices: [],
      })
      try {
        if (device.gatt && !device.gatt.connected) await device.gatt.connect()
      } catch (_) { /* device chosen but GATT refused — still treat as paired */ }
      device.addEventListener('gattserverdisconnected', handleDisconnect)
      setBleDevice(device)
      setBleConnected(true)
    } catch (err) {
      setBleError(err && err.name === 'NotFoundError'
        ? 'No FLEX- device found in range. Make sure your teacher\'s phone is broadcasting (e.g. via nRF Connect).'
        : 'Bluetooth pairing failed: ' + (err?.message || 'unknown error'))
      setBleConnected(false)
    } finally {
      setBleConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setBleConnected(false)
    setBleError('Bluetooth device disconnected.')
  }

  const disconnectBluetooth = () => {
    try {
      if (bleDevice) {
        bleDevice.removeEventListener('gattserverdisconnected', handleDisconnect)
        if (bleDevice.gatt && bleDevice.gatt.connected) bleDevice.gatt.disconnect()
      }
    } catch (_) { /* ignore */ }
    setBleDevice(null)
    setBleConnected(false)
    setBleError(null)
  }

  const mark = async (s) => {
    setMarking(s.sessionId)
    setToast(null)
    if (!bleConnected || !bleDevice?.name) {
      setToast({ kind: 'err', text: 'Connect Bluetooth first — attendance cannot be marked without a connected FLEX- device.' })
      setMarking(null)
      setTimeout(() => setToast(null), 4500)
      return
    }
    // Pre-flight check: warn the student if they paired with a device whose
    // name doesn't match this session's expected name. Backend will reject too,
    // but failing fast on the client gives a clearer message.
    if (s.bleDeviceName && bleDevice.name && s.bleDeviceName.toLowerCase() !== bleDevice.name.toLowerCase()) {
      setToast({ kind: 'err', text: `You're connected to "${bleDevice.name}" but this session needs "${s.bleDeviceName}". Disconnect and pair with the right classroom device.` })
      setMarking(null)
      setTimeout(() => setToast(null), 5000)
      return
    }
    try {
      await api.post('/student/attendance/mark', {
        sessionId: s.sessionId,
        sessionToken: s.sessionToken,
        bleDeviceName: bleDevice.name,
      })
      setToast({ kind: 'ok', text: `Present marked for ${s.courseCode} · ${s.section}.` })
      poll()
    } catch (err) {
      setToast({ kind: 'err', text: err.response?.data?.message || err.message || 'Failed to mark' })
    } finally {
      setMarking(null)
      setTimeout(() => setToast(null), 3500)
    }
  }

  return (
    <div className="space-y-3">
      {/* BLE control bar — always visible so the student knows the connection state. */}
      <div className={`chunky-card p-3 flex items-center gap-3 ${bleConnected ? 'bg-moss/15 border-moss' : 'bg-cream'}`}>
        <div className={`w-10 h-10 border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0 ${bleConnected ? 'bg-moss' : 'bg-cocoa'}`}>
          {bleConnected
            ? <BluetoothConnected size={16} className="text-cream" strokeWidth={2.8} />
            : !bleSupported ? <BluetoothOff size={16} className="text-bone" strokeWidth={2.8} />
            : <Bluetooth size={16} className="text-bone" strokeWidth={2.8} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[11px] uppercase tracking-widest text-ink">
            BLE Status
          </div>
          <div className="text-[11px] text-cocoa font-bold mt-0.5">
            {!bleSupported
              ? 'Web Bluetooth not supported in this browser.'
              : bleConnected
                ? <>Connected to <span className="font-mono text-ink">{bleDevice?.name || 'device'}</span> — you can mark attendance.</>
                : (bleError || 'Not connected. Click "Connect Bluetooth" to enable attendance marking.')}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`tag ${bleConnected ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
            {bleConnected ? 'CONNECTED' : 'NOT CONNECTED'}
          </span>
          {bleConnected ? (
            <button onClick={disconnectBluetooth}
              className="bg-bone text-ink border-2 border-ink rounded-md px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              Disconnect
            </button>
          ) : (
            <button onClick={connectBluetooth} disabled={!bleSupported || bleConnecting}
              className="bg-burn text-bone border-2 border-ink rounded-md px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
              <Bluetooth size={11} strokeWidth={3} /> {bleConnecting ? 'Pairing…' : 'Connect Bluetooth'}
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="chunky-card p-4 flex items-center gap-3 bg-cream">
          <div className="w-10 h-10 bg-cocoa border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0">
            <Bluetooth size={16} className="text-bone" strokeWidth={2.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[11px] uppercase tracking-widest text-ink">BLE Attendance</div>
            <div className="text-[11px] text-cocoa font-bold mt-0.5">
              {loading ? 'Checking for live sessions…' : 'No live session right now. When your faculty opens a window, a Mark Attendance button will appear here.'}
            </div>
          </div>
          <span className="tag bg-bone text-ink shrink-0">{loading ? 'POLLING' : 'IDLE'}</span>
        </div>
      )}

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-3 ${toast.kind === 'ok' ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      {sessions.map(s => {
        const remainingMs = Math.max(0, new Date(s.endsAt).getTime() - now)
        const remainingMin = Math.floor(remainingMs / 60000)
        const remainingSec = Math.floor((remainingMs % 60000) / 1000)
        const expired = remainingMs <= 0
        const canMark = bleConnected && !expired && !s.alreadyMarked
        return (
          <div key={s.sessionId} className={`chunky-card p-4 cascade-in ${s.alreadyMarked ? 'bg-moss/10 border-moss' : 'border-burn ring-2 ring-burn/30'}`}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-12 h-12 bg-burn border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0">
                <Bluetooth size={20} className="text-bone" strokeWidth={2.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm text-ink uppercase tracking-wider">{s.courseCode}</span>
                  <span className="tag bg-coffee text-bone">{s.section}</span>
                  {s.alreadyMarked
                    ? <span className="tag bg-moss text-cream">✓ MARKED</span>
                    : <span className="tag bg-burn text-bone animate-blink">LIVE</span>}
                </div>
                <div className="text-xs font-bold text-cocoa mt-1">{s.courseName}</div>
                {s.topic && <div className="text-[11px] text-cocoa/80 italic mt-0.5">&gt; {s.topic}</div>}
                <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-cocoa uppercase tracking-wider flex-wrap">
                  <span className="flex items-center gap-1"><Radio size={11} strokeWidth={3} /> {s.sessionToken}</span>
                  <span className="flex items-center gap-1"><Clock size={11} strokeWidth={3} /> {expired ? 'expired' : `${remainingMin}:${remainingSec.toString().padStart(2,'0')} left`}</span>
                  {s.bleDeviceName && (
                    <span className="flex items-center gap-1 text-burn">
                      <Bluetooth size={11} strokeWidth={3} /> Connect to: <span className="font-mono bg-bone border-2 border-ink rounded px-1.5 py-0.5 text-ink">{s.bleDeviceName}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-auto">
                {s.alreadyMarked ? (
                  <div className="bg-moss text-cream border-2 border-ink rounded-md px-4 py-2.5 font-display text-xs uppercase tracking-wider shadow-pixel-sm inline-flex items-center gap-2">
                    <CheckCircle2 size={14} strokeWidth={3} /> Present
                  </div>
                ) : expired ? (
                  <div className="bg-cocoa text-bone border-2 border-ink rounded-md px-4 py-2.5 font-display text-xs uppercase tracking-wider shadow-pixel-sm">
                    Window Closed
                  </div>
                ) : (
                  <button
                    disabled={marking === s.sessionId || !canMark}
                    onClick={() => mark(s)}
                    title={canMark ? 'Mark Present' : 'Connect Bluetooth first'}
                    className="bg-bone text-ink border-2 border-ink rounded-md px-4 py-2.5 font-display text-xs uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {marking === s.sessionId ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                        Scanning…
                      </>
                    ) : !bleConnected ? (
                      <>
                        <BluetoothOff size={14} strokeWidth={3} /> Connect BLE first
                      </>
                    ) : (
                      <>
                        <BluetoothConnected size={14} strokeWidth={3} /> Mark Attendance
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
