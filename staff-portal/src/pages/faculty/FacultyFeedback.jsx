import { useEffect, useState } from 'react'
import { MessageSquare, RefreshCw, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, StatCard } from '../../components/PageShell'

export default function FacultyFeedback() {
  const [rows, setRows] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/faculty/feedback?semester=Spring%202026')
      const arr = Array.isArray(res.data) ? res.data : []
      setRows(arr)
      if (arr.length > 0 && !activeId) setActiveId(arr[0].sectionId)
      setErr(null)
    } catch (e) {
      setErr('Failed to load feedback: ' + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const active = rows.find(r => r.sectionId === activeId)
  const histMax = active ? Math.max(1, ...Object.values(active.ratingHistogram || {})) : 1

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Feedback" KickerIcon={MessageSquare} title="COURSE FEEDBACK"
        subtitle="Aggregated student feedback per section. Individual responses are never revealed." />

      {err && <div className="chunky-card p-3 bg-bad text-bone text-xs font-extrabold uppercase tracking-wider flex items-center gap-2"><AlertTriangle size={14} strokeWidth={3} />{err}</div>}

      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">{rows.length} section{rows.length === 1 ? '' : 's'} this semester</div>
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
          <MessageSquare size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No feedback yet for your sections.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {rows.map(r => (
              <button key={r.sectionId}
                onClick={() => setActiveId(r.sectionId)}
                className={`px-3 py-2 border-2 border-ink rounded-md font-extrabold text-xs uppercase tracking-wider transition-all ${
                  activeId === r.sectionId ? 'bg-cocoa text-bone shadow-pixel-sm' : 'bg-cream text-cocoa hover:bg-tan/50'
                }`}>
                {r.courseCode} · {r.section}
                <span className="ml-2 text-[10px] opacity-80">({r.totalResponses}/{r.totalEnrolled})</span>
              </button>
            ))}
          </div>

          {active && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Enrolled" value={active.totalEnrolled} tone="bg-cocoa text-bone" />
                <StatCard label="Responses" value={active.totalResponses} tone="bg-coffee text-bone" />
                <StatCard label="Response %" value={`${active.responseRate}%`} tone="bg-mustard text-ink" />
                <StatCard label="Avg Rating" value={active.averageRating || '—'} tone="bg-moss text-cream" />
              </div>

              <SectionCard title={`Rating Distribution — ${active.courseCode} · ${active.section}`}>
                <div className="p-5 space-y-2">
                  {[5,4,3,2,1].map(n => {
                    const count = (active.ratingHistogram || {})[n] || 0
                    const pct = active.totalResponses ? Math.round((count / active.totalResponses) * 100) : 0
                    return (
                      <div key={n} className="flex items-center gap-3">
                        <span className="w-12 text-[10px] font-extrabold text-cocoa uppercase tracking-wider">{n} ★</span>
                        <div className="flex-1 bg-cream border-2 border-ink rounded h-4 overflow-hidden">
                          <div className={`h-full ${n >= 4 ? 'bg-moss' : n === 3 ? 'bg-mustard' : 'bg-bad'}`} style={{ width: `${(count / histMax) * 100}%` }} />
                        </div>
                        <span className="w-20 text-right text-[10px] font-extrabold text-ink tabular-nums">{count} · {pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title={`Comments — ${active.courseCode} · ${active.section}`}>
                <div className="p-5 space-y-2">
                  {(active.comments || []).length === 0
                    ? <div className="text-xs font-bold text-cocoa uppercase tracking-wider">No written comments.</div>
                    : (active.comments || []).map((c, i) => (
                        <div key={i} className="bg-bone border-2 border-ink rounded p-3 text-sm text-ink">{c}</div>
                      ))
                  }
                </div>
              </SectionCard>
            </>
          )}
        </>
      )}
    </div>
  )
}
