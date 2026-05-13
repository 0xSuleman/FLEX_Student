import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Wifi, Play, Square, Save, Clock, Eye, Hand, X,
  Users, CheckCircle2, XCircle, Coffee, Search, AlertTriangle,
  ListChecks, RefreshCw, Download, Upload,
  Calendar, BookMarked, ChevronDown, ExternalLink,
} from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, ActionButton, StatCard } from '../../components/PageShell'

// ── Mode constants ──
const IDLE = 'idle'
const VIEW = 'view'
const EDIT = 'edit'
const AUTO  = 'automated' // Captive Wi-Fi automated self-mark + faculty roster polling
const MANUAL = 'manual' // Faculty-only marking — opens a session, hides self-marking, taps students to set P/A/L

const STATUS_TONE = {
  Present: 'bg-moss text-cream',
  Absent:  'bg-bad text-bone',
  Late:    'bg-mustard text-ink',
  Pending: 'bg-bone text-cocoa',
  // legacy alias — old code referenced "Leave"
  Leave:   'bg-mustard text-ink',
}

const PRESENCE_CODE = { Present: 'P', Absent: 'A', Late: 'L', Leave: 'L', Pending: '' }
const DECODE_PRESENCE = { P: 'Present', A: 'Absent', L: 'Late' }

export default function FacultyAttendance() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [mode, setMode] = useState(IDLE)
  const [roster, setRoster] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(15)
  const [networkStatus, setNetworkStatus] = useState(null)
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
  const exportMenuRef = useRef(null)
  const exportButtonRef = useRef(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportMenuPos, setExportMenuPos] = useState(null)
  const [latestMark, setLatestMark] = useState(null)
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

  // Reposition the dropdown anchored to the trigger button. Uses fixed
  // positioning so it escapes any overflow-hidden parent (SectionCard etc).
  // Mobile (<640px) full-width with 12px gutters; desktop right-aligned to
  // the button.
  const recomputeExportMenuPos = () => {
    if (!exportButtonRef.current) return
    const rect = exportButtonRef.current.getBoundingClientRect()
    const isMobile = window.innerWidth < 640
    if (isMobile) {
      setExportMenuPos({ top: rect.bottom + 6, left: 12, right: 12, width: null })
    } else {
      setExportMenuPos({ top: rect.bottom + 6, left: null, right: window.innerWidth - rect.right, width: 288 })
    }
  }

  useEffect(() => {
    if (!exportMenuOpen) return
    recomputeExportMenuPos()
    const handlerClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)
          && exportButtonRef.current && !exportButtonRef.current.contains(e.target)) {
        setExportMenuOpen(false)
      }
    }
    const handleResize = () => recomputeExportMenuPos()
    document.addEventListener('mousedown', handlerClick)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      document.removeEventListener('mousedown', handlerClick)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [exportMenuOpen])

  // On mount / section change: if there's still an OPEN session for this
  // section, restore the live session card so a page refresh doesn't make
  // the live automated attendance window vanish from the faculty view. We pick the most
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
        setActiveSession({
          id: live.id,
          startedAt: new Date(live.startedAt).getTime(),
          endsAt: new Date(live.endsAt).getTime(),
        })
        setNetworkStatus(null)
        setTopic(live.topic || '')
        setDuration(live.durationMinutes || 30)
        setNow(Date.now())
        setMode(AUTO)
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

  const downloadSheet = async (scope = 'today') => {
    if (!courseId) return
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sheet?scope=${scope}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().slice(0, 10)
      const suffix = scope === 'latest' ? 'latest' : scope === 'all' ? 'all-sessions' : today
      a.download = `attendance-${suffix}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      const label = scope === 'latest' ? 'Latest session' : scope === 'all' ? 'All sessions' : "Today's sessions"
      setToast({ kind: 'ok', text: `${label} downloaded.` })
      clearToastSoon()
    } catch (err) {
      let msg
      if (err.response?.data instanceof Blob) {
        // Server returned an error with a Blob body (because we requested blob).
        // Try to read it as JSON; otherwise fall back to a generic message.
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          msg = 'Download failed: ' + (parsed.message || text)
        } catch {
          msg = "Download failed — make sure a template is uploaded and there are sessions in this scope."
        }
      } else {
        msg = 'Download failed: ' + (err.response?.data?.message || err.message)
      }
      setToast({ kind: 'err', text: msg })
      clearToastSoon()
    }
  }

  // ── Automated attendence polling — replaces the old fake client simulator ──
  // Polls real backend every 2s for any student who has self-marked through their
  // portal's "Mark Attendance" button, and reflects it in the live faculty roster.
  // Faculty manual overrides are preserved (only Pending rows are updated from server).
  useEffect(() => {
    if ((mode !== AUTO && mode !== MANUAL) || !activeSession) return
    pollRef.current = setInterval(async () => {
      if (Date.now() >= activeSession.endsAt) return
      try {
        const res = await api.get(`/faculty/attendance/sessions/${activeSession.id}/marks`)
        const arr = Array.isArray(res.data) ? res.data : []
        let newLatest = null
        setRoster(prev => {
          const next = prev.map(r => {
            const live = arr.find(m => m.enrollmentId === r.enrollmentId)
            if (!live || !live.presence) return r
            if (r.status !== 'Pending') return r
            newLatest = { rollNo: r.roll, name: r.name }
            const status = live.presence === 'P' ? 'Present'
                         : live.presence === 'A' ? 'Absent'
                         : live.presence === 'L' ? 'Leave' : r.status
            return { ...r, status, method: live.method || 'Automated', deviceUuid: live.deviceUuid, clientIp: live.clientIp, clientMac: live.clientMac, clientFingerprint: live.clientFingerprint }
          })
          return next
        })
        if (newLatest) {
          setLatestMark(newLatest)
        }
      } catch { /* keep last good */ }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [mode, activeSession])

  // Countdown ticker
  useEffect(() => {
    if ((mode !== AUTO && mode !== MANUAL) || !activeSession) return
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tickRef.current)
  }, [mode, activeSession])

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

  // Browser UUID and hotspot MAC are hard same-session locks. The backend
  // rejects both for new marks.
  const uuidCounts = useMemo(() => {
    const m = {}
    for (const r of roster) {
      if (r.deviceUuid) m[r.deviceUuid] = (m[r.deviceUuid] || 0) + 1
    }
    return m
  }, [roster])

  // Fingerprint collisions are review flags only. They catch identical OS/screen
  // signatures but students are still allowed to mark.
  const macCounts = useMemo(() => {
    const m = {}
    for (const r of roster) {
      if (r.clientMac) m[r.clientMac] = (m[r.clientMac] || 0) + 1
    }
    return m
  }, [roster])
  const fingerprintCounts = useMemo(() => {
    const m = {}
    for (const r of roster) {
      if (r.clientFingerprint) m[r.clientFingerprint] = (m[r.clientFingerprint] || 0) + 1
    }
    return m
  }, [roster])

  // Same flags computed for the past-session edit roster so the Device column
  // there can highlight collisions exactly the same way as the live view.
  const editUuidCounts = useMemo(() => {
    const m = {}
    for (const r of editRoster) {
      if (r.deviceUuid) m[r.deviceUuid] = (m[r.deviceUuid] || 0) + 1
    }
    return m
  }, [editRoster])
  const editMacCounts = useMemo(() => {
    const m = {}
    for (const r of editRoster) {
      if (r.clientMac) m[r.clientMac] = (m[r.clientMac] || 0) + 1
    }
    return m
  }, [editRoster])
  const editFingerprintCounts = useMemo(() => {
    const m = {}
    for (const r of editRoster) {
      if (r.clientFingerprint) m[r.clientFingerprint] = (m[r.clientFingerprint] || 0) + 1
    }
    return m
  }, [editRoster])

  // ── Mode initiations ──
  const startEdit = async () => {
    setMode(EDIT); setActiveSession(null)
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

  const startAutomatedMode = () => {
    if (!courseId) return
    setMode(AUTO)
    setActiveSession(null)
    setLatestMark(null)
  }

  const startManualMode = () => {
    if (!courseId) return
    setMode(MANUAL)
    setActiveSession(null)
    setTopic('')
    // Default everyone to Present in Manual; faculty just unchecks absentees.
    loadRoster('Present', 'Manual')
  }

  // Manual mode is one-shot: open a session + commit marks in a single click.
  // No live self-mark window, no countdown — faculty just sets everyone's status
  // and hits Save. Topic is required so Sir's record always has a name.
  const saveManualAttendance = async () => {
    const cleanTopic = (topic || '').trim()
    if (!cleanTopic) {
      setToast({ kind: 'err', text: 'Topic is required before you can save manual attendance.' })
      clearToastSoon()
      return
    }
    if (!courseId) return
    setSaving(true)
    try {
      const open = await api.post('/faculty/attendance/sessions', {
        facultySectionId: parseInt(courseId, 10),
        topic: cleanTopic,
        durationMinutes: 5,  // tiny window; we close it immediately below
        mode: 'MANUAL',
      })
      const sessionId = open.data.id
      // Build marks: anything still Pending falls through to backend's Auto/Absent rule.
      const finalRoster = roster.map(r => r.status === 'Pending' ? { ...r, status: 'Absent', method: 'Auto' } : r)
      await api.post(`/faculty/attendance/sessions/${sessionId}/close`, {
        marks: finalRoster.map(r => ({
          enrollmentId: r.enrollmentId,
          presence: PRESENCE_CODE[r.status] || 'A',
          method: r.method && r.method !== '—' ? r.method : 'Manual',
        })),
      })
      const present = finalRoster.filter(r => r.status === 'Present').length
      const absent  = finalRoster.filter(r => r.status === 'Absent').length
      const late    = finalRoster.filter(r => r.status === 'Late' || r.status === 'Leave').length
      setToast({ kind: 'ok', text: `Manual attendance saved · ${present} P / ${absent} A / ${late} L` })
      setMode(IDLE)
      setActiveSession(null)
      setTopic('')
    } catch (err) {
      setToast({ kind: 'err', text: 'Save failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setSaving(false)
      clearToastSoon()
    }
  }

  // Toggle a status on a roster row. If the same status is already active
  // → un-mark (back to Pending). Otherwise, set the new status. Used by the
  // P/A/L buttons in MANUAL mode.
  const setRowStatus = (enrollmentId, status) => {
    setRoster(prev => prev.map(r => {
      if (r.enrollmentId !== enrollmentId) return r
      if (r.status === status) {
        return { ...r, status: 'Pending', method: '—', dirty: true }
      }
      return { ...r, status, method: 'Manual', dirty: true }
    }))
  }

  const openAutomatedWindow = async () => {
    if (!topic.trim()) {
      setToast({ kind: 'err', text: 'Topic is required before opening a session.' })
      clearToastSoon()
      return
    }
    setSaving(true)
    let openedSessionId = null
    try {
      const res = await api.post('/faculty/attendance/sessions', {
        facultySectionId: parseInt(courseId, 10),
        topic,
        durationMinutes: duration,
      })
      const s = res.data
      openedSessionId = s.id
      const net = await api.post(`/faculty/attendance/sessions/${s.id}/network/start`)
      setNetworkStatus(net.data || null)
      setActiveSession({
        id: s.id,
        startedAt: new Date(s.startedAt).getTime(),
        endsAt: new Date(s.endsAt).getTime(),
      })
      setNow(new Date(s.startedAt).getTime())
      // Manual mode wants every student pre-marked Present; automated attendence starts blank.
      await loadRoster(mode === MANUAL ? 'Present' : 'Pending', mode === MANUAL ? 'Manual' : '—')
      setToast({ kind: 'info', text: 'Automated Attendence is live · students join Mark-Attendence and open attendence.fast.' })
      clearToastSoon()
    } catch (err) {
      if (openedSessionId) {
        await api.post(`/faculty/attendance/sessions/${openedSessionId}/close`, { marks: [] }).catch(() => {})
      }
      setToast({ kind: 'err', text: 'Failed to open Automated Attendence session: ' + (err.response?.data?.message || err.message) })
      clearToastSoon()
    } finally {
      setSaving(false)
    }
  }

  const startView = async () => {
    setMode(VIEW); setActiveSession(null)
    if (!courseId) return
    setViewLoading(true)
    try {
      const res = await api.get(`/faculty/sections/${courseId}/attendance/sessions`)
      const arr = Array.isArray(res.data) ? res.data : []
      // Show closed sessions only — open ones still belong to Automated/Manual flows.
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
        // Convert backend P/A/L code → UI status. L renders as "Late".
        status: r.presence === 'P' ? 'Present'
              : r.presence === 'A' ? 'Absent'
              : r.presence === 'L' ? 'Late'
              : 'Pending',
        method: r.method || '—',
        deviceUuid: r.deviceUuid,
        clientIp: r.clientIp,
        clientMac: r.clientMac,
        clientFingerprint: r.clientFingerprint,
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

  const cancelMode = async () => {
    if ((mode === AUTO || mode === MANUAL) && activeSession) {
      await api.post(`/faculty/attendance/sessions/${activeSession.id}/network/stop`, {}).catch(() => {})
      await api.post(`/faculty/attendance/sessions/${activeSession.id}/close`, { marks: [] }).catch(() => {})
    }
    setMode(IDLE)
    setActiveSession(null)
    setNetworkStatus(null)
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

  const closeAutomatedAndSave = async () => {
    if (!activeSession) return
    setSaving(true)
    const finalRoster = roster.map(r => r.status === 'Pending' ? { ...r, status: 'Absent', method: 'Auto' } : r)
    try {
      await api.post(`/faculty/attendance/sessions/${activeSession.id}/network/stop`, {}).catch(() => {})
      await api.post(`/faculty/attendance/sessions/${activeSession.id}/close`, {
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
      setActiveSession(null)
      setNetworkStatus(null)
      setTopic('')
    } catch (err) {
      setToast({ kind: 'err', text: 'Close failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setSaving(false)
      clearToastSoon()
    }
  }

  const clearToastSoon = () => setTimeout(() => setToast(null), 3500)

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

  const remainingMs = activeSession ? Math.max(0, activeSession.endsAt - now) : 0
  const remainingMin = Math.floor(remainingMs / 60000)
  const remainingSec = Math.floor((remainingMs % 60000) / 1000)
  const elapsedPct = activeSession ? Math.min(100, ((now - activeSession.startedAt) / (activeSession.endsAt - activeSession.startedAt)) * 100) : 0

  useEffect(() => {
    if ((mode === AUTO || mode === MANUAL) && activeSession && remainingMs <= 0) closeAutomatedAndSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  // ─── RENDER ───
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Attendance"
        KickerIcon={ListChecks}
        title="ATTENDANCE"
        subtitle="Pick a section, then choose a mode — view past records, edit a past session, open an Automated Attendence Wi-Fi window, or do manual attendance."
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
            <button ref={exportButtonRef} onClick={() => setExportMenuOpen(v => !v)} disabled={!courseId || !templateStatus?.uploaded}
              title="Download the uploaded template with attendance columns appended. Choose Today, Latest, or Overview."
              className="bg-burn text-bone border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5 disabled:opacity-50">
              <Download size={11} strokeWidth={3} /> Export Excel
              <ChevronDown size={10} strokeWidth={3} className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportMenuOpen && exportMenuPos && (
              <div ref={exportMenuRef}
                style={{
                  position: 'fixed',
                  top: exportMenuPos.top,
                  left: exportMenuPos.left ?? 'auto',
                  right: exportMenuPos.right ?? 'auto',
                  width: exportMenuPos.width ?? 'auto',
                }}
                className="bg-cream border-2 border-ink rounded-md shadow-pixel z-50 overflow-hidden">
                <div className="bg-cocoa text-bone px-3 py-2 border-b-2 border-ink">
                  <div className="font-display text-[10px] uppercase tracking-widest">Download Sheet</div>
                  <div className="text-[9px] text-tan font-bold mt-0.5 normal-case tracking-normal">Pick a scope · template-format xlsx</div>
                </div>
                <ExportItem
                  Icon={Calendar} title="Today" sub="Every session held today (one column per class — handles makeup classes)"
                  onClick={() => { setExportMenuOpen(false); downloadSheet('today') }}
                />
                <ExportItem
                  Icon={Clock} title="Latest Session" sub="Just the most recent lecture's attendance"
                  onClick={() => { setExportMenuOpen(false); downloadSheet('latest') }}
                />
                <ExportItem
                  Icon={BookMarked} title="Overview" sub="Full semester · every session as its own column"
                  onClick={() => { setExportMenuOpen(false); downloadSheet('all') }}
                  last
                />
              </div>
            )}
            <ModeBadge mode={mode} />
          </div>
        </div>

        {mode === IDLE && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <ModeButton onClick={startView}        Icon={Eye}       title="View"   sub="Past closed sessions, read-only." />
            <ModeButton onClick={startEdit}        Icon={Hand}      title="Edit"   sub="Pick a past session, update P/A/L." accent />
            <ModeButton onClick={startAutomatedMode}     Icon={Wifi} title="Automated" sub="Start Wi-Fi attendance." />
            <ModeButton onClick={startManualMode}  Icon={ListChecks} title="Manual" sub="Tap each student to mark P/A/L." />
          </div>
        )}

        {mode === AUTO && !activeSession && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
            <Field className="md:col-span-8" label="Lecture Topic">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Iterative & Incremental Models"
                className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
            </Field>
            <Field className="md:col-span-4" label={`Duration · ${duration >= 60 ? `${(duration / 60).toFixed(duration % 60 ? 1 : 0)} hr` : `${duration} min`}`}>
              <input type="range" min="5" max="180" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full accent-ink" />
            </Field>
            <div className="md:col-span-12 text-[11px] font-bold text-cocoa">
              Click the open button to start <span className="font-mono text-ink">Mark-Attendence</span> Wifi, students open <span className="font-mono text-ink">attendence.fast</span> in their browser, Enter their roll no to mark attendence.
            </div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <ActionButton tone="bone" Icon={X} onClick={cancelMode}>Back</ActionButton>
              <ActionButton tone="cocoa" Icon={Play} onClick={openAutomatedWindow} disabled={saving}>{saving ? 'Starting...' : 'Open'}</ActionButton>
            </div>
          </div>
        )}

        {mode === MANUAL && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <Field className="md:col-span-8" label="Lecture Topic (required)">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Iterative & Incremental Models"
                className={`w-full bg-bone border-2 rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none ${!topic.trim() ? 'border-bad' : 'border-ink'}`} />
            </Field>
            <div className="md:col-span-4 flex items-end gap-2 justify-end">
              <ActionButton tone="bone" Icon={X} onClick={cancelMode} disabled={saving}>Close</ActionButton>
              <ActionButton tone="cocoa" Icon={Save} onClick={saveManualAttendance} disabled={saving || !topic.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </ActionButton>
            </div>
            <div className="md:col-span-12 text-[11px] font-bold text-cocoa">
              Every student starts as <span className="text-moss">Present</span>. Click <span className="text-bad">A</span> to mark Absent, <span className="text-mustard">L</span> for Late, or click an already-active button to un-mark. <span className="font-extrabold">Close</span> discards changes; <span className="font-extrabold">Save</span> commits — topic must be set first.
            </div>
          </div>
        )}

        {mode === AUTO && activeSession && (
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
              <ActionButton tone="bad" Icon={Square} onClick={closeAutomatedAndSave} disabled={saving}>{saving ? 'Saving…' : 'Close & Save'}</ActionButton>
            </div>
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-cream border-2 border-ink rounded-md p-3">
                <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-3">&gt; Latest Marked Student</div>
                {latestMark ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-moss text-cream rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-ink truncate">{latestMark.rollNo}</div>
                      <div className="text-[10px] font-bold text-cocoa truncate">{latestMark.name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-cocoa opacity-60">Waiting for marks...</div>
                )}
              </div>
              <div className="bg-coffee text-bone border-2 border-ink rounded-md p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-bone border-2 border-ink rounded-md flex items-center justify-center shrink-0">
                  <Wifi size={18} className="text-coffee" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">&gt; Student access</div>
                  <div className="font-mono font-extrabold text-base md:text-lg mt-0.5 break-all">SSID {networkStatus?.ssid || 'Mark-Attendence'} · attendence.fast</div>
                </div>
                <button onClick={() => window.open(`/faculty/attendance/projector/${activeSession.id}`, '_blank')}
                  className="bg-bone text-ink border-2 border-ink rounded px-2.5 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                  <ExternalLink size={11} strokeWidth={3} /> Projector
                </button>
              </div>
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

      {(mode === AUTO || mode === MANUAL) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard Icon={Users} label="Total" value={stats.total} tone="bg-cocoa text-bone" />
          <StatCard Icon={CheckCircle2} label="Present" value={stats.present} tone="bg-moss text-cream" />
          <StatCard Icon={XCircle} label="Absent" value={stats.absent} tone="bg-bad text-bone" />
          <StatCard Icon={Coffee} label="Leave" value={stats.leave} tone="bg-mustard text-ink" />
          <StatCard Icon={Clock} label="Pending" value={stats.pending} tone="bg-bone text-ink" />
        </div>
      )}

      {(mode === AUTO || mode === MANUAL) && (
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
                {mode === MANUAL && <Th center>Mark</Th>}
                <Th center>Method</Th>
                <Th center>Device</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const dupUuid = r.deviceUuid && uuidCounts[r.deviceUuid] > 1
                const dupMac = r.clientMac && macCounts[r.clientMac] > 1
                const dupFingerprint = r.clientFingerprint && fingerprintCounts[r.clientFingerprint] > 1
                const hardFlag = dupUuid || dupMac
                const rowBg = hardFlag ? 'bg-bad/10' : dupFingerprint ? 'bg-mustard/15' : i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'
                return (
                <tr key={r.enrollmentId || r.roll} className={`border-b border-dashed border-cocoa/30 ${rowBg}`}>
                  <td className="px-4 py-2.5 text-cocoa font-bold text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-extrabold text-ink">{r.roll}</td>
                  <td className="px-4 py-2.5 text-ink">{r.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    {r.status === 'Pending'
                      ? <span className="inline-block w-6 h-5 border-2 border-dashed border-cocoa/50 rounded" title="unmarked" />
                      : <span className={`tag ${STATUS_TONE[r.status]}`}>{r.status === 'Leave' ? 'Late' : r.status}</span>}
                  </td>
                  {mode === MANUAL && (
                    <td className="px-4 py-2.5 text-center">
                      <div className="inline-flex gap-1">
                        <Btn label="P" active={r.status === 'Present'} tone="moss"    onClick={() => setRowStatus(r.enrollmentId, 'Present')} />
                        <Btn label="A" active={r.status === 'Absent'}  tone="bad"     onClick={() => setRowStatus(r.enrollmentId, 'Absent')} />
                        <Btn label="L" active={r.status === 'Late' || r.status === 'Leave'} tone="mustard" onClick={() => setRowStatus(r.enrollmentId, 'Late')} />
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-center">
                    <MethodTag method={r.method} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DeviceCell r={r} dupUuid={dupUuid} dupMac={dupMac} dupFingerprint={dupFingerprint}
                      uuidCount={uuidCounts[r.deviceUuid]}
                      macCount={macCounts[r.clientMac]}
                      fingerprintCount={fingerprintCounts[r.clientFingerprint]} />
                  </td>
                </tr>
              )})}
              {filtered.length === 0 && (
                <tr><td colSpan={mode === MANUAL ? 7 : 6} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No students.</td></tr>
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
                                    <Th center>Device</Th>
                                    {mode === EDIT && <Th center>Mark</Th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {editRoster.map((r, j) => {
                                    const dupUuidE = r.deviceUuid && editUuidCounts[r.deviceUuid] > 1
                                    const dupMacE = r.clientMac && editMacCounts[r.clientMac] > 1
                                    const dupFingerprintE = r.clientFingerprint && editFingerprintCounts[r.clientFingerprint] > 1
                                    const hardFlagE = dupUuidE || dupMacE
                                    const rowBgE = hardFlagE ? 'bg-bad/10' : dupFingerprintE ? 'bg-mustard/15' : j % 2 === 0 ? 'bg-cream' : 'bg-bone/50'
                                    return (
                                    <tr key={r.enrollmentId} className={`border-b border-dashed border-cocoa/30 ${rowBgE} ${r.dirty ? 'ring-1 ring-burn/40' : ''}`}>
                                      <td className="px-4 py-2 text-left text-cocoa font-bold text-xs">{j + 1}</td>
                                      <td className="px-4 py-2 text-left font-extrabold text-ink">{r.roll}</td>
                                      <td className="px-4 py-2 text-left text-ink">{r.name}</td>
                                      <td className="px-4 py-2 text-center">
                                        {r.status === 'Pending'
                                          ? <span className="inline-block w-6 h-5 border-2 border-dashed border-cocoa/50 rounded" title="unmarked" />
                                          : <span className={`tag ${STATUS_TONE[r.status]}`}>{r.status === 'Leave' ? 'Late' : r.status}</span>}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <MethodTag method={r.method} />
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <DeviceCell r={r} dupUuid={dupUuidE} dupMac={dupMacE} dupFingerprint={dupFingerprintE}
                                          uuidCount={editUuidCounts[r.deviceUuid]}
                                          macCount={editMacCounts[r.clientMac]}
                                          fingerprintCount={editFingerprintCounts[r.clientFingerprint]} />
                                      </td>
                                      {mode === EDIT && (
                                        <td className="px-4 py-2 text-center">
                                          <div className="inline-flex gap-1">
                                            <Btn label="P" active={r.status === 'Present'} tone="moss"    onClick={() => setEditStatus(r.roll, 'Present')} />
                                            <Btn label="A" active={r.status === 'Absent'}  tone="bad"     onClick={() => setEditStatus(r.roll, 'Absent')} />
                                            <Btn label="L" active={r.status === 'Late' || r.status === 'Leave'} tone="mustard" onClick={() => setEditStatus(r.roll, 'Late')} />
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  )})}
                                  {editRoster.length === 0 && (
                                    <tr><td colSpan={mode === EDIT ? 7 : 6} className="px-4 py-6 text-center text-cocoa text-xs font-bold uppercase tracking-wider">No students.</td></tr>
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
        <span className="font-display text-[11px] text-ink uppercase tracking-wide whitespace-normal break-words leading-tight">{title}</span>
      </div>
      <div className="text-[10px] text-cocoa font-bold leading-snug line-clamp-2">{sub}</div>
    </button>
  )
}

/** A single row in the Export Excel dropdown — icon + bold title + small sub. */
function ExportItem({ Icon, title, sub, onClick, last }) {
  return (
    <button onClick={onClick}
      className={`group w-full text-left px-3 py-2.5 hover:bg-burn/15 transition-colors flex items-start gap-2.5 ${last ? '' : 'border-b border-cocoa/20'}`}>
      <div className="w-8 h-8 bg-coffee group-hover:bg-burn border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors">
        <Icon size={14} className="text-bone" strokeWidth={2.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[11px] uppercase tracking-wider text-ink">{title}</div>
        <div className="text-[10px] text-cocoa font-bold mt-0.5 leading-snug">{sub}</div>
      </div>
    </button>
  )
}

function ModeBadge({ mode }) {
  const map = {
    [IDLE]: { label: 'IDLE', tone: 'bg-bone text-ink' },
    [VIEW]: { label: 'VIEW', tone: 'bg-coffee text-bone' },
    [EDIT]: { label: 'EDIT', tone: 'bg-mustard text-ink' },
    [AUTO]:  { label: 'AUTOMATED',  tone: 'bg-burn text-bone animate-blink' },
    manual: { label: 'MANUAL', tone: 'bg-coffee text-bone' },
  }
  const info = map[mode] || map[IDLE]
  return (
    <span className={`tag ${info.tone}`}>{info.label}</span>
  )
}

function MethodTag({ method }) {
  const label = method || '—'
  const tone = label === 'Automated'
    ? 'bg-coffee text-bone'
    : label === 'Manual'
      ? 'bg-mustard text-ink'
      : label === 'Auto'
        ? 'bg-cocoa text-bone'
        : 'bg-bone text-cocoa'
  return <span className={`tag ${tone}`}>{label}</span>
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

/**
 * Speech-bubble-style "SAME DEVICE" notice with a yellow chat-tail.
 * Renders nothing when the row's device is unique. For duplicate-UUID
 * collisions (same browser, hard cheat) the bubble is red+blinking; for
 * fingerprint collisions (same phone, different browsers OR identical
 * phone models) it's mustard yellow — a review flag, not a verdict.
 */
function DeviceCell({ r, dupUuid, dupMac, dupFingerprint, uuidCount, macCount, fingerprintCount }) {
  if (!r.clientMac && !r.deviceUuid && !r.clientFingerprint) {
    return <span className="text-cocoa/40 text-xs">—</span>
  }
  if (dupUuid || dupMac || dupFingerprint) {
    const isHard = dupUuid || dupMac
    const tone = isHard ? 'bg-bad text-bone' : 'bg-mustard text-ink'
    const tailColor = isHard ? 'bg-bad' : 'bg-mustard'
    const tip = dupUuid
      ? `Same browser UUID used by ${uuidCount} students — blocked for new marks.`
      : dupMac
        ? `Same hotspot MAC as ${macCount} students — blocked for new marks.`
        : `Same OS/screen fingerprint as ${fingerprintCount} students — allowed, verify if suspicious.`
    return (
      <div className="relative inline-block" title={tip}>
        <span className={`relative ${tone} border-2 border-ink rounded-md px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-pixel-sm ${isHard ? 'animate-blink' : ''}`}>
          {dupUuid ? 'same browser' : dupMac ? 'same phone' : 'review device'}
        </span>
        {/* Chat-bubble tail: a small rotated square positioned at the bottom-left, with the bubble color + ink border (only the visible two sides). */}
        <span className={`absolute left-3 -bottom-[5px] w-2.5 h-2.5 ${tailColor} border-r-2 border-b-2 border-ink rotate-45`} aria-hidden="true" />
      </div>
    )
  }
  return (
    <span className="text-cocoa/40 text-[10px] font-mono"
      title={`MAC ${r.clientMac || '?'}${r.deviceUuid ? ` · UUID ${r.deviceUuid}` : ''}${r.clientIp ? ` · IP ${r.clientIp}` : ''}${r.clientFingerprint ? ` · ${r.clientFingerprint}` : ''}`}>
      ✓
    </span>
  )
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
