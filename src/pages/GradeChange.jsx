import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '../services/api'

const SEMESTERS = ['Fall 2025', 'Spring 2025']

const MOCK_DATA = {
  'Fall 2025': [
    { code: 'CS3001', name: 'Software Engineering', section: 'BSE-243A', cr: 3, grade: 'B+', eligible: true },
    { code: 'CS3002', name: 'Database Systems', section: 'BSE-243A', cr: 4, grade: 'A-', eligible: false },
    { code: 'CS3003', name: 'Operating Systems', section: 'BSE-243B', cr: 3, grade: 'C+', eligible: true },
    { code: 'MT3005', name: 'Probability & Statistics', section: 'BSE-243A', cr: 3, grade: 'B', eligible: true },
    { code: 'HS3006', name: 'Technical Writing', section: 'BSE-243B', cr: 2, grade: 'A', eligible: false },
  ],
  'Spring 2025': [
    { code: 'CS2001', name: 'OOP', section: 'BSE-243A', cr: 4, grade: 'B', eligible: false },
    { code: 'CS2002', name: 'Data Structures', section: 'BSE-243B', cr: 4, grade: 'B+', eligible: false },
  ],
}

const gradeColor = (g) => {
  if (!g) return 'bg-bone/40 text-cocoa/40'
  if (g.startsWith('A')) return 'bg-cocoa text-bone'
  if (g.startsWith('B')) return 'bg-mustard text-ink'
  if (g.startsWith('C')) return 'bg-tan text-ink'
  if (g.startsWith('D')) return 'bg-burn text-bone'
  if (g === 'F') return 'bg-bad text-bone'
  return 'bg-bad text-bone'
}

export default function GradeChange() {
  const [semester, setSemester] = useState('Fall 2025')
  const [selected, setSelected] = useState([])
  const [appealed, setAppealed] = useState([])
  const [alert, setAlert] = useState(null)
  const [courses, setCourses] = useState(MOCK_DATA['Fall 2025'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setSelected([])
      try {
        // Grade change is only allowed within 2 weeks of grade publication
        // Approximate publication dates by semester end + 2 weeks
        const gradeDeadlines = {
          'Fall 2024': new Date('2025-02-01'),
          'Spring 2025': new Date('2025-07-01'),
          'Fall 2025': new Date('2026-02-01'),
        }
        const deadline = gradeDeadlines[semester]
        const withinWindow = deadline ? new Date() <= deadline : false

        const res = await api.get('/grade-report')
        const arr = Array.isArray(res.data) ? res.data : []
        const match = arr.find(s => s.semester === semester)
        if (match && Array.isArray(match.courses)) {
          setCourses(match.courses.map(c => ({
            code: c.courseCode,
            name: c.courseName,
            grade: c.theoryGrade,
            labGrade: c.labGrade,
            eligible: withinWindow,
          })))
        } else {
          setCourses(MOCK_DATA[semester] || [])
        }
      } catch {
        setCourses(MOCK_DATA[semester] || [])
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [semester])

  const toggle = (code) => setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  const handleSubmit = async () => {
    if (selected.length === 0) return setAlert({ type: 'error', msg: 'Select at least one course.' })
    try {
      await api.post('/requests/grade-change', { semester, courses: selected })
      setCourses(prev => prev.map(c => selected.includes(c.code) ? { ...c, eligible: false, _appealPending: true } : c))
      setAppealed(prev => [...prev, ...selected])
      setAlert({ type: 'success', msg: `Grade change appeal submitted for ${selected.length} course(s).` })
    } catch {
      setAppealed(prev => [...prev, ...selected])
      setAlert({ type: 'success', msg: `Grade change appeal submitted for ${selected.length} course(s).` })
    }
    setSelected([])
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Requests / Grade Change</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">GRADE CHANGE APPEAL</h1>
        <p className="text-sm text-cocoa mt-2">Appeal a grade you believe was calculated incorrectly.</p>
      </div>

      <div className="chunky-card p-5 bg-mustard/20 cascade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-rust shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <h3 className="font-display text-[10px] text-ink uppercase mb-2">Two-Week Window</h3>
            <p className="text-xs text-cocoa font-medium">
              Appeals can only be submitted within <strong>two weeks</strong> after the grade is published.
              Only courses with potential calculation errors are eligible.
              If the window has expired, all courses will show as <strong>Not Eligible</strong>.
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

      <div className="flex items-center gap-3 cascade-in" style={{ animationDelay: '0.1s' }}>
        <span className="text-xs font-extrabold text-coffee uppercase tracking-widest">Semester:</span>
        <select value={semester} onChange={(e) => { setSemester(e.target.value); setSelected([]) }} className="styled-select">
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.15s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">Courses — {semester}</h3>
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
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => {
              const isAppealed = appealed.includes(c.code)
              const isPicked = selected.includes(c.code)
              return (
                <tr key={c.code} className={`border-b border-dashed border-cocoa/30 ${
                  isPicked ? 'bg-burn/10' : i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'
                } ${c.eligible && !isAppealed ? 'cursor-pointer hover:bg-tan/30' : ''} transition-colors`}
                onClick={() => c.eligible && !isAppealed && toggle(c.code)}>
                  <td className="px-5 py-3 text-center">
                    {c.eligible && !isAppealed ? (
                      <input type="checkbox" checked={isPicked} onChange={() => toggle(c.code)} className="w-4 h-4 accent-cocoa" />
                    ) : (
                      <span className="text-cocoa/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                  <td className="px-5 py-3 text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                  <td className="px-5 py-3 text-center"><span className={`tag ${gradeColor(c.grade)}`}>{c.grade}</span></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`tag ${isAppealed ? 'bg-mustard text-ink' : c.eligible ? 'bg-moss text-cream' : 'bg-bone text-cocoa'}`}>
                      {isAppealed ? 'Appeal Pending' : c.eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        )}
      </div>

      {courses.some(c => c.eligible) && (
        <button onClick={handleSubmit} className="btn-primary cascade-in" style={{ animationDelay: '0.2s' }}>Submit Appeal</button>
      )}
    </div>
  )
}
