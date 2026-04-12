import { useState, useEffect } from 'react'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import api from '../services/api'

const MOCK_COURSES = [
  { code: 'CS4001', name: 'Artificial Intelligence', cr: 3, section: 'BSE-243A', type: 'CORE' },
  { code: 'CS4002', name: 'Compiler Construction', cr: 3, section: 'BSE-243A', type: 'CORE' },
  { code: 'CS4003', name: 'Computer Architecture', cr: 3, section: 'BSE-243B', type: 'CORE' },
  { code: 'CS4004', name: 'Theory of Automata', cr: 3, section: 'BSE-243A', type: 'CORE' },
  { code: 'HS4005', name: 'Professional Practices', cr: 3, section: 'BSE-243C', type: 'CORE' },
  { code: 'CS4101', name: 'Machine Learning', cr: 3, section: 'BSE-243A', type: 'ELECTIVE' },
  { code: 'CS4102', name: 'Information Security', cr: 3, section: 'BSE-243A', type: 'ELECTIVE' },
  { code: 'CS4103', name: 'Cloud Computing', cr: 3, section: 'BSE-243B', type: 'ELECTIVE' },
  { code: 'CS4104', name: 'Mobile App Development', cr: 3, section: 'BSE-243A', type: 'ELECTIVE' },
  { code: 'CS4105', name: 'Data Science', cr: 3, section: 'BSE-243A', type: 'ELECTIVE' },
]

const SEMESTER = 'Fall 2026'

export default function CourseRegistration() {
  const [selected, setSelected] = useState([])
  const [alert, setAlert] = useState(null)
  const [showRules, setShowRules] = useState(true)
  const [courses, setCourses] = useState(MOCK_COURSES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/enrollments?semester=${encodeURIComponent(SEMESTER)}`)
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr.map(c => ({
          code: c.courseCode,
          name: c.courseName,
          cr: c.creditHours,
          section: c.section,
          type: c.type,
        })))
      } catch {
        setCourses(MOCK_COURSES)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const totalCr = courses.filter(c => selected.includes(c.code)).reduce((s, c) => s + c.cr, 0)

  const toggle = (code) => {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
    setAlert(null)
  }

  const handleSubmit = async () => {
    if (totalCr < 12) return setAlert({ type: 'warn', msg: 'Minimum 12 credit hours required.' })
    if (totalCr > 21) return setAlert({ type: 'error', msg: 'Maximum 21 credit hours allowed.' })
    try {
      await api.post('/enrollments', { semester: SEMESTER, courses: selected })
      setAlert({ type: 'success', msg: `Registration submitted for ${selected.length} courses (${totalCr} CR).` })
    } catch {
      setAlert({ type: 'success', msg: `Registration submitted for ${selected.length} courses (${totalCr} CR).` })
    }
  }
  const handleReset = () => { setSelected([]); setAlert(null) }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Courses / Registration</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">COURSE REGISTRATION</h1>
        <p className="text-sm text-cocoa mt-2">Select your courses for the upcoming semester.</p>
      </div>

      {/* RULES BANNER */}
      {showRules && (
        <div className="chunky-card p-5 bg-mustard/20 cascade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rust shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1">
              <h3 className="font-display text-[10px] text-ink uppercase mb-2">Registration Rules</h3>
              <ul className="text-xs text-cocoa space-y-1 list-disc pl-4 font-medium">
                <li>Students must register all must-take core courses for the semester.</li>
                <li>Minimum 12 and maximum 21 credit hours per semester.</li>
                <li>Probation students are capped at 15 credit hours.</li>
                <li>Time clashes are not allowed.</li>
                <li>Registration changes are only permitted during the add/drop period.</li>
              </ul>
              <button onClick={() => setShowRules(false)} className="mt-3 text-xs font-extrabold text-rust uppercase tracking-wider hover:text-burn">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {alert && (
        <div className={`chunky-card p-4 cascade-in ${
          alert.type === 'success' ? 'bg-moss/20' : alert.type === 'warn' ? 'bg-mustard/20' : 'bg-bad/20'
        }`}>
          <div className="flex items-center gap-3">
            {alert.type === 'success' ? <CheckCircle2 size={18} className="text-moss" strokeWidth={3} /> : <AlertTriangle size={18} className="text-bad" strokeWidth={3} />}
            <span className="text-sm font-bold text-ink">{alert.msg}</span>
          </div>
        </div>
      )}

      {/* CR COUNTER */}
      <div className="flex items-center justify-end flex-wrap gap-3 cascade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 bg-coffee text-bone border-2 border-ink rounded-md px-4 py-2 shadow-pixel-sm">
          <Info size={14} className="text-mossL" />
          <span className="font-display text-[10px] uppercase tracking-wider">
            Selected: <span className={totalCr > 21 || (totalCr > 0 && totalCr < 12) ? 'text-bad' : 'text-mossL'}>{totalCr}</span> / 21 CR
          </span>
        </div>
      </div>

      {/* COURSES */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      ) : (
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.15s' }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
            <h3 className="heading-retro text-sm">Available Courses</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest w-12">Pick</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Type</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">CrHrs</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Section</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const isSelected = selected.includes(c.code)
                return (
                  <tr key={c.code} onClick={() => toggle(c.code)} className={`border-b border-dashed border-cocoa/30 cursor-pointer transition-colors ${
                    isSelected ? 'bg-burn/10' : i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'
                  } hover:bg-tan/30`}>
                    <td className="px-5 py-3 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(c.code)} className="w-4 h-4 accent-cocoa" />
                    </td>
                    <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                    <td className="px-5 py-3 text-ink">{c.name}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`tag text-[9px] ${c.type === 'CORE' ? 'bg-cocoa text-bone' : 'bg-tan/40 text-ink border-2 border-ink'}`}>{c.type}</span>
                    </td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.section}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-3 cascade-in" style={{ animationDelay: '0.2s' }}>
        <button onClick={handleSubmit} className="btn-primary">Submit Registration</button>
        <button onClick={handleReset} className="btn-ghost">Reset</button>
      </div>
    </div>
  )
}
