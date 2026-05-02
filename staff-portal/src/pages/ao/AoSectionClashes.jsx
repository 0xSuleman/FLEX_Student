import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader, SectionCard } from '../../components/PageShell'

const COURSES = ['CS3001 · BSE-243A', 'CS3001 · BSE-243B', 'CS3003 · BSE-243C', 'MT3005 · BSE-243A']

const CLASHES = {
  'CS3001 · BSE-243A': [
    { roll: '24L-3072', name: 'Suleman Ahmed',  conflictsWith: 'MT3005-A · 10:00–11:30 Mon/Wed' },
    { roll: '24L-3081', name: 'Shahzaib Saeed', conflictsWith: 'CS3011-B · 10:00–11:30 Mon/Wed' },
  ],
  'CS3001 · BSE-243B': [
    { roll: '24L-3088', name: 'Bilal Akhtar', conflictsWith: 'CS3012-A · 11:30–13:00 Mon/Wed' },
  ],
  'CS3003 · BSE-243C': [
    { roll: '24L-3091', name: 'Aisha Tariq',  conflictsWith: 'HS3006-B · 14:30–16:00 Tue/Thu' },
    { roll: '24L-3089', name: 'Sara Khan',    conflictsWith: 'CS3011-A · 14:30–16:00 Tue/Thu' },
    { roll: '24L-3087', name: 'Maryam Iqbal', conflictsWith: 'MT3005-B · 14:30–16:00 Tue/Thu' },
  ],
  'MT3005 · BSE-243A': [],
}

export default function AoSectionClashes() {
  const [active, setActive] = useState(COURSES[0])
  const list = CLASHES[active] || []
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Conflicts" KickerIcon={AlertTriangle} title="COURSE SECTION CLASHES" subtitle="Students whose schedule has overlap with another enrolled section." />
      <div className="flex flex-wrap gap-2">
        {COURSES.map(c => (
          <button key={c} onClick={() => setActive(c)} className={`tag border-2 ${active === c ? 'bg-cocoa text-bone border-burn' : 'bg-bone text-ink border-ink'}`}>{c}</button>
        ))}
      </div>
      <SectionCard title={`${active} — ${list.length} clash${list.length !== 1 ? 'es' : ''}`}>
        {list.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs font-bold text-cocoa uppercase tracking-wider">
            No clashes detected for this section.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <Th>Roll</Th><Th>Name</Th><Th>Conflicts With</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{r.roll}</td>
                  <td className="px-5 py-3 text-ink">{r.name}</td>
                  <td className="px-5 py-3 text-ink">{r.conflictsWith}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  )
}

function Th({ children }) { return <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">{children}</th> }
