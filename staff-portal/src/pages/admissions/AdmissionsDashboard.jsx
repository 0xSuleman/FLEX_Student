import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, ClipboardList } from 'lucide-react'
import { PageHeader, StatCard, SectionCard, ActionButton } from '../../components/PageShell'

export default function AdmissionsDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Admissions Officer" KickerIcon={UserPlus} title="ADMISSIONS DESK" subtitle="Create new student accounts at admission. Track applications + intake." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={UserPlus}      label="New This Week"   value="14" tone="bg-cocoa text-bone" />
        <StatCard Icon={Users}         label="Total Admitted"  value="380" sub="Fall 2026 incoming" tone="bg-coffee text-bone" />
        <StatCard Icon={ClipboardList} label="Applications"    value="2,148" tone="bg-mustard text-ink" />
        <StatCard Icon={ClipboardList} label="Pending Verify"  value="6" tone="bg-bad text-bone" />
      </div>
      <SectionCard title="Quick Actions">
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => navigate('/admissions/new')} className="chunky-card chunky-card-hover p-4 text-left flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
              <UserPlus size={16} className="text-bone" strokeWidth={2.8} />
            </div>
            <div>
              <div className="font-black text-sm text-ink uppercase tracking-wider">New Admission</div>
              <div className="text-[11px] text-cocoa font-bold mt-0.5">&gt; Create student profile from application</div>
            </div>
          </button>
          <button onClick={() => navigate('/admissions/records')} className="chunky-card chunky-card-hover p-4 text-left flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
              <Users size={16} className="text-bone" strokeWidth={2.8} />
            </div>
            <div>
              <div className="font-black text-sm text-ink uppercase tracking-wider">Admission Records</div>
              <div className="text-[11px] text-cocoa font-bold mt-0.5">&gt; Search · update · re-issue credentials</div>
            </div>
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
