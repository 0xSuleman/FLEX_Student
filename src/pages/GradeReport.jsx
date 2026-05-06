import { useState, useEffect } from 'react'
import api from '../services/api'

const MOCK_SEMESTERS = [
  {
    name: 'Fall 2024',
    courses: [
      { code: 'CS1001', name: 'Intro to Computing', theory: 'A-', lab: null },
      { code: 'CS1002', name: 'Programming Fundamentals', theory: 'B+', lab: 'A' },
      { code: 'MT1001', name: 'Calculus', theory: 'B', lab: null },
      { code: 'EE1001', name: 'Applied Physics', theory: 'A', lab: 'A-' },
      { code: 'HU1001', name: 'English Composition', theory: 'A-', lab: null },
    ],
  },
  {
    name: 'Spring 2025',
    courses: [
      { code: 'CS2001', name: 'OOP', theory: 'A', lab: 'A' },
      { code: 'CS2002', name: 'Data Structures', theory: 'A-', lab: 'B+' },
      { code: 'MT2001', name: 'Linear Algebra', theory: 'B+', lab: null },
      { code: 'CS2003', name: 'Digital Logic Design', theory: 'B+', lab: 'A-' },
      { code: 'HU2001', name: 'Islamic Studies', theory: 'A', lab: null },
    ],
  },
  {
    name: 'Fall 2025',
    courses: [
      { code: 'CS3001', name: 'Software Engineering', theory: 'A-', lab: null },
      { code: 'CS3002', name: 'Database Systems', theory: 'A', lab: 'A' },
      { code: 'CS3003', name: 'Operating Systems', theory: 'B+', lab: 'A-' },
      { code: 'CS3004', name: 'Computer Networks', theory: 'B', lab: 'B+' },
      { code: 'MT3005', name: 'Probability & Stats', theory: 'A-', lab: null },
      { code: 'HS3006', name: 'Technical Writing', theory: 'A', lab: null },
    ],
  },
]

const gradeColor = (g) => {
  if (!g) return 'bg-bone/40 text-cocoa/40'
  if (g.startsWith('A')) return 'bg-cocoa text-bone'
  if (g.startsWith('B')) return 'bg-mustard text-ink'
  if (g.startsWith('C')) return 'bg-tan text-ink'
  if (g.startsWith('D')) return 'bg-burn text-bone'
  if (g === 'F') return 'bg-bad text-bone'
  return 'bg-bad text-bone'
}

export default function GradeReport() {
  const [semesters, setSemesters] = useState(MOCK_SEMESTERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/grade-report')
      .then((res) => {
        const mapped = res.data.map((item) => ({
          name: item.semester,
          courses: item.courses.map((c) => ({
            code: c.courseCode,
            name: c.courseName,
            theory: c.theoryGrade,
            lab: c.labGrade,
          })),
        }))
        setSemesters(mapped)
      })
      .catch(() => {
        setSemesters(MOCK_SEMESTERS)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / Grade Report</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">GRADE REPORT</h1>
        <p className="text-sm text-cocoa mt-2">Theory and lab grades broken out per semester.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {semesters.map((sem, si) => (
          <div key={sem.name} className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: `${0.05 + si * 0.05}s` }}>
            <div className="px-4 sm:px-4 py-3 border-b-2 border-ink bg-tan">
              <h3 className="heading-retro text-xs sm:text-sm truncate min-w-0">{sem.name}</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="bg-bone border-b-2 border-ink text-coffee">
                  <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                  <th className="px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest w-12">T</th>
                  <th className="px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest w-12">L</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c, i) => (
                  <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                    <td className="px-3 py-2 text-xs">
                      <div className="font-extrabold text-ink">{c.code}</div>
                      <div className="text-[10px] text-cocoa">{c.name}</div>
                    </td>
                    <td className="px-3 py-2 text-center"><span className={`tag text-[9px] ${gradeColor(c.theory)}`}>{c.theory || '—'}</span></td>
                    <td className="px-3 py-2 text-center"><span className={`tag text-[9px] ${gradeColor(c.lab)}`}>{c.lab || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
