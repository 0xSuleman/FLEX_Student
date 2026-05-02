import { useState, useEffect } from 'react'
import { Download, X, Info, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const SEMESTERS = [
  {
    name: 'Fall 2024', crAttempted: 17, crEarned: 17, sgpa: 3.68, cgpa: 3.68,
    courses: [
      { code: 'CS1001', name: 'Introduction to Computing', cr: 3, grade: 'A-', points: 3.67, grading: 'absolute' },
      { code: 'CS1002', name: 'Programming Fundamentals', cr: 3, grade: 'A', points: 4.0, grading: 'relative', mca: 72 },
      { code: 'MT1001', name: 'Calculus & Analytical Geometry', cr: 3, grade: 'B+', points: 3.33, grading: 'relative', mca: 58 },
      { code: 'EE1001', name: 'Applied Physics', cr: 3, grade: 'B', points: 3.0, grading: 'absolute' },
      { code: 'HU1001', name: 'English Composition', cr: 3, grade: 'A', points: 4.0, grading: 'absolute' },
      { code: 'HU1002', name: 'Islamic Studies', cr: 2, grade: 'A-', points: 3.67, grading: 'absolute' },
    ],
  },
  {
    name: 'Spring 2025', crAttempted: 18, crEarned: 18, sgpa: 3.78, cgpa: 3.73,
    courses: [
      { code: 'CS2001', name: 'OOP', cr: 4, grade: 'A', points: 4.0, grading: 'relative', mca: 67 },
      { code: 'CS2002', name: 'Discrete Structures', cr: 3, grade: 'A-', points: 3.67, grading: 'relative', mca: 61 },
      { code: 'MT2001', name: 'Linear Algebra', cr: 3, grade: 'B+', points: 3.33, grading: 'relative', mca: 55 },
      { code: 'CS2003', name: 'Digital Logic Design', cr: 3, grade: 'A-', points: 3.67, grading: 'absolute' },
      { code: 'HU2001', name: 'Pakistan Studies', cr: 2, grade: 'A', points: 4.0, grading: 'absolute' },
      { code: 'CS2004', name: 'Computing Lab', cr: 3, grade: 'A', points: 4.0, grading: 'absolute' },
    ],
  },
  {
    name: 'Fall 2025', crAttempted: 17, crEarned: 17, sgpa: 3.55, cgpa: 3.66,
    courses: [
      { code: 'CS3001', name: 'Data Structures & Algorithms', cr: 4, grade: 'A-', points: 3.67, grading: 'relative', mca: 63 },
      { code: 'CS3002', name: 'Computer Organization', cr: 3, grade: 'B+', points: 3.33, grading: 'relative', mca: 59 },
      { code: 'CS3003', name: 'Database Systems', cr: 4, grade: 'A', points: 4.0, grading: 'absolute' },
      { code: 'MT3001', name: 'Probability & Statistics', cr: 3, grade: 'B', points: 3.0, grading: 'relative', mca: 52 },
      { code: 'HU3001', name: 'Professional Practices', cr: 3, grade: 'A-', points: 3.67, grading: 'absolute' },
    ],
  },
  {
    name: 'Spring 2026', crAttempted: 16, crEarned: 0, sgpa: 0, cgpa: 3.66,
    courses: [
      { code: 'CS4001', name: 'Artificial Intelligence', cr: 3, grade: 'I', points: 0 },
      { code: 'CS4002', name: 'Compiler Construction', cr: 3, grade: 'I', points: 0 },
      { code: 'CS4003', name: 'Computer Architecture', cr: 4, grade: 'I', points: 0 },
      { code: 'CS4004', name: 'Theory of Automata', cr: 3, grade: 'I', points: 0 },
      { code: 'CS4005', name: 'Information Security', cr: 3, grade: 'I', points: 0 },
    ],
  },
]

const STUDENT = { name: 'Suleman Ahmed', rollNo: '24L-3072', degree: 'BS(SE)', campus: 'Lahore' }

const ABSOLUTE = [
  { grade: 'A+', range: '≥ 90' },  { grade: 'A', range: '86–89' },
  { grade: 'A-', range: '82–85' }, { grade: 'B+', range: '78–81' },
  { grade: 'B', range: '74–77' },  { grade: 'B-', range: '70–73' },
  { grade: 'C+', range: '66–69' }, { grade: 'C', range: '62–65' },
  { grade: 'C-', range: '58–61' }, { grade: 'D+', range: '54–57' },
  { grade: 'D', range: '50–53' },  { grade: 'F', range: '≤ 49' },
]

const GRADE_NAMES = ['F','D','D+','C-','C','C+','B-','B','B+','A-','A','A+']
const B_INDEX = 7

function getMcaRow(mca) {
  const m = Math.round(mca)
  let bBase
  if (m >= 65) bBase = m - 2
  else if (m >= 50) bBase = m + 3
  else bBase = m + 8

  return GRADE_NAMES.map((g, i) => {
    const offset = (i - B_INDEX) * 5
    const val = bBase + offset
    if (i === 0) return { grade: g, label: `≤${Math.max(29, bBase - 31)}` }
    if (i === 11) return { grade: g, label: `≥${val}` }
    if (val < 30) return { grade: g, label: '—' }
    return { grade: g, label: `${val}` }
  })
}

const gradeColor = (g) => {
  if (!g) return 'bg-bone/40 text-cocoa/40'
  if (g === 'I') return 'bg-coffee/50 text-bone'
  if (g.startsWith('A')) return 'bg-cocoa text-bone'
  if (g.startsWith('B')) return 'bg-mustard text-ink'
  if (g.startsWith('C')) return 'bg-tan text-ink'
  if (g.startsWith('D')) return 'bg-burn text-bone'
  return 'bg-bad text-bone'
}

export default function Transcript() {
  const [modal, setModal] = useState(null)
  const { user } = useAuth()
  const [apiData, setApiData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const semesterOrder = (name) => {
      const [term, year] = name.split(' ')
      return parseInt(year) * 10 + (term === 'Spring' ? 0 : term === 'Summer' ? 1 : 2)
    }

    const fetchTranscript = async () => {
      try {
        const res = await api.get('/transcript')
        const d = res.data
        const transcriptData = {
          student: {
            name: d.studentName,
            rollNo: d.rollNo,
            degree: d.degree,
            campus: d.campus,
          },
          semesters: (d.semesters || []).map(s => ({
            name: s.semester,
            crAttempted: s.crAttempted,
            crEarned: s.crEarned,
            sgpa: s.sgpa,
            cgpa: s.cgpa,
            courses: (s.courses || []).map(c => ({
              code: c.courseCode,
              name: c.courseName,
              cr: c.creditHours,
              grade: c.grade,
              points: c.points,
              grading: c.gradingScheme ? c.gradingScheme.toLowerCase() : 'absolute',
              mca: c.mca,
            })),
          })),
        }

        // Sort completed semesters chronologically first
        transcriptData.semesters.sort((a, b) => semesterOrder(a.name) - semesterOrder(b.name))

        // Also fetch current semester enrollments for in-progress display
        try {
          const enrollRes = await api.get('/enrollments?semester=Spring+2026')
          const enrollments = Array.isArray(enrollRes.data) ? enrollRes.data : []
          if (enrollments.length > 0) {
            const sorted = transcriptData.semesters
            const lastCgpa = sorted.length > 0 ? sorted[sorted.length - 1].cgpa : 0
            const currentSem = {
              name: 'Spring 2026',
              crAttempted: enrollments.reduce((s, e) => s + (e.creditHours || 0), 0),
              crEarned: 0,
              sgpa: 0,
              cgpa: lastCgpa,
              courses: enrollments.map(e => ({
                code: e.courseCode,
                name: e.courseName,
                cr: e.creditHours,
                grade: 'I',
                points: 0,
                grading: e.gradingScheme ? e.gradingScheme.toLowerCase() : 'absolute',
                mca: e.mca,
              })),
            }
            transcriptData.semesters = [...sorted, currentSem]
          }
        } catch { /* ignore */ }

        setApiData(transcriptData)
      } catch {
        setApiData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchTranscript()
  }, [user])

  const student = apiData?.student || STUDENT
  const semesters = apiData?.semesters || SEMESTERS

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / Transcript</div>
          <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">TRANSCRIPT</h1>
          <p className="text-sm text-cocoa mt-2">Click any course row to view grading scheme details.</p>
        </div>
        <button onClick={() => alert('Transcript PDF download started.')} className="btn-primary">
          <Download size={14} strokeWidth={3} /> Download PDF
        </button>
      </div>

      <div className="flex items-center gap-5 text-xs font-bold text-coffee uppercase tracking-wider cascade-in" style={{ animationDelay: '0.03s' }}>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-coffee/15 border-2 border-ink rounded-sm" /> Absolute</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-burn/15 border-2 border-ink rounded-sm" /> Relative</span>
      </div>

      <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.05s' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(student).map(([k, v]) => (
            <div key={k} className="bg-bone border-2 border-ink rounded p-2.5">
              <div className="text-[9px] font-extrabold text-coffee uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="font-extrabold text-sm text-ink mt-1">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {semesters.map((sem, si) => (
        <div key={sem.name} className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: `${0.1 + si * 0.05}s` }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between flex-wrap gap-2">
            <h3 className="heading-retro text-sm">{sem.name}</h3>
            <div className="flex items-center gap-3 text-[10px] font-extrabold text-ink uppercase tracking-wider">
              <span>Cr: {sem.crAttempted}/{sem.crEarned}</span>
              <span>·</span>
              <span>SGPA: {sem.sgpa.toFixed(2)}</span>
              <span>·</span>
              <span>CGPA: {sem.cgpa.toFixed(2)}</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Cr</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Pts</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Scheme</th>
              </tr>
            </thead>
            <tbody>
              {sem.courses.map((c, i) => {
                const isRel = c.grading === 'relative'
                return (
                  <tr key={c.code} onClick={() => setModal(c)}
                    className={`border-b border-dashed border-cocoa/30 cursor-pointer transition-all hover:shadow-soft-warm ${
                      isRel ? 'bg-burn/8 hover:bg-burn/15' : 'bg-coffee/8 hover:bg-coffee/15'
                    }`}>
                    <td className="px-4 py-2.5 font-extrabold text-ink">
                      {c.code}
                      <Info size={9} className={`inline ml-1 -mt-0.5 ${isRel ? 'text-burnL' : 'text-coffee'}`} strokeWidth={3} />
                    </td>
                    <td className="px-4 py-2.5 text-ink text-xs">{c.name}</td>
                    <td className="px-4 py-2.5 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                    <td className="px-4 py-2.5 text-center"><span className={`tag ${gradeColor(c.grade)}`}>{c.grade}</span></td>
                    <td className="px-4 py-2.5 text-center"><span className="tag bg-mustard/20 text-ink">{c.points.toFixed(2)}</span></td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`tag text-[8px] ${isRel ? 'bg-burn/20 text-ink' : 'bg-coffee text-bone'}`}>
                        {isRel ? 'RELATIVE' : 'ABSOLUTE'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-cream border-2 border-ink rounded-lg shadow-pixel-lg w-full max-w-xl overflow-hidden cascade-in" style={{ overflowY: 'hidden' }}>
            <div className="bg-cocoa text-bone px-4 py-3 border-b-2 border-ink flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`tag ${gradeColor(modal.grade)}`}>{modal.grade}</span>
                <div>
                  <div className="font-extrabold text-xs">{modal.code} — {modal.name}</div>
                  <div className="text-[10px] text-bone/70">Cr: {modal.cr} · Pts: {modal.points.toFixed(2)} · {modal.grading === 'relative' ? `MCA: ${modal.mca}` : 'Fixed %'}</div>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-bone/70 hover:text-burn"><X size={16} strokeWidth={3} /></button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-[9px] font-extrabold text-coffee uppercase tracking-widest content-up" style={{ animationDelay: '0.1s' }}>
                {modal.grading === 'relative' ? `Relative Grading · MCA = ${modal.mca}` : 'Absolute Grading · Fixed Thresholds'}
              </div>

              {/* HORIZONTAL GRADE STRIP */}
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-0.5 min-w-[600px]">
                  {(modal.grading === 'relative' ? [...getMcaRow(modal.mca)].reverse() : ABSOLUTE).map((row, i) => {
                    const isCurrent = row.grade === modal.grade
                    return (
                      <div
                        key={row.grade}
                        className={`flex-1 text-center p-1.5 border-2 rounded cascade-in ${
                          isCurrent
                            ? 'border-burn bg-burn/15 scale-105 z-10 shadow-pixel-sm'
                            : 'border-ink/30 bg-bone'
                        }`}
                        style={{ animationDelay: `${0.15 + i * 0.03}s` }}
                      >
                        <div className={`tag text-[8px] mx-auto mb-1 ${gradeColor(row.grade)}`}>{row.grade}</div>
                        <div className="text-[9px] font-extrabold text-ink">{row.label || row.range}</div>
                        {isCurrent && <div className="text-[7px] font-black text-burn mt-0.5 uppercase number-pop">YOU</div>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* teacher note */}
              <div className="flex items-start gap-2 bg-mustard/10 border border-mustard/40 rounded px-3 py-2 content-up" style={{ animationDelay: '0.25s' }}>
                <AlertTriangle size={12} className="text-mustard shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-[10px] text-ink font-medium">Teacher has final authority. Boundaries may be scaled at instructor's discretion.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
