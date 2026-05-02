import { useNavigate } from 'react-router-dom'
import { Users, KeyRound, Database, Settings, ShieldCheck, AlertTriangle } from 'lucide-react'
import { PageHeader, StatCard, SectionCard } from '../../components/PageShell'

export default function ItDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="IT Administrator" KickerIcon={ShieldCheck} title="SYSTEM CONTROL" subtitle="User accounts · roles · password resets · audit logs · system settings." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={Users}         label="Active Users"     value="402" tone="bg-cocoa text-bone" />
        <StatCard Icon={KeyRound}      label="Reset Queue"      value="3"   tone="bg-mustard text-ink" />
        <StatCard Icon={AlertTriangle} label="Failed Logins (24h)" value="14" tone="bg-bad text-bone" />
        <StatCard Icon={Database}      label="DB Storage Used"  value="38%" tone="bg-coffee text-bone" />
      </div>
      <SectionCard title="System Health">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Health label="Auth Service" value="OK" tone="bg-moss text-cream" />
          <Health label="Database" value="OK" tone="bg-moss text-cream" />
          <Health label="BLE Module" value="OK" tone="bg-moss text-cream" />
          <Health label="Payment Gateway" value="OK" tone="bg-moss text-cream" />
          <Health label="Email Service" value="OK" tone="bg-moss text-cream" />
          <Health label="Notification Bus" value="OK" tone="bg-moss text-cream" />
        </div>
      </SectionCard>
    </div>
  )
}

function Health({ label, value, tone }) {
  return (
    <div className="bg-bone border-2 border-ink rounded-md p-3">
      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest">{label}</div>
      <div className={`tag mt-2 inline-block ${tone}`}>{value}</div>
    </div>
  )
}
