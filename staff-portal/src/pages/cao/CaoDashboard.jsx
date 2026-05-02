import { useNavigate } from 'react-router-dom'
import { Send, Shield, Building2 } from 'lucide-react'
import { PageHeader, StatCard, SectionCard } from '../../components/PageShell'

export default function CaoDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Central Academic Office" KickerIcon={Building2} title="CENTRAL OPERATIONS" subtitle="University-wide profile distribution + DC handling. Top-of-pipeline for new admissions." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={Send}     label="Profiles to Distribute" value="220" sub="Fall 2026" tone="bg-cocoa text-bone" />
        <StatCard Icon={Building2} label="Campuses"               value="5"  tone="bg-coffee text-bone" />
        <StatCard Icon={Shield}   label="Active DC Cases"        value="3"  tone="bg-bad text-bone" />
        <StatCard Icon={Shield}   label="DC This Semester"       value="14" tone="bg-mustard text-ink" />
      </div>
      <SectionCard title="Distribution Pipeline">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <PipelineCard campus="Lahore"     count={86} action={() => navigate('/cao/profiles')} />
          <PipelineCard campus="Islamabad"  count={64} action={() => navigate('/cao/profiles')} />
          <PipelineCard campus="Karachi"    count={42} action={() => navigate('/cao/profiles')} />
          <PipelineCard campus="Peshawar"   count={18} action={() => navigate('/cao/profiles')} />
          <PipelineCard campus="Faisalabad" count={10} action={() => navigate('/cao/profiles')} />
        </div>
      </SectionCard>
    </div>
  )
}

function PipelineCard({ campus, count, action }) {
  return (
    <button onClick={action} className="chunky-card chunky-card-hover p-4 text-left">
      <div className="font-display text-sm text-ink uppercase tracking-wider">{campus}</div>
      <div className="font-black text-3xl text-ink mt-1">{count}</div>
      <div className="text-[10px] font-bold text-cocoa mt-1 uppercase tracking-wider">profiles ready</div>
    </button>
  )
}
