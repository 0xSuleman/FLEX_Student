import { useState } from 'react'
import { Target, AlertTriangle, Info } from 'lucide-react'

const SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']

const DATA = {
  'Spring 2026': [
    {
      code: 'CS3001', name: 'Software Engineering', percentage: 92,
      records: [
        { no: 1, date: '2026-01-27', hrs: 1.5, presence: 'P' },
        { no: 2, date: '2026-01-29', hrs: 1.5, presence: 'P' },
        { no: 3, date: '2026-01-31', hrs: 1.5, presence: 'A' },
        { no: 4, date: '2026-02-03', hrs: 1.5, presence: 'P' },
        { no: 5, date: '2026-02-05', hrs: 1.5, presence: 'P' },
        { no: 6, date: '2026-02-07', hrs: 1.5, presence: 'LT' },
        { no: 7, date: '2026-02-10', hrs: 1.5, presence: 'P' },
        { no: 8, date: '2026-02-12', hrs: 1.5, presence: 'P' },
        { no: 9, date: '2026-02-14', hrs: 1.5, presence: 'P' },
        { no: 10, date: '2026-02-17', hrs: 1.5, presence: 'P' },
      ],
    },
    {
      code: 'CS3002', name: 'Database Systems', percentage: 88,
      records: [
        { no: 1, date: '2026-01-28', hrs: 1.5, presence: 'P' },
        { no: 2, date: '2026-01-30', hrs: 1.5, presence: 'P' },
        { no: 3, date: '2026-02-01', hrs: 1.5, presence: 'P' },
        { no: 4, date: '2026-02-04', hrs: 1.5, presence: 'A' },
        { no: 5, date: '2026-02-06', hrs: 1.5, presence: 'P' },
        { no: 6, date: '2026-02-08', hrs: 1.5, presence: 'P' },
        { no: 7, date: '2026-02-11', hrs: 1.5, presence: 'P' },
        { no: 8, date: '2026-02-13', hrs: 1.5, presence: 'P' },
      ],
    },
    {
      code: 'CS3003', name: 'Operating Systems', percentage: 70,
      records: [
        { no: 1, date: '2026-01-27', hrs: 1.5, presence: 'P' },
        { no: 2, date: '2026-01-29', hrs: 1.5, presence: 'A' },
        { no: 3, date: '2026-01-31', hrs: 1.5, presence: 'A' },
        { no: 4, date: '2026-02-03', hrs: 1.5, presence: 'P' },
        { no: 5, date: '2026-02-05', hrs: 1.5, presence: 'P' },
        { no: 6, date: '2026-02-07', hrs: 1.5, presence: 'A' },
        { no: 7, date: '2026-02-10', hrs: 1.5, presence: 'P' },
      ],
    },
    {
      code: 'MT3005', name: 'Probability & Statistics', percentage: 95,
      records: [
        { no: 1, date: '2026-01-27', hrs: 1.5, presence: 'P' },
        { no: 2, date: '2026-01-29', hrs: 1.5, presence: 'P' },
        { no: 3, date: '2026-01-31', hrs: 1.5, presence: 'P' },
        { no: 4, date: '2026-02-03', hrs: 1.5, presence: 'P' },
        { no: 5, date: '2026-02-05', hrs: 1.5, presence: 'P' },
        { no: 6, date: '2026-02-07', hrs: 1.5, presence: 'P' },
        { no: 7, date: '2026-02-10', hrs: 1.5, presence: 'LT' },
      ],
    },
  ],
  'Fall 2025': [],
  'Spring 2025': [],
}

export default function Attendance() {
  const [semester, setSemester] = useState('Spring 2026')
  const [activeTab, setActiveTab] = useState(0)
  const courses = DATA[semester] || []
  const course = courses[activeTab]

  return (
    <div className="space-y-5 max-w-[1500px]">
      {/* HEADER */}
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / Attendance</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">ATTENDANCE</h1>
        <p className="text-sm text-cocoa mt-2">Track your lecture presence per course. Stay above 80% to remain eligible.</p>
      </div>

      {/* SEMESTER FILTER */}
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

      {courses.length === 0 ? (
        <div className="chunky-card p-12 text-center cascade-in" style={{ animationDelay: '0.1s' }}>
          <Target size={40} className="text-tan mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-cocoa font-bold">No attendance records for {semester}.</p>
        </div>
      ) : (
        <>
          {/* COURSE TABS */}
          <div className="flex gap-2 flex-wrap cascade-in" style={{ animationDelay: '0.1s' }}>
            {courses.map((c, i) => (
              <button
                key={c.code}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 border-2 border-ink rounded-md font-extrabold text-xs uppercase tracking-wider transition-all ${
                  activeTab === i
                    ? 'bg-cocoa text-bone shadow-pixel-sm'
                    : 'bg-cream text-cocoa hover:bg-tan/50'
                }`}
              >
                {c.code} <span className="opacity-60">·</span> {c.name}
              </button>
            ))}
          </div>

          {/* COURSE DETAIL */}
          {course && (
            <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.15s' }}>
              <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
                <h3 className="heading-retro text-sm">{course.code} — {course.name}</h3>
                <span className={`tag text-sm ${course.percentage >= 80 ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
                  {course.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="p-5 border-b-2 border-ink">
                <div className="flex justify-between text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-2">
                  <span>Attendance</span>
                  <span>{course.percentage}% / 100%</span>
                </div>
                <div className="h-4 bg-bone border-2 border-ink rounded-sm overflow-hidden">
                  <div
                    className="h-full bar-fill"
                    style={{
                      '--target': `${course.percentage}%`,
                      backgroundColor: course.percentage >= 80 ? '#10B981' : '#DC2626',
                    }}
                  />
                </div>
                {course.percentage < 80 && (
                  <div className="mt-3 flex items-start gap-2 bg-bad/15 border-2 border-bad rounded-md px-3 py-2">
                    <AlertTriangle size={14} className="text-bad shrink-0 mt-0.5" strokeWidth={3} />
                    <p className="text-xs text-ink font-bold">
                      Warning: attendance below 80%. You may be barred from the final exam.
                    </p>
                  </div>
                )}
              </div>

              {/* Lecture table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone border-b-2 border-ink text-coffee">
                    <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">#</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Date</th>
                    <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Duration</th>
                    <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Presence</th>
                  </tr>
                </thead>
                <tbody>
                  {course.records.map((r, i) => (
                    <tr key={r.no} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                      <td className="px-5 py-2.5 font-extrabold text-ink">{r.no}</td>
                      <td className="px-5 py-2.5 text-cocoa font-mono text-xs">{r.date}</td>
                      <td className="px-5 py-2.5 text-center text-cocoa">{r.hrs} hr</td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`tag ${
                          r.presence === 'P' ? 'bg-cocoa text-bone' :
                          r.presence === 'A' ? 'bg-bad text-bone' :
                          'bg-mustard text-ink'
                        }`}>
                          {r.presence === 'P' ? 'PRESENT' : r.presence === 'A' ? 'ABSENT' : 'LATE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Note */}
              <div className="px-5 py-3 border-t-2 border-ink bg-bone/50 flex items-center gap-2 text-xs text-cocoa font-bold">
                <Info size={12} className="text-rust" />
                Attendance is updated with a 24-hour delay. Contact your instructor for any discrepancies.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
