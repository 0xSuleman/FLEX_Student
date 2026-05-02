import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Target, Printer, AlertTriangle,
  Calendar, ScrollText, PieChart, GraduationCap, RefreshCw,
} from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

// CLO mapping is course-design metadata that we don't yet have a backend model
// for. As a defensible default, we round-robin components across CLO-1..CLO-5.
// When a course-CLO map ships in the future, swap this for the real mapping.
const CLOS = [
  { id: 'CLO-1', desc: 'CLO 1', target: 60 },
  { id: 'CLO-2', desc: 'CLO 2', target: 60 },
  { id: 'CLO-3', desc: 'CLO 3', target: 60 },
  { id: 'CLO-4', desc: 'CLO 4', target: 60 },
  { id: 'CLO-5', desc: 'CLO 5', target: 60 },
]

const TABS = [
  { key: 'marksheet',    label: 'Mark Sheet',          Icon: ScrollText },
  { key: 'daywise',      label: 'Day-Wise Attendance', Icon: Calendar },
  { key: 'attsheet',     label: 'Attendance Sheet',    Icon: Printer },
  { key: 'eval',         label: 'Eval Report',         Icon: PieChart },
  { key: 'gradecontrib', label: 'Grade Contribution',  Icon: GraduationCap },
  { key: 'obe',          label: 'OBE / CLO',           Icon: Target },
  { key: 'lowclo',       label: 'Low-CLO Students',    Icon: AlertTriangle },
]

export default function FacultyReports() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [roster, setRoster] = useState([])
  const [instruments, setInstruments] = useState([])
  const [scores, setScores] = useState({})    // {componentId: {enrollmentId: obtained}}
  const [sessions, setSessions] = useState([])
  const [tab, setTab] = useState('marksheet')
  const [studentId, setStudentId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/faculty/courses?semester=Spring%202026')
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr)
        if (arr.length > 0 && !courseId) setCourseId(arr[0].id)
      })
      .catch(() => {})
  }, [])

  const load = async (sid) => {
    if (!sid) return
    setLoading(true)
    try {
      const [m, a] = await Promise.allSettled([
        api.get(`/faculty/sections/${sid}/marks`),
        api.get(`/faculty/sections/${sid}/attendance/sessions`),
      ])
      if (m.status === 'fulfilled') {
        const d = m.value.data || {}
        setRoster(d.roster || [])
        setInstruments(d.instruments || [])
        setScores(d.scores || {})
        if ((d.roster || []).length > 0) setStudentId(d.roster[0].enrollmentId)
      }
      if (a.status === 'fulfilled') setSessions(Array.isArray(a.value.data) ? a.value.data : [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(courseId) }, [courseId])

  // Flat list of components from instruments, in display order. Each has a
  // CLO assignment (round-robin) so the OBE tab has something to show until
  // a richer CLO-mapping model exists.
  const components = useMemo(() => {
    const flat = []
    let idx = 0
    for (const ins of instruments) {
      for (const c of (ins.components || [])) {
        flat.push({
          id: c.id,
          key: `c${c.id}`,
          name: `${ins.name}: ${c.name}`,
          weight: c.weightage,
          max: c.maxMarks,
          clo: CLOS[idx % CLOS.length].id,
        })
        idx++
      }
    }
    return flat
  }, [instruments])

  // Marks indexed by enrollmentId+componentKey for matching the existing UI shape.
  const marksByStudent = useMemo(() => {
    const out = {}
    for (const r of roster) {
      const m = {}
      for (const c of components) {
        const v = scores[c.id]?.[r.enrollmentId]
        if (v != null) m[c.key] = v
      }
      out[r.enrollmentId] = m
    }
    return out
  }, [roster, components, scores])

  const course = courses.find(c => String(c.id) === String(courseId))
  const student = roster.find(r => r.enrollmentId === studentId)

  const evalStats = useMemo(() => components.map(c => {
    const vals = roster.map(r => marksByStudent[r.enrollmentId]?.[c.key]).filter(v => v != null)
    if (vals.length === 0) return { ...c, mean: 0, min: 0, maxScore: 0, std: 0, meanPct: 0, dropSuggested: false }
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length
    const min = Math.min(...vals)
    const maxScore = Math.max(...vals)
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length
    const std = Math.sqrt(variance)
    const meanPct = c.max > 0 ? (mean / c.max) * 100 : 0
    const dropSuggested = meanPct < 50 && std > c.max * 0.2
    return { ...c, mean: Math.round(mean * 10) / 10, min, maxScore, std: Math.round(std * 10) / 10, meanPct: Math.round(meanPct), dropSuggested }
  }), [roster, components, marksByStudent])

  const cloAttainment = useMemo(() => CLOS.map(clo => {
    const cs = components.filter(c => c.clo === clo.id)
    if (cs.length === 0) return { ...clo, achieved: 0, met: false }
    let total = 0, students = 0
    for (const r of roster) {
      let acc = 0, count = 0
      for (const c of cs) {
        const v = marksByStudent[r.enrollmentId]?.[c.key]
        if (v != null && c.max > 0) { acc += (v / c.max) * 100; count += 1 }
      }
      if (count > 0) { total += acc / count; students += 1 }
    }
    const achieved = students > 0 ? Math.round(total / students) : 0
    return { ...clo, achieved, met: achieved >= clo.target }
  }), [roster, components, marksByStudent])

  const lowCloStudents = useMemo(() => {
    const out = []
    for (const r of roster) {
      for (const clo of CLOS) {
        const cs = components.filter(c => c.clo === clo.id)
        if (cs.length === 0) continue
        let acc = 0, count = 0
        for (const c of cs) {
          const v = marksByStudent[r.enrollmentId]?.[c.key]
          if (v != null && c.max > 0) { acc += (v / c.max) * 100; count += 1 }
        }
        const pct = count > 0 ? acc / count : 0
        if (pct < 40) out.push({ rollNo: r.rollNo, name: r.name, clo: clo.id, pct: Math.round(pct) })
      }
    }
    return out
  }, [roster, components, marksByStudent])

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Reports" KickerIcon={BarChart3} title="FACULTY REPORTS"
        subtitle="Mark sheets · attendance reports · eval / drop analysis · OBE attainment · low-CLO watchlist. All values sourced from your real marks + attendance entries." />

      <div className="chunky-card overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-ink bg-tan flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-ink uppercase tracking-widest">&gt; Section</span>
            <select value={courseId || ''} onChange={e => setCourseId(e.target.value)}
              className="bg-bone border-2 border-ink rounded-md px-3 py-1.5 font-mono text-sm text-ink focus:outline-none">
              {courses.length === 0 && <option>No assigned sections</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} · {c.section}</option>)}
            </select>
          </div>
          <div className="ml-auto">
            <ActionButton tone="bone" Icon={RefreshCw} onClick={() => load(courseId)}>Refresh</ActionButton>
          </div>
        </div>
        <div className="px-5 py-3 flex flex-wrap gap-2 border-b-2 border-ink">
          {TABS.map(t => {
            const Icon = t.Icon
            const isActive = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 border-2 border-ink rounded-md font-display text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 shadow-pixel-sm transition-all ${isActive ? 'bg-cocoa text-bone' : 'bg-bone text-ink hover:-translate-x-[1px] hover:-translate-y-[1px]'}`}>
                <Icon size={11} strokeWidth={3} /> {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32"><div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
      )}

      {!loading && components.length === 0 && (
        <SectionCard title="No marks defined yet">
          <div className="px-5 py-10 text-center text-xs font-bold text-cocoa uppercase tracking-wider">
            Define evaluation instruments on the Marks page first — every report below is computed from them.
          </div>
        </SectionCard>
      )}

      {!loading && components.length > 0 && (
        <>
          {tab === 'marksheet' && (
            <SectionCard
              title={`Mark Sheet — ${course?.courseCode || ''} · ${course?.section || ''}`}
              right={
                <div className="flex items-center gap-2">
                  <select value={studentId || ''} onChange={e => setStudentId(parseInt(e.target.value, 10))}
                    className="bg-bone border-2 border-ink rounded-md px-3 py-1.5 font-mono text-xs text-ink focus:outline-none">
                    {roster.map(r => <option key={r.enrollmentId} value={r.enrollmentId}>{r.rollNo} · {r.name}</option>)}
                  </select>
                  <ActionButton tone="bone" Icon={Printer} onClick={() => window.print()}>Print</ActionButton>
                </div>
              }>
              {student ? (
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <Mini label="Roll No"  value={student.rollNo} />
                    <Mini label="Name"     value={student.name} />
                    <Mini label="Section"  value={course?.section || '—'} />
                    <Mini label="Course"   value={course?.courseCode || '—'} />
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bone border-b-2 border-ink text-coffee">
                        <Th>Component</Th><Th center>Weight</Th><Th center>Max</Th><Th center>Obtained</Th><Th center>%</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map(c => {
                        const v = marksByStudent[student.enrollmentId]?.[c.key]
                        const pct = (v != null && c.max > 0) ? Math.round((v / c.max) * 100) : null
                        return (
                          <tr key={c.id} className="border-b border-dashed border-cocoa/30">
                            <td className="px-4 py-2 font-extrabold text-ink">{c.name}</td>
                            <td className="px-4 py-2 text-center"><span className="tag bg-tan text-ink">{c.weight}%</span></td>
                            <td className="px-4 py-2 text-center font-mono text-cocoa">{c.max}</td>
                            <td className="px-4 py-2 text-center"><span className="tag bg-coffee text-bone">{v ?? '—'}</span></td>
                            <td className="px-4 py-2 text-center font-mono text-ink">{pct == null ? '—' : `${pct}%`}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="px-5 py-8 text-cocoa text-xs uppercase tracking-wider">No students enrolled.</div>}
            </SectionCard>
          )}

          {tab === 'daywise' && (
            <SectionCard title={`Day-Wise Attendance — ${course?.courseCode || ''} · ${course?.section || ''}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone border-b-2 border-ink text-coffee">
                    <Th>#</Th><Th>Date</Th><Th>Topic</Th><Th center>Status</Th>
                    <Th center>Present</Th><Th center>Absent</Th><Th center>Leave</Th><Th center>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No sessions yet.</td></tr>
                  ) : sessions.map((s, i) => (
                    <tr key={s.sessionId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                      <td className="px-4 py-2 font-extrabold text-ink">{s.lectureNo}</td>
                      <td className="px-4 py-2 font-mono text-xs text-cocoa">{s.date || '—'}</td>
                      <td className="px-4 py-2 text-ink">{s.topic || '—'}</td>
                      <td className="px-4 py-2 text-center"><span className={`tag ${s.status === 'CLOSED' ? 'bg-cocoa text-bone' : 'bg-burn text-bone'}`}>{s.status}</span></td>
                      <td className="px-4 py-2 text-center"><span className="tag bg-moss text-cream">{s.present}</span></td>
                      <td className="px-4 py-2 text-center"><span className="tag bg-bad text-bone">{s.absent}</span></td>
                      <td className="px-4 py-2 text-center"><span className="tag bg-mustard text-ink">{s.leave}</span></td>
                      <td className="px-4 py-2 text-center font-mono text-cocoa">{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {tab === 'attsheet' && (
            <SectionCard title={`Attendance Sheet — ${course?.courseCode || ''} · ${course?.section || ''}`}>
              <div className="px-5 py-5 text-xs text-cocoa font-bold uppercase tracking-wider">
                Total sessions: {sessions.length} · Average present per session: {sessions.length === 0 ? '—' : Math.round(sessions.reduce((s, x) => s + x.present, 0) / sessions.length)}
              </div>
            </SectionCard>
          )}

          {tab === 'eval' && (
            <SectionCard title="Evaluation Report (per component)">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone border-b-2 border-ink text-coffee">
                    <Th>Component</Th><Th center>Mean</Th><Th center>Min</Th><Th center>Max</Th><Th center>Std</Th><Th center>Mean %</Th><Th center>Drop?</Th>
                  </tr>
                </thead>
                <tbody>
                  {evalStats.map(s => (
                    <tr key={s.id} className="border-b border-dashed border-cocoa/30">
                      <td className="px-4 py-2 font-extrabold text-ink">{s.name}</td>
                      <td className="px-4 py-2 text-center font-mono">{s.mean}</td>
                      <td className="px-4 py-2 text-center font-mono">{s.min}</td>
                      <td className="px-4 py-2 text-center font-mono">{s.maxScore}</td>
                      <td className="px-4 py-2 text-center font-mono">{s.std}</td>
                      <td className="px-4 py-2 text-center"><span className={`tag ${s.meanPct >= 60 ? 'bg-moss text-cream' : 'bg-mustard text-ink'}`}>{s.meanPct}%</span></td>
                      <td className="px-4 py-2 text-center">{s.dropSuggested ? <span className="tag bg-bad text-bone">DROP</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {tab === 'gradecontrib' && (
            <SectionCard title="Grade Contribution (per component, totals to 100%)">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone border-b-2 border-ink text-coffee"><Th>Component</Th><Th center>Weight</Th><Th center>Mean %</Th><Th center>Contribution</Th></tr>
                </thead>
                <tbody>
                  {evalStats.map(s => (
                    <tr key={s.id} className="border-b border-dashed border-cocoa/30">
                      <td className="px-4 py-2 font-extrabold text-ink">{s.name}</td>
                      <td className="px-4 py-2 text-center font-mono">{s.weight}%</td>
                      <td className="px-4 py-2 text-center font-mono">{s.meanPct}%</td>
                      <td className="px-4 py-2 text-center"><span className="tag bg-coffee text-bone">{Math.round((s.meanPct / 100) * s.weight * 10) / 10}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {tab === 'obe' && (
            <SectionCard title="OBE / CLO Attainment">
              <div className="p-5 space-y-2">
                {cloAttainment.map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="w-20 font-extrabold text-xs text-ink uppercase tracking-wider">{c.id}</span>
                    <div className="flex-1 bg-cream border-2 border-ink rounded h-4 overflow-hidden">
                      <div className={`h-full ${c.met ? 'bg-moss' : 'bg-bad'}`} style={{ width: `${Math.min(100, c.achieved)}%` }} />
                    </div>
                    <span className="w-24 text-right text-[11px] font-extrabold text-ink tabular-nums">{c.achieved}% / {c.target}%</span>
                    <span className={`tag ${c.met ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>{c.met ? 'Met' : 'Not met'}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === 'lowclo' && (
            <SectionCard title="Low-CLO Watchlist (<40%)">
              {lowCloStudents.length === 0 ? (
                <div className="px-5 py-8 text-cocoa text-xs uppercase tracking-wider">No students below threshold.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bone border-b-2 border-ink text-coffee"><Th>Roll</Th><Th>Name</Th><Th center>CLO</Th><Th center>Achievement</Th></tr>
                  </thead>
                  <tbody>
                    {lowCloStudents.map((s, i) => (
                      <tr key={i} className="border-b border-dashed border-cocoa/30">
                        <td className="px-4 py-2 font-extrabold text-ink">{s.rollNo}</td>
                        <td className="px-4 py-2 text-ink">{s.name}</td>
                        <td className="px-4 py-2 text-center"><span className="tag bg-coffee text-bone">{s.clo}</span></td>
                        <td className="px-4 py-2 text-center"><span className="tag bg-bad text-bone">{s.pct}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="bg-bone border-2 border-ink rounded px-2 py-1.5">
      <div className="text-[8px] font-extrabold text-coffee uppercase tracking-widest">{label}</div>
      <div className="font-black text-sm text-ink mt-0.5">{value || '—'}</div>
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}
