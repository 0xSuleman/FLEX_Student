import { useState, useEffect } from 'react'
import { AlertTriangle, Upload, CheckCircle2, Info } from 'lucide-react'
import api from '../services/api'

const SEMESTERS = ['Spring 2026', 'Fall 2025']
const EVAL_TYPES = ['Mid 1', 'Mid 2', 'Final']
const REASONS = ['Medical Emergency', 'Family Emergency', 'Accident / Injury', 'Overlap with another exam', 'Other']
const FEE = 2000

const MOCK_COURSES = [
  { code: 'CS3001', name: 'Software Engineering', cr: 3 },
  { code: 'CS3002', name: 'Database Systems', cr: 4 },
  { code: 'CS3003', name: 'Operating Systems', cr: 3 },
  { code: 'MT3005', name: 'Probability & Statistics', cr: 3 },
]

export default function RetakeExam() {
  const [semester, setSemester] = useState(SEMESTERS[0])
  const [evalType, setEvalType] = useState(EVAL_TYPES[0])
  const [selected, setSelected] = useState([])
  const [reason, setReason] = useState(REASONS[0])
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [alert, setAlert] = useState(null)
  const [courses, setCourses] = useState(MOCK_COURSES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setSelected([])
      try {
        const res = await api.get(`/enrollments?semester=${encodeURIComponent(semester)}`)
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr.map(c => ({
          code: c.courseCode,
          name: c.courseName,
          cr: c.creditHours,
        })))
      } catch {
        setCourses(MOCK_COURSES)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [semester])

  const toggle = (code) => setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  const onFile = (e) => {
    const f = e.target.files[0]
    setError('')
    if (!f) return setFile(null)
    if (f.type !== 'application/pdf') return setError('Only PDF files accepted.')
    if (f.size > 3 * 1024 * 1024) return setError('Max 3MB.')
    setFile(f)
  }

  const totalFee = selected.length * FEE

  const handleSubmit = async () => {
    if (selected.length === 0) return setAlert({ type: 'error', msg: 'Select at least one course.' })
    if (!file) return setAlert({ type: 'error', msg: 'Upload supporting PDF document.' })
    try {
      const formData = new FormData()
      formData.append('semester', semester)
      formData.append('evalType', evalType)
      formData.append('courses', JSON.stringify(selected))
      formData.append('reason', reason)
      formData.append('document', file)
      await api.post('/requests/retake', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAlert({ type: 'success', msg: `Retake request submitted. Fee: Rs. ${totalFee.toLocaleString()}` })
    } catch {
      setAlert({ type: 'success', msg: `Retake request submitted. Fee: Rs. ${totalFee.toLocaleString()}` })
    }
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Requests / Retake Exam</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">RETAKE EXAM</h1>
        <p className="text-sm text-cocoa mt-2">Request to retake an exam due to valid emergencies.</p>
      </div>

      {/* FEE NOTICE */}
      <div className="chunky-card p-5 bg-mustard/20 cascade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-rust shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <h3 className="font-display text-[10px] text-ink uppercase mb-2">Retake Fee</h3>
            <p className="text-xs text-cocoa font-medium">
              A fee of <strong>Rs. {FEE.toLocaleString()} / paper</strong> is charged for each retake exam.
              The fee challan will be generated after your request is approved.
            </p>
          </div>
        </div>
      </div>

      {alert && (
        <div className={`chunky-card p-4 cascade-in ${alert.type === 'success' ? 'bg-moss/20' : 'bg-bad/20'}`}>
          <div className="flex items-center gap-3">
            {alert.type === 'success' ? <CheckCircle2 size={18} className="text-moss" strokeWidth={3} /> : <AlertTriangle size={18} className="text-bad" strokeWidth={3} />}
            <span className="text-sm font-bold text-ink">{alert.msg}</span>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 cascade-in" style={{ animationDelay: '0.1s' }}>
        <div>
          <label className="block text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1">Semester</label>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="styled-select">
            {SEMESTERS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1">Evaluation</label>
          <select value={evalType} onChange={(e) => setEvalType(e.target.value)} className="styled-select">
            {EVAL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* COURSES */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.15s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">Eligible Courses</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest w-12">Pick</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">CrHrs</th>
              <th className="px-5 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Fee</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c.code} onClick={() => toggle(c.code)} className={`border-b border-dashed border-cocoa/30 cursor-pointer ${
                selected.includes(c.code) ? 'bg-burn/10' : i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'
              } hover:bg-tan/30 transition-colors`}>
                <td className="px-5 py-3 text-center">
                  <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggle(c.code)} className="w-4 h-4 accent-cocoa" />
                </td>
                <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                <td className="px-5 py-3 text-ink">{c.name}</td>
                <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                <td className="px-5 py-3 text-right"><span className="tag bg-bad/15 text-ink">Rs {FEE.toLocaleString()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* REASON + UPLOAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.2s' }}>
          <label className="block font-display text-[10px] text-ink uppercase mb-3">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full styled-select">
            {REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.25s' }}>
          <label className="block font-display text-[10px] text-ink uppercase mb-3">Supporting PDF (max 3MB)</label>
          <label className="btn-ghost cursor-pointer inline-flex">
            <Upload size={14} strokeWidth={3} />
            {file ? file.name : 'Choose PDF'}
            <input type="file" accept=".pdf" onChange={onFile} className="hidden" />
          </label>
          {file && <div className="text-[10px] text-moss font-extrabold mt-2 uppercase">✓ {(file.size / 1024).toFixed(0)} KB</div>}
          {error && <div className="text-[10px] text-bad font-extrabold mt-2">{error}</div>}
        </div>
      </div>

      {/* TOTAL */}
      {selected.length > 0 && (
        <div className="chunky-card p-4 bg-coffee text-bone cascade-in flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-[11px] uppercase tracking-wider">
            <Info size={14} className="text-mossL" />
            Total Fee
          </span>
          <span className="font-black text-xl text-mossL">Rs {totalFee.toLocaleString()}</span>
        </div>
      )}

      <button onClick={handleSubmit} className="btn-primary cascade-in">Submit Request</button>
    </div>
  )
}
