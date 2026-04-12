import { Radar, TrendingUp, TrendingDown } from 'lucide-react'

const PLOS = [
  { plo: 'PLO 1', name: 'Engineering Knowledge', score: 85, course: 'CS3001 — Software Engineering', assessment: 'Midterm, Final' },
  { plo: 'PLO 2', name: 'Problem Analysis', score: 78, course: 'CS3002 — Database Systems', assessment: 'Assignments, Project' },
  { plo: 'PLO 3', name: 'Design & Development', score: 82, course: 'CS3001 — Software Engineering', assessment: 'Project, Lab' },
  { plo: 'PLO 4', name: 'Investigation', score: 70, course: 'CS3003 — Operating Systems', assessment: 'Lab, Assignment' },
  { plo: 'PLO 5', name: 'Modern Tool Usage', score: 88, course: 'CS3002 — Database Systems', assessment: 'Lab, Project' },
  { plo: 'PLO 6', name: 'Engineer & Society', score: 75, course: 'HS3006 — Technical Writing', assessment: 'Report, Presentation' },
  { plo: 'PLO 7', name: 'Environment & Sustainability', score: 65, course: 'HS3006 — Technical Writing', assessment: 'Essay' },
  { plo: 'PLO 8', name: 'Ethics', score: 90, course: 'HS3006 — Technical Writing', assessment: 'Case Study' },
  { plo: 'PLO 9', name: 'Individual & Team Work', score: 72, course: 'CS3001 — Software Engineering', assessment: 'Group Project' },
  { plo: 'PLO 10', name: 'Communication', score: 80, course: 'HS3006 — Technical Writing', assessment: 'Presentation' },
  { plo: 'PLO 11', name: 'Project Management', score: 68, course: 'CS3001 — Software Engineering', assessment: 'Project Plan' },
  { plo: 'PLO 12', name: 'Lifelong Learning', score: 77, course: 'CS3003 — Operating Systems', assessment: 'Research Paper' },
]

export default function PloMarks() {
  const overall = Math.round(PLOS.reduce((s, p) => s + p.score, 0) / PLOS.length)
  const strengths = [...PLOS].filter(p => p.score >= 80).sort((a, b) => b.score - a.score).slice(0, 3)
  const weaknesses = [...PLOS].filter(p => p.score < 75).sort((a, b) => a.score - b.score).slice(0, 3)

  // SVG radar — 12 axes
  const cx = 200, cy = 200, r = 160
  const points = PLOS.map((p, i) => {
    const angle = (Math.PI * 2 * i) / PLOS.length - Math.PI / 2
    const dist = (p.score / 100) * r
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)]
  })
  const polygon = points.map(p => p.join(',')).join(' ')

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Academic / PLO Marks</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">PLO ATTAINMENT</h1>
        <p className="text-sm text-cocoa mt-2">Your performance against the 12 Program Learning Outcomes.</p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="chunky-card p-5 text-center cascade-in" style={{ animationDelay: '0.05s' }}>
          <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-2">Overall</div>
          <div className="font-black text-6xl text-ink leading-none tabular-nums">{overall}<span className="text-2xl">%</span></div>
          <div className="h-2 bg-bone border-2 border-ink rounded-sm mt-4 overflow-hidden">
            <div className="h-full bar-fill" style={{ '--target': `${overall}%`, backgroundColor: '#10B981' }} />
          </div>
        </div>

        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-moss" strokeWidth={3} />
            <h3 className="font-display text-[10px] text-ink uppercase">Strengths</h3>
          </div>
          <div className="space-y-2">
            {strengths.map(p => (
              <div key={p.plo} className="flex items-center justify-between p-2 bg-moss/10 border-2 border-moss/40 rounded">
                <div className="text-xs">
                  <span className="font-extrabold text-ink">{p.plo}</span>
                  <span className="text-cocoa"> · {p.name}</span>
                </div>
                <span className="tag bg-moss text-cream">{p.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} className="text-bad" strokeWidth={3} />
            <h3 className="font-display text-[10px] text-ink uppercase">Improve</h3>
          </div>
          <div className="space-y-2">
            {weaknesses.map(p => (
              <div key={p.plo} className="flex items-center justify-between p-2 bg-bad/10 border-2 border-bad/40 rounded">
                <div className="text-xs">
                  <span className="font-extrabold text-ink">{p.plo}</span>
                  <span className="text-cocoa"> · {p.name}</span>
                </div>
                <span className="tag bg-bad text-bone">{p.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RADAR CHART */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.2s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
          <h3 className="heading-retro text-sm">Radar Chart</h3>
          <Radar size={14} className="text-ink" />
        </div>
        <div className="p-6 flex items-center justify-center bg-bone/40">
          <svg viewBox="0 0 400 400" className="w-full max-w-[480px]">
            {/* concentric grid */}
            {[0.25, 0.5, 0.75, 1].map((scale, i) => (
              <polygon
                key={i}
                points={PLOS.map((_, j) => {
                  const a = (Math.PI * 2 * j) / PLOS.length - Math.PI / 2
                  return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)].join(',')
                }).join(' ')}
                fill="none"
                stroke="#0B1C3D"
                strokeWidth="1"
                opacity={0.2}
              />
            ))}
            {/* axes */}
            {PLOS.map((_, i) => {
              const a = (Math.PI * 2 * i) / PLOS.length - Math.PI / 2
              return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#0B1C3D" strokeWidth="1" opacity={0.2} />
            })}
            {/* data polygon */}
            <polygon points={polygon} fill="#10B981" fillOpacity={0.3} stroke="#10B981" strokeWidth="2.5" />
            {points.map((pt, i) => (
              <circle key={i} cx={pt[0]} cy={pt[1]} r="3" fill="#0B1C3D" stroke="#10B981" strokeWidth="2" />
            ))}
            {/* labels */}
            {PLOS.map((p, i) => {
              const a = (Math.PI * 2 * i) / PLOS.length - Math.PI / 2
              const lx = cx + (r + 18) * Math.cos(a)
              const ly = cy + (r + 18) * Math.sin(a)
              return (
                <text key={i} x={lx} y={ly} fontSize="11" fontWeight="900" fill="#0B1C3D" textAnchor="middle" dominantBaseline="middle">
                  {p.plo.replace('PLO ', 'P')}
                </text>
              )
            })}
          </svg>
        </div>
      </div>

      {/* MAPPING TABLE */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.25s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">PLO Mapping</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">PLO</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Assessment</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Attainment</th>
            </tr>
          </thead>
          <tbody>
            {PLOS.map((p, i) => (
              <tr key={p.plo} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                <td className="px-5 py-3 font-extrabold text-ink">{p.plo}<div className="text-[10px] text-cocoa font-bold">{p.name}</div></td>
                <td className="px-5 py-3 text-cocoa">{p.course}</td>
                <td className="px-5 py-3 text-cocoa text-xs">{p.assessment}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-24 h-2 bg-bone border border-ink rounded-sm overflow-hidden">
                      <div className="h-full" style={{ width: `${p.score}%`, backgroundColor: p.score >= 80 ? '#10B981' : p.score >= 70 ? '#F59E0B' : '#DC2626' }} />
                    </div>
                    <span className="font-extrabold text-xs w-8 text-right" style={{ color: p.score >= 80 ? '#10B981' : p.score >= 70 ? '#F59E0B' : '#DC2626' }}>{p.score}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
