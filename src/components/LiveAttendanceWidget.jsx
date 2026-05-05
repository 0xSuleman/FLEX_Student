import { useEffect, useState, useRef } from 'react'
import { Bluetooth, BluetoothConnected, BluetoothOff, CheckCircle2, AlertTriangle, Radio, Clock } from 'lucide-react'
import api from '../services/api'

const POLL_MS = 8000

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
  const [bleAdapterOn, setBleAdapterOn] = useState(false)
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

  // Watch the OS Bluetooth adapter so we only show the Pair button once it's on.
  const refreshAdapter = async () => {
    if (!bleSupported || !navigator.bluetooth.getAvailability) {
      setBleAdapterOn(false)
      return
    }
    try {
      const ok = await navigator.bluetooth.getAvailability()
      setBleAdapterOn(!!ok)
    } catch { setBleAdapterOn(false) }
  }

  useEffect(() => {
    poll()
    refreshAdapter()
    pollRef.current = setInterval(poll, POLL_MS)
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    const adapterPoll = setInterval(refreshAdapter, 3000)
    let availabilityListener
    if (bleSupported && navigator.bluetooth.addEventListener) {
      availabilityListener = (e) => setBleAdapterOn(!!e.value)
      try { navigator.bluetooth.addEventListener('availabilitychanged', availabilityListener) } catch {}
    }
    return () => {
      clearInterval(pollRef.current)
      clearInterval(tickRef.current)
      clearInterval(adapterPoll)
      if (availabilityListener && navigator.bluetooth.removeEventListener) {
        try { navigator.bluetooth.removeEventListener('availabilitychanged', availabilityListener) } catch {}
      }
    }
  }, [])

  const connectBluetooth = async () => {
    setBleError(null)
    if (!bleSupported) {
      setBleError('Bluetooth not available in this browser. Use Chrome or Edge.')
      return
    }
    if (!bleAdapterOn) {
      setBleError('Turn on Bluetooth on this device first.')
      return
    }
    setBleConnecting(true)
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      })
      // Don't actually open a GATT connection — Android peripherals in
      // "Pair new device" mode and many phones reject or hang on
      // device.gatt.connect(). Picking the device is sufficient: we have
      // device.name and the backend cross-checks against the session's
      // recorded name. Listen for disconnect events anyway in case the
      // device drops off (e.g. user moves out of range).
      try { device.addEventListener('gattserverdisconnected', handleDisconnect) } catch {}
      setBleDevice(device)
      setBleConnected(true)
    } catch (err) {
      setBleError(err && err.name === 'NotFoundError'
        ? 'No Bluetooth device selected.'
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
    // Geolocation gate: backend cross-checks distance against the session's
    // classroom coords.
    if (!navigator.geolocation) {
      setToast({ kind: 'err', text: 'Geolocation not supported in this browser.' })
      setMarking(null)
      setTimeout(() => setToast(null), 4500)
      return
    }
    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        if (status.state === 'denied') {
          setToast({ kind: 'err', text: 'Location is blocked for this site. Click the 🔒 in the address bar → Site settings → Location → Allow, then reload.' })
          setMarking(null)
          setTimeout(() => setToast(null), 6000)
          return
        }
      } catch { /* permissions API unsupported — fall through to getCurrentPosition */ }
    }
    let coords = null
    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      })
    } catch (err) {
      const msg = err?.code === 1
        ? 'Location is blocked for this site. Click the 🔒 in the address bar → Site settings → Location → Allow, then reload.'
        : err?.code === 3
          ? 'Location request timed out. Move near a window or check that Location Services are enabled, then retry.'
          : 'Location unavailable. Allow location access and retry.'
      setToast({ kind: 'err', text: msg })
      setMarking(null)
      setTimeout(() => setToast(null), 6000)
      return
    }
    try {
      await api.post('/student/attendance/mark', {
        sessionId: s.sessionId,
        sessionToken: s.sessionToken,
        bleDeviceName: bleDevice.name,
        latitude: coords.latitude,
        longitude: coords.longitude,
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

  // Cross-check: do any of the currently open sessions expect a device name
  // that matches what the student paired with?
  const expectedNames = sessions.map(s => s.bleDeviceName).filter(Boolean)
  const connectedName = bleDevice?.name || ''
  const nameMatchesAnySession = expectedNames.length === 0
    || expectedNames.some(n => n.toLowerCase() === connectedName.toLowerCase())
  const showMismatchWarning = bleConnected && !nameMatchesAnySession && expectedNames.length > 0

  return (
    <div className="space-y-3">
      <div className={`chunky-card p-3 flex flex-wrap items-center gap-3 ${showMismatchWarning ? 'bg-bad/15 border-bad' : bleConnected ? 'bg-moss/15 border-moss' : 'bg-cream'}`}>
        <div className={`w-10 h-10 border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0 ${showMismatchWarning ? 'bg-bad' : bleConnected ? 'bg-moss' : 'bg-cocoa'}`}>
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
              ? 'Bluetooth not available in this browser. Use Chrome or Edge.'
              : !bleAdapterOn
                ? 'Turn on Bluetooth on this device first. The pair button will appear once Bluetooth is on.'
                : !bleConnected
                  ? (bleError || (sessions.length === 0
                      ? 'Bluetooth is on. No live session yet — when your teacher opens one, pair with their device.'
                      : 'Bluetooth is on. Click "Pair Device" and pick the device your teacher named.'))
                  : showMismatchWarning
                    ? <>Paired with <span className="font-mono text-ink">{connectedName || 'device'}</span>, but the teacher's device is <span className="font-mono text-ink">{expectedNames.join(' / ')}</span>. Disconnect and pair with that one.</>
                    : sessions.length === 0
                      ? <>Paired with <span className="font-mono text-ink">{connectedName || 'device'}</span>. Waiting for your teacher to open a session.</>
                      : <>Paired with <span className="font-mono text-ink">{connectedName || 'device'}</span>. You can mark attendance now.</>}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`tag ${showMismatchWarning ? 'bg-bad text-bone' : bleConnected ? 'bg-moss text-cream' : !bleAdapterOn ? 'bg-bad text-bone' : 'bg-mustard text-ink'}`}>
            {bleConnected ? (showMismatchWarning ? 'WRONG DEVICE' : 'CONNECTED') : !bleAdapterOn ? 'BLUETOOTH OFF' : 'NOT PAIRED'}
          </span>
          {bleConnected ? (
            <button onClick={disconnectBluetooth}
              className="bg-bone text-ink border-2 border-ink rounded-md px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              Disconnect
            </button>
          ) : (bleAdapterOn && sessions.length > 0) ? (
            bleConnecting ? (
              <button onClick={() => { setBleConnecting(false); setBleError('Pairing cancelled.') }}
                className="bg-bone text-ink border-2 border-ink rounded-md px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5">
                <Bluetooth size={11} strokeWidth={3} className="animate-pulse" /> Cancel
              </button>
            ) : (
              <button onClick={connectBluetooth} disabled={!bleSupported}
                className="bg-burn text-bone border-2 border-ink rounded-md px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
                <Bluetooth size={11} strokeWidth={3} /> Pair Device
              </button>
            )
          ) : null}
        </div>
      </div>

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
        const nameMatch = !s.bleDeviceName || (connectedName && s.bleDeviceName.toLowerCase() === connectedName.toLowerCase())
        const canMark = bleConnected && !expired && !s.alreadyMarked && nameMatch
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
                    title={canMark ? 'Mark Present' : (!bleConnected ? 'Connect Bluetooth first' : !nameMatch ? `Pair with ${s.bleDeviceName}` : 'Cannot mark')}
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
                    ) : !nameMatch ? (
                      <>
                        <BluetoothOff size={14} strokeWidth={3} /> Wrong device
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
