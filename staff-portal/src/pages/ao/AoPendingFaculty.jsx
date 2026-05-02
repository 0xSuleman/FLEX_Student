import { Inbox, Send } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const ROWS = [
  { faculty: 'Hammad Afzal',  course: 'CS3003-B', missing: 'Mid-1 marks',          days: 12, escalated: true },
  { faculty: 'Sara Iftikhar', course: 'CS2002-A', missing: 'April attendance',     days: 4,  escalated: false },
  { faculty: 'Ali Hasan',     course: 'MT3005-A', missing: 'Quiz 3 marks',         days: 2,  escalated: false },
  { faculty: 'Imran Tariq',   course: 'CS3009-A', missing: 'Project rubric',       days: 6,  escalated: false },
]

export default function AoPendingFaculty() {
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Watchlist" KickerIcon={Inbox}
        title="PENDING FACULTY INPUTS"
        subtitle="Faculty members behind on attendance / marks / evaluation entry. Send a reminder; escalate to HOD if persistent."
      />
      <SectionCard title="Active Reminders Queue">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <Th>Faculty</Th><Th>Course / Section</Th><Th>Missing</Th><Th center>Overdue</Th><Th center>Escalation</Th><Th center>Action</Th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{r.faculty}</td>
                <td className="px-5 py-3 text-ink">{r.course}</td>
                <td className="px-5 py-3 text-ink">{r.missing}</td>
                <td className="px-5 py-3 text-center"><span className={`tag ${r.days > 7 ? 'bg-bad text-bone' : 'bg-mustard text-ink'}`}>{r.days}d</span></td>
                <td className="px-5 py-3 text-center">{r.escalated ? <span className="tag bg-bad text-bone">HOD NOTIFIED</span> : <span className="tag bg-bone text-cocoa">—</span>}</td>
                <td className="px-5 py-3 text-center">
                  <div className="inline-flex gap-1">
                    <ActionButton Icon={Send}>Remind</ActionButton>
                    {!r.escalated && <ActionButton tone="bad">Escalate</ActionButton>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}
