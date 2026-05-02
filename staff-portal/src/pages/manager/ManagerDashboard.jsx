import { useNavigate } from 'react-router-dom'
import { Briefcase, Users, AlertTriangle, ClipboardList } from 'lucide-react'
import { PageHeader, StatCard, SectionCard } from '../../components/PageShell'

export default function ManagerDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Manager (Academics)" KickerIcon={Briefcase} title="OPERATIONS HUB" subtitle="Faculty of Computing · oversight + escalations across all sections." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={Users}         label="Active Students" value="382" tone="bg-cocoa text-bone" />
        <StatCard Icon={Users}         label="Faculty"         value="24"  tone="bg-coffee text-bone" />
        <StatCard Icon={AlertTriangle} label="Escalations"     value="3"   tone="bg-mustard text-ink" />
        <StatCard Icon={ClipboardList} label="Late-Reg Cases"  value="3"   tone="bg-bad text-bone" />
      </div>
      <SectionCard title="Active Escalations">
        <div className="p-5 text-sm text-ink">
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-burn rounded-sm mt-2 shrink-0" /><span>CS3003 enrolment overflow — AO requested seat increase, awaiting HOD approval.</span></li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-burn rounded-sm mt-2 shrink-0" /><span>Mid-1 results delay (CS3003-B) — escalated to HOD by AO 12 days ago.</span></li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-burn rounded-sm mt-2 shrink-0" /><span>Late registration backlog — 3 cases, all past Registrar with Flex Support.</span></li>
          </ul>
        </div>
      </SectionCard>
    </div>
  )
}
