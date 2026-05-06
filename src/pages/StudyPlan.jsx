import { useState, useEffect } from 'react'
import api from '../services/api'

const MOCK_PLAN = [
  { sem: 1, courses: [
    { code: 'CS1001', name: 'Introduction to Computing', cr: 3, type: 'CORE' },
    { code: 'CS1002', name: 'Programming Fundamentals', cr: 4, type: 'CORE' },
    { code: 'MT1003', name: 'Calculus & Analytical Geometry', cr: 3, type: 'CORE' },
    { code: 'EE1004', name: 'Applied Physics', cr: 3, type: 'CORE' },
    { code: 'HS1005', name: 'English Composition', cr: 3, type: 'CORE' },
  ]},
  { sem: 2, courses: [
    { code: 'CS2001', name: 'Object Oriented Programming', cr: 4, type: 'CORE' },
    { code: 'CS2002', name: 'Data Structures', cr: 4, type: 'CORE' },
    { code: 'MT2003', name: 'Linear Algebra', cr: 3, type: 'CORE' },
    { code: 'CS2004', name: 'Digital Logic Design', cr: 3, type: 'CORE' },
    { code: 'HS2005', name: 'Islamic Studies', cr: 3, type: 'CORE' },
  ]},
  { sem: 3, courses: [
    { code: 'CS3001', name: 'Software Engineering', cr: 3, type: 'CORE' },
    { code: 'CS3002', name: 'Database Systems', cr: 4, type: 'CORE' },
    { code: 'CS3003', name: 'Operating Systems', cr: 3, type: 'CORE' },
    { code: 'CS3004', name: 'Computer Networks', cr: 3, type: 'CORE' },
    { code: 'MT3005', name: 'Probability & Statistics', cr: 3, type: 'CORE' },
    { code: 'HS3006', name: 'Technical Writing', cr: 2, type: 'CORE' },
  ]},
  { sem: 4, courses: [
    { code: 'CS4001', name: 'Artificial Intelligence', cr: 3, type: 'CORE' },
    { code: 'CS4002', name: 'Compiler Construction', cr: 3, type: 'CORE' },
    { code: 'CS4003', name: 'Computer Architecture', cr: 3, type: 'CORE' },
    { code: 'CS4004', name: 'Theory of Automata', cr: 3, type: 'CORE' },
    { code: 'HS4005', name: 'Professional Practices', cr: 3, type: 'CORE' },
  ]},
  { sem: 5, courses: [
    { code: 'CS5001', name: 'Design & Analysis of Algorithms', cr: 3, type: 'CORE' },
    { code: 'CS5002', name: 'Parallel & Distributed Computing', cr: 3, type: 'CORE' },
    { code: 'CS5003', name: 'Information Security', cr: 3, type: 'ELECTIVE' },
    { code: 'CS5004', name: 'Machine Learning', cr: 3, type: 'ELECTIVE' },
    { code: 'HS5005', name: 'Pakistan Studies', cr: 3, type: 'CORE' },
  ]},
  { sem: 6, courses: [
    { code: 'CS6001', name: 'Final Year Project I', cr: 3, type: 'CORE' },
    { code: 'CS6002', name: 'Web Engineering', cr: 3, type: 'ELECTIVE' },
    { code: 'CS6003', name: 'Cloud Computing', cr: 3, type: 'ELECTIVE' },
    { code: 'CS6004', name: 'Deep Learning', cr: 3, type: 'ELECTIVE' },
    { code: 'MT6005', name: 'Numerical Computing', cr: 3, type: 'CORE' },
  ]},
  { sem: 7, courses: [
    { code: 'CS7001', name: 'Final Year Project II', cr: 3, type: 'CORE' },
    { code: 'CS7002', name: 'Natural Language Processing', cr: 3, type: 'ELECTIVE' },
    { code: 'CS7003', name: 'Computer Vision', cr: 3, type: 'ELECTIVE' },
    { code: 'CS7004', name: 'DevOps Engineering', cr: 3, type: 'ELECTIVE' },
    { code: 'HS7005', name: 'Entrepreneurship', cr: 3, type: 'CORE' },
  ]},
  { sem: 8, courses: [
    { code: 'CS8001', name: 'Final Year Project III', cr: 3, type: 'CORE' },
    { code: 'CS8002', name: 'Blockchain Technology', cr: 3, type: 'ELECTIVE' },
    { code: 'CS8003', name: 'IoT Systems', cr: 3, type: 'ELECTIVE' },
    { code: 'HS8004', name: 'Community Service', cr: 1, type: 'CORE' },
  ]},
]

export default function StudyPlan() {
  const [plan, setPlan] = useState(MOCK_PLAN)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/study-plan')
        const mapped = res.data.map((s) => ({
          sem: s.semester,
          courses: s.courses.map((c) => ({
            code: c.courseCode,
            name: c.courseName,
            cr: c.creditHours,
            type: c.type,
          })),
        }))
        setPlan(mapped)
      } catch {
        setPlan(MOCK_PLAN)
      } finally {
        setLoading(false)
      }
    })()
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
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / Study Plan</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">STUDY PLAN</h1>
        <p className="text-sm text-cocoa mt-2">Full 8-semester roadmap for your degree program.</p>
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 text-xs font-bold text-coffee uppercase tracking-wider cascade-in" style={{ animationDelay: '0.05s' }}>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-cocoa border border-ink rounded-sm" /> Core</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-tan/40 border border-ink rounded-sm" /> Elective</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plan.map((sem, si) => {
          const total = sem.courses.reduce((s, c) => s + c.cr, 0)
          return (
            <div key={sem.sem} className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: `${0.1 + si * 0.04}s` }}>
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between gap-2">
                <h3 className="heading-retro text-xs sm:text-sm truncate min-w-0">Semester {sem.sem}</h3>
                <span className="text-xs font-bold text-ink uppercase tracking-wider shrink-0">{total} CR</span>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-bone border-b-2 border-ink text-coffee">
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                    <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                    <th className="px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest">Cr</th>
                    <th className="px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses.map((c, i) => (
                    <tr key={c.code} className={`border-b border-dashed border-cocoa/30 ${c.type === 'ELECTIVE' ? 'bg-burn/5' : i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                      <td className="px-3 py-2 font-extrabold text-ink text-xs">{c.code}</td>
                      <td className="px-3 py-2 text-ink text-xs">{c.name}</td>
                      <td className="px-3 py-2 text-center"><span className="tag bg-bone text-ink text-[9px]">{c.cr}</span></td>
                      <td className="px-3 py-2 text-center">
                        <span className={`tag text-[9px] ${c.type === 'ELECTIVE' ? 'bg-tan/40 text-ink' : 'bg-cocoa text-bone'}`}>
                          {c.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
