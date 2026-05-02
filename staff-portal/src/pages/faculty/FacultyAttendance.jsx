import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bluetooth, Play, Square, Save, Clock, Eye, Hand, X,
  Users, CheckCircle2, XCircle, Coffee, Search, AlertTriangle,
  ListChecks, RefreshCw, Download,
} from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, ActionButton, StatCard } from '../../components/PageShell'

// ── Mode constants ──
const IDLE   = 'idle'
const VIEW   = 'view'
const MANUAL = 'manual'
const BLE    = 'ble'

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
  const [bleDeviceName, setBleDeviceName] = useState('')
  const [now, setNow] = useState(Date.now())
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pastSessions, setPastSessions] = useState([])
  const [bleSupported, setBleSupported] = useState(false)
  // VIEW mode: real past sessions from backend + per-session expanded edit roster.
  const [viewSessions, setViewSessions] = useState([])
  const [viewLoading, setViewLoading] = useState(false)
  const [editSessionId, setEditSessionId] = useState(null)
  const [editRoster, setEditRoster] = useState([])
  const [editSaving, setEditSaving] = useState(false)
  const tickRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    setBleSupported(typeof navigator !== 'undefined' && 'bluetooth' in navigator)
  }, [])

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

  // ── BLE polling — replaces the old fake client simulator ──
  // Polls real backend every 2s for any student who has self-marked through their
  // portal's "Mark Attendance" button, and reflects it in the live faculty roster.
  // Faculty manual overrides are preserved (only Pending rows are updated from server).
  useEffect(() => {
    if (mode !== BLE || !bleSession) return
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
          return { ...r, status, method: live.method || 'Bluetooth' }
        }))
      } catch { /* keep last good */ }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [mode, bleSession])

  // Countdown ticker
  useEffect(() => {
    if (mode !== BLE || !bleSession) return
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

  // ── Mode initiations ──
  const startManual = async () => {
    if (!courseId) return
    await loadRoster('Present', 'Manual')   // Everyone defaults to Present
    setMode(MANUAL)
    setBleSession(null)
    setToast({ kind: 'info', text: 'Manual session — everyone is Present by default. Mark only the absent / late students, then Save.' })
    clearToastSoon()
  }

  const startBleMode = () => {
    if (!courseId) return
    setMode(BLE)
    setBleSession(null)
  }

  const openBleWindow = async () => {
    if (!topic.trim()) {
      setToast({ kind: 'err', text: 'Topic is required before opening a BLE window.' })
      clearToastSoon()
      return
    }
    const cleanedName = bleDeviceName.trim()
    if (!cleanedName.toUpperCase().startsWith('FLEX-')) {
      setToast({ kind: 'err', text: 'BLE device name must start with FLEX- (e.g. FLEX-CS3001-A). Set this to the name your phone or beacon is broadcasting.' })
      clearToastSoon()
      return
    }
    // Hard gate: faculty must verify their BLE device is reachable from this
    // browser too. No silent skip if Web Bluetooth is missing or pairing fails.
    if (!bleSupported) {
      setToast({ kind: 'err', text: 'Bluetooth is not available in this browser. Use Chrome/Edge over HTTPS or localhost.' })
      clearToastSoon()
      return
    }
    try {
      await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'FLEX-' }], optionalServices: [] })
    } catch (err) {
      setToast({ kind: 'err', text: 'Bluetooth pairing was cancelled. Open nRF Connect on your phone, broadcast the FLEX- name, then retry.' })
      clearToastSoon()
      return
    }
    try {
      const res = await api.post('/faculty/attendance/sessions', {
        facultySectionId: parseInt(courseId, 10),
        topic,
        durationMinutes: duration,
        bleDeviceName: cleanedName,
      })
      const s = res.data
      setBleSession({
        id: s.id,
        sessionToken: s.sessionToken,
        startedAt: new Date(s.startedAt).getTime(),
        endsAt: new Date(s.endsAt).getTime(),
      })
      setNow(new Date(s.startedAt).getTime())
      await loadRoster('Pending', '—')
      setToast({ kind: 'info', text: `BLE window open · token ${s.sessionToken}. Students see "Mark Attendance" on their portal.` })
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
    if (mode === BLE && bleSession) {
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

  const saveManual = async () => {
    if (!course) return
    if (!topic.trim()) {
      setToast({ kind: 'err', text: 'Topic is required.' })
      clearToastSoon()
      return
    }
    setSaving(true)
    try {
      const open = await api.post('/faculty/attendance/sessions', {
        facultySectionId: parseInt(courseId, 10),
        topic,
        durationMinutes: 5,
      })
      const sid = open.data.id
      await api.post(`/faculty/attendance/sessions/${sid}/close`, {
        marks: roster.map(r => ({
          enrollmentId: r.enrollmentId,
          presence: PRESENCE_CODE[r.status] || 'P',
          method: 'Manual',
        })),
      })
      pushPast({ id: sid, course, topic: topic || 'Manual entry', date: new Date().toISOString().slice(0,10), present: stats.present, absent: stats.absent, leave: stats.leave, total: stats.total, kind: 'Manual' })
      setToast({ kind: 'ok', text: `Saved · ${stats.present} present / ${stats.absent} absent / ${stats.leave} leave` })
      setMode(IDLE)
      setTopic('')
    } catch (err) {
      setToast({ kind: 'err', text: 'Save failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setSaving(false)
      clearToastSoon()
    }
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
      pushPast({ id: bleSession.id, course, topic, date: new Date().toISOString().slice(0,10), present, absent, leave, total: finalRoster.length, kind: 'BLE' })
      setToast({ kind: 'ok', text: `BLE session closed & saved · ${present} present / ${absent} absent` })
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

  const pushPast = (rec) => setPastSessions(prev => [{ ...rec, key: Date.now() }, ...prev])
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

  const remainingMs = bleSession ? Math.max(0, bleSession.endsAt - now) : 0
  const remainingMin = Math.floor(remainingMs / 60000)
  const remainingSec = Math.floor((remainingMs % 60000) / 1000)
  const elapsedPct = bleSession ? Math.min(100, ((now - bleSession.startedAt) / (bleSession.endsAt - bleSession.startedAt)) * 100) : 0

  useEffect(() => {
    if (mode === BLE && bleSession && remainingMs <= 0) closeBleAndSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  // ─── RENDER ───
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Attendance"
        KickerIcon={ListChecks}
        title="ATTENDANCE"
        subtitle="Pick a section, then choose a mode — view past records, take attendance manually, or open a BLE window for students to self-mark."
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
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportExcel} disabled={!courseId}
              title="Download per-section attendance sheet (xlsx)"
              className="bg-coffee text-bone border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
              <Download size={11} strokeWidth={3} /> Excel
            </button>
            <ModeBadge mode={mode} bleSupported={bleSupported} />
          </div>
        </div>

        {mode === IDLE && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <ModeButton onClick={startView}      Icon={Eye}   title="View Attendance"   sub="Look at past sessions for this section. Read-only." />
            <ModeButton onClick={startManual}    Icon={Hand}  title="Manual Attendance" sub="Everyone defaults to Present. Mark absent / late then Save." accent />
            <ModeButton onClick={startBleMode}   Icon={Bluetooth} title="BLE Attendance" sub="Open a Bluetooth window so students can self-mark from their portal." />
          </div>
        )}

        {mode === BLE && !bleSession && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
            <Field className="md:col-span-7" label="Lecture Topic">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Iterative & Incremental Models"
                className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
            </Field>
            <Field className="md:col-span-3" label={`Duration · ${duration} min`}>
              <input type="range" min="5" max="30" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full accent-burn" />
              <div className="flex justify-between text-[9px] font-extrabold text-cocoa uppercase tracking-wider mt-0.5">
                <span>5</span><span>15</span><span>30</span>
              </div>
            </Field>
            <Field className="md:col-span-2" label="BLE device name">
              <input value={bleDeviceName} onChange={(e) => setBleDeviceName(e.target.value)} placeholder="FLEX-CS3001-A"
                className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
            </Field>
            <div className="md:col-span-12 bg-mustard/15 border-2 border-mustard rounded-md p-3 text-[11px] text-ink leading-relaxed">
              <div className="font-extrabold uppercase tracking-widest text-burn mb-1 text-[10px]">&gt; Set up your broadcasting device first</div>
              On your phone, install <span className="font-mono font-extrabold">nRF Connect</span> (Android) or <span className="font-mono font-extrabold">Bluetooth LE Lab</span> (iOS) → open Advertiser → set Device Name to the value above (e.g. <span className="font-mono font-extrabold">FLEX-CS3001-A</span>) → Start broadcasting. Students will only be able to mark attendance if they BLE-connect to that exact device.
            </div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <ActionButton tone="bone" Icon={X} onClick={cancelMode}>Back</ActionButton>
              <ActionButton tone="cocoa" Icon={Play} onClick={openBleWindow}>Open</ActionButton>
            </div>
          </div>
        )}

        {mode === BLE && bleSession && (
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
            <div className="md:col-span-12">
              <div className="bg-bone border-2 border-ink rounded h-3 overflow-hidden relative">
                <div className="h-full bg-burn transition-all duration-1000" style={{ width: `${elapsedPct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-ink uppercase tracking-widest">
                  {Math.round(elapsedPct)}% elapsed · token {bleSession.sessionToken}
                </div>
              </div>
            </div>
            <div className="md:col-span-12 text-[11px] font-extrabold text-coffee uppercase tracking-wider flex items-center gap-2">
              <Bluetooth size={12} strokeWidth={3} className="text-burn" />
              Students must connect to <span className="font-mono bg-bone border-2 border-ink rounded px-2 py-0.5 text-ink">{bleDeviceName}</span> to mark attendance.
            </div>
          </div>
        )}

        {mode === MANUAL && (
          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <Field className="md:col-span-9" label="Lecture Topic">
              <input
                value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Iterative & Incremental Models"
                className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none"
              />
            </Field>
            <div className="md:col-span-3 flex gap-2 items-end">
              <ActionButton tone="bone" Icon={X} onClick={cancelMode}>Cancel</ActionButton>
              <ActionButton tone="cocoa" Icon={Save} onClick={saveManual} disabled={saving || !topic.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </ActionButton>
            </div>
            <div className="md:col-span-12 text-[11px] font-extrabold text-cocoa uppercase tracking-wider flex items-center gap-2">
              <Hand size={12} strokeWidth={3} className="text-burn" />
              Manual mode · default = Present · click P/A/L on a row to mark; click again to undo back to unmarked.
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
      </div>

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-moss text-cream' : toast.kind === 'err' ? 'bg-bad text-bone' : 'bg-cocoa text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : toast.kind === 'err' ? <AlertTriangle size={16} strokeWidth={3} /> : <RefreshCw size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      {(mode === MANUAL || mode === BLE) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard Icon={Users} label="Total" value={stats.total} tone="bg-cocoa text-bone" />
          <StatCard Icon={CheckCircle2} label="Present" value={stats.present} tone="bg-moss text-cream" />
          <StatCard Icon={XCircle} label="Absent" value={stats.absent} tone="bg-bad text-bone" />
          <StatCard Icon={Coffee} label="Leave" value={stats.leave} tone="bg-mustard text-ink" />
          <StatCard Icon={Clock} label="Pending" value={stats.pending} tone="bg-bone text-ink" />
        </div>
      )}

      {(mode === MANUAL || mode === BLE) && (
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
                {mode === MANUAL && <Th center>Mark</Th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.enrollmentId || r.roll} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-4 py-2.5 text-cocoa font-bold text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-extrabold text-ink">{r.roll}</td>
                  <td className="px-4 py-2.5 text-ink">{r.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    {r.status === 'Pending'
                      ? <span className="inline-block w-6 h-5 border-2 border-dashed border-cocoa/50 rounded" title="unmarked" />
                      : <span className={`tag ${STATUS_TONE[r.status]}`}>{r.status}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`tag ${r.method === 'Bluetooth' ? 'bg-coffee text-bone' : r.method === 'Manual' ? 'bg-mustard text-ink' : r.method === 'Auto' ? 'bg-cocoa text-bone' : 'bg-bone text-cocoa'}`}>{r.method}</span>
                  </td>
                  {mode === MANUAL && (
                    <td className="px-4 py-2.5 text-center">
                      <div className="inline-flex gap-1">
                        <Btn label="P" active={r.status === 'Present'} tone="moss"    onClick={() => setStatus(r.roll, 'Present')} />
                        <Btn label="A" active={r.status === 'Absent'}  tone="bad"     onClick={() => setStatus(r.roll, 'Absent')} />
                        <Btn label="L" active={r.status === 'Leave'}   tone="mustard" onClick={() => setStatus(r.roll, 'Leave')} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={mode === MANUAL ? 6 : 5} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No students.</td></tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      )}

      {mode === VIEW && (
        <SectionCard title={`Past Sessions — ${course?.courseCode || ''} · ${course?.section || ''}`}
          right={<div className="text-[10px] font-extrabold text-cocoa uppercase tracking-widest">Click a row to edit P/A/L · req 4.2.4</div>}>
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
                  <Th>#</Th><Th>Date</Th><Th>Topic</Th><Th center>Present / Total</Th><Th center>Edit</Th>
                </tr>
              </thead>
              <tbody>
                {viewSessions.map((s, i) => {
                  const open = editSessionId === s.sessionId
                  return (
                    <>
                      <tr key={s.sessionId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                        <td className="px-4 py-2.5 font-extrabold text-ink">{s.lectureNo}</td>
                        <td className="px-4 py-2.5 text-cocoa font-mono text-xs">{s.date || '—'}</td>
                        <td className="px-4 py-2.5 text-ink">{s.topic || '—'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="tag bg-moss text-cream mr-1">{s.present}</span>
                          <span className="tag bg-bad text-bone mr-1">{s.absent}</span>
                          <span className="tag bg-mustard text-ink mr-1">{s.leave}</span>
                          <span className="tag bg-cocoa text-bone">/{s.total}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => openEdit(s.sessionId)}
                            className={`px-3 py-1 border-2 border-ink rounded font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${open ? 'bg-cocoa text-bone' : 'bg-bone text-ink'}`}>
                            {open ? 'Close' : 'Edit'}
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-tan/40">
                          <td colSpan={5} className="p-4">
                            <div className="bg-bone border-2 border-ink rounded-md overflow-hidden">
                              <div className="px-4 py-2 bg-coffee text-bone flex items-center justify-between">
                                <span className="font-display text-[10px] uppercase tracking-widest">Edit roster — Lecture {s.lectureNo} · {s.date}</span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setEditSessionId(null)} disabled={editSaving}
                                    className="bg-bone text-ink border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">Cancel</button>
                                  <button onClick={saveEdit} disabled={editSaving}
                                    className="bg-burn text-bone border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                                    <Save size={11} strokeWidth={3} /> {editSaving ? 'Saving…' : 'Save Changes'}
                                  </button>
                                </div>
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-cream border-b-2 border-ink text-coffee">
                                    <Th>#</Th><Th>Roll</Th><Th>Name</Th><Th center>Current</Th><Th center>Method</Th><Th center>Mark</Th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {editRoster.map((r, j) => (
                                    <tr key={r.enrollmentId} className={`border-b border-dashed border-cocoa/30 ${j % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} ${r.dirty ? 'ring-1 ring-burn/40' : ''}`}>
                                      <td className="px-4 py-2 text-cocoa font-bold text-xs">{j + 1}</td>
                                      <td className="px-4 py-2 font-extrabold text-ink">{r.roll}</td>
                                      <td className="px-4 py-2 text-ink">{r.name}</td>
                                      <td className="px-4 py-2 text-center">
                                        {r.status === 'Pending'
                                          ? <span className="inline-block w-6 h-5 border-2 border-dashed border-cocoa/50 rounded" title="unmarked" />
                                          : <span className={`tag ${STATUS_TONE[r.status]}`}>{r.status}</span>}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <span className={`tag ${r.method === 'Bluetooth' ? 'bg-coffee text-bone' : r.method === 'Manual' ? 'bg-mustard text-ink' : r.method === 'Auto' ? 'bg-cocoa text-bone' : 'bg-bone text-cocoa'}`}>{r.method}</span>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <div className="inline-flex gap-1">
                                          <Btn label="P" active={r.status === 'Present'} tone="moss"    onClick={() => setEditStatus(r.roll, 'Present')} />
                                          <Btn label="A" active={r.status === 'Absent'}  tone="bad"     onClick={() => setEditStatus(r.roll, 'Absent')} />
                                          <Btn label="L" active={r.status === 'Leave'}   tone="mustard" onClick={() => setEditStatus(r.roll, 'Leave')} />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {editRoster.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-cocoa text-xs font-bold uppercase tracking-wider">No students.</td></tr>
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
            <div className="px-5 py-3 border-t-2 border-dashed border-cocoa/30 text-[11px] font-bold text-cocoa uppercase tracking-wider">
              &gt; Per req 4.2.4 you can update P/A/L for any past lecture in this semester. The session date stays fixed (req 4.2.5).
            </div>
          </>)}
        </SectionCard>
      )}

      {/* Legacy in-memory past list — kept for the BLE / Manual save toasts only. */}
      {false && mode === VIEW && (
        <SectionCard title={`Past Sessions — ${course?.courseCode || ''} · ${course?.section || ''}`}>
          {pastSessions.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs font-bold text-cocoa uppercase tracking-wider">
              No saved sessions yet from this UI session. Past records are stored in the student-facing attendance log.
            </div>
          ) : (<>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone border-b-2 border-ink text-coffee">
                  <Th>Date</Th><Th>Topic</Th><Th center>Kind</Th><Th center>P / A / L / Total</Th><Th center>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pastSessions.map((s, i) => (
                  <tr key={s.key} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                    <td className="px-5 py-3 text-ink">{s.date}</td>
                    <td className="px-5 py-3 text-ink">{s.topic}</td>
                    <td className="px-5 py-3 text-center"><span className={`tag ${s.kind === 'BLE' ? 'bg-coffee text-bone' : 'bg-mustard text-ink'}`}>{s.kind}</span></td>
                    <td className="px-5 py-3 text-center">
                      <span className="tag bg-moss text-cream mr-1">{s.present}</span>
                      <span className="tag bg-bad text-bone mr-1">{s.absent}</span>
                      <span className="tag bg-mustard text-ink mr-1">{s.leave}</span>
                      <span className="tag bg-cocoa text-bone">/{s.total}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          if (!confirm(`Delete this attendance record?\n\nFlex does not allow editing past-date records — you must delete and re-create.\n\nDate: ${s.date}\nTopic: ${s.topic || '(no topic)'}`)) return
                          setPastSessions(prev => prev.filter(p => p.key !== s.key))
                        }}
                        className="bg-bad text-bone border-2 border-ink rounded px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t-2 border-dashed border-cocoa/30 text-[11px] font-bold text-cocoa uppercase tracking-wider">
              &gt; Past-date records cannot be edited. To correct one, delete it then take attendance again for that date via Manual mode.
            </div>
          </>)}
        </SectionCard>
      )}
    </div>
  )
}

function ModeButton({ onClick, Icon, title, sub, accent }) {
  return (
    <button onClick={onClick} className={`chunky-card chunky-card-hover p-4 text-left ${accent ? 'ring-2 ring-burn' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
          <Icon size={16} className="text-bone" strokeWidth={2.8} />
        </div>
        <span className="font-display text-sm text-ink uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-[11px] text-cocoa font-bold leading-snug">{sub}</div>
    </button>
  )
}

function ModeBadge({ mode, bleSupported }) {
  const map = {
    [IDLE]:   { label: 'IDLE',   tone: 'bg-bone text-ink' },
    [VIEW]:   { label: 'VIEW',   tone: 'bg-coffee text-bone' },
    [MANUAL]: { label: 'MANUAL', tone: 'bg-mustard text-ink' },
    [BLE]:    { label: 'BLE',    tone: 'bg-burn text-bone animate-blink' },
  }
  const info = map[mode] || map[IDLE]
  return (
    <div className="flex items-center gap-2">
      <span className={`tag ${info.tone}`}>{info.label}</span>
      {!bleSupported && <span className="tag bg-mustard text-ink" title="Web Bluetooth not supported">BLE OFF</span>}
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
