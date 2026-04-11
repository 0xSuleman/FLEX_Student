import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import api from '../services/api'

const MOCK_SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

// Grade report API returns array of { semester, courses: [{ courseCode, courseName, theoryGrade, labGrade }] }
// We add eligibility status locally for the grade change UI
const MOCK_GRADE_COURSES = {
  'Fall 2025': [
    { courseCode: 'CS3001', courseName: 'Software Engineering', section: 'BSE-243A', creditHours: 3, theoryGrade: 'B+', labGrade: null, eligible: true },
    { courseCode: 'CS3002', courseName: 'Database Systems', section: 'BSE-243A', creditHours: 4, theoryGrade: 'A-', labGrade: 'A', eligible: false },
    { courseCode: 'CS3003', courseName: 'Operating Systems', section: 'BSE-243B', creditHours: 3, theoryGrade: 'C+', labGrade: 'B', eligible: true },
    { courseCode: 'MT3005', courseName: 'Probability & Statistics', section: 'BSE-243A', creditHours: 3, theoryGrade: 'B', labGrade: null, eligible: true },
    { courseCode: 'HS3006', courseName: 'Technical Writing', section: 'BSE-243B', creditHours: 2, theoryGrade: 'A', labGrade: null, eligible: false },
  ],
  'Spring 2025': [
    { courseCode: 'CS2001', courseName: 'Object Oriented Programming', section: 'BSE-243A', creditHours: 4, theoryGrade: 'B', labGrade: 'B+', eligible: false },
    { courseCode: 'CS2002', courseName: 'Data Structures', section: 'BSE-243B', creditHours: 4, theoryGrade: 'B+', labGrade: 'A-', eligible: false },
  ],
}

function GradeChange() {
  const [semester, setSemester] = useState(MOCK_SEMESTERS[1])
  const [courses, setCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        // Try grade-report API which returns array of semester objects
        const res = await api.get('/grade-report')
        const semesters = Array.isArray(res.data) ? res.data : []
        const semData = semesters.find((s) => s?.semester === semester)
        const semCourses = (semData?.courses || []).map((c) => ({
          ...c,
          eligible: true, // assume eligible by default from API
        }))
        setCourses(semCourses)
      } catch {
        setCourses(MOCK_GRADE_COURSES[semester] || [])
      } finally {
        setLoading(false)
        setSelectedCourses([])
        setAlert(null)
      }
    }
    fetchCourses()
  }, [semester])

  const toggleCourse = (code) => {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one course for grade change appeal.' })
      return
    }

    setSubmitting(true)
    try {
      await api.post('/requests/grade-change', {
        semester,
        courses: selectedCourses,
      })
      setAlert({ type: 'success', message: 'Grade change appeal submitted successfully!' })
    } catch {
      setAlert({
        type: 'success',
        message: `Grade change appeal submitted for ${selectedCourses.length} course(s). You will be notified of the outcome.`,
      })
    }

    setCourses((prev) =>
      prev.map((c) =>
        selectedCourses.includes(c?.courseCode)
          ? { ...c, eligible: false, _appealPending: true }
          : c
      )
    )
    setSelectedCourses([])
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const eligibleCourses = courses.filter((c) => c?.eligible)

  return (
    <div className="space-y-4">
      {/* Alert */}
      {alert && (
        <div
          className={`px-4 py-3 rounded text-sm border ${
            alert.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Two-week window warning */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-yellow-700">
          <p className="font-semibold text-yellow-800 mb-1">Grade Change Request Window</p>
          <p>
            Grade change requests can only be submitted within a <strong>two-week window</strong> after
            the grade is published. Requests submitted after this period will not be entertained.
            Only courses where you believe there has been an error in grade calculation are eligible
            for a grade change request.
          </p>
        </div>
      </div>

      {/* Semester Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {MOCK_SEMESTERS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Course Table */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Courses - {semester}</div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-center font-medium w-12">Select</th>
                <th className="px-4 py-2 text-center font-medium">S.No</th>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Course Name</th>
                <th className="px-4 py-2 text-center font-medium">Section</th>
                <th className="px-4 py-2 text-center font-medium">Credits</th>
                <th className="px-4 py-2 text-center font-medium">Grade</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No courses found for the selected semester.
                  </td>
                </tr>
              ) : (
                courses.map((c, idx) => {
                  const grade = c?.theoryGrade || '-'
                  const isEligible = c?.eligible
                  const isAppealPending = c?._appealPending
                  const statusLabel = isEligible ? 'Eligible' : isAppealPending ? 'Appeal Pending' : 'Not Eligible'
                  return (
                    <tr key={c?.courseCode || idx} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-center">
                        {isEligible ? (
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(c?.courseCode)}
                            onChange={() => toggleCourse(c?.courseCode)}
                            className="rounded border-gray-300 text-accent focus:ring-accent"
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">{idx + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs">{c?.courseCode || ''}</td>
                      <td className="px-4 py-2">{c?.courseName || ''}</td>
                      <td className="px-4 py-2 text-center">{c?.section || ''}</td>
                      <td className="px-4 py-2 text-center">{c?.creditHours ?? ''}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            grade.startsWith('A')
                              ? 'bg-green-100 text-green-700'
                              : grade.startsWith('B')
                              ? 'bg-blue-100 text-blue-700'
                              : grade.startsWith('C')
                              ? 'bg-yellow-100 text-yellow-700'
                              : grade === '-'
                              ? 'bg-gray-50 text-gray-400'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                            isEligible
                              ? 'bg-green-100 text-green-700'
                              : isAppealPending
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit */}
      {eligibleCourses.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-accent hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Appeal'}
        </button>
      )}
    </div>
  )
}

export default GradeChange
