import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Users, FileSpreadsheet, FileText, Search, ChevronRight } from 'lucide-react'
import api from '../../services/api'

export default function FacultyCourses() {
  const [sections, setSections] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeRoster, setActiveRoster] = useState([])
  const [search, setSearch] = useState('')
  const [loadingRoster, setLoadingRoster] = useState(false)

  // Load real assigned sections
  useEffect(() => {
    let cancelled = false
    api.get('/faculty/courses?semester=Spring%202026')
      .then(res => {
        if (cancelled) return
        const arr = Array.isArray(res.data) ? res.data : []
        const mapped = arr.map(s => ({
          id: s.id,
          code: s.courseCode,
          name: s.courseName,
          section: s.section,
          enrolled: s.enrolled,
          room: s.room || '—',
          day: s.dayPattern || '—',
          time: s.timeSlot || '—',
          roster: null,
        }))
        setSections(mapped)
        if (mapped.length > 0) setActiveId(mapped[0].id)
      })
      .catch(() => { setSections([]) })
    return () => { cancelled = true }
  }, [])

  // Load roster for active section
  useEffect(() => {
    const sec = sections.find(s => s.id === activeId)
    if (!sec) return
    if (sec.roster) { setActiveRoster(sec.roster); return }
    let cancelled = false
    setLoadingRoster(true)
    api.get(`/faculty/sections/${activeId}/roster`)
      .then(res => {
        if (cancelled) return
        const arr = Array.isArray(res.data) ? res.data : []
        const mapped = arr.map(r => ({
          enrollmentId: r.enrollmentId,
          roll: r.rollNo,
          name: r.name,
          program: r.program,
        }))
        setActiveRoster(mapped)
        // cache on the section so we don't re-fetch
        setSections(prev => prev.map(s => s.id === activeId ? { ...s, roster: mapped } : s))
      })
      .catch(() => setActiveRoster([]))
      .finally(() => { if (!cancelled) setLoadingRoster(false) })
    return () => { cancelled = true }
  }, [activeId])

  const active = sections.find(s => s.id === activeId) || sections[0]

  const filtered = useMemo(() => {
    if (!search.trim()) return activeRoster
    const q = search.toLowerCase()
    return activeRoster.filter(r => r.roll.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
  }, [activeRoster, search])

  const downloadCSV = () => {
    const rows = [['Roll', 'Name', 'Program'], ...activeRoster.map(r => [r.roll, r.name, r.program])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${active.code}-${active.section}-roster.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight">COURSES</h1>
        <p className="text-sm text-cocoa mt-2">Assigned sections and rosters · Spring 2026</p>
      </div>

      {/* SECTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s, i) => {
          const isActive = s.id === activeId
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`chunky-card p-5 text-left transition-all cascade-in ${isActive ? 'ring-2 ring-burn shadow-pixel translate-x-[-2px] translate-y-[-2px]' : 'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel'}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
                  <BookOpen size={16} className="text-bone" strokeWidth={2.8} />
                </div>
                <span className={`tag ${isActive ? 'bg-burn text-bone' : 'bg-tan text-ink'}`}>{s.section}</span>
              </div>
              <div className="font-display text-base text-ink uppercase tracking-wider leading-tight">{s.code}</div>
              <div className="text-xs font-bold text-cocoa mt-1">{s.name}</div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-bone border-2 border-ink rounded px-2 py-1.5 text-center">
                  <div className="text-[8px] font-extrabold text-coffee uppercase">Enrolled</div>
                  <div className="font-black text-sm text-ink">{s.enrolled}</div>
                </div>
                <div className="bg-bone border-2 border-ink rounded px-2 py-1.5 text-center">
                  <div className="text-[8px] font-extrabold text-coffee uppercase">Room</div>
                  <div className="font-black text-sm text-ink">{s.room}</div>
                </div>
                <div className="bg-bone border-2 border-ink rounded px-2 py-1.5 text-center">
                  <div className="text-[8px] font-extrabold text-coffee uppercase">Day</div>
                  <div className="font-black text-[11px] text-ink leading-tight">{s.day}</div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-cocoa mt-2 uppercase tracking-wider">&gt; {s.time}</div>
              {isActive && (
                <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-burn uppercase tracking-wider animate-blink">
                  <ChevronRight size={10} strokeWidth={3} /> Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ROSTER */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.2s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex flex-wrap items-center justify-between gap-3">
          <h3 className="heading-retro text-sm flex items-center gap-2">
            <Users size={14} strokeWidth={3} /> Roster — {active?.code} · {active?.section}
            {loadingRoster && <span className="text-[10px] text-cocoa font-bold">· loading…</span>}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-bone border-2 border-ink rounded-md px-3 py-1.5 w-56">
              <Search size={12} className="text-cocoa" strokeWidth={3} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roll or name..."
                className="bg-transparent text-xs text-ink placeholder:text-cocoa/50 focus:outline-none w-full font-bold"
              />
            </div>
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-1.5 bg-cocoa text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <FileSpreadsheet size={11} strokeWidth={3} /> Excel
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-cocoa text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <FileText size={11} strokeWidth={3} /> PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest w-12">#</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Name</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Program</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.enrollmentId || r.roll} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-5 py-2.5 text-cocoa font-bold text-xs">{i + 1}</td>
                  <td className="px-5 py-2.5 font-extrabold text-ink">{r.roll}</td>
                  <td className="px-5 py-2.5 text-ink">{r.name}</td>
                  <td className="px-5 py-2.5 text-center"><span className="tag bg-bone text-ink">{r.program}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">
                  {search ? `No students match "${search}"` : 'No students enrolled'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
