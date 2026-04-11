import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const MOCK_DATA = {
  studentName: 'Suleman Ahmed',
  rollNo: '24L-3072',
  degree: 'BS(SE)',
  campus: 'Lahore',
  semesters: [
    {
      semester: 'Fall 2024',
      crAttempted: 17,
      crEarned: 17,
      sgpa: 3.68,
      cgpa: 3.68,
      courses: [
        { courseCode: 'CS1001', courseName: 'Introduction to Computing', creditHours: 3, grade: 'A-', points: 3.67 },
        { courseCode: 'CS1002', courseName: 'Programming Fundamentals', creditHours: 3, grade: 'A', points: 4.0 },
        { courseCode: 'MT1001', courseName: 'Calculus and Analytical Geometry', creditHours: 3, grade: 'B+', points: 3.33 },
        { courseCode: 'EE1001', courseName: 'Applied Physics', creditHours: 3, grade: 'B', points: 3.0 },
        { courseCode: 'HU1001', courseName: 'English Composition', creditHours: 3, grade: 'A', points: 4.0 },
      ],
    },
  ],
}

function Transcript() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const res = await api.get('/transcript')
        setData(res.data)
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
      }
    }
    fetchTranscript()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const d = data || MOCK_DATA

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Student Transcript</div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-gray-400 uppercase">Roll No</div>
              <div className="text-sm font-medium">{d.rollNo}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase">Name</div>
              <div className="text-sm font-medium">{d.studentName}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase">Degree</div>
              <div className="text-sm font-medium">{d.degree}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase">Campus</div>
              <div className="text-sm font-medium">{d.campus}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Blocks */}
      {(d.semesters || []).map((sem) => (
        <div key={sem.semester} className="rounded shadow overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span>{sem.semester}</span>
            <div className="flex gap-6 text-xs">
              <span>Cr. Attempted: <strong>{sem.crAttempted}</strong></span>
              <span>Cr. Earned: <strong>{sem.crEarned}</strong></span>
              <span>SGPA: <strong>{(sem.sgpa || 0).toFixed(2)}</strong></span>
              <span>CGPA: <strong>{(sem.cgpa || 0).toFixed(2)}</strong></span>
            </div>
          </div>
          <div className="bg-white overflow-x-auto">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-4 py-2 text-left font-medium">Code</th>
                  <th className="px-4 py-2 text-left font-medium">Course Name</th>
                  <th className="px-4 py-2 text-center font-medium">CrdHrs</th>
                  <th className="px-4 py-2 text-center font-medium">Grade</th>
                  <th className="px-4 py-2 text-center font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {(sem.courses || []).map((c, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs">{c.courseCode}</td>
                    <td className="px-4 py-2">{c.courseName}</td>
                    <td className="px-4 py-2 text-center">{c.creditHours}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          (c.grade || '').startsWith('A')
                            ? 'bg-green-100 text-green-700'
                            : (c.grade || '').startsWith('B')
                            ? 'bg-blue-100 text-blue-700'
                            : (c.grade || '').startsWith('C')
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {c.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{(c.points || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Transcript
