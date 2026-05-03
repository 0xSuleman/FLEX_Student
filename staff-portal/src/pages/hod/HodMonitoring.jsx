import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, StatCard } from '../../components/PageShell'

const STATE_TONE = {
  DRAFT:     'bg-bone text-cocoa',
  SUBMITTED: 'bg-mustard text-ink',
  APPROVED:  'bg-moss text-cream',
  REJECTED:  'bg-bad text-bone',
}

export default function HodMonitoring() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hod/monitoring')
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch { setRows([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const totalSections = rows.length
  const avgAtt = rows.length === 0 ? 0 : Math.round(rows.reduce((s, r) => s + (r.avgAttendance || 0), 0) / rows.length * 10) / 10
  const submitted = rows.filter(r => r.gradeState === 'SUBMITTED').length
  const approved = rows.filter(r => r.gradeState === 'APPROVED').length

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Monitoring" KickerIcon={BarChart3} title="DEPARTMENT MONITORING"
        subtitle="Per-section attendance averages and grade-submission state across the department." />

      <div className="flex items-center justify-end">
        <button onClick={load} className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
          <RefreshCw size={11} strokeWidth={3} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sections" value={totalSections} tone="bg-cocoa text-bone" />
        <StatCard label="Avg Attendance" value={`${avgAtt}%`} tone="bg-coffee text-bone" />
        <StatCard label="Submitted" value={submitted} tone="bg-mustard text-ink" />
        <StatCard label="Approved" value={approved} tone="bg-moss text-cream" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
      ) : (
        <SectionCard title="Section-wise breakdown">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Section</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Faculty</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Enrolled</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Avg Attendance</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.sectionId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-4 py-2.5 font-extrabold text-ink">{r.courseCode}</td>
                  <td className="px-4 py-2.5"><span className="tag bg-bone text-ink">{r.section}</span></td>
                  <td className="px-4 py-2.5 text-ink">{r.facultyName || '—'}</td>
                  <td className="px-4 py-2.5 text-center"><span className="tag bg-coffee text-bone">{r.enrolled}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-cream border-2 border-ink rounded h-3 overflow-hidden max-w-[200px]">
                        <div className={`h-full ${r.avgAttendance >= 75 ? 'bg-moss' : r.avgAttendance >= 60 ? 'bg-mustard' : 'bg-bad'}`} style={{ width: `${Math.min(100, r.avgAttendance)}%` }} />
                      </div>
                      <span className="text-[11px] font-extrabold text-ink tabular-nums w-12">{r.avgAttendance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center"><span className={`tag ${STATE_TONE[r.gradeState] || 'bg-bone text-cocoa'}`}>{r.gradeState}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No data.</td></tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  )
}
