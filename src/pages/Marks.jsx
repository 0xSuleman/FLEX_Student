import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Award } from 'lucide-react'
import api from '../services/api'

const SEMESTERS = ['Spring 2026', 'Fall 2025']

const DATA = {
  'Spring 2026': [
    {
      code: 'CS3001', name: 'Software Engineering',
      evals: [
        { type: 'QUIZ', name: 'Quiz 1', w: 5, obtained: 4.2, total: 5, avg: 3.8, std: 0.7, min: 1.5, max: 5.0 },
        { type: 'QUIZ', name: 'Quiz 2', w: 5, obtained: 3.5, total: 5, avg: 3.2, std: 0.9, min: 1.0, max: 5.0 },
        { type: 'QUIZ', name: 'Quiz 3', w: 5, obtained: 4.8, total: 5, avg: 3.5, std: 0.8, min: 2.0, max: 5.0 },
        { type: 'ASSIGNMENT', name: 'Assignment 1', w: 5, obtained: 8.5, total: 10, avg: 7.5, std: 1.2, min: 3.0, max: 10.0 },
        { type: 'ASSIGNMENT', name: 'Assignment 2', w: 5, obtained: 9.0, total: 10, avg: 8.0, std: 1.0, min: 4.0, max: 10.0 },
        { type: 'MID1', name: 'CLO 1', w: 5, obtained: 12, total: 15, avg: 10.5, std: 2.3, min: 5, max: 15 },
        { type: 'MID1', name: 'CLO 2', w: 5, obtained: 14, total: 15, avg: 11, std: 2.1, min: 4, max: 15 },
        { type: 'MID1', name: 'CLO 3', w: 5, obtained: 10, total: 15, avg: 9, std: 3.0, min: 3, max: 15 },
        { type: 'MID2', name: 'CLO 1', w: 5, obtained: 13, total: 15, avg: 10, std: 2.5, min: 4, max: 15 },
        { type: 'MID2', name: 'CLO 2', w: 5, obtained: 11, total: 15, avg: 9.5, std: 2.8, min: 3, max: 14 },
        { type: 'MID2', name: 'CLO 3', w: 5, obtained: 14, total: 15, avg: 11.5, std: 1.9, min: 6, max: 15 },
        { type: 'FINAL', name: 'CLO 1', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
        { type: 'FINAL', name: 'CLO 2', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
        { type: 'FINAL', name: 'CLO 3', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
        { type: 'FINAL', name: 'CLO 4', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
      ],
    },
    {
      code: 'CS3002', name: 'Database Systems',
      evals: [
        { type: 'QUIZ', name: 'Quiz 1', w: 5, obtained: 3.8, total: 5, avg: 3.2, std: 0.8, min: 1.0, max: 5.0 },
        { type: 'QUIZ', name: 'Quiz 2', w: 5, obtained: 4.5, total: 5, avg: 3.6, std: 0.7, min: 1.5, max: 5.0 },
        { type: 'ASSIGNMENT', name: 'Assignment 1', w: 10, obtained: 18, total: 20, avg: 15, std: 2.5, min: 8, max: 20 },
        { type: 'MID1', name: 'CLO 1', w: 5, obtained: 13, total: 15, avg: 10, std: 2.4, min: 5, max: 15 },
        { type: 'MID1', name: 'CLO 2', w: 5, obtained: 12, total: 15, avg: 9.5, std: 2.6, min: 4, max: 14 },
        { type: 'MID1', name: 'CLO 3', w: 5, obtained: 11, total: 15, avg: 10, std: 2.2, min: 5, max: 15 },
        { type: 'MID2', name: 'CLO 1', w: 5, obtained: 14, total: 15, avg: 11, std: 2.0, min: 6, max: 15 },
        { type: 'MID2', name: 'CLO 2', w: 5, obtained: 12, total: 15, avg: 10.5, std: 2.3, min: 5, max: 15 },
        { type: 'MID2', name: 'CLO 3', w: 5, obtained: 13, total: 15, avg: 11, std: 2.1, min: 5, max: 14 },
        { type: 'FINAL', name: 'CLO 1', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
        { type: 'FINAL', name: 'CLO 2', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
        { type: 'FINAL', name: 'CLO 3', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
        { type: 'FINAL', name: 'CLO 4', w: 10, obtained: null, total: 25, avg: null, std: null, min: null, max: null },
      ],
    },
  ],
  'Fall 2025': [],
}

const TYPE_LABELS = { QUIZ: 'Quizzes', ASSIGNMENT: 'Assignments', MID1: 'Mid 1', MID2: 'Mid 2', FINAL: 'Final' }
const TYPE_ORDER = ['QUIZ', 'ASSIGNMENT', 'MID1', 'MID2', 'FINAL']

function groupEvals(evals) {
  const groups = {}
  evals.forEach(e => {
    if (!groups[e.type]) groups[e.type] = []
    groups[e.type].push(e)
  })
  return TYPE_ORDER.filter(t => groups[t]).map(t => ({ type: t, label: TYPE_LABELS[t], items: groups[t] }))
}

function computeGrandTotal(evals) {
  const allComplete = evals.every(e => e.obtained !== null)
  const totalW = evals.reduce((s, e) => s + e.w, 0)
  const withObtained = evals.filter(e => e.obtained !== null)
  const totalObt = withObtained.reduce((s, e) => s + e.obtained, 0)
  const totalMax = withObtained.reduce((s, e) => s + e.total, 0)
  const totalAvg = withObtained.reduce((s, e) => s + (e.avg || 0), 0)
  const totalMin = withObtained.reduce((s, e) => s + (e.min || 0), 0)
  const totalMax2 = withObtained.reduce((s, e) => s + (e.max || 0), 0)
  return {
    allComplete,
    w: totalW,
    obtained: allComplete ? totalObt : null,
    total: allComplete ? totalMax : null,
    avg: allComplete ? totalAvg : null,
    min: allComplete ? totalMin : null,
    max: allComplete ? totalMax2 : null,
  }
}

function formatVal(v) {
  return v === null || v === undefined ? '\u2014' : v
}

export default function Marks() {
  const [semester, setSemester] = useState('Spring 2026')
  const [activeTab, setActiveTab] = useState(0)
  const [collapsed, setCollapsed] = useState({})
  const [apiData, setApiData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarks = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/marks?semester=${encodeURIComponent(semester)}`)
        const arr = Array.isArray(res.data) ? res.data : []
        setApiData(arr.map(c => ({
          code: c.courseCode,
          name: c.courseName,
          evals: (c.evaluations || []).map(e => ({
            type: e.evaluationType,
            name: e.evaluationName,
            w: e.weightage,
            obtained: e.obtained,
            total: e.total,
            avg: e.average,
            std: e.stdDev,
            min: e.min,
            max: e.max,
          })),
        })))
      } catch {
        setApiData(null)
      } finally {
        setLoading(false)
        setActiveTab(0)
      }
    }
    fetchMarks()
  }, [semester])

  const courses = apiData || (DATA[semester] || [])
  const course = courses[activeTab]
  const groups = course ? groupEvals(course.evals) : []
  const grandTotal = course ? computeGrandTotal(course.evals) : null

  const toggle = (type) => setCollapsed(prev => ({ ...prev, [type]: !prev[type] }))

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / Marks</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">MARKS</h1>
        <p className="text-sm text-cocoa mt-2">Per-evaluation scores with class averages.</p>
      </div>

      <div className="flex items-center gap-3 cascade-in" style={{ animationDelay: '0.05s' }}>
        <span className="text-xs font-extrabold text-coffee uppercase tracking-widest">Semester:</span>
        <select
          value={semester}
          onChange={(e) => { setSemester(e.target.value); setActiveTab(0) }}
          className="styled-select"
        >
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="chunky-card p-12 text-center cascade-in">
          <Award size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No marks for {semester}.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap cascade-in" style={{ animationDelay: '0.1s' }}>
            {courses.map((c, i) => (
              <button
                key={c.code}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 border-2 border-ink rounded-md font-extrabold text-xs uppercase tracking-wider transition-all ${
                  activeTab === i ? 'bg-cocoa text-bone shadow-pixel-sm' : 'bg-cream text-cocoa hover:bg-tan/50'
                }`}
              >
                {c.code} · {c.name}
              </button>
            ))}
          </div>

          {course && (
            <div className="space-y-3">
              {groups.map((g, gi) => {
                const isOpen = !collapsed[g.type]
                const groupWeightage = g.items.reduce((s, e) => s + e.w, 0)
                return (
                  <div key={g.type} className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: `${0.15 + gi * 0.05}s` }}>
                    <button
                      onClick={() => toggle(g.type)}
                      className="w-full px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between hover:bg-tan/80 transition-colors"
                    >
                      <h3 className="heading-retro text-sm">{g.label} ({g.items.length})</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-extrabold text-cocoa uppercase tracking-wider">Wt: {groupWeightage}%</span>
                        {isOpen ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                      </div>
                    </button>
                    {isOpen && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-bone border-b-2 border-ink text-coffee">
                            <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Eval</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Wt</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Score</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Avg</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Std</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Min</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.items.map((e, i) => (
                            <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                              <td className="px-4 py-2.5 font-extrabold text-ink">{e.name}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold text-ink bg-tan/40">{e.w}%</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-coffee text-bone">{formatVal(e.obtained)} / {e.total}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-mustard/20 text-ink">{formatVal(e.avg)}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-tan/50 text-ink">{formatVal(e.std)}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-bad/15 text-ink">{formatVal(e.min)}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-moss/15 text-ink">{formatVal(e.max)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}

              {/* GRAND TOTAL — accordion like others, empty until all evals complete */}
              {grandTotal && (
                <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: `${0.15 + groups.length * 0.05}s` }}>
                  <button
                    onClick={() => toggle('GRAND')}
                    className="w-full px-5 py-3.5 border-b-2 border-ink bg-cocoa flex items-center justify-between hover:bg-cocoa/80 transition-colors"
                  >
                    <h3 className="heading-retro text-sm text-bone">Grand Total</h3>
                    {collapsed['GRAND'] ? <ChevronDown size={18} strokeWidth={3} className="text-bone" /> : <ChevronUp size={18} strokeWidth={3} className="text-bone" />}
                  </button>
                  {!collapsed['GRAND'] && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bone border-b-2 border-ink text-coffee">
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Summary</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Wt</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Score</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Avg</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Std</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Min</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-cream">
                          <td className="px-4 py-3 font-extrabold text-ink">All Evaluations</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold text-ink bg-tan/40 number-pop">{grandTotal.w}%</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-coffee text-bone number-pop">{formatVal(grandTotal.obtained)} / {formatVal(grandTotal.total)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-mustard/20 text-ink">{formatVal(grandTotal.avg)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-tan/50 text-ink">{'\u2014'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-bad/15 text-ink">{formatVal(grandTotal.min)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 border-2 border-ink rounded text-[10px] font-extrabold bg-moss/15 text-ink">{formatVal(grandTotal.max)}</span>
                          </td>
                        </tr>
                        {!grandTotal.allComplete && (
                          <tr className="bg-bone/50">
                            <td colSpan={7} className="px-4 py-3 text-center text-xs font-bold text-cocoa/60 uppercase tracking-wider">
                              Results pending — all evaluations must be completed first
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
