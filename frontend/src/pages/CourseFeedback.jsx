import { useState, useEffect } from 'react'
import { Star, X } from 'lucide-react'
import api from '../services/api'

const MOCK_COURSES = [
  { id: 1, courseCode: 'CS3001', courseName: 'Software Engineering', creditHours: 3, status: 'PENDING', submittedDate: null, rating: null, comments: null },
  { id: 2, courseCode: 'CS3002', courseName: 'Database Systems', creditHours: 4, status: 'SUBMITTED', submittedDate: '2025-12-20', rating: 4, comments: 'Great course' },
  { id: 3, courseCode: 'CS3003', courseName: 'Operating Systems', creditHours: 3, status: 'PENDING', submittedDate: null, rating: null, comments: null },
  { id: 4, courseCode: 'MT3005', courseName: 'Probability & Statistics', creditHours: 3, status: 'PENDING', submittedDate: null, rating: null, comments: null },
  { id: 5, courseCode: 'HS3006', courseName: 'Technical Writing', creditHours: 2, status: 'SUBMITTED', submittedDate: '2025-12-21', rating: 5, comments: 'Excellent' },
]

const QUESTIONS = [
  'The instructor was well prepared for the class.',
  'The instructor explained concepts clearly.',
  'The instructor was approachable and helpful.',
  'The course material was well organized.',
  'The assignments were relevant to the course content.',
  'The exams/assessments were fair and reasonable.',
  'The instructor encouraged student participation.',
  'Overall, I am satisfied with this course.',
]

function CourseFeedback() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [ratings, setRatings] = useState({})
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get('/feedback')
        setCourses(Array.isArray(res.data) ? res.data : [])
      } catch {
        setCourses(MOCK_COURSES)
      } finally {
        setLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  const openFeedback = (course) => {
    setSelectedCourse(course)
    setRatings({})
    setComments('')
    setShowModal(true)
  }

  const setRating = (questionIndex, value) => {
    setRatings((prev) => ({ ...prev, [questionIndex]: value }))
  }

  const handleSubmitFeedback = async () => {
    const allRated = QUESTIONS.every((_, i) => ratings[i] !== undefined)
    if (!allRated) {
      window.alert('Please rate all questions before submitting.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/feedback', {
        courseCode: selectedCourse?.courseCode,
        ratings,
        comments,
      })
    } catch {
      // fallback
    }

    setCourses((prev) =>
      prev.map((c) =>
        c?.courseCode === selectedCourse?.courseCode ? { ...c, status: 'SUBMITTED' } : c
      )
    )
    setSubmitting(false)
    setShowModal(false)
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
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Course Feedback</div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-center font-medium">S.No</th>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Course Name</th>
                <th className="px-4 py-2 text-center font-medium">Credits</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, idx) => {
                const isPending = (c?.status || '').toUpperCase() !== 'SUBMITTED'
                return (
                  <tr key={c?.courseCode || idx} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-center">{c?.id ?? idx + 1}</td>
                    <td className="px-4 py-2 font-mono text-xs">{c?.courseCode || ''}</td>
                    <td className="px-4 py-2">{c?.courseName || ''}</td>
                    <td className="px-4 py-2 text-center">{c?.creditHours ?? ''}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                          !isPending
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {c?.status || ''}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {isPending ? (
                        <button
                          onClick={() => openFeedback(c)}
                          className="bg-accent hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Give Feedback
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Completed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Modal */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-primary text-white px-6 py-3 flex items-center justify-between rounded-t-lg">
              <h3 className="font-semibold">
                Feedback: {selectedCourse?.courseCode || ''} - {selectedCourse?.courseName || ''}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {QUESTIONS.map((q, i) => (
                <div key={i} className="border-b border-gray-100 pb-3">
                  <p className="text-sm text-gray-700 mb-2">
                    {i + 1}. {q}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setRating(i, val)}
                        className="p-1 transition-colors"
                      >
                        <Star
                          size={24}
                          className={
                            (ratings[i] || 0) >= val
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-gray-400 self-center">
                      {ratings[i] ? `${ratings[i]}/5` : 'Not rated'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts about this course..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                ></textarea>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submitting}
                  className="bg-accent hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseFeedback
