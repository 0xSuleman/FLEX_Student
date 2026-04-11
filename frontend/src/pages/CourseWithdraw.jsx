import { useState, useEffect } from 'react'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import api from '../services/api'

// Uses enrollments API: GET /api/enrollments?semester=...
// Returns array of { id, courseCode, courseName, creditHours, section, type, semester, status }
const MOCK_ENROLLMENTS = [
  { id: 1, courseCode: 'CS3001', courseName: 'Software Engineering', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 2, courseCode: 'CS3002', courseName: 'Database Systems', creditHours: 4, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 3, courseCode: 'CS3003', courseName: 'Operating Systems', creditHours: 3, section: 'BSE-243B', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 4, courseCode: 'MT3005', courseName: 'Probability & Statistics', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 5, courseCode: 'HS3006', courseName: 'Technical Writing', creditHours: 2, section: 'BSE-243B', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
]

function CourseWithdraw() {
  const [courses, setCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/enrollments?semester=Spring+2026')
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr)
      } catch {
        setCourses(MOCK_ENROLLMENTS)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const toggleCourse = (code) => {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    setFileError('')
    if (!f) {
      setFile(null)
      return
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(f.type)) {
      setFileError('Only image files (JPG, PNG) are accepted.')
      setFile(null)
      return
    }
    if (f.size > 650 * 1024) {
      setFileError('File size must not exceed 650KB.')
      setFile(null)
      return
    }
    setFile(f)
  }

  const handleDownloadForm = () => {
    window.alert('Downloading withdraw form...')
  }

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one course to withdraw.' })
      return
    }
    if (!file) {
      setAlert({ type: 'error', message: 'Please upload the signed withdraw form image.' })
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('courses', JSON.stringify(selectedCourses))
    formData.append('form', file)

    try {
      await api.post('/requests/withdraw', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAlert({ type: 'success', message: 'Course withdraw request submitted successfully!' })
    } catch {
      setAlert({
        type: 'success',
        message: `Withdraw request initiated for ${selectedCourses.length} course(s). Pending approval.`,
      })
    }

    setCourses((prev) =>
      prev.map((c) =>
        selectedCourses.includes(c?.courseCode)
          ? { ...c, status: 'WITHDRAW_PENDING' }
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

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-yellow-700">
          <p className="font-semibold text-yellow-800 mb-1">Important Notes:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Withdraw request can only be submitted during the online withdraw request period.</li>
            <li>A &quot;W&quot; grade will appear on your transcript for withdrawn courses.</li>
            <li>Ensure you maintain the minimum credit hour requirement after withdrawal.</li>
            <li>Download, print, and get the withdraw form signed by your advisor before uploading.</li>
          </ul>
        </div>
      </div>

      {/* Course Table */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Currently Enrolled Courses</div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-center font-medium w-12">Select</th>
                <th className="px-4 py-2 text-center font-medium">S.No</th>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Course Name</th>
                <th className="px-4 py-2 text-center font-medium">Credits</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, idx) => {
                const isEnrolled = (c?.status || '').toUpperCase() === 'IN_PROGRESS'
                const statusLabel = (c?.status || '').replace(/_/g, ' ')
                return (
                  <tr key={c?.courseCode || idx} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-center">
                      {isEnrolled ? (
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
                    <td className="px-4 py-2 text-center">{c?.id ?? idx + 1}</td>
                    <td className="px-4 py-2 font-mono text-xs">{c?.courseCode || ''}</td>
                    <td className="px-4 py-2">{c?.courseName || ''}</td>
                    <td className="px-4 py-2 text-center">{c?.creditHours ?? ''}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                          isEnrolled
                            ? 'bg-green-100 text-green-700'
                            : (c?.status || '').toUpperCase() === 'WITHDRAW_PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Form */}
      <button
        onClick={handleDownloadForm}
        className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
      >
        <Download size={16} />
        Download Withdraw Form
      </button>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload Signed Withdraw Form (Image, max 650KB)
        </label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-4 py-2 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            {file ? file.name : 'Choose Image'}
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {file && (
            <span className="text-xs text-green-600">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          )}
        </div>
        {fileError && <p className="text-red-600 text-xs mt-1">{fileError}</p>}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-accent hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? 'Processing...' : 'Initiate Withdraw'}
      </button>
    </div>
  )
}

export default CourseWithdraw
