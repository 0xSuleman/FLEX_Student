import { useState, useEffect } from 'react'
import api from '../services/api'

// API returns array of { semester: 1, courses: [{ courseCode, courseName, creditHours, type }] }
const MOCK_DATA = [
  {
    semester: 1,
    courses: [
      { courseCode: 'CS1001', courseName: 'Introduction to Computing', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS1002', courseName: 'Programming Fundamentals', creditHours: 4, type: 'CORE' },
      { courseCode: 'MT1003', courseName: 'Calculus & Analytical Geometry', creditHours: 3, type: 'CORE' },
      { courseCode: 'EE1004', courseName: 'Applied Physics', creditHours: 3, type: 'CORE' },
      { courseCode: 'HS1005', courseName: 'English Composition', creditHours: 3, type: 'CORE' },
    ],
  },
  {
    semester: 2,
    courses: [
      { courseCode: 'CS2001', courseName: 'Object Oriented Programming', creditHours: 4, type: 'CORE' },
      { courseCode: 'CS2002', courseName: 'Data Structures', creditHours: 4, type: 'CORE' },
      { courseCode: 'MT2003', courseName: 'Linear Algebra', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS2004', courseName: 'Digital Logic Design', creditHours: 3, type: 'CORE' },
      { courseCode: 'HS2005', courseName: 'Islamic Studies', creditHours: 3, type: 'CORE' },
    ],
  },
  {
    semester: 3,
    courses: [
      { courseCode: 'CS3001', courseName: 'Software Engineering', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS3002', courseName: 'Database Systems', creditHours: 4, type: 'CORE' },
      { courseCode: 'CS3003', courseName: 'Operating Systems', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS3004', courseName: 'Computer Networks', creditHours: 3, type: 'CORE' },
      { courseCode: 'MT3005', courseName: 'Probability & Statistics', creditHours: 3, type: 'CORE' },
      { courseCode: 'HS3006', courseName: 'Technical Writing', creditHours: 2, type: 'CORE' },
    ],
  },
  {
    semester: 4,
    courses: [
      { courseCode: 'CS4001', courseName: 'Artificial Intelligence', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS4002', courseName: 'Compiler Construction', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS4003', courseName: 'Computer Architecture', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS4004', courseName: 'Theory of Automata', creditHours: 3, type: 'CORE' },
      { courseCode: 'HS4005', courseName: 'Professional Practices', creditHours: 3, type: 'CORE' },
    ],
  },
  {
    semester: 5,
    courses: [
      { courseCode: 'CS5001', courseName: 'Design & Analysis of Algorithms', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS5002', courseName: 'Parallel & Distributed Computing', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS5003', courseName: 'Information Security', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'CS5004', courseName: 'Machine Learning', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'HS5005', courseName: 'Pakistan Studies', creditHours: 3, type: 'CORE' },
    ],
  },
  {
    semester: 6,
    courses: [
      { courseCode: 'CS6001', courseName: 'Final Year Project I', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS6002', courseName: 'Web Engineering', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'CS6003', courseName: 'Cloud Computing', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'CS6004', courseName: 'Deep Learning', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'MT6005', courseName: 'Numerical Computing', creditHours: 3, type: 'CORE' },
    ],
  },
  {
    semester: 7,
    courses: [
      { courseCode: 'CS7001', courseName: 'Final Year Project II', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS7002', courseName: 'Natural Language Processing', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'CS7003', courseName: 'Computer Vision', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'CS7004', courseName: 'DevOps Engineering', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'HS7005', courseName: 'Entrepreneurship', creditHours: 3, type: 'CORE' },
    ],
  },
  {
    semester: 8,
    courses: [
      { courseCode: 'CS8001', courseName: 'Final Year Project III', creditHours: 3, type: 'CORE' },
      { courseCode: 'CS8002', courseName: 'Blockchain Technology', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'CS8003', courseName: 'IoT Systems', creditHours: 3, type: 'ELECTIVE' },
      { courseCode: 'HS8004', courseName: 'Community Service', creditHours: 1, type: 'CORE' },
    ],
  },
]

function StudyPlan() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudyPlan = async () => {
      try {
        const res = await api.get('/study-plan')
        setData(Array.isArray(res.data) ? res.data : [])
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
      }
    }
    fetchStudyPlan()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const semesters = data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-primary inline-block"></span>
          <span className="text-xs text-gray-600">Core Course</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-accent inline-block"></span>
          <span className="text-xs text-gray-600">Elective Course</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {semesters.map((sem) => {
          const semCourses = sem?.courses || []
          const totalCredits = semCourses.reduce((sum, c) => sum + (c?.creditHours ?? 0), 0)
          const semLabel = `Semester ${sem?.semester ?? '?'}`
          return (
            <div key={sem?.semester} className="rounded shadow overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <span>{semLabel}</span>
                <span className="text-xs">Total: {totalCredits} CrdHrs</span>
              </div>
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600">
                      <th className="px-3 py-1.5 text-left font-medium text-xs">Code</th>
                      <th className="px-3 py-1.5 text-left font-medium text-xs">Course Name</th>
                      <th className="px-3 py-1.5 text-center font-medium text-xs">CrdHrs</th>
                      <th className="px-3 py-1.5 text-center font-medium text-xs">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semCourses.map((c) => {
                      const typeUpper = (c?.type || '').toUpperCase()
                      const isElective = typeUpper !== 'CORE'
                      const typeLabel = typeUpper === 'CORE' ? 'Core' : typeUpper === 'ELECTIVE' ? 'Elective' : (c?.type || '')
                      return (
                        <tr
                          key={c?.courseCode}
                          className={`border-t border-gray-100 ${
                            isElective ? 'bg-accent/5' : ''
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono text-xs">{c?.courseCode || ''}</td>
                          <td className="px-3 py-1.5 text-xs">{c?.courseName || ''}</td>
                          <td className="px-3 py-1.5 text-center text-xs">{c?.creditHours ?? ''}</td>
                          <td className="px-3 py-1.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                !isElective
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-accent/10 text-accent'
                              }`}
                            >
                              {typeLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
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

export default StudyPlan
