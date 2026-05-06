import { useState, useEffect, useRef, useMemo } from 'react'
import {
  KeyRound, Play, Square, Save, Clock, Eye, Hand, X,
  Users, CheckCircle2, XCircle, Coffee, Search, AlertTriangle,
  ListChecks, RefreshCw, Download, Upload,
} from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, ActionButton, StatCard } from '../../components/PageShell'

// ── Mode constants ──
const IDLE = 'idle'
const VIEW = 'view'
const EDIT = 'edit'
const BLE  = 'ble'      // PIN-driven student self-mark + faculty roster polling
const MANUAL = 'manual' // Faculty-only marking — opens a session, hides the PIN, taps students to set P/A/L

const STATUS_TONE = {
  Present: 'bg-moss text-cream',
  Absent:  'bg-bad text-bone',
  Leave:   'bg-mustard text-ink',
  Pending: 'bg-bone text-cocoa',
}

const PRESENCE_CODE = { Present: 'P', Absent: 'A', Leave: 'L', Pending: '' }

export default function FacultyAttendance() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [mode, setMode] = useState(IDLE)
  const [roster, setRoster] = useState([])
  const [bleSession, setBleSession] = useState(null)
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(15)
  // PIN+geo branch: BLE device name is gone; the session response now carries
  // a 6-digit pinCode that the teacher announces / projects.
  const [now, setNow] = useState(Date.now())
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  // VIEW mode: real past sessions from backend + per-session expanded edit roster.
  const [viewSessions, setViewSessions] = useState([])
  const [viewLoading, setViewLoading] = useState(false)
  const [editSessionId, setEditSessionId] = useState(null)
  const [editRoster, setEditRoster] = useState([])
  const [editSaving, setEditSaving] = useState(false)
  // Sir's attendance-sheet template upload state.
  const [templateStatus, setTemplateStatus] = useState(null)
  const [templateUploading, setTemplateUploading] = useState(false)
  const templateInputRef = useRef(null)
  const tickRef = useRef(null)
  const pollRef = useRef(null)

  // Load assigned sections
  useEffect(() => {
    api.get('/faculty/courses?semester=Spring%202026')
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr)
        if (arr.length > 0 && !courseId) setCourseId(arr[0].id)
      })
      .catch(() => setToast({ kind: 'err', text: 'Failed to load courses. Backend offline?' }))
  }, [])

  const loadRoster = async (presetStatus = 'Pending', method = '—') => {
    if (!courseId) return
    try {
      const res = await api.get(`/faculty/sections/${courseId}/roster`)
      const arr = Array.isArray(res.data) ? res.data : []
      setRoster(arr.map(r => ({
        enrollmentId: r.enrollmentId,
        roll: r.rollNo,
        name: r.name,
        status: presetStatus,
        method,
      })))
    } catch {
      setRoster([])
      setToast({ kind: 'err', text: 'Failed to load roster.' })
    }
  }

  useEffect(() => {
    if (courseId) loadRoster()
  }, [courseId])

  const loadTemplateStatus = async () => {
    if (!courseId) { setTemplateStatus(null); return }
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/template`)
      setTemplateStatus(res.data || null)
    } catch { setTemplateStatus(null) }
  }
  useEffect(() => { loadTemplateStatus() }, [courseId])

  // On mount / section change: if there's still an OPEN session for this
  // section, restore the live session card so a page refresh doesn't make
  // the live PIN window vanish from the faculty view. We pick the most
  // recent open + unexpired one (matches the student-side dedupe).
  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/faculty/sections/${courseId}/attendance/sessions`)
        const arr = Array.isArray(res.data) ? res.data : []
        const now = Date.now()
        const live = arr
          .filter(s => s.status === 'OPEN' && new Date(s.endsAt).getTime() > now)
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
        if (cancelled || !live) return
        setBleSession({
          id: live.id,
          sessionToken: live.sessionToken,
          pinCode: live.pinCode,
          startedAt: new Date(live.startedAt).getTime(),
          endsAt: new Date(live.endsAt).getTime(),
        })
        setTopic(live.topic || '')
        setDuration(live.durationMinutes || 30)
        setNow(Date.now())
        setMode(BLE)
        loadRoster('Pending', '—')
      } catch { /* no live session — leave UI alone */ }
    })()
    return () => { cancelled = true }
  }, [courseId])

  const uploadTemplate = async (file) => {
    if (!file || !courseId) return
    setTemplateUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/faculty/sections/${courseId}/attendance/template`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTemplateStatus({ uploaded: true, ...res.data })
      setToast({ kind: 'ok', text: `Template uploaded · ${res.data.filename}` })
    } catch (err) {
      setToast({ kind: 'err', text: 'Upload failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setTemplateUploading(false)
      if (templateInputRef.current) templateInputRef.current.value = ''
      clearToastSoon()
    }
  }

  const downloadFilledSheet = async () => {
    if (!courseId) return
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sheet`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().slice(0, 10)
      a.download = `attendance-${today}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      setToast({ kind: 'ok', text: "Today's attendance sheet downloaded." })
      clearToastSoon()
    } catch (err) {
      const msg = err.response?.data instanceof Blob
        ? "Download failed — make sure a template is uploaded."
        : ('Download failed: ' + (err.response?.data?.message || err.message))
      setToast({ kind: 'err', text: msg })
      clearToastSoon()
    }
  }

  // ── BLE polling — replaces the old fake client simulator ──
  // Polls real backend every 2s for any student who has self-marked through their
  // portal's "Mark Attendance" button, and reflects it in the live faculty roster.
  // Faculty manual overrides are preserved (only Pending rows are updated from server).
  useEffect(() => {
    if ((mode !== BLE && mode !== MANUAL) || !bleSession) return
    pollRef.current = setInterval(async () => {
      if (Date.now() >= bleSession.endsAt) return
      try {
        const res = await api.get(`/faculty/attendance/sessions/${bleSession.id}/marks`)
        const arr = Array.isArray(res.data) ? res.data : []
        setRoster(prev => prev.map(r => {
          const live = arr.find(m => m.enrollmentId === r.enrollmentId)
          if (!live || !live.presence) return r
          if (r.status !== 'Pending') return r
          const status = live.presence === 'P' ? 'Present'
                       : live.presence === 'A' ? 'Absent'
                       : live.presence === 'L' ? 'Leave' : r.status
          return { ...r, status, method: live.method || 'PIN', deviceUuid: live.deviceUuid, clientIp: live.clientIp, clientFingerprint: live.clientFingerprint }
        }))
      } catch { /* keep last good */ }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [mode, bleSession])

  // Countdown ticker
  useEffect(() => {
    if ((mode !== BLE && mode !== MANUAL) || !bleSession) return
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tickRef.current)
  }, [mode, bleSession])

  const course = courses.find(c => String(c.id) === String(courseId))

  const stats = useMemo(() => {
    const present = roster.filter(r => r.status === 'Present').length
    const absent  = roster.filter(r => r.status === 'Absent').length
    const leave   = roster.filter(r => r.status === 'Leave').length
    const pending = roster.filter(r => r.status === 'Pending').length
    return { present, absent, leave, pending, total: roster.length }
  }, [roster])

  const filtered = useMemo(() => {
    if (!search.trim()) return roster
    const q = search.toLowerCase()
    return roster.filter(r => r.roll.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
  }, [roster, search])

  // Count device-UUIDs across the full roster (not the filtered subset) so a
  // duplicate is still flagged even if the user search-filters one away.
  const deviceCounts = useMemo(() => {
    const m = {}
    for (const r of roster) {
      if (r.deviceUuid) m[r.deviceUuid] = (m[r.deviceUuid] || 0) + 1
    }
    return m
  }, [roster])

  // Cross-browser fingerprint counts. A collision here = different localStorage
  // UUIDs but identical screen+lang+tz signature → either same phone via
  // different browsers (probable cheat) or two students with identical phones
  // (legitimate). Surfaced as a yellow review flag, never auto-rejected.
  const fingerprintCounts = useMemo(() => {
    const m = {}
    for (const r of roster) {
      if (r.clientFingerprint) m[r.clientFingerprint] = (m[r.clientFingerprint] || 0) + 1
    }
    return m
  }, [roster])

  // ── Mode initiations ──
  const startEdit = async () => {
    setMode(EDIT); setBleSession(null)
    if (!courseId) return
    setViewLoading(true)
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sessions`)
      const arr = Array.isArray(res.data) ? res.data : []
      setViewSessions(arr.filter(s => s.status === 'CLOSED'))
    } catch (err) {
      setToast({ kind: 'err', text: 'Failed to load past sessions.' })
      setViewSessions([])
    } finally { setViewLoading(false) }
  }

  const startBleMode = () => {
    if (!courseId) return
    setMode(BLE)
    setBleSession(null)
  }

  const startManualMode = () => {
    if (!courseId) return
    setMode(MANUAL)
    setBleSession(null)
  }

  // Click-to-cycle: only used in MANUAL mode (and live PIN sessions where
  // faculty wants to override). Walks Pending → Present → Absent → Leave →
  // back to Pending.
  const cycleRowStatus = (enrollmentId) => {
    const order = ['Pending', 'Present', 'Absent', 'Leave']
    setRoster(prev => prev.map(r => {
      if (r.enrollmentId !== enrollmentId) return r
      const idx = order.indexOf(r.status)
      const next = order[(idx + 1) % order.length]
      return { ...r, status: next, method: next === 'Pending' ? '—' : 'Manual', dirty: true }
    }))
  }

  const openBleWindow = async () => {
    if (!topic.trim()) {
      setToast({ kind: 'err', text: 'Topic is required before opening a session.' })
      clearToastSoon()
      return
    }
    // Capture classroom lat/long via the browser's Geolocation API. Stored
    // on the session so student mark requests are rejected if they're > 100m
    // away — defeats the "rename a phone at home" cheat.
    let coords = null
    try {
      coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported.'))
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      })
    } catch (err) {
      setToast({ kind: 'err', text: 'Location permission required. Allow location in your browser, then retry Open.' })
      clearToastSoon()
      return
    }
    try {
      const res = await api.post('/faculty/attendance/sessions', {
        facultySectionId: parseInt(courseId, 10),
        topic,
        durationMinutes: duration,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      const s = res.data
      setBleSession({
        id: s.id,
        sessionToken: s.sessionToken,
        pinCode: s.pinCode,
        startedAt: new Date(s.startedAt).getTime(),
        endsAt: new Date(s.endsAt).getTime(),
      })
      setNow(new Date(s.startedAt).getTime())
      await loadRoster('Pending', '—')
      setToast({ kind: 'info', text: `Session live · PIN ${s.pinCode}. Announce this code to the class.` })
      clearToastSoon()
    } catch (err) {
      setToast({ kind: 'err', text: 'Failed to open session: ' + (err.response?.data?.message || err.message) })
      clearToastSoon()
    }
  }

  const startView = async () => {
    setMode(VIEW); setBleSession(null)
    if (!courseId) return
    setViewLoading(true)
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sessions`)
      const arr = Array.isArray(res.data) ? res.data : []
      // Show closed sessions only — open ones still belong to BLE/Manual flows.
      setViewSessions(arr.filter(s => s.status === 'CLOSED'))
    } catch (err) {
      setToast({ kind: 'err', text: 'Failed to load past sessions.' })
      setViewSessions([])
    } finally { setViewLoading(false) }
  }

  const openEdit = async (sessionId) => {
    if (editSessionId === sessionId) { setEditSessionId(null); return }
    setEditSessionId(sessionId)
    setEditSaving(false)
    try {
      const res = await api.get(`/faculty/attendance/sessions/${sessionId}/marks`)
      const arr = Array.isArray(res.data) ? res.data : []
      setEditRoster(arr.map(r => ({
        enrollmentId: r.enrollmentId,
        roll: r.rollNo,
        name: r.name,
        // Convert backend P/A/L code → UI status
        status: r.presence === 'P' ? 'Present'
              : r.presence === 'A' ? 'Absent'
              : r.presence === 'L' ? 'Leave'
              : 'Pending',
        method: r.method || '—',
        dirty: false,
      })))
    } catch (err) {
      setEditRoster([])
      setToast({ kind: 'err', text: 'Failed to load session marks.' })
      clearToastSoon()
    }
  }

  const setEditStatus = (roll, status) => {
    setEditRoster(prev => prev.map(r => {
      if (r.roll !== roll) return r
      const next = r.status === status ? 'Pending' : status
      return { ...r, status: next, method: 'Manual', dirty: true }
    }))
  }

  const deleteSession = async (sessionId) => {
    if (!sessionId) return
    if (!confirm('Permanently delete this session and every attendance record tied to it? This cannot be undone.')) return
    try {
      await api.delete(`/faculty/attendance/sessions/${sessionId}`)
      setToast({ kind: 'ok', text: 'Session deleted.' })
      setEditSessionId(null)
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sessions`)
      const arr = Array.isArray(res.data) ? res.data : []
      setViewSessions(arr.filter(s => s.status === 'CLOSED'))
    } catch (err) {
      setToast({ kind: 'err', text: 'Delete failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      clearToastSoon()
    }
  }

  const saveEdit = async () => {
    if (!editSessionId) return
    const dirtyRows = editRoster.filter(r => r.dirty && r.status !== 'Pending')
    if (dirtyRows.length === 0) {
      setToast({ kind: 'info', text: 'No changes to save.' })
      clearToastSoon()
      return
    }
    setEditSaving(true)
    try {
      await api.put(`/faculty/attendance/sessions/${editSessionId}/marks`, {
        marks: dirtyRows.map(r => ({
          enrollmentId: r.enrollmentId,
          presence: PRESENCE_CODE[r.status] || 'A',
          method: 'Manual',
        })),
      })
      setToast({ kind: 'ok', text: `Updated · ${dirtyRows.length} record${dirtyRows.length === 1 ? '' : 's'}` })
      // Reload list + close the edit panel
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sessions`)
      setViewSessions((Array.isArray(res.data) ? res.data : []).filter(s => s.status === 'CLOSED'))
      setEditSessionId(null)
    } catch (err) {
      setToast({ kind: 'err', text: 'Save failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setEditSaving(false)
      clearToastSoon()
    }
  }

  const cancelMode = () => {
    if ((mode === BLE || mode === MANUAL) && bleSession) {
      api.post(`/faculty/attendance/sessions/${bleSession.id}/close`, { marks: [] }).catch(() => {})
    }
    setMode(IDLE)
    setBleSession(null)
    setTopic('')
    loadRoster()
  }

  // Click the same status again to undo back to Pending (unmarked).
  const setStatus = (roll, status) => {
    setRoster(prev => prev.map(r => {
      if (r.roll !== roll) return r
      if (r.status === status) {
        return { ...r, status: 'Pending', method: '—' }   // toggle-off → unmarked
      }
      return { ...r, status, method: 'Manual' }
    }))
  }

  const closeBleAndSave = async () => {
    if (!bleSession) return
    setSaving(true)
    const finalRoster = roster.map(r => r.status === 'Pending' ? { ...r, status: 'Absent', method: 'Auto' } : r)
    try {
      await api.post(`/faculty/attendance/sessions/${bleSession.id}/close`, {
        marks: finalRoster.map(r => ({
          enrollmentId: r.enrollmentId,
          presence: PRESENCE_CODE[r.status] || 'A',
          method: r.method && r.method !== '—' ? r.method : 'Auto',
        })),
      })
      const present = finalRoster.filter(r => r.status === 'Present').length
      const absent  = finalRoster.filter(r => r.status === 'Absent').length
      const leave   = finalRoster.filter(r => r.status === 'Leave').length
      setToast({ kind: 'ok', text: `Session closed & saved · ${present} present / ${absent} absent` })
      setMode(IDLE)
      setBleSession(null)
      setTopic('')
    } catch (err) {
      setToast({ kind: 'err', text: 'Close failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setSaving(false)
      clearToastSoon()
    }
  }

  const clearToastSoon = () => setTimeout(() => setToast(null), 3500)

  const exportExcel = async () => {
    if (!courseId) return
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/export`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-section-${courseId}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      setToast({ kind: 'ok', text: 'Attendance sheet downloaded.' })
      clearToastSoon()
    } catch (err) {
      setToast({ kind: 'err', text: 'Export failed: ' + (err.response?.data?.message || err.message) })
      clearToastSoon()
    }
  }

  const exportSession = async (sessionId) => {
    try {
      const res = await api.get(`/faculty/attendance/sessions/${sessionId}/export`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-session-${sessionId}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      setToast({ kind: 'ok', text: 'Session sheet downloaded.' })
      clearToastSoon()
    } catch (err) {
      setToast({ kind: 'err', text: 'Export failed: ' + (err.response?.data?.message || err.message) })
      clearToastSoon()
    }
  }

  const remainingMs = bleSession ? Math.max(0, bleSession.endsAt - now) : 0
  const remainingMin = Math.floor(remainingMs / 60000)
  const remainingSec = Math.floor((remainingMs % 60000) / 1000)
  const elapsedPct = bleSession ? Math.min(100, ((now - bleSession.startedAt) / (bleSession.endsAt - bleSession.startedAt)) * 100) : 0

  useEffect(() => {
    if ((mode === BLE || mode === MANUAL) && bleSession && remainingMs <= 0) closeBleAndSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  // ─── RENDER ───
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Attendance"
        KickerIcon={ListChecks}
        title="ATTENDANCE"
        subtitle="Pick a section, then choose a mode — view past records, edit a past session, or open a PIN-based attendance window."
      />

      <div className="chunky-card overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-ink bg-tan flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-ink uppercase tracking-widest">&gt; Section</span>
            <select
              disabled={mode !== IDLE && mode !== VIEW}
              value={courseId || ''}
              onChange={(e) => setCourseId(e.target.value)}
              className="bg-bone border-2 border-ink rounded-md px-3 py-1.5 font-mono text-sm text-ink focus:outline-none disabled:opacity-50"
            >
              {courses.length === 0 && <option>No assigned sections</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} · {c.section}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <input ref={templateInputRef} type="file" accept=".xlsx" className="hidden"
              onChange={(e) => uploadTemplate(e.target.files?.[0])} />
            <button onClick={() => templateInputRef.current?.click()} disabled={!courseId || templateUploading}
              title="Upload Sir's attendance sheet template (xlsx)"
              className="bg-mustard text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
              <Upload size={11} strokeWidth={3} /> {templateUploading ? 'Uploading…' : (templateStatus?.uploaded ? 'Insert Excel Sheet' : 'Insert Excel Sheet')}
            </button>
            <button onClick={downloadFilledSheet} disabled={!courseId || !templateStatus?.uploaded}
              title="Download the template you uploaded with today's date column filled in P/A for every student. Submit this to AO/HOD as the day's attendance record."
              className="bg-burn text-bone border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
              <Download size={11} strokeWidth={3} /> Today's Sheet
            </button>
            <button onClick={exportExcel} disabled={!courseId}
              title="Download a summary across ALL past sessions for this section: one column per lecture, totals, % per student. Useful for end-of-semester review."
              className="bg-coffee text-bone border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
              <Download size={11} strokeWidth={3} /> Overview
            </button>
            <ModeBadge mode={mode} />
          </div>
        </div>

        {mode === IDLE && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <ModeButton onClick={startView}        Icon={Eye}       title="View"   sub="Past closed sessions, read-only." />
            <ModeButton onClick={startEdit}        Icon={Hand}      title="Edit"   sub="Pick a past session, update P/A/L." accent />
            <ModeButton onClick={startBleMode}     Icon={KeyRound}  title="PIN"    sub="Students self-mark from phones." />
            <ModeButton onClick={startManualMode}  Icon={ListChecks} title="Manual" sub="Tap each student to mark P/A/L." />
          </div>
        )}

        {(mode === BLE || mode === MANUAL) && !bleSession && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
            <Field className="md:col-span-8" label="Lecture Topic">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Iterative & Incremental Models"
                className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
            </Field>
            <Field className="md:col-span-4" label={`Duration · ${duration >= 60 ? `${(duration / 60).toFixed(duration % 60 ? 1 : 0)} hr` : `${duration} min`}`}>
              <input type="range" min="5" max="180" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full accent-ink" />
            </Field>
            <div className="md:col-span-12 text-[11px] font-bold text-cocoa">
              {mode === MANUAL
                ? 'Manual mode — after you click Open, tap each student row in the roster to cycle Pending → Present → Absent → Leave. Close & Save to commit; unmarked students become Absent automatically.'
                : 'A 6-digit PIN is generated when you click Open. Announce or project it; students enter the PIN + their location is checked against the classroom.'}
            </div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <ActionButton tone="bone" Icon={X} onClick={cancelMode}>Back</ActionButton>
              <ActionButton tone="cocoa" Icon={Play} onClick={openBleWindow}>Open</ActionButton>
            </div>
          </div>
        )}

        {(mode === BLE || mode === MANUAL) && bleSession && (
          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 bg-cream border-2 border-ink rounded-md px-3 py-2.5">
              <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest">&gt; Topic</div>
              <div className="font-extrabold text-sm text-ink">{topic}</div>
            </div>
            <div className="md:col-span-3 bg-cream border-2 border-ink rounded-md px-3 py-2.5">
              <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest">&gt; Time Left</div>
              <div className="font-extrabold text-lg text-ink tabular-nums">{remainingMin}:{remainingSec.toString().padStart(2, '0')}</div>
            </div>
            <div className="md:col-span-2 flex gap-2 items-end">
              <ActionButton tone="bad" Icon={Square} onClick={closeBleAndSave} disabled={saving}>{saving ? 'Saving…' : 'Close & Save'}</ActionButton>
            </div>
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-cream border-2 border-ink rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold text-coffee uppercase tracking-widest">&gt; Session progress</span>
                  <span className="tag bg-coffee text-bone tabular-nums">{Math.round(elapsedPct)}%</span>
                </div>
                <div className="bg-bone border-2 border-ink rounded h-4 overflow-hidden relative">
                  <div className="h-full bg-burn transition-all duration-1000" style={{ width: `${elapsedPct}%` }} />
                </div>
                <div className="mt-1.5 text-[10px] font-extrabold text-cocoa uppercase tracking-wider">
                  Token <span className="font-mono text-ink">{bleSession.sessionToken}</span>
                </div>
              </div>
              {mode === BLE ? (
                <div className="bg-burn text-bone border-2 border-ink rounded-md p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">&gt; Attendance PIN</div>
                    <div className="font-mono font-black text-4xl md:text-5xl mt-1 tracking-[0.2em] tabular-nums">{bleSession.pinCode || '------'}</div>
                    <div className="text-[10px] mt-1 opacity-80 font-bold uppercase tracking-wider">Announce or project this code</div>
                  </div>
                </div>
              ) : (
                <div className="bg-coffee text-bone border-2 border-ink rounded-md p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">&gt; Manual mode</div>
                    <div className="font-extrabold text-base mt-1">Tap each student row below to cycle Pending → Present → Absent → Leave.</div>
                    <div className="text-[10px] mt-1 opacity-80 font-bold uppercase tracking-wider">Close & Save when done — unmarked students become Absent automatically.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === VIEW && (
          <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-extrabold text-cocoa uppercase tracking-wider">
              <Eye size={14} strokeWidth={3} className="text-burn" /> View only — read-only attendance history
            </div>
            <ActionButton tone="bone" Icon={X} onClick={() => setMode(IDLE)}>Back</ActionButton>
          </div>
        )}

        {mode === EDIT && (
          <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-extrabold text-cocoa uppercase tracking-wider">
              <Hand size={14} strokeWidth={3} className="text-burn" /> Edit mode — click a session to update P/A/L ( · date stays fixed)
            </div>
            <ActionButton tone="bone" Icon={X} onClick={() => { setMode(IDLE); setEditSessionId(null) }}>Back</ActionButton>
          </div>
        )}
      </div>

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-moss text-cream' : toast.kind === 'err' ? 'bg-bad text-bone' : 'bg-cocoa text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : toast.kind === 'err' ? <AlertTriangle size={16} strokeWidth={3} /> : <RefreshCw size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      {(mode === BLE || mode === MANUAL) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard Icon={Users} label="Total" value={stats.total} tone="bg-cocoa text-bone" />
          <StatCard Icon={CheckCircle2} label="Present" value={stats.present} tone="bg-moss text-cream" />
          <StatCard Icon={XCircle} label="Absent" value={stats.absent} tone="bg-bad text-bone" />
          <StatCard Icon={Coffee} label="Leave" value={stats.leave} tone="bg-mustard text-ink" />
          <StatCard Icon={Clock} label="Pending" value={stats.pending} tone="bg-bone text-ink" />
        </div>
      )}

      {(mode === BLE || mode === MANUAL) && (
        <SectionCard
          title={`Roster — ${course?.courseCode || ''} · ${course?.section || ''}`}
          right={
            <div className="flex items-center gap-2 bg-bone border-2 border-ink rounded-md px-3 py-1.5 w-56">
              <Search size={12} className="text-cocoa" strokeWidth={3} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="bg-transparent text-xs text-ink placeholder:text-cocoa/50 focus:outline-none w-full font-bold" />
            </div>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <Th>#</Th><Th>Roll</Th><Th>Name</Th>
                <Th center>Status</Th>
                <Th center>Method</Th>
                <Th center>Device</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const dupDevice = r.deviceUuid && deviceCounts[r.deviceUuid] > 1
                const dupFingerprint = !dupDevice && r.clientFingerprint && fingerprintCounts[r.clientFingerprint] > 1
                const rowBg = dupDevice ? 'bg-bad/10' : dupFingerprint ? 'bg-mustard/15' : i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'
                return (
                <tr key={r.enrollmentId || r.roll}
                  onClick={mode === MANUAL ? () => cycleRowStatus(r.enrollmentId) : undefined}
                  className={`border-b border-dashed border-cocoa/30 ${rowBg} ${mode === MANUAL ? 'cursor-pointer hover:bg-tan/40' : ''}`}>
                  <td className="px-4 py-2.5 text-cocoa font-bold text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-extrabold text-ink">{r.roll}</td>
                  <td className="px-4 py-2.5 text-ink">{r.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    {r.status === 'Pending'
                      ? <span className="inline-block w-6 h-5 border-2 border-dashed border-cocoa/50 rounded" title="unmarked" />
                      : <span className={`tag ${STATUS_TONE[r.status]}`}>{r.status}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`tag ${r.method === 'PIN' || r.method === 'Bluetooth' ? 'bg-coffee text-bone' : r.method === 'Manual' ? 'bg-mustard text-ink' : r.method === 'Auto' ? 'bg-cocoa text-bone' : 'bg-bone text-cocoa'}`}>{r.method}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {r.deviceUuid
                      ? <span className={`tag font-mono ${dupDevice ? 'bg-bad text-bone animate-blink' : dupFingerprint ? 'bg-mustard text-ink' : 'bg-bone text-cocoa'}`} title={
                          dupDevice
                            ? `Same browser device used by ${deviceCounts[r.deviceUuid]} students — log-out + log-in cheat`
                            : dupFingerprint
                              ? `Same phone signature as ${fingerprintCounts[r.clientFingerprint]} students — could be same phone via different browsers, or identical phone models. Verify with the student.`
                              : `Device ${r.deviceUuid}${r.clientIp ? ` · IP ${r.clientIp}` : ''}${r.clientFingerprint ? ` · ${r.clientFingerprint}` : ''}`
                        }>
                          {dupDevice ? '⚠ ' : dupFingerprint ? '⚑ ' : ''}…{r.deviceUuid.slice(-4)}
                        </span>
                      : <span className="text-cocoa/40 text-xs">—</span>}
                  </td>
                </tr>
              )})}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No students.</td></tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      )}

      {(mode === VIEW || mode === EDIT) && (
        <SectionCard title={`Past Sessions — ${course?.courseCode || ''} · ${course?.section || ''}`}
          right={mode === EDIT
            ? <div className="text-[10px] font-extrabold text-cocoa uppercase tracking-widest">Click any row to edit P/A/L</div>
            : <div className="text-[10px] font-extrabold text-cocoa uppercase tracking-widest">Read-only history</div>}>
          {viewLoading ? (
            <div className="flex items-center justify-center h-32"><div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
          ) : viewSessions.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs font-bold text-cocoa uppercase tracking-wider">
              No closed sessions yet for this section.
            </div>
          ) : (<>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone border-b-2 border-ink text-coffee">
                  <Th>#</Th><Th>Date</Th><Th>Topic</Th><Th center>Present / Total</Th>
                </tr>
              </thead>
              <tbody>
                {viewSessions.map((s, i) => {
                  const open = editSessionId === s.sessionId
                  return (
                    <>
                      <tr key={s.sessionId}
                        onClick={() => openEdit(s.sessionId)}
                        className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} cursor-pointer hover:bg-tan/40 ${open ? 'bg-tan/60' : ''}`}>
                        <td className="px-4 py-2.5 text-left font-extrabold text-ink w-12">{s.lectureNo}</td>
                        <td className="px-4 py-2.5 text-left text-cocoa font-mono text-xs w-32">{s.date || '—'}</td>
                        <td className="px-4 py-2.5 text-left text-ink max-w-[260px] truncate" title={s.topic || ''}>
                          {s.topic ? (s.topic.length > 30 ? s.topic.slice(0, 30) + '…' : s.topic) : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1.5 tabular-nums">
                            <span className="tag bg-moss text-cream w-8 text-center">{s.present}</span>
                            <span className="tag bg-bad text-bone w-8 text-center">{s.absent}</span>
                            <span className="tag bg-mustard text-ink w-8 text-center">{s.leave}</span>
                            <span className="tag bg-cocoa text-bone min-w-[2.5rem] text-center">/{s.total}</span>
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-tan/40">
                          <td colSpan={4} className="p-4">
                            <div className="bg-bone border-2 border-ink rounded-md overflow-hidden">
                              <div className="px-4 py-2 bg-coffee text-bone flex items-center justify-between">
                                <span className="font-display text-[10px] uppercase tracking-widest">{mode === EDIT ? 'Edit roster' : 'Roster'} — Lecture {s.lectureNo} · {s.date}</span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => exportSession(s.sessionId)}
                                    className="bg-coffee text-bone border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                                    <Download size={11} strokeWidth={3} /> Excel
                                  </button>
                                  <button onClick={() => setEditSessionId(null)} disabled={editSaving}
                                    className="bg-bone text-ink border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">Close</button>
                                  {mode === EDIT && (
                                    <>
                                      <button onClick={() => deleteSession(s.sessionId)} disabled={editSaving}
                                        title="Permanently delete this entire session and every attendance row in it. Cannot be undone."
                                        className="bg-bad text-bone border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                                        <X size={11} strokeWidth={3} /> Delete
                                      </button>
                                      <button onClick={saveEdit} disabled={editSaving}
                                        className="bg-burn text-bone border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                                        <Save size={11} strokeWidth={3} /> {editSaving ? 'Saving…' : 'Save'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-cream border-b-2 border-ink text-coffee">
                                    <Th>#</Th><Th>Roll</Th><Th>Name</Th><Th center>Current</Th><Th center>Method</Th>
                                    {mode === EDIT && <Th center>Mark</Th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {editRoster.map((r, j) => (
                                    <tr key={r.enrollmentId} className={`border-b border-dashed border-cocoa/30 ${j % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} ${r.dirty ? 'ring-1 ring-burn/40' : ''}`}>
                                      <td className="px-4 py-2 text-left text-cocoa font-bold text-xs">{j + 1}</td>
                                      <td className="px-4 py-2 text-left font-extrabold text-ink">{r.roll}</td>
                                      <td className="px-4 py-2 text-left text-ink">{r.name}</td>
                                      <td className="px-4 py-2 text-center">
                                        {r.status === 'Pending'
                                          ? <span className="inline-block w-6 h-5 border-2 border-dashed border-cocoa/50 rounded" title="unmarked" />
                                          : <span className={`tag ${STATUS_TONE[r.status]}`}>{r.status}</span>}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <span className={`tag ${r.method === 'PIN' || r.method === 'Bluetooth' ? 'bg-coffee text-bone' : r.method === 'Manual' ? 'bg-mustard text-ink' : r.method === 'Auto' ? 'bg-cocoa text-bone' : 'bg-bone text-cocoa'}`}>{r.method}</span>
                                      </td>
                                      {mode === EDIT && (
                                        <td className="px-4 py-2 text-center">
                                          <div className="inline-flex gap-1">
                                            <Btn label="P" active={r.status === 'Present'} tone="moss"    onClick={() => setEditStatus(r.roll, 'Present')} />
                                            <Btn label="A" active={r.status === 'Absent'}  tone="bad"     onClick={() => setEditStatus(r.roll, 'Absent')} />
                                            <Btn label="L" active={r.status === 'Leave'}   tone="mustard" onClick={() => setEditStatus(r.roll, 'Leave')} />
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                  {editRoster.length === 0 && (
                                    <tr><td colSpan={mode === EDIT ? 6 : 5} className="px-4 py-6 text-center text-cocoa text-xs font-bold uppercase tracking-wider">No students.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            {mode === EDIT && (
              <div className="px-5 py-3 border-t-2 border-dashed border-cocoa/30 text-[11px] font-bold text-cocoa uppercase tracking-wider">
                &gt; you can update P/A/L for any past lecture in this semester. The session date stays fixed.
              </div>
            )}
          </>)}
        </SectionCard>
      )}

    </div>
  )
}

function ModeButton({ onClick, Icon, title, sub, accent }) {
  return (
    <button onClick={onClick} className={`chunky-card chunky-card-hover p-2.5 text-left ${accent ? 'ring-2 ring-burn' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0">
          <Icon size={13} className="text-bone" strokeWidth={2.8} />
        </div>
        <span className="font-display text-xs text-ink uppercase tracking-wider truncate">{title}</span>
      </div>
      <div className="text-[10px] text-cocoa font-bold leading-snug line-clamp-2">{sub}</div>
    </button>
  )
}

function ModeBadge({ mode }) {
  const map = {
    [IDLE]: { label: 'IDLE', tone: 'bg-bone text-ink' },
    [VIEW]: { label: 'VIEW', tone: 'bg-coffee text-bone' },
    [EDIT]: { label: 'EDIT', tone: 'bg-mustard text-ink' },
    [BLE]:  { label: 'PIN',  tone: 'bg-burn text-bone animate-blink' },
  }
  const info = map[mode] || map[IDLE]
  return (
    <div className="flex items-center gap-2">
      <span className={`tag ${info.tone}`}>{info.label}</span>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; {label}</div>
      {children}
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}

function Btn({ label, onClick, active, tone }) {
  const tones = {
    moss:    active ? 'bg-moss text-cream'    : 'bg-bone text-ink',
    bad:     active ? 'bg-bad text-bone'     : 'bg-bone text-ink',
    mustard: active ? 'bg-mustard text-ink'  : 'bg-bone text-ink',
  }
  return (
    <button onClick={onClick} className={`px-2.5 py-1 rounded border-2 border-ink font-extrabold text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${tones[tone]}`}>
      {label}
    </button>
  )
}
