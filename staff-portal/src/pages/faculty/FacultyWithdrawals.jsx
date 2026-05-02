import { useEffect, useState } from 'react'
import { FileX, ChevronUp, ChevronDown, Send, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/PageShell'

const TONE = {
  PENDING_FACULTY: 'bg-mustard text-ink',
  PENDING_HOD:     'bg-tan text-ink',
  APPROVED:        'bg-moss text-cream',
  REJECTED:        'bg-bad text-bone',
}

export default function FacultyWithdrawals() {
  const [reqs, setReqs] = useState([])
  const [openId, setOpenId] = useState(null)
  const [remarksById, setRemarksById] = useState({})
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/faculty/withdrawals')
      const arr = Array.isArray(res.data) ? res.data : []
      setReqs(arr)
      if (arr.length > 0 && !openId) setOpenId(arr[0].id)
    } catch (e) {
      setToast({ kind: 'err', text: 'Load failed: ' + (e.response?.data?.message || e.message) })
      clearSoon()
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const recommend = async (id, action) => {
    const remarks = remarksById[id] || ''
    if (action === 'REJECT' && !remarks.trim()) {
      setToast({ kind: 'err', text: 'Remarks are required when rejecting.' })
      clearSoon()
      return
    }
    setActing(true)
    try {
      await api.post(`/faculty/withdrawals/${id}/recommend`, { action, remarks })
      setToast({ kind: 'ok', text: action === 'APPROVE' ? 'Forwarded to HOD.' : 'Rejected.' })
      await load()
    } catch (e) {
      setToast({ kind: 'err', text: 'Action failed: ' + (e.response?.data?.message || e.message) })
    } finally {
      setActing(false)
      clearSoon()
    }
  }

  const clearSoon = () => setTimeout(() => setToast(null), 3500)

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Course Withdrawals" KickerIcon={FileX} title="WITHDRAWAL REQUESTS"
        subtitle="Recommend Approve to forward to HOD (req 3.12.5 / 4.7). Recommend Reject to close the request immediately." />

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
        <div className="flex items-center justify-center h-32">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      ) : reqs.length === 0 ? (
        <div className="chunky-card p-12 text-center">
          <FileX size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No pending withdrawal requests for your sections.</p>
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
                  </div>
                  <span className={`tag ${TONE[r.state] || 'bg-bone text-cocoa'} shrink-0`}>{r.state}</span>
                  {open ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                </button>
                {open && (
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Field label="Submitted" value={r.requestDate} />
                      <Field label="Course" value={`${r.courseCode} · ${r.section}`} />
                      <Field label="Semester" value={r.semester} />
                      <Field label="State" value={r.state} />
                    </div>
                    {r.documentPath && (
                      <div>
                        <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; Attached document</div>
                        <div className="bg-bone border-2 border-ink rounded-md p-3 text-sm text-ink font-mono">{r.documentPath}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; Faculty Remarks (required if rejecting)</div>
                      <textarea
                        value={remarksById[r.id] || ''}
                        onChange={(e) => setRemarksById(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Remarks for the HOD or rejection reason..."
                        className="w-full bg-bone border-2 border-ink rounded-md p-3 text-sm text-ink focus:outline-none min-h-[80px] font-mono"
                      />
                    </div>
                    {r.state === 'PENDING_FACULTY' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-dashed border-cocoa/30">
                        <button onClick={() => recommend(r.id, 'REJECT')} disabled={acting}
                          className="bg-bad text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5">
                          <X size={11} strokeWidth={3} /> Recommend Reject
                        </button>
                        <button onClick={() => recommend(r.id, 'APPROVE')} disabled={acting}
                          className="bg-cocoa text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5">
                          <Send size={11} strokeWidth={3} /> Approve & Forward to HOD
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
