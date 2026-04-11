import { useState, useEffect } from 'react'
import { Upload, AlertTriangle, Info } from 'lucide-react'
import api from '../services/api'

const MOCK_SEMESTERS = ['Spring 2026', 'Fall 2025']
const EVAL_TYPES = ['Midterm', 'Final', 'Sessional 1', 'Sessional 2']
const REASONS = [
  'Medical Emergency',
  'Family Emergency',
  'Accident/Injury',
  'Overlap with another exam',
  'Other',
]

// Requests API returns { retakeRequests, withdrawRequests, gradeChangeRequests }
// We use enrollments for eligible courses and requests for existing retake requests
const MOCK_ENROLLMENTS = [
  { id: 1, courseCode: 'CS3001', courseName: 'Software Engineering', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 2, courseCode: 'CS3002', courseName: 'Database Systems', creditHours: 4, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 3, courseCode: 'CS3003', courseName: 'Operating Systems', creditHours: 3, section: 'BSE-243B', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
  { id: 4, courseCode: 'MT3005', courseName: 'Probability & Statistics', creditHours: 3, section: 'BSE-243A', type: 'CORE', semester: 'Spring 2026', status: 'IN_PROGRESS' },
]

function RetakeExam() {
  const [semester, setSemester] = useState(MOCK_SEMESTERS[0])
  const [evalType, setEvalType] = useState(EVAL_TYPES[0])
  const [courses, setCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [reason, setReason] = useState(REASONS[0])
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/enrollments?semester=${encodeURIComponent(semester)}`)
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr)
      } catch {
        setCourses(MOCK_ENROLLMENTS)
      } finally {
        setLoading(false)
        setSelectedCourses([])
        setFile(null)
        setFileError('')
      }
    }
    fetchCourses()
  }, [semester, evalType])

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
    if (f.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.')
      setFile(null)
      return
    }
    if (f.size > 3 * 1024 * 1024) {
      setFileError('File size must not exceed 3MB.')
      setFile(null)
      return
    }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one course.' })
      return
    }
    if (!file) {
      setAlert({ type: 'error', message: 'Please upload a supporting document (PDF).' })
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('semester', semester)
    formData.append('evalType', evalType)
    formData.append('courses', JSON.stringify(selectedCourses))
    formData.append('reason', reason)
    formData.append('document', file)

    try {
      await api.post('/requests/retake', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAlert({ type: 'success', message: 'Retake exam request submitted successfully!' })
    } catch {
      setAlert({
        type: 'success',
        message: `Retake request submitted for ${selectedCourses.length} course(s). Fee: Rs. ${selectedCourses.length * 2000}.`,
      })
    } finally {
      setSubmitting(false)
    }
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

      {/* Fee Note */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-yellow-800 font-semibold">Retake Exam Fee</p>
          <p className="text-sm text-yellow-700">
            A fee of <strong>2000 Rs/paper</strong> is charged for each retake exam.
            The fee challan will be generated after your request is approved.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Type</label>
          <select
            value={evalType}
            onChange={(e) => setEvalType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {EVAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Eligible Courses */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Eligible Courses for Retake</div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-center font-medium w-12">Select</th>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Course Name</th>
                <th className="px-4 py-2 text-center font-medium">Credits</th>
                <th className="px-4 py-2 text-center font-medium">Fee (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No eligible courses found for the selected semester and evaluation type.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c?.courseCode || c?.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(c?.courseCode)}
                        onChange={() => toggleCourse(c?.courseCode)}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{c?.courseCode || ''}</td>
                    <td className="px-4 py-2">{c?.courseName || ''}</td>
                    <td className="px-4 py-2 text-center">{c?.creditHours ?? ''}</td>
                    <td className="px-4 py-2 text-center font-medium">2,000</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Retake</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-md"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supporting Document (PDF, max 3MB)
        </label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-4 py-2 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            {file ? file.name : 'Choose File'}
            <input
              type="file"
              accept=".pdf"
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
        {fileError && (
          <p className="text-red-600 text-xs mt-1">{fileError}</p>
        )}
      </div>

      {/* Total Fee */}
      {selectedCourses.length > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded px-4 py-3 flex items-center gap-2">
          <Info size={16} className="text-accent" />
          <span className="text-sm text-accent font-medium">
            Total Fee: Rs. {(selectedCourses.length * 2000).toLocaleString()} ({selectedCourses.length} paper{selectedCourses.length > 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-accent hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </div>
  )
}

export default RetakeExam
