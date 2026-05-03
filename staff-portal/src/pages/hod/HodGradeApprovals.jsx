import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, Check, X, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const ALL_GRADES = ['A+','A','A-','B+','B','B-','C+','C','C-','D','F']
const STATE_TONE = {
  SUBMITTED: 'bg-mustard text-ink',
  APPROVED:  'bg-moss text-cream',
  REJECTED:  'bg-bad text-bone',
  DRAFT:     'bg-bone text-cocoa',
}

export default function HodGradeApprovals() {
  const [items, setItems] = useState([])
  const [openId, setOpenId] = useState(null)   // submissionId
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hod/grade-approvals')
      const arr = Array.isArray(res.data) ? res.data : []
      setItems(arr)
      if (arr.length > 0 && !openId) setOpenId(arr[0].submissionId)
      else if (arr.length === 0) { setOpenId(null); setDetail(null) }
    } catch (err) {
      setToast({ kind: 'err', text: 'Failed to load: ' + (err.response?.data?.message || err.message) })
      clearSoon()
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!openId) { setDetail(null); return }
    api.get(`/hod/grade-approvals/${openId}`)
      .then(res => setDetail(res.data))
      .catch(() => setDetail(null))
  }, [openId])

  const decide = async (decision) => {
    if (!openId) return
    let remarks = ''
    if (decision === 'reject') {
      remarks = prompt('Reason for rejection (required):', '') || ''
      if (!remarks.trim()) return
    } else {
      remarks = prompt('Optional remarks (leave blank to skip):', '') || ''
    }
    setActing(true)
    try {
      await api.post(`/hod/grade-approvals/${openId}/${decision}`, { remarks })
      setToast({ kind: 'ok', text: decision === 'approve' ? 'Approved & published.' : 'Rejected.' })
      await load()
    } catch (err) {
      setToast({ kind: 'err', text: 'Action failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setActing(false)
      clearSoon()
    }
  }

  const clearSoon = () => setTimeout(() => setToast(null), 3500)

  const distMax = useMemo(() => {
    if (!detail?.distribution) return 1
    return Math.max(1, ...Object.values(detail.distribution))
  }, [detail])

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Approvals" KickerIcon={GraduationCap} title="GRADE APPROVALS"
        subtitle="Faculty grade-list submissions awaiting your decision. Approval publishes finals + grades to students." />

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">
          {items.length} submission{items.length !== 1 ? 's' : ''} pending
        </div>
        <ActionButton tone="bone" Icon={RefreshCw} onClick={load}>Refresh</ActionButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="chunky-card p-12 text-center">
          <GraduationCap size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No pending grade-list submissions.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {items.map(it => {
              const l = it.list || {}
              return (
                <button key={it.submissionId}
                  onClick={() => setOpenId(it.submissionId)}
                  className={`chunky-card p-4 text-left transition-all ${openId === it.submissionId ? 'ring-2 ring-burn shadow-pixel translate-x-[-2px] translate-y-[-2px]' : 'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-display text-base text-ink uppercase tracking-wider">{l.courseCode}</div>
                    <span className={`tag ${STATE_TONE[l.state] || 'bg-bone text-cocoa'}`}>{l.state}</span>
                  </div>
                  <div className="text-xs font-bold text-cocoa">{l.facultyName || 'Faculty'}</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <Mini label="Section" value={l.section} />
                    <Mini label="Students" value={l.rows?.length || 0} />
                    <Mini label="Mean" value={l.meanPercentage != null ? `${l.meanPercentage}%` : '—'} />
                  </div>
                </button>
              )
            })}
          </div>

          {detail && (
            <SectionCard title={`Grade List — ${detail.courseCode} · ${detail.section} · ${detail.semester}`}
              right={<span className={`tag ${STATE_TONE[detail.state] || 'bg-bone text-cocoa'}`}>{detail.state}</span>}>
              <div className="p-5">
                <div className="grid gap-2 items-end h-40 mb-4" style={{ gridTemplateColumns: `repeat(${ALL_GRADES.length}, minmax(0, 1fr))` }}>
                  {ALL_GRADES.map(g => {
                    const n = detail.distribution?.[g] || 0
                    return (
                      <div key={g} className="flex flex-col items-center justify-end gap-1.5 h-full">
                        <div className="font-black text-xs text-ink tabular-nums">{n}</div>
                        <div className="w-full bg-coffee border-2 border-ink rounded-sm shadow-pixel-sm" style={{ height: `${(n / distMax) * 80}%`, minHeight: '4px' }} />
                        <div className="text-[10px] font-extrabold text-ink uppercase tracking-wider">{g}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Mini label="Mean" value={detail.meanPercentage != null ? `${detail.meanPercentage}%` : '—'} />
                  <Mini label="Students" value={detail.rows?.length || 0} />
                  <Mini label="Scheme" value={detail.scheme} />
                  <Mini label="Faculty" value={detail.facultyName} />
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-bone">
                      <tr className="border-b-2 border-ink text-coffee">
                        <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
                        <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest">Name</th>
                        <th className="px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest">%</th>
                        <th className="px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.rows || []).map((r, i) => (
                        <tr key={r.enrollmentId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                          <td className="px-3 py-1.5 font-extrabold text-ink">{r.rollNo}</td>
                          <td className="px-3 py-1.5 text-ink">{r.name}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                          <td className="px-3 py-1.5 text-center">
                            {r.letterGrade ? <span className="tag bg-coffee text-bone">{r.letterGrade}</span> : <span className="tag bg-bone text-cocoa">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {detail.state === 'SUBMITTED' && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t-2 border-dashed border-cocoa/30">
                    <ActionButton tone="bad" Icon={X} onClick={() => decide('reject')} disabled={acting}>Reject</ActionButton>
                    <ActionButton tone="cocoa" Icon={Check} onClick={() => decide('approve')} disabled={acting}>Approve & Publish</ActionButton>
                  </div>
                )}
                {detail.state !== 'SUBMITTED' && detail.hodRemarks && (
                  <div className="pt-4 mt-4 border-t-2 border-dashed border-cocoa/30 text-xs text-cocoa">
                    Remarks: {detail.hodRemarks}
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="bg-bone border-2 border-ink rounded px-2 py-1.5 text-center">
      <div className="text-[8px] font-extrabold text-coffee uppercase">{label}</div>
      <div className="font-black text-sm text-ink mt-0.5">{value || '—'}</div>
    </div>
  )
}
