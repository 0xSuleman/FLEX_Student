import { Calendar } from 'lucide-react'
import { PageHeader, SectionCard, InfoBox, ActionButton } from '../../components/PageShell'

const WINDOWS = [
  { name: 'Course Registration', start: '14 Jan 2026', end: '01 Feb 2026', status: 'CLOSED' },
  { name: 'Drop Deadline',       start: '14 Jan 2026', end: '14 Feb 2026', status: 'CLOSED' },
  { name: 'Withdrawal Window',   start: '13 Jan 2026', end: '15 May 2026', status: 'OPEN'   },
  { name: 'Feedback #1',         start: '16 Feb 2026', end: '20 Feb 2026', status: 'CLOSED' },
  { name: 'Feedback #2',         start: '04 May 2026', end: '08 May 2026', status: 'PENDING'},
  { name: 'Retake Request',      start: 'After Mid-1', end: 'After Final', status: 'PENDING'},
]

export default function AoSemester() {
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Semester" KickerIcon={Calendar} title="SEMESTER & WINDOWS" subtitle="Spring 2026 · time-bounded modules controlled by the AO." />
      <SectionCard title="Active Semester · Spring 2026" right={<ActionButton tone="cocoa">Edit Dates</ActionButton>}>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoBox label="Start Date" value="19 Jan 2026" />
          <InfoBox label="End Date" value="08 May 2026" />
          <InfoBox label="Total Weeks" value="16" />
          <InfoBox label="Status" value="In Progress" />
        </div>
      </SectionCard>
      <SectionCard title="Time-Bounded Windows">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Window</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Start</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">End</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {WINDOWS.map((w, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{w.name}</td>
                <td className="px-5 py-3 text-ink">{w.start}</td>
                <td className="px-5 py-3 text-ink">{w.end}</td>
                <td className="px-5 py-3 text-center"><span className={`tag ${w.status === 'OPEN' ? 'bg-moss text-cream' : w.status === 'PENDING' ? 'bg-mustard text-ink' : 'bg-cocoa text-bone'}`}>{w.status}</span></td>
                <td className="px-5 py-3 text-center"><ActionButton tone="bone">Edit</ActionButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
