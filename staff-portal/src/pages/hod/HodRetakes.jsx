import { useEffect, useState } from 'react'
import { Repeat, ChevronUp, ChevronDown, Check, X, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/PageShell'

const TONE = {
  PENDING:  'bg-mustard text-ink',
  APPROVED: 'bg-moss text-cream',
  REJECTED: 'bg-bad text-bone',
}

export default function HodRetakes() {
  const [reqs, setReqs] = useState([])
  const [openId, setOpenId] = useState(null)
  const [remarks, setRemarks] = useState({})
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hod/retakes')
      const arr = Array.isArray(res.data) ? res.data : []
      setReqs(arr)
      if (arr.length > 0 && !openId) setOpenId(arr[0].id)
    } catch (e) {
      setToast({ kind: 'err', text: 'Load failed: ' + (e.response?.data?.message || e.message) })
      clearSoon()
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const decide = async (id, action) => {
    const r = remarks[id] || ''
    if (action === 'REJECT' && !r.trim()) {
      setToast({ kind: 'err', text: 'Remarks are required when rejecting.' })
      clearSoon()
      return
    }
    setActing(true)
    try {
      await api.post(`/hod/retakes/${id}/decide`, { action, remarks: r })
      setToast({ kind: 'ok', text: action === 'APPROVE' ? 'Approved.' : 'Rejected.' })
      await load()
    } catch (e) {
      setToast({ kind: 'err', text: 'Action failed: ' + (e.response?.data?.message || e.message) })
    } finally { setActing(false); clearSoon() }
  }

  const clearSoon = () => setTimeout(() => setToast(null), 3500)

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Retake Exams" KickerIcon={Repeat} title="RETAKE APPROVALS"
        subtitle="Pending retake-exam requests awaiting your decision (req 5.6)." />

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">{reqs.length} pending</div>
        <button onClick={load} className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
          <RefreshCw size={11} strokeWidth={3} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
      ) : reqs.length === 0 ? (
        <div className="chunky-card p-12 text-center">
          <Repeat size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No retake requests awaiting decision.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reqs.map(r => {
            const open = openId === r.id
            return (
              <div key={r.id} className="chunky-card overflow-hidden">
                <button onClick={() => setOpenId(open ? null : r.id)}
                  className="w-full px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between gap-3 text-left hover:bg-tan/80 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-extrabold text-ink shrink-0">{r.studentRollNo}</span>
                    <span className="text-ink truncate">{r.studentName}</span>
                    <span className="tag bg-bone text-ink shrink-0">{r.courseCode}</span>
                    <span className="tag bg-coffee text-bone shrink-0">{r.section}</span>
                    <span className="tag bg-tan text-ink shrink-0">{r.evaluationType}</span>
                  </div>
                  <span className={`tag ${TONE[r.status] || 'bg-bone text-cocoa'} shrink-0`}>{r.status}</span>
                  {open ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                </button>
                {open && (
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Field label="Submitted" value={r.requestDate} />
                      <Field label="Course" value={`${r.courseCode} · ${r.section}`} />
                      <Field label="Exam" value={r.evaluationType} />
                      <Field label="Semester" value={r.semester} />
                    </div>
                    {r.reason && (
                      <div>
                        <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; Student Reason</div>
                        <div className="bg-bone border-2 border-ink rounded-md p-3 text-sm text-ink">{r.reason}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; HOD Remarks (required if rejecting)</div>
                      <textarea
                        value={remarks[r.id] || ''}
                        onChange={(e) => setRemarks(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Decision rationale..."
                        className="w-full bg-bone border-2 border-ink rounded-md p-3 text-sm text-ink focus:outline-none min-h-[80px] font-mono"
                      />
                    </div>
                    {r.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-dashed border-cocoa/30">
                        <button onClick={() => decide(r.id, 'REJECT')} disabled={acting}
                          className="bg-bad text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5">
                          <X size={11} strokeWidth={3} /> Reject
                        </button>
                        <button onClick={() => decide(r.id, 'APPROVE')} disabled={acting}
                          className="bg-cocoa text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5">
                          <Check size={11} strokeWidth={3} /> Approve
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="bg-bone border-2 border-ink rounded-md p-3">
      <div className="text-[9px] font-extrabold text-ink/60 uppercase tracking-widest mb-1">{label}</div>
      <div className="font-extrabold text-sm text-ink">{value || '—'}</div>
    </div>
  )
}
