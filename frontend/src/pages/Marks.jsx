import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'

const MOCK_SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

const MOCK_DATA = [
  {
    courseCode: 'CS3001',
    courseName: 'Software Engineering',
    semester: 'Spring 2026',
    evaluations: [
      { evaluationType: 'QUIZ', evaluationName: 'Quiz 1', weightage: 5, obtained: 4.2, total: 5, average: 3.8, stdDev: 0.7, min: 1.5, max: 5.0 },
      { evaluationType: 'QUIZ', evaluationName: 'Quiz 2', weightage: 5, obtained: 3.5, total: 5, average: 3.2, stdDev: 0.9, min: 1.0, max: 5.0 },
      { evaluationType: 'QUIZ', evaluationName: 'Quiz 3', weightage: 5, obtained: 4.8, total: 5, average: 3.5, stdDev: 0.8, min: 2.0, max: 5.0 },
      { evaluationType: 'ASSIGNMENT', evaluationName: 'Assignment 1', weightage: 5, obtained: 8.5, total: 10, average: 7.5, stdDev: 1.2, min: 3.0, max: 10.0 },
      { evaluationType: 'ASSIGNMENT', evaluationName: 'Assignment 2', weightage: 5, obtained: 9.0, total: 10, average: 8.0, stdDev: 1.0, min: 4.0, max: 10.0 },
      { evaluationType: 'SESSIONAL', evaluationName: 'Sessional 1', weightage: 15, obtained: 32, total: 40, average: 28, stdDev: 5.5, min: 12, max: 39 },
      { evaluationType: 'SESSIONAL', evaluationName: 'Sessional 2', weightage: 15, obtained: 35, total: 40, average: 30, stdDev: 4.8, min: 15, max: 40 },
      { evaluationType: 'MIDTERM', evaluationName: 'Midterm', weightage: 20, obtained: 38, total: 50, average: 34, stdDev: 7.2, min: 15, max: 48 },
      { evaluationType: 'FINAL', evaluationName: 'Final Exam', weightage: 30, obtained: null, total: 50, average: null, stdDev: null, min: null, max: null },
    ],
  },
  {
    courseCode: 'CS3002',
    courseName: 'Database Systems',
    semester: 'Spring 2026',
    evaluations: [
      { evaluationType: 'QUIZ', evaluationName: 'Quiz 1', weightage: 5, obtained: 3.8, total: 5, average: 3.2, stdDev: 0.8, min: 1.0, max: 5.0 },
      { evaluationType: 'QUIZ', evaluationName: 'Quiz 2', weightage: 5, obtained: 4.5, total: 5, average: 3.6, stdDev: 0.7, min: 1.5, max: 5.0 },
      { evaluationType: 'ASSIGNMENT', evaluationName: 'Assignment 1', weightage: 10, obtained: 18, total: 20, average: 15, stdDev: 2.5, min: 8, max: 20 },
      { evaluationType: 'SESSIONAL', evaluationName: 'Sessional 1', weightage: 10, obtained: 22, total: 25, average: 19, stdDev: 3.2, min: 10, max: 25 },
      { evaluationType: 'MIDTERM', evaluationName: 'Midterm', weightage: 25, obtained: 42, total: 50, average: 35, stdDev: 6.8, min: 18, max: 49 },
      { evaluationType: 'FINAL', evaluationName: 'Final Exam', weightage: 30, obtained: null, total: 50, average: null, stdDev: null, min: null, max: null },
    ],
  },
]

// Group evaluations by evaluationType into categories for accordion display
function groupEvaluations(evaluations) {
  const typeLabels = {
    QUIZ: 'Quizzes',
    ASSIGNMENT: 'Assignments',
    SESSIONAL: 'Sessionals',
    MIDTERM: 'Midterms',
    FINAL: 'Finals',
  }
  const groups = {}
  for (const ev of evaluations || []) {
    const type = ev?.evaluationType || 'OTHER'
    if (!groups[type]) {
      groups[type] = { name: typeLabels[type] || type, items: [] }
    }
    groups[type].items.push(ev)
  }
  // Return in a fixed order
  const order = ['QUIZ', 'ASSIGNMENT', 'SESSIONAL', 'MIDTERM', 'FINAL']
  const result = []
  for (const t of order) {
    if (groups[t]) result.push(groups[t])
  }
  // Add any remaining types not in the order
  for (const t of Object.keys(groups)) {
    if (!order.includes(t)) result.push(groups[t])
  }
  return result
}

function Marks() {
  const [semester, setSemester] = useState(MOCK_SEMESTERS[0])
  const [data, setData] = useState(null)
  const [activeCourse, setActiveCourse] = useState(0)
  const [expandedSections, setExpandedSections] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarks = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/marks?semester=${encodeURIComponent(semester)}`)
        setData(Array.isArray(res.data) ? res.data : [])
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
        setActiveCourse(0)
        setExpandedSections({})
      }
    }
    fetchMarks()
  }, [semester])

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const courses = data || []
  const course = courses[activeCourse]
  const categories = course ? groupEvaluations(course?.evaluations) : []

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
            onClick={() => {
              setActiveCourse(i)
              setExpandedSections({})
            }}
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
          <div className="card-header">
            {course?.courseCode || ''} - {course?.courseName || ''}
          </div>
          <div className="bg-white">
            {categories.map((cat) => {
              const isExpanded = expandedSections[cat.name] !== false
              return (
                <div key={cat.name} className="border-b border-gray-100 last:border-b-0">
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleSection(cat.name)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-primary">
                      {cat.name}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-500" />
                    )}
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-striped">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600">
                            <th className="px-4 py-2 text-left font-medium">
                              Evaluation
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Weightage
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Obtained
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Total
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Average
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Std Dev
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Min
                            </th>
                            <th className="px-4 py-2 text-center font-medium">
                              Max
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(cat.items || []).map((item, idx) => (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="px-4 py-2">{item?.evaluationName ?? ''}</td>
                              <td className="px-4 py-2 text-center">
                                {item?.weightage != null ? `${item.weightage}%` : '-'}
                              </td>
                              <td className="px-4 py-2 text-center font-semibold">
                                {item?.obtained != null ? item.obtained : '-'}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {item?.total != null ? item.total : '-'}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {item?.average != null
                                  ? Number(item.average).toFixed(1)
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {item?.stdDev != null
                                  ? Number(item.stdDev).toFixed(1)
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {item?.min != null ? item.min : '-'}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {item?.max != null ? item.max : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Marks
