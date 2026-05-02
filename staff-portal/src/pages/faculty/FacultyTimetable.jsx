import { useEffect, useMemo, useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard } from '../../components/PageShell'

const DAY_KEYS = ['Mon','Tue','Wed','Thu','Fri','Sat']

// Map a "Mon/Wed" pattern → array of canonical day keys.
function expandPattern(p) {
  if (!p) return []
  return p.split(/[\/,]/).map(s => s.trim()).filter(Boolean)
}

// Slot start "HH:MM-HH:MM" → start time in minutes for sorting.
function startMin(slot) {
  if (!slot) return 0
  const m = /^(\d{1,2}):(\d{2})/.exec(slot)
  if (!m) return 0
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

const COLOR_POOL = ['bg-coffee text-bone','bg-burn text-bone','bg-mustard text-ink','bg-cocoa text-bone','bg-rust text-bone']

export default function FacultyTimetable() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/faculty/timetable?semester=Spring%202026')
      setRows(Array.isArray(res.data) ? res.data : [])
      setErr(null)
    } catch (e) {
      setErr('Failed to load timetable: ' + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // Build a {time → {day → row}} grid from the raw section list.
  const grid = useMemo(() => {
    // Distinct time slots, sorted by start minute.
    const slots = Array.from(new Set(rows.map(r => r.timeSlot).filter(Boolean)))
      .sort((a, b) => startMin(a) - startMin(b))
    const colorByCourse = {}
    rows.forEach(r => {
      if (!(r.courseCode in colorByCourse)) {
        colorByCourse[r.courseCode] = COLOR_POOL[Object.keys(colorByCourse).length % COLOR_POOL.length]
      }
    })
    const cells = {}     // `${slot}|${day}` → row
    rows.forEach(r => {
      expandPattern(r.dayPattern).forEach(day => {
        cells[`${r.timeSlot}|${day}`] = { ...r, color: colorByCourse[r.courseCode] }
      })
    })
    return { slots, cells }
  }, [rows])

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Timetable" KickerIcon={Calendar} title="WEEKLY SCHEDULE"
        subtitle="Your assigned classes for the active semester · sourced from your section assignments." />

      {err && <div className="chunky-card p-3 bg-bad text-bone text-xs font-extrabold uppercase tracking-wider">{err}</div>}

      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">{rows.length} class{rows.length === 1 ? '' : 'es'}</div>
        <button onClick={load} className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
          <RefreshCw size={11} strokeWidth={3} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="chunky-card p-12 text-center">
          <Calendar size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No classes assigned for this semester.</p>
        </div>
      ) : (
        <SectionCard title="Schedule">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cocoa text-bone border-b-2 border-ink">
                <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest w-24">Time</th>
                {DAY_KEYS.map(d => (
                  <th key={d} className="px-3 py-3 text-center text-[10px] font-extrabold uppercase tracking-widest">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.slots.map(slot => (
                <tr key={slot} className="border-b-2 border-ink">
                  <td className="px-3 py-2 font-mono text-xs font-extrabold text-ink bg-bone border-r-2 border-ink">{slot}</td>
                  {DAY_KEYS.map(day => {
                    const cell = grid.cells[`${slot}|${day}`]
                    return (
                      <td key={day} className="p-1.5 border-r-2 border-ink last:border-r-0">
                        {cell ? (
                          <div className={`rounded border-2 border-ink p-2 text-center font-extrabold text-[11px] uppercase tracking-wider ${cell.color}`}>
                            <div>{cell.courseCode} · {cell.section}</div>
                            <div className="text-[9px] opacity-80 mt-0.5">{cell.room || '—'}</div>
                          </div>
                        ) : (
                          <div className="rounded border-2 border-dashed border-cocoa/30 p-2 text-center text-[10px] font-bold text-cocoa/30">—</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  )
}
