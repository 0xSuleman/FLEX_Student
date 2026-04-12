import { Download, BookMarked } from 'lucide-react'

const SEMESTERS = [
  {
    name: 'Fall 2024', crAttempted: 17, crEarned: 17, sgpa: 3.68, cgpa: 3.68,
    courses: [
      { code: 'CS1001', name: 'Introduction to Computing', cr: 3, grade: 'A-', points: 3.67 },
      { code: 'CS1002', name: 'Programming Fundamentals', cr: 3, grade: 'A', points: 4.0 },
      { code: 'MT1001', name: 'Calculus & Analytical Geometry', cr: 3, grade: 'B+', points: 3.33 },
      { code: 'EE1001', name: 'Applied Physics', cr: 3, grade: 'B', points: 3.0 },
      { code: 'HU1001', name: 'English Composition', cr: 3, grade: 'A', points: 4.0 },
      { code: 'HU1002', name: 'Islamic Studies', cr: 2, grade: 'A-', points: 3.67 },
    ],
  },
  {
    name: 'Spring 2025', crAttempted: 18, crEarned: 18, sgpa: 3.78, cgpa: 3.73,
    courses: [
      { code: 'CS2001', name: 'Object Oriented Programming', cr: 4, grade: 'A', points: 4.0 },
      { code: 'CS2002', name: 'Discrete Structures', cr: 3, grade: 'A-', points: 3.67 },
      { code: 'MT2001', name: 'Linear Algebra', cr: 3, grade: 'B+', points: 3.33 },
      { code: 'CS2003', name: 'Digital Logic Design', cr: 3, grade: 'A-', points: 3.67 },
      { code: 'HU2001', name: 'Pakistan Studies', cr: 2, grade: 'A', points: 4.0 },
      { code: 'CS2004', name: 'Computing Lab', cr: 3, grade: 'A', points: 4.0 },
    ],
  },
  {
    name: 'Fall 2025', crAttempted: 17, crEarned: 17, sgpa: 3.55, cgpa: 3.66,
    courses: [
      { code: 'CS3001', name: 'Data Structures & Algorithms', cr: 4, grade: 'A-', points: 3.67 },
      { code: 'CS3002', name: 'Computer Organization', cr: 3, grade: 'B+', points: 3.33 },
      { code: 'CS3003', name: 'Database Systems', cr: 4, grade: 'A', points: 4.0 },
      { code: 'MT3001', name: 'Probability & Statistics', cr: 3, grade: 'B', points: 3.0 },
      { code: 'HU3001', name: 'Professional Practices', cr: 3, grade: 'A-', points: 3.67 },
    ],
  },
]

const STUDENT = { name: 'Suleman Ahmed', rollNo: '24L-3072', degree: 'BS(SE)', campus: 'Lahore' }

const gradeColor = (g) => {
  if (g.startsWith('A')) return 'bg-cocoa text-bone'
  if (g.startsWith('B')) return 'bg-mustard text-ink'
  if (g.startsWith('C')) return 'bg-tan text-ink'
  if (g.startsWith('D')) return 'bg-burn text-bone'
  if (g === 'F') return 'bg-bad text-bone'
  return 'bg-bad text-bone'
}

export default function Transcript() {
  const handleDownload = () => alert('Transcript PDF download started.')

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / Transcript</div>
          <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">TRANSCRIPT</h1>
          <p className="text-sm text-cocoa mt-2">Complete academic record with grades and points.</p>
        </div>
        <button onClick={handleDownload} className="btn-primary">
          <Download size={14} strokeWidth={3} />
          Download PDF
        </button>
      </div>

      {/* student info */}
      <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.05s' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(STUDENT).map(([k, v]) => (
            <div key={k} className="bg-bone border-2 border-ink rounded p-2.5">
              <div className="text-[9px] font-extrabold text-coffee uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="font-extrabold text-sm text-ink mt-1">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* per semester */}
      {SEMESTERS.map((sem, si) => (
        <div key={sem.name} className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: `${0.1 + si * 0.05}s` }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between flex-wrap gap-2">
            <h3 className="heading-retro text-sm">{sem.name}</h3>
            <div className="flex items-center gap-3 text-[10px] font-extrabold text-ink uppercase tracking-wider">
              <span>Cr Att: <strong>{sem.crAttempted}</strong></span>
              <span>·</span>
              <span>Cr Earned: <strong>{sem.crEarned}</strong></span>
              <span>·</span>
              <span>SGPA: <strong className="text-ink">{sem.sgpa.toFixed(2)}</strong></span>
              <span>·</span>
              <span>CGPA: <strong className="text-ink">{sem.cgpa.toFixed(2)}</strong></span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">CrHrs</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Points</th>
              </tr>
            </thead>
            <tbody>
              {sem.courses.map((c, i) => (
                <tr key={c.code} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                  <td className="px-5 py-3 text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                  <td className="px-5 py-3 text-center"><span className={`tag ${gradeColor(c.grade)}`}>{c.grade}</span></td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-mustard/20 text-ink">{c.points.toFixed(2)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
