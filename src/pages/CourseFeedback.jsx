import { useState, useEffect } from 'react'
import { Star, X, MessageSquare, CheckCircle2 } from 'lucide-react'
import api from '../services/api'

const INITIAL_COURSES = [
  { id: 1, code: 'CS3001', name: 'Software Engineering',     cr: 3, status: 'PENDING' },
  { id: 2, code: 'CS3002', name: 'Database Systems',          cr: 4, status: 'SUBMITTED' },
  { id: 3, code: 'CS3003', name: 'Operating Systems',         cr: 3, status: 'PENDING' },
  { id: 4, code: 'MT3005', name: 'Probability & Statistics',  cr: 3, status: 'PENDING' },
  { id: 5, code: 'HS3006', name: 'Technical Writing',         cr: 2, status: 'SUBMITTED' },
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

export default function CourseFeedback() {
  const [courses, setCourses] = useState(INITIAL_COURSES)
  const [modalCourse, setModalCourse] = useState(null)
  const [ratings, setRatings] = useState({})
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get('/feedback')
        const data = res.data.map(item => ({
          id: item.id,
          code: item.courseCode,
          name: item.courseName,
          cr: item.creditHours,
          status: item.status,
          submittedDate: item.submittedDate,
          rating: item.rating,
          comments: item.comments,
        }))
        setCourses(data)
      } catch {
        setCourses(INITIAL_COURSES)
      } finally {
        setLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  const open = (c) => {
    setModalCourse(c)
    setRatings({})
    setComments('')
    setError('')
  }
  const close = () => setModalCourse(null)

  const setRating = (qi, val) => setRatings(prev => ({ ...prev, [qi]: val }))

  const submit = async () => {
    if (!QUESTIONS.every((_, i) => ratings[i] != null)) {
      return setError('Please rate all questions before submitting.')
    }
    try {
      await api.post('/feedback', {
        courseCode: modalCourse.code,
        ratings,
        comments,
      })
      setCourses(prev => prev.map(c => c.id === modalCourse.id ? { ...c, status: 'SUBMITTED' } : c))
    } catch {
      setCourses(prev => prev.map(c => c.id === modalCourse.id ? { ...c, status: 'SUBMITTED' } : c))
    }
    close()
  }

  const pending = courses.filter(c => c.status === 'PENDING').length

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
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Other / Course Feedback</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">COURSE FEEDBACK</h1>
        <p className="text-sm text-cocoa mt-2">{pending > 0 ? `${pending} feedback${pending > 1 ? 's' : ''} pending. Submit early.` : 'All feedback submitted. Thank you!'}</p>
      </div>

      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.05s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
          <h3 className="heading-retro text-sm">Spring 2026 Courses</h3>
          <MessageSquare size={14} className="text-ink" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">CrHrs</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => {
              const isPending = c.status === 'PENDING'
              return (
                <tr key={c.id} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                  <td className="px-5 py-3 text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`tag ${isPending ? 'bg-cocoa text-bone' : 'bg-moss text-cream'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {isPending ? (
                      <button onClick={() => open(c)} className="bg-coffee text-bone border-2 border-ink rounded px-3 py-1 font-extrabold text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                        Give Feedback
                      </button>
                    ) : (
                      <span className="text-cocoa/40 text-[10px] font-bold uppercase tracking-wider">✓ Done</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalCourse && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4 cascade-in" onClick={close}>
          <div onClick={(e) => e.stopPropagation()} className="bg-cream border-2 border-ink rounded-lg shadow-pixel-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-cocoa text-bone px-5 py-3.5 border-b-2 border-ink flex items-center justify-between sticky top-0">
              <h3 className="font-display text-xs uppercase tracking-wider">Feedback — {modalCourse.code} {modalCourse.name}</h3>
              <button onClick={close} className="text-bone/70 hover:text-burn"><X size={18} strokeWidth={3} /></button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="bg-bad/20 border-2 border-bad rounded-md px-3 py-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">{error}</span>
                </div>
              )}
              {QUESTIONS.map((q, i) => (
                <div key={i} className="border-b border-dashed border-cocoa/30 pb-3">
                  <p className="text-xs font-bold text-ink mb-2">{i + 1}. {q}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => setRating(i, v)} type="button">
                        <Star size={22} strokeWidth={2} className={(ratings[i] || 0) >= v ? 'fill-mustard text-mustard' : 'text-cocoa/30'} />
                      </button>
                    ))}
                    <span className="ml-2 text-[10px] text-cocoa/60 self-center font-bold uppercase">
                      {ratings[i] ? `${ratings[i]} / 5` : 'Not rated'}
                    </span>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1">Additional Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts..."
                  className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:shadow-pixel-sm focus:-translate-x-[1px] focus:-translate-y-[1px] transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={submit} className="btn-primary"><CheckCircle2 size={14} strokeWidth={3} /> Submit</button>
                <button onClick={close} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
