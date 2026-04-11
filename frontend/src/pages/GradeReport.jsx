import { useState, useEffect } from 'react'
import api from '../services/api'

// API returns array of { semester, courses: [{ courseCode, courseName, theoryGrade, labGrade }] }
const MOCK_DATA = [
  {
    semester: 'Fall 2021',
    courses: [
      { courseCode: 'CS1001', courseName: 'Intro to Computing', theoryGrade: 'A-', labGrade: null },
      { courseCode: 'CS1002', courseName: 'Programming Fundamentals', theoryGrade: 'B+', labGrade: 'A' },
      { courseCode: 'MT1003', courseName: 'Calculus', theoryGrade: 'B', labGrade: null },
      { courseCode: 'EE1004', courseName: 'Applied Physics', theoryGrade: 'A', labGrade: 'A-' },
      { courseCode: 'HS1005', courseName: 'English Composition', theoryGrade: 'A-', labGrade: null },
    ],
  },
  {
    semester: 'Spring 2022',
    courses: [
      { courseCode: 'CS2001', courseName: 'OOP', theoryGrade: 'A', labGrade: 'A' },
      { courseCode: 'CS2002', courseName: 'Data Structures', theoryGrade: 'A-', labGrade: 'B+' },
      { courseCode: 'MT2003', courseName: 'Linear Algebra', theoryGrade: 'B+', labGrade: null },
      { courseCode: 'CS2004', courseName: 'Digital Logic Design', theoryGrade: 'B+', labGrade: 'A-' },
      { courseCode: 'HS2005', courseName: 'Islamic Studies', theoryGrade: 'A', labGrade: null },
    ],
  },
  {
    semester: 'Fall 2022',
    courses: [
      { courseCode: 'CS3001', courseName: 'Software Engineering', theoryGrade: 'A-', labGrade: null },
      { courseCode: 'CS3002', courseName: 'Database Systems', theoryGrade: 'A', labGrade: 'A' },
      { courseCode: 'CS3003', courseName: 'Operating Systems', theoryGrade: 'B+', labGrade: 'A-' },
      { courseCode: 'CS3004', courseName: 'Computer Networks', theoryGrade: 'B', labGrade: 'B+' },
      { courseCode: 'MT3005', courseName: 'Probability & Stats', theoryGrade: 'A-', labGrade: null },
      { courseCode: 'HS3006', courseName: 'Technical Writing', theoryGrade: 'A', labGrade: null },
    ],
  },
  {
    semester: 'Spring 2023',
    courses: [
      { courseCode: 'CS4001', courseName: 'Artificial Intelligence', theoryGrade: 'A', labGrade: 'A-' },
      { courseCode: 'CS4002', courseName: 'Compiler Construction', theoryGrade: 'B+', labGrade: 'B+' },
      { courseCode: 'CS4003', courseName: 'Computer Architecture', theoryGrade: 'B', labGrade: 'B' },
      { courseCode: 'CS4004', courseName: 'Theory of Automata', theoryGrade: 'A-', labGrade: null },
      { courseCode: 'HS4005', courseName: 'Professional Practices', theoryGrade: 'A', labGrade: null },
    ],
  },
  {
    semester: 'Fall 2023',
    courses: [
      { courseCode: 'CS5001', courseName: 'Design & Analysis of Algorithms', theoryGrade: 'A-', labGrade: null },
      { courseCode: 'CS5002', courseName: 'Parallel & Distributed Computing', theoryGrade: 'B+', labGrade: 'A-' },
      { courseCode: 'CS5003', courseName: 'Information Security', theoryGrade: 'A', labGrade: 'A' },
      { courseCode: 'CS5004', courseName: 'Machine Learning', theoryGrade: 'A-', labGrade: 'A' },
      { courseCode: 'HS5005', courseName: 'Pakistan Studies', theoryGrade: 'B+', labGrade: null },
    ],
  },
  {
    semester: 'Spring 2024',
    courses: [
      { courseCode: 'CS6001', courseName: 'Final Year Project I', theoryGrade: 'A', labGrade: null },
      { courseCode: 'CS6002', courseName: 'Web Engineering', theoryGrade: 'A', labGrade: 'A' },
      { courseCode: 'CS6003', courseName: 'Cloud Computing', theoryGrade: 'A-', labGrade: 'B+' },
      { courseCode: 'CS6004', courseName: 'Deep Learning', theoryGrade: 'A', labGrade: 'A' },
      { courseCode: 'MT6005', courseName: 'Numerical Computing', theoryGrade: 'B+', labGrade: null },
    ],
  },
]

function getGradeClass(grade) {
  if (!grade) return 'bg-gray-50 text-gray-400'
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700'
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700'
  if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function GradeReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGradeReport = async () => {
      try {
        const res = await api.get('/grade-report')
        setData(Array.isArray(res.data) ? res.data : [])
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
      }
    }
    fetchGradeReport()
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semesters.map((sem) => (
          <div key={sem?.semester} className="rounded shadow overflow-hidden">
            <div className="card-header">{sem?.semester || ''}</div>
            <div className="bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="px-3 py-1.5 text-left font-medium text-xs">
                      Course
                    </th>
                    <th className="px-3 py-1.5 text-center font-medium text-xs w-14">
                      C
                    </th>
                    <th className="px-3 py-1.5 text-center font-medium text-xs w-14">
                      L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sem?.courses || []).map((c, i) => {
                    const theoryGrade = c?.theoryGrade || '-'
                    const labGrade = c?.labGrade || '-'
                    const courseLabel = `${c?.courseCode || ''} - ${c?.courseName || ''}`
                    return (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 text-xs">{courseLabel}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getGradeClass(
                              theoryGrade === '-' ? null : theoryGrade
                            )}`}
                          >
                            {theoryGrade}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getGradeClass(
                              labGrade === '-' ? null : labGrade
                            )}`}
                          >
                            {labGrade}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GradeReport
