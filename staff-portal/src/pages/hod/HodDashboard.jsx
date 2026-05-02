import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, FileX, BookOpen, Layers, BarChart3, Clock, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, StatCard, SectionCard, ActionButton } from '../../components/PageShell'

export default function HodDashboard() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [counts, setCounts] = useState({})
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [meRes, dashRes, gradesRes] = await Promise.allSettled([
        api.get('/hod/me'),
        api.get('/hod/dashboard'),
        api.get('/hod/grade-approvals'),
      ])
      if (meRes.status === 'fulfilled') setMe(meRes.value.data)
      if (dashRes.status === 'fulfilled') setCounts(dashRes.value.data || {})
      if (gradesRes.status === 'fulfilled') setPending(Array.isArray(gradesRes.value.data) ? gradesRes.value.data : [])
      setErr(null)
    } catch (e) {
      setErr('Load failed: ' + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const subtitle = me ? `${me.department} · ${counts.currentSemester || ''}` : 'Loading…'

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Head of Department" KickerIcon={GraduationCap} title="DEPARTMENT OVERVIEW"
        subtitle={subtitle} />

      {err && <div className="chunky-card p-3 bg-bad text-bone text-xs font-extrabold uppercase tracking-wider">{err}</div>}

      <div className="flex items-center justify-end">
        <button onClick={load} className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
          <RefreshCw size={11} strokeWidth={3} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={GraduationCap} label="Pending Grades" value={counts.pendingGradeApprovals ?? 0} tone="bg-mustard text-ink" />
        <StatCard Icon={FileX}         label="Withdrawals"    value={counts.pendingWithdrawals ?? 0}    tone="bg-bad text-bone" />
        <StatCard Icon={Clock}         label="Retakes"        value={counts.pendingRetakes ?? 0}        tone="bg-coffee text-bone" />
        <StatCard Icon={Users}         label="Faculty"        value={counts.totalFaculty ?? 0}          tone="bg-cocoa text-bone" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={BookOpen}      label="Sections"       value={counts.totalSections ?? 0} tone="bg-moss text-cream" />
        <StatCard Icon={Clock}         label="Late Reg."      value={counts.pendingLateRegistration ?? 0} tone="bg-tan text-ink" />
        <StatCard Icon={BarChart3}     label="Semester"       value={counts.currentSemester || '—'} tone="bg-bone text-ink" />
        <StatCard Icon={Layers}        label="Department"     value={(me?.department || '').split(' ').map(w => w[0]).join('') || '—'} tone="bg-burn text-bone" />
      </div>

      <SectionCard title="Pending Grade Sheets" right={<ActionButton Icon={GraduationCap} onClick={() => navigate('/hod/grade-approvals')}>Review All</ActionButton>}>
        {loading ? (
          <div className="flex items-center justify-center h-24"><div className="w-8 h-8 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
        ) : pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No grade sheets awaiting your review.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <Th>Course</Th><Th>Section</Th><Th>Faculty</Th><Th center>Students</Th><Th center>Scheme</Th><Th center>Action</Th>
              </tr>
            </thead>
            <tbody>
              {pending.map((it, i) => {
                const l = it.list || {}
                return (
                  <tr key={it.submissionId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                    <td className="px-5 py-3 font-extrabold text-ink">{l.courseCode}</td>
                    <td className="px-5 py-3"><span className="tag bg-bone text-ink">{l.section}</span></td>
                    <td className="px-5 py-3 text-ink">{l.facultyName || '—'}</td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">{l.rows?.length || 0}</span></td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-tan text-ink">{l.scheme}</span></td>
                    <td className="px-5 py-3 text-center"><ActionButton onClick={() => navigate('/hod/grade-approvals')}>Review</ActionButton></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction icon={GraduationCap} label="Grade Approvals" sub={`${counts.pendingGradeApprovals ?? 0} pending`} onClick={() => navigate('/hod/grade-approvals')} />
        <QuickAction icon={FileX}         label="Withdrawals"     sub={`${counts.pendingWithdrawals ?? 0} pending`}     onClick={() => navigate('/hod/withdrawals')} />
        <QuickAction icon={Clock}         label="Retakes"         sub={`${counts.pendingRetakes ?? 0} pending`}         onClick={() => navigate('/hod/retakes')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction icon={BarChart3}     label="Monitoring"      sub="Dept-wide attendance + grades"  onClick={() => navigate('/hod/monitoring')} />
        <QuickAction icon={Layers}        label="Sections"        sub={`${counts.totalSections ?? 0} sections`}        onClick={() => navigate('/hod/sections')} />
        <QuickAction icon={Clock}         label="Late Reg."       sub="—"                              onClick={() => navigate('/hod/late-registration')} />
      </div>
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}

function QuickAction({ icon: Icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="chunky-card chunky-card-hover p-4 text-left flex items-center gap-3">
      <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
        <Icon size={16} className="text-bone" strokeWidth={2.8} />
      </div>
      <div>
        <div className="font-black text-sm text-ink uppercase tracking-wider">{label}</div>
        <div className="text-[11px] text-cocoa font-bold mt-0.5">&gt; {sub}</div>
      </div>
    </button>
  )
}
