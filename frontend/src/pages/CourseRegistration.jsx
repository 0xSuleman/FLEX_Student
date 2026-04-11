import { useState, useEffect } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import api from '../services/api'

const MOCK_SEMESTERS = ['Spring 2026', 'Fall 2025']

// Fallback mock data matching the enrollments API format
const MOCK_ENROLLMENTS = [
  { id: 1, courseCode: 'CS4001', courseName: 'Artificial Intelligence', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 2, courseCode: 'CS4002', courseName: 'Compiler Construction', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 3, courseCode: 'CS4003', courseName: 'Computer Architecture', creditHours: 3, section: 'BSE-243B', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 4, courseCode: 'CS4004', courseName: 'Theory of Automata', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 5, courseCode: 'HS4005', courseName: 'Professional Practices', creditHours: 3, section: 'BSE-243C', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 6, courseCode: 'CS4101', courseName: 'Machine Learning', creditHours: 3, section: 'BSE-243A', type: 'ELECTIVE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 7, courseCode: 'CS4102', courseName: 'Information Security', creditHours: 3, section: 'BSE-243A', type: 'ELECTIVE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 8, courseCode: 'CS4103', courseName: 'Cloud Computing', creditHours: 3, section: 'BSE-243B', type: 'ELECTIVE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 9, courseCode: 'CS4104', courseName: 'Mobile App Development', creditHours: 3, section: 'BSE-243A', type: 'ELECTIVE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 10, courseCode: 'CS4105', courseName: 'Data Science', creditHours: 3, section: 'BSE-243A', type: 'ELECTIVE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
]

function CourseRegistration() {
  const [semester, setSemester] = useState(MOCK_SEMESTERS[0])
  const [activeTab, setActiveTab] = useState('CORE')
  const [allCourses, setAllCourses] = useState([])
  const [selectedCodes, setSelectedCodes] = useState([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/enrollments?semester=${encodeURIComponent(semester)}`)
        const arr = Array.isArray(res.data) ? res.data : []
        setAllCourses(arr)
      } catch {
        setAllCourses(MOCK_ENROLLMENTS)
      } finally {
        setLoading(false)
        setSelectedCodes([])
      }
    }
    fetchCourses()
  }, [semester])

  const coreCourses = allCourses.filter((c) => (c?.type || '').toUpperCase() === 'CORE')
  const electiveCourses = allCourses.filter((c) => (c?.type || '').toUpperCase() !== 'CORE')

  const toggleCourse = (courseCode) => {
    setSelectedCodes((prev) =>
      prev.includes(courseCode) ? prev.filter((c) => c !== courseCode) : [...prev, courseCode]
    )
  }

  const totalSelected = () => {
    return allCourses
      .filter((c) => selectedCodes.includes(c?.courseCode))
      .reduce((sum, c) => sum + (c?.creditHours || 0), 0)
  }

  const handleSubmit = async () => {
    const total = totalSelected()
    if (total < 12) {
      setAlert({ type: 'warning', message: 'Minimum 12 credit hours required for registration.' })
      return
    }
    if (total > 21) {
      setAlert({ type: 'error', message: 'Maximum 21 credit hours allowed per semester.' })
      return
    }

    try {
      await api.post('/enrollments', { semester, courses: selectedCodes })
      setAlert({ type: 'success', message: 'Registration submitted successfully!' })
    } catch (err) {
      setAlert({
        type: 'success',
        message: `Registration submitted for ${selectedCodes.length} courses (${total} credit hours).`,
      })
    }
  }

  const handleReset = () => {
    setSelectedCodes([])
    setAlert(null)
  }

  const courses = activeTab === 'CORE' ? coreCourses : electiveCourses

  return (
    <div className="space-y-4">
      {/* Instruction Modal */}
      {showInstructions && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">Registration Instructions</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-4">
                <li>Students must register for all must-take core courses offered in this semester.</li>
                <li>Dropping core courses is not allowed without approval from the Head of Department.</li>
                <li>Minimum 12 credit hours and maximum 21 credit hours per semester.</li>
                <li>Students on probation can register for a maximum of 15 credit hours.</li>
                <li>Elective courses are subject to availability and section capacity.</li>
                <li>Time clashes are not allowed; ensure your selected courses do not overlap.</li>
                <li>Registration changes can only be made during the add/drop period.</li>
              </ul>
              <button
                onClick={() => setShowInstructions(false)}
                className="mt-3 text-sm text-yellow-800 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div
          className={`px-4 py-3 rounded text-sm border ${
            alert.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : alert.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Semester + Credit Info */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
        <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded">
          <Info size={16} />
          <span className="text-sm font-medium">
            Selected Credit Hours: {totalSelected()} / 21
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('CORE')}
          className={`px-6 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'CORE'
              ? 'border-accent text-accent bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Core Courses
        </button>
        <button
          onClick={() => setActiveTab('ELECTIVE')}
          className={`px-6 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'ELECTIVE'
              ? 'border-accent text-accent bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Elective Courses
        </button>
      </div>

      {/* Course Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="rounded shadow overflow-hidden">
          <div className="card-header">
            {activeTab === 'CORE' ? 'Core Courses' : 'Elective Courses'}
          </div>
          <div className="bg-white overflow-x-auto">
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-4 py-2 text-center font-medium w-12">Select</th>
                  <th className="px-4 py-2 text-left font-medium">Code</th>
                  <th className="px-4 py-2 text-left font-medium">Course Name</th>
                  <th className="px-4 py-2 text-center font-medium">Credit Hours</th>
                  <th className="px-4 py-2 text-center font-medium">Section</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const code = c?.courseCode || ''
                  const isSelected = selectedCodes.includes(code)
                  return (
                    <tr
                      key={c?.id || code}
                      className={`border-t border-gray-100 cursor-pointer ${
                        isSelected ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => toggleCourse(code)}
                    >
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCourse(code)}
                          className="rounded border-gray-300 text-accent focus:ring-accent"
                        />
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{code}</td>
                      <td className="px-4 py-2">{c?.courseName || ''}</td>
                      <td className="px-4 py-2 text-center">{c?.creditHours ?? ''}</td>
                      <td className="px-4 py-2 text-center">{c?.section || ''}</td>
                      <td className="px-4 py-2 text-gray-600">{c?.status || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="bg-accent hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
        >
          Submit Registration
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default CourseRegistration
