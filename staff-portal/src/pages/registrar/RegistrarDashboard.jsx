import { useNavigate } from 'react-router-dom'
import { ClipboardList, Users, BookOpen, FilePen } from 'lucide-react'
import { PageHeader, StatCard, SectionCard, ActionButton } from '../../components/PageShell'

const PENDING = [
  { id: 1, roll: '24L-3091', course: 'CS3001', section: 'BSE-243A', stage: 'WITH_REGISTRAR', remarks: 'Re-admission after gap; HOD approved.' },
  { id: 2, roll: '24L-3088', course: 'CS3003', section: 'BSE-243B', stage: 'WITH_REGISTRAR', remarks: 'Hospitalisation; HOD approved.' },
]

export default function RegistrarDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Registrar" KickerIcon={ClipboardList} title="REGISTRAR DESK" subtitle="Final approver for late registration. Maintains course offering plan." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={ClipboardList} label="Late-Reg Pending" value={PENDING.length} tone="bg-mustard text-ink" />
        <StatCard Icon={Users}         label="Active Students"  value="1,420" tone="bg-cocoa text-bone" />
        <StatCard Icon={BookOpen}      label="Offered Courses"  value="118"   tone="bg-coffee text-bone" />
        <StatCard Icon={FilePen}       label="Grade Changes"    value="2"     tone="bg-moss text-cream" />
      </div>
      <SectionCard title="HOD-Cleared Late Registration Cases" right={<ActionButton onClick={() => navigate('/registrar/late-registration')}>Open Queue</ActionButton>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Section</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Remarks</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {PENDING.map((r, i) => (
              <tr key={r.id} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{r.roll}</td>
                <td className="px-5 py-3 text-ink">{r.course}</td>
                <td className="px-5 py-3"><span className="tag bg-bone text-ink">{r.section}</span></td>
                <td className="px-5 py-3 text-ink text-xs">{r.remarks}</td>
                <td className="px-5 py-3 text-center"><ActionButton tone="cocoa">Allow</ActionButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
