import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, Send, RefreshCw, AlertTriangle, CheckCircle2, Lock } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, ActionButton, StatCard } from '../../components/PageShell'

const ALL_GRADES = ['A+','A','A-','B+','B','B-','C+','C','C-','D','F']
const STATE_TONE = {
  null:       'bg-bone text-cocoa',
  DRAFT:      'bg-bone text-cocoa',
  SUBMITTED:  'bg-mustard text-ink',
  APPROVED:   'bg-moss text-cream',
  REJECTED:   'bg-bad text-bone',
}

export default function FacultyGrading() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/faculty/courses?semester=Spring%202026')
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr)
        if (arr.length > 0 && !courseId) setCourseId(arr[0].id)
      })
      .catch(() => setToast({ kind: 'err', text: 'Failed to load courses.' }))
  }, [])

  const load = async (sid) => {
    if (!sid) return
    setLoading(true)
    try {
      const res = await api.get(`/faculty/sections/${sid}/grades`)
      setData(res.data)
    } catch (err) {
      setData(null)
      setToast({ kind: 'err', text: 'Failed to load grade list: ' + (err.response?.data?.message || err.message) })
      clearSoon()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(courseId) }, [courseId])

  const submit = async () => {
    if (!courseId || !data?.readyToSubmit) return
    if (!confirm('Submit this grade list to the HOD for approval? You won\'t be able to edit until they decide.')) return
    setSubmitting(true)
    try {
      const res = await api.post(`/faculty/sections/${courseId}/grades/submit`)
      setData(res.data)
      setToast({ kind: 'ok', text: 'Submitted to HOD.' })
    } catch (err) {
      setToast({ kind: 'err', text: 'Submit failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setSubmitting(false)
      clearSoon()
    }
  }

  const clearSoon = () => setTimeout(() => setToast(null), 3500)

  const distMax = useMemo(() => {
    if (!data?.distribution) return 1
    return Math.max(1, ...Object.values(data.distribution))
  }, [data])

  const stateTone = STATE_TONE[data?.state ?? 'null']
  const locked = data?.state === 'SUBMITTED' || data?.state === 'APPROVED'

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Grading" KickerIcon={GraduationCap} title="GRADING"
        subtitle="Computed from saved marks. Review the distribution, then submit to the HOD. Grades become visible to students only after HOD approval (req 5.2.3)." />

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
          {data?.state && <span className={`tag ${stateTone}`}>STATUS · {data.state}</span>}
          {data?.scheme && <span className="tag bg-coffee text-bone">{data.scheme}</span>}
          <div className="ml-auto flex items-center gap-2">
            <ActionButton tone="bone" Icon={RefreshCw} onClick={() => load(courseId)}>Refresh</ActionButton>
            <ActionButton tone="cocoa" Icon={Send} onClick={submit}
              disabled={!data?.readyToSubmit || submitting || locked}>
              {submitting ? 'Submitting…' : locked ? 'Locked' : 'Submit to HOD'}
            </ActionButton>
          </div>
        </div>

        {data?.state === 'REJECTED' && data?.hodRemarks && (
          <div className="px-5 py-3 border-b-2 border-ink bg-bad/10 text-ink">
            <div className="font-extrabold text-[10px] uppercase tracking-widest text-bad mb-1">HOD rejected — fix the issues below and resubmit</div>
            <div className="text-sm">{data.hodRemarks}</div>
          </div>
        )}
        {data?.state === 'APPROVED' && (
          <div className="px-5 py-3 border-b-2 border-ink bg-moss/15 text-ink flex items-center gap-2">
            <Lock size={14} strokeWidth={3} className="text-moss" />
            <span className="text-sm font-extrabold uppercase tracking-wider">Grades approved & published to students.</span>
            {data.hodRemarks && <span className="text-xs text-cocoa">— {data.hodRemarks}</span>}
          </div>
        )}

        {(!data?.readyToSubmit && (data?.blockers || []).length > 0 && data?.state !== 'APPROVED') && (
          <div className="px-5 py-3 border-b-2 border-ink bg-mustard/20 text-ink">
            <div className="font-extrabold text-[10px] uppercase tracking-widest text-coffee mb-1 flex items-center gap-1.5">
              <AlertTriangle size={12} strokeWidth={3} /> Cannot submit yet
            </div>
            <ul className="list-disc list-inside text-xs">
              {data.blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
      </div>

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Students" value={data.rows?.length || 0} tone="bg-cocoa text-bone" />
            <StatCard label="Mean" value={data.meanPercentage != null ? `${data.meanPercentage}%` : '—'} tone="bg-coffee text-bone" />
            <StatCard label="Total Weight" value={`${data.totalWeight}%`} tone={Math.abs(data.totalWeight - 100) < 0.01 ? 'bg-moss text-cream' : 'bg-bad text-bone'} />
            <StatCard label="Scheme" value={data.scheme} tone="bg-mustard text-ink" />
          </div>

          <SectionCard title="Distribution">
            <div className="p-5">
              <div className="grid gap-2 items-end h-40 mb-3" style={{ gridTemplateColumns: `repeat(${ALL_GRADES.length}, minmax(0, 1fr))` }}>
                {ALL_GRADES.map(g => {
                  const n = data.distribution?.[g] || 0
                  return (
                    <div key={g} className="flex flex-col items-center justify-end gap-1.5 h-full">
                      <div className="font-black text-xs text-ink tabular-nums">{n}</div>
                      <div className="w-full bg-coffee border-2 border-ink rounded-sm shadow-pixel-sm" style={{ height: `${(n / distMax) * 80}%`, minHeight: '4px' }} />
                      <div className="text-[10px] font-extrabold text-ink uppercase tracking-wider">{g}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard title={`Grade List — ${data.courseCode} · ${data.section}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone border-b-2 border-ink text-coffee">
                  <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Name</th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">%</th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade</th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">GP</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Note</th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((r, i) => (
                  <tr key={r.enrollmentId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                    <td className="px-4 py-2 text-cocoa font-bold text-xs">{i + 1}</td>
                    <td className="px-4 py-2 font-extrabold text-ink">{r.rollNo}</td>
                    <td className="px-4 py-2 text-ink">{r.name}</td>
                    <td className="px-4 py-2 text-center font-mono text-ink">{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                    <td className="px-4 py-2 text-center">
                      {r.letterGrade
                        ? <span className="tag bg-coffee text-bone">{r.letterGrade}</span>
                        : <span className="tag bg-bone text-cocoa">—</span>}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-cocoa">{r.gradePoints != null ? r.gradePoints : '—'}</td>
                    <td className="px-4 py-2 text-xs text-cocoa">{r.reason || ''}</td>
                  </tr>
                ))}
                {(data.rows || []).length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No students enrolled.</td></tr>
                )}
              </tbody>
            </table>
          </SectionCard>
        </>
      )}
    </div>
  )
}
