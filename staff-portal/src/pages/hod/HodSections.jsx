import { useEffect, useState, useMemo } from 'react'
import { Layers, Search, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard } from '../../components/PageShell'

export default function HodSections() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hod/sections')
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch { setRows([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter(r =>
      (r.courseCode || '').toLowerCase().includes(s) ||
      (r.courseName || '').toLowerCase().includes(s) ||
      (r.section || '').toLowerCase().includes(s) ||
      (r.facultyName || '').toLowerCase().includes(s) ||
      (r.semester || '').toLowerCase().includes(s)
    )
  }, [rows, q])

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Sections" KickerIcon={Layers} title="DEPARTMENT SECTIONS"
        subtitle="All sections currently offered. Filter by course code, faculty, or section." />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-bone border-2 border-ink rounded-md px-3 py-1.5 w-72">
          <Search size={12} className="text-cocoa" strokeWidth={3} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…"
            className="bg-transparent text-xs text-ink placeholder:text-cocoa/50 focus:outline-none w-full font-bold" />
        </div>
        <button onClick={load} className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
          <RefreshCw size={11} strokeWidth={3} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
      ) : (
        <SectionCard title={`${filtered.length} section${filtered.length === 1 ? '' : 's'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <Th>Course</Th><Th>Section</Th><Th>Faculty</Th><Th>Schedule</Th><Th>Room</Th><Th center>Enrolled</Th><Th>Semester</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.sectionId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-extrabold text-ink">{r.courseCode}</div>
                    <div className="text-[11px] text-cocoa">{r.courseName}</div>
                  </td>
                  <td className="px-4 py-2.5"><span className="tag bg-bone text-ink">{r.section}</span></td>
                  <td className="px-4 py-2.5 text-ink">{r.facultyName || '—'}</td>
                  <td className="px-4 py-2.5 text-cocoa font-mono text-xs">{r.dayPattern || '—'} {r.timeSlot ? `· ${r.timeSlot}` : ''}</td>
                  <td className="px-4 py-2.5 text-cocoa">{r.room || '—'}</td>
                  <td className="px-4 py-2.5 text-center"><span className="tag bg-coffee text-bone">{r.enrolled}</span></td>
                  <td className="px-4 py-2.5 text-cocoa text-xs">{r.semester}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No sections.</td></tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}
