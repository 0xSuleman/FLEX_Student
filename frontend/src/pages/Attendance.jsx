import { useState, useEffect } from 'react'
import api from '../services/api'

const MOCK_SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

const MOCK_DATA = [
  {
    courseCode: 'CS3001',
    courseName: 'Software Engineering',
    semester: 'Spring 2026',
    totalLectures: 10,
    present: 7,
    absent: 2,
    leaves: 1,
    percentage: 85,
    records: [
      { lectureNo: 1, date: '2026-01-27', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 2, date: '2026-01-29', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 3, date: '2026-01-31', durationHrs: 1.5, presence: 'A' },
      { lectureNo: 4, date: '2026-02-03', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 5, date: '2026-02-05', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 6, date: '2026-02-07', durationHrs: 1.5, presence: 'L' },
      { lectureNo: 7, date: '2026-02-10', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 8, date: '2026-02-12', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 9, date: '2026-02-14', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 10, date: '2026-02-17', durationHrs: 1.5, presence: 'A' },
    ],
  },
  {
    courseCode: 'CS3002',
    courseName: 'Database Systems',
    semester: 'Spring 2026',
    totalLectures: 8,
    present: 7,
    absent: 1,
    leaves: 0,
    percentage: 92,
    records: [
      { lectureNo: 1, date: '2026-01-28', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 2, date: '2026-01-30', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 3, date: '2026-02-01', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 4, date: '2026-02-04', durationHrs: 1.5, presence: 'A' },
      { lectureNo: 5, date: '2026-02-06', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 6, date: '2026-02-08', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 7, date: '2026-02-11', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 8, date: '2026-02-13', durationHrs: 1.5, presence: 'P' },
    ],
  },
  {
    courseCode: 'CS3003',
    courseName: 'Operating Systems',
    semester: 'Spring 2026',
    totalLectures: 7,
    present: 4,
    absent: 3,
    leaves: 0,
    percentage: 70,
    records: [
      { lectureNo: 1, date: '2026-01-27', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 2, date: '2026-01-29', durationHrs: 1.5, presence: 'A' },
      { lectureNo: 3, date: '2026-01-31', durationHrs: 1.5, presence: 'A' },
      { lectureNo: 4, date: '2026-02-03', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 5, date: '2026-02-05', durationHrs: 1.5, presence: 'P' },
      { lectureNo: 6, date: '2026-02-07', durationHrs: 1.5, presence: 'A' },
      { lectureNo: 7, date: '2026-02-10', durationHrs: 1.5, presence: 'P' },
    ],
  },
]

function Attendance() {
  const [semester, setSemester] = useState(MOCK_SEMESTERS[0])
  const [data, setData] = useState(null)
  const [activeCourse, setActiveCourse] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/attendance?semester=${encodeURIComponent(semester)}`)
        setData(Array.isArray(res.data) ? res.data : [])
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
        setActiveCourse(0)
      }
    }
    fetchAttendance()
  }, [semester])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const courses = data || []
  const course = courses[activeCourse]

  return (
    <div className="space-y-4">
      {/* Semester Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {MOCK_SEMESTERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Course Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {courses.map((c, i) => (
          <button
            key={c?.courseCode || i}
            onClick={() => setActiveCourse(i)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeCourse === i
                ? 'border-accent text-accent bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {c?.courseCode || ''} - {c?.courseName || ''}
          </button>
        ))}
      </div>

      {course && (
        <div className="rounded shadow overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span>
              {course?.courseCode || ''} - {course?.courseName || ''}
            </span>
            <span>Attendance: {course?.percentage ?? 0}%</span>
          </div>
          <div className="card-body">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Attendance Percentage</span>
                <span
                  className={`font-bold ${
                    (course?.percentage ?? 0) >= 80 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {course?.percentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    (course?.percentage ?? 0) >= 80 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${course?.percentage ?? 0}%` }}
                ></div>
              </div>
              {(course?.percentage ?? 0) < 80 && (
                <p className="text-red-600 text-xs mt-1">
                  Warning: Your attendance is below 80%. You may be barred from
                  the final exam.
                </p>
              )}
            </div>

            {/* Attendance Table */}
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-4 py-2 text-left font-medium">
                    Lecture No
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">
                    Duration (Hrs)
                  </th>
                  <th className="px-4 py-2 text-center font-medium">
                    Presence
                  </th>
                </tr>
              </thead>
              <tbody>
                {(course?.records || []).map((lec, idx) => (
                  <tr key={lec?.lectureNo ?? idx} className="border-t border-gray-100">
                    <td className="px-4 py-2">{lec?.lectureNo ?? ''}</td>
                    <td className="px-4 py-2">{lec?.date ?? ''}</td>
                    <td className="px-4 py-2">{lec?.durationHrs ?? ''}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          lec?.presence === 'P'
                            ? 'bg-green-100 text-green-700'
                            : lec?.presence === 'A'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {lec?.presence ?? ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Note */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded px-4 py-2 text-xs text-blue-700">
              <strong>Note:</strong> Attendance is marked with 24hrs delay. If
              you have any discrepancy, please contact your course instructor.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance
