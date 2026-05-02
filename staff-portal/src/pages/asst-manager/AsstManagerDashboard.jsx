import { Mail, Inbox, Users } from 'lucide-react'
import { PageHeader, StatCard, SectionCard } from '../../components/PageShell'

export default function AsstManagerDashboard() {
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Asst. Manager (Academics)" KickerIcon={Mail} title="ASSIST DESK" subtitle="Limited operational tasks: email lists, lookups, queue support." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard Icon={Mail}  label="Mails Today"  value="6"  tone="bg-cocoa text-bone" />
        <StatCard Icon={Users} label="Lookups"      value="14" tone="bg-coffee text-bone" />
        <StatCard Icon={Inbox} label="Tasks Queued" value="2"  tone="bg-mustard text-ink" />
      </div>
      <SectionCard title="My Queue">
        <div className="p-5 text-sm text-ink">
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-burn rounded-sm mt-2 shrink-0" /><span>Send Spring 2026 final exam venue email to all of BSE-244 — assigned by Manager Saadia Rehman.</span></li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-burn rounded-sm mt-2 shrink-0" /><span>Pull Excel of CS3001 students with attendance below 75% — for AO follow-up.</span></li>
          </ul>
        </div>
      </SectionCard>
    </div>
  )
}
