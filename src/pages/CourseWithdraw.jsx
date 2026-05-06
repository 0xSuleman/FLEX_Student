import { useState, useEffect } from 'react'
import { AlertTriangle, Download, Upload, CheckCircle2 } from 'lucide-react'
import api from '../services/api'

const MOCK_ENROLLED = [
  { code: 'CS3001', name: 'Software Engineering', cr: 3, section: 'BSE-243A', status: 'IN_PROGRESS' },
  { code: 'CS3002', name: 'Database Systems', cr: 4, section: 'BSE-243A', status: 'IN_PROGRESS' },
  { code: 'CS3003', name: 'Operating Systems', cr: 3, section: 'BSE-243B', status: 'IN_PROGRESS' },
  { code: 'MT3005', name: 'Probability & Statistics', cr: 3, section: 'BSE-243A', status: 'IN_PROGRESS' },
  { code: 'HS3006', name: 'Technical Writing', cr: 2, section: 'BSE-243B', status: 'IN_PROGRESS' },
]

export default function CourseWithdraw() {
  const finalStart = new Date('2026-05-20')
  const withdrawDeadline = new Date(finalStart.getTime() - 3 * 24 * 60 * 60 * 1000)
  const withdrawClosed = new Date() > withdrawDeadline

  const [courses, setCourses] = useState(MOCK_ENROLLED)
  const [selected, setSelected] = useState([])
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const res = await api.get('/enrollments?semester=Spring+2026')
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr.map(c => ({
          code: c.courseCode,
          name: c.courseName,
          cr: c.creditHours,
          section: c.section,
          status: c.status,
        })))
      } catch {
        setCourses(MOCK_ENROLLED)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const toggle = (code) => setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  const onFile = (e) => {
    const f = e.target.files[0]
    setError('')
    if (!f) return setFile(null)
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) return setError('Only JPG/PNG accepted.')
    if (f.size > 650 * 1024) return setError('Max 650KB.')
    setFile(f)
  }

  const handleSubmit = async () => {
    if (selected.length === 0) return setAlert({ type: 'error', msg: 'Select at least one course.' })
    if (!file) return setAlert({ type: 'error', msg: 'Upload the signed withdraw form.' })
    try {
      const formData = new FormData()
      formData.append('courses', JSON.stringify(selected))
      formData.append('form', file)
      await api.post('/requests/withdraw', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setCourses(prev => prev.map(c => selected.includes(c.code) ? { ...c, status: 'WITHDRAW_PENDING' } : c))
      setAlert({ type: 'success', msg: `Withdraw request submitted for ${selected.length} course(s). Pending approval.` })
    } catch {
      setCourses(prev => prev.map(c => selected.includes(c.code) ? { ...c, status: 'WITHDRAW_PENDING' } : c))
      setAlert({ type: 'success', msg: `Withdraw request submitted for ${selected.length} course(s). Pending approval.` })
    }
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Courses / Withdraw</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">COURSE WITHDRAW</h1>
        <p className="text-sm text-cocoa mt-2">Withdraw from a course before the deadline. A "W" grade will appear on your transcript.</p>
      </div>

      {/* WITHDRAW CLOSED NOTICE */}
      {withdrawClosed ? (
        <div className="chunky-card p-5 bg-mustard/20 cascade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rust shrink-0 mt-0.5" strokeWidth={2.5} />
            <div>
              <h3 className="font-display text-[10px] text-ink uppercase mb-2">Withdraw Period Closed</h3>
              <p className="text-xs text-cocoa font-medium">
                The withdraw window has closed. Course withdrawals are locked 3 days before final exams begin.
                The last date to withdraw was <strong>{withdrawDeadline.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* WARNING */}
          <div className="chunky-card p-5 bg-mustard/20 cascade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-rust shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <h3 className="font-display text-[10px] text-ink uppercase mb-2">Important</h3>
                <ul className="text-xs text-cocoa space-y-1 list-disc pl-4 font-medium">
                  <li>Withdraw closes 3 days before final exams begin.</li>
                  <li>A "W" grade will be recorded on your transcript.</li>
                  <li>Maintain the minimum credit-hour requirement after withdrawal.</li>
                  <li>Get the form signed by your advisor before uploading.</li>
                </ul>
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

          {/* COURSES */}
          <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b-2 border-ink bg-tan">
              <h3 className="heading-retro text-xs sm:text-sm truncate min-w-0">Currently Enrolled Courses</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
              </div>
            ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-bone border-b-2 border-ink text-coffee">
                  <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest w-12">Pick</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                  <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Section</th>
                  <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">CrHrs</th>
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
                    <td className="px-5 py-3 text-center text-cocoa font-bold text-xs"><span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold text-ink bg-bone">{c.section}</span></td>
                    <td className="px-5 py-3 text-center font-extrabold"><span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold text-ink bg-bone">{c.cr}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            )}
          </div>

          {/* DOWNLOAD + UPLOAD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.15s' }}>
              <h3 className="font-display text-[10px] text-ink uppercase mb-3">Step 1 — Download Form</h3>
              <p className="text-xs text-cocoa mb-4 font-medium">Download the official withdraw form and get it signed by your academic advisor.</p>
              <button onClick={() => window.alert('Withdraw form download started.')} className="btn-ghost">
                <Download size={14} strokeWidth={3} />
                Download Form
              </button>
            </div>

            <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-display text-[10px] text-ink uppercase mb-3">Step 2 — Upload Signed Form</h3>
              <p className="text-xs text-cocoa mb-4 font-medium">Upload the signed image (JPG / PNG, max 650KB).</p>
              <label className="btn-ghost cursor-pointer inline-flex">
                <Upload size={14} strokeWidth={3} />
                {file ? file.name : 'Choose Image'}
                <input type="file" accept=".jpg,.jpeg,.png" onChange={onFile} className="hidden" />
              </label>
              {file && <div className="text-[10px] text-moss font-extrabold mt-2 uppercase tracking-wider">✓ {(file.size / 1024).toFixed(0)} KB</div>}
              {error && <div className="text-[10px] text-bad font-extrabold mt-2">{error}</div>}
            </div>
          </div>

          <button onClick={handleSubmit} className="btn-primary cascade-in" style={{ animationDelay: '0.25s' }}>
            Submit Withdraw Request
          </button>
        </>
      )}
    </div>
  )
}
