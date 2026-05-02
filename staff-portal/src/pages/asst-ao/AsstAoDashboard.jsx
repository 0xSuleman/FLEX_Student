import { Mail, Users, Inbox } from 'lucide-react'
import { PageHeader, StatCard, SectionCard } from '../../components/PageShell'
import { useNavigate } from 'react-router-dom'

const RECENT = [
  { date: '2026-04-24', list: 'BSE-243A — Spring 2026', recipients: 42, subject: 'Final exam venue announcement' },
  { date: '2026-04-22', list: 'CS3003 — Section B',     recipients: 36, subject: 'Reminder: project demo schedule' },
  { date: '2026-04-20', list: 'BSE-244 — All sections', recipients: 78, subject: 'Drop deadline reminder' },
]

export default function AsstAoDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Asst. Academic Officer" KickerIcon={Mail} title="MAILING DESK" subtitle="Limited view: send mailing-list emails, view (read-only) student records, support the AO." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard Icon={Mail}  label="Mails This Week" value="14" tone="bg-cocoa text-bone" />
        <StatCard Icon={Users} label="Active Lists"    value="6"  tone="bg-coffee text-bone" />
        <StatCard Icon={Inbox} label="Tasks Assigned"  value="2"  tone="bg-mustard text-ink" />
      </div>
      <SectionCard title="Recent Mailings">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Date</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">List</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Recipients</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Subject</th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-mono text-xs text-cocoa">{r.date}</td>
                <td className="px-5 py-3 text-ink">{r.list}</td>
                <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">{r.recipients}</span></td>
                <td className="px-5 py-3 text-ink">{r.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
