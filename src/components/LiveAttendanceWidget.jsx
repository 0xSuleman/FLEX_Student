import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, AlertTriangle, Radio, Clock, KeyRound, MapPin } from 'lucide-react'
import api from '../services/api'

const POLL_MS = 8000

// Per-browser stable identifier persisted in localStorage. Sent with every
// mark so the backend can enforce per-session device binding (one device
// can only mark for one enrollment in the same session). Cleared by
// "clear browsing data" / incognito — by design, this is friction not a
// security boundary.
function getOrCreateDeviceUuid() {
  try {
    let id = localStorage.getItem('flex_device_id')
    if (!id) {
      id = (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'dev-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36)
      localStorage.setItem('flex_device_id', id)
    }
    return id
  } catch {
    // localStorage may be blocked (private mode on some browsers). Fall back
    // to an in-memory ID — won't survive reload but the user can still mark.
    return null
  }
}

// Cross-browser device signature: stable signals that don't change when the
// student switches Safari → Chrome → Bluefy on the same physical device.
// We deliberately exclude User-Agent (browser-dependent) and instead rely on
// screen geometry + locale + timezone which the OS controls. Two students
// with identical phone models can collide — the backend treats this as a
// faculty review flag, never an auto-reject.
function getClientFingerprint() {
  try {
    const w = (window.screen && window.screen.width) || 0
    const h = (window.screen && window.screen.height) || 0
    const ratio = window.devicePixelRatio || 1
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || ''
    let tz = ''
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch {}
    return `${w}x${h}@${ratio}|${lang}|${tz}`
  } catch {
    return null
  }
}

export default function LiveAttendanceWidget() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(null)
  const [toast, setToast] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [pinInputs, setPinInputs] = useState({})
  const pollRef = useRef(null)
  const tickRef = useRef(null)

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
    return () => {
      clearInterval(pollRef.current)
      clearInterval(tickRef.current)
    }
  }, [])

  const setPin = (sessionId, value) => {
    // Strip non-digits, cap at 6 chars.
    const cleaned = (value || '').replace(/\D/g, '').slice(0, 6)
    setPinInputs(prev => ({ ...prev, [sessionId]: cleaned }))
  }

  const mark = async (s) => {
    const pin = (pinInputs[s.sessionId] || '').trim()
    setMarking(s.sessionId)
    setToast(null)
    if (pin.length !== 6) {
      setToast({ kind: 'err', text: 'Enter the 6-digit PIN your teacher announced.' })
      setMarking(null)
      setTimeout(() => setToast(null), 4000)
      return
    }
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
      } catch { /* permissions API unsupported — fall through */ }
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
        pinCode: pin,
        latitude: coords.latitude,
        longitude: coords.longitude,
        deviceUuid: getOrCreateDeviceUuid(),
        clientFingerprint: getClientFingerprint(),
      })
      setToast({ kind: 'ok', text: `Present marked for ${s.courseCode} · ${s.section}.` })
      setPinInputs(prev => ({ ...prev, [s.sessionId]: '' }))
      poll()
    } catch (err) {
      setToast({ kind: 'err', text: err.response?.data?.message || err.message || 'Failed to mark' })
    } finally {
      setMarking(null)
      setTimeout(() => setToast(null), 4500)
    }
  }

  if (loading || sessions.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="chunky-card p-3 flex flex-wrap items-center gap-3 bg-cream">
        <div className="w-10 h-10 border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0 bg-burn">
          <KeyRound size={16} className="text-bone" strokeWidth={2.8} />
        </div>
        <div className="flex-1 min-w-0 basis-0">
          <div className="font-display text-[11px] uppercase tracking-widest text-ink">
            Live Session
          </div>
          <div className="text-[11px] text-cocoa font-bold mt-0.5">
            Enter the 6-digit PIN your teacher announced. Your location is verified to confirm you are in the classroom.
          </div>
        </div>
      </div>

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-3 ${toast.kind === 'ok' ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider break-words">{toast.text}</span>
        </div>
      )}

      {sessions.map(s => {
        const remainingMs = Math.max(0, new Date(s.endsAt).getTime() - now)
        const remainingMin = Math.floor(remainingMs / 60000)
        const remainingSec = Math.floor((remainingMs % 60000) / 1000)
        const expired = remainingMs <= 0
        const pinValue = pinInputs[s.sessionId] || ''
        const canMark = !expired && !s.alreadyMarked && pinValue.length === 6
        return (
          <div key={s.sessionId} className={`chunky-card p-3 sm:p-4 cascade-in ${s.alreadyMarked ? 'bg-moss/10 border-moss' : 'border-burn ring-2 ring-burn/30'}`}>
            <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-burn border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0">
                <KeyRound size={20} className="text-bone" strokeWidth={2.8} />
              </div>
              <div className="flex-1 min-w-0 basis-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm text-ink uppercase tracking-wider">{s.courseCode}</span>
                  <span className="tag bg-coffee text-bone">{s.section}</span>
                  {s.alreadyMarked
                    ? <span className="tag bg-moss text-cream">✓ MARKED</span>
                    : <span className="tag bg-burn text-bone animate-blink">LIVE</span>}
                </div>
                <div className="text-xs font-bold text-cocoa mt-1 break-words">{s.courseName}</div>
                {s.topic && <div className="text-[11px] text-cocoa/80 italic mt-0.5 break-words">&gt; {s.topic}</div>}
                <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[11px] font-bold text-cocoa uppercase tracking-wider flex-wrap">
                  <span className="flex items-center gap-1"><Radio size={11} strokeWidth={3} /> {s.sessionToken}</span>
                  <span className="flex items-center gap-1"><Clock size={11} strokeWidth={3} /> {expired ? 'expired' : `${remainingMin}:${remainingSec.toString().padStart(2,'0')} left`}</span>
                  <span className="flex items-center gap-1 text-cocoa/80"><MapPin size={11} strokeWidth={3} /> Location verified on mark</span>
                </div>
              </div>
            </div>

            {!s.alreadyMarked && !expired && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit PIN"
                  value={pinValue}
                  onChange={(e) => setPin(s.sessionId, e.target.value)}
                  className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2.5 font-mono text-base sm:text-lg text-ink tracking-[0.3em] tabular-nums focus:outline-none focus:ring-2 focus:ring-burn"
                />
                <button
                  disabled={marking === s.sessionId || !canMark}
                  onClick={() => mark(s)}
                  title={canMark ? 'Mark Present' : 'Enter the 6-digit PIN first'}
                  className="w-full sm:w-auto bg-burn text-bone border-2 border-ink rounded-md px-4 py-2.5 font-display text-xs uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {marking === s.sessionId ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-bone border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} strokeWidth={3} /> Mark Attendance
                    </>
                  )}
                </button>
              </div>
            )}

            {s.alreadyMarked && (
              <div className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-moss text-cream border-2 border-ink rounded-md px-4 py-2.5 font-display text-xs uppercase tracking-wider shadow-pixel-sm">
                <CheckCircle2 size={14} strokeWidth={3} /> Present
              </div>
            )}

            {expired && !s.alreadyMarked && (
              <div className="mt-3 w-full sm:w-auto inline-flex items-center justify-center bg-cocoa text-bone border-2 border-ink rounded-md px-4 py-2.5 font-display text-xs uppercase tracking-wider shadow-pixel-sm">
                Window Closed
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
