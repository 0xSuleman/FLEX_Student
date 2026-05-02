import { useNavigate } from 'react-router-dom'
import { Calendar, Layers, FileCheck, ScrollText, FilePen } from 'lucide-react'
import { PageHeader, StatCard, SectionCard, ActionButton } from '../../components/PageShell'

const HOD_APPROVED = [
  { course: 'CS3001', section: 'BSE-243A', faculty: 'Zeeshan Rana', students: 42 },
  { course: 'CS3002', section: 'BSE-243A', faculty: 'Zeeshan Rana', students: 39 },
]

export default function ExamDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Exam Office" KickerIcon={Calendar} title="EXAMINATION CENTER" subtitle="Schedules · seating · grade finalization · retakes · transcripts." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={Calendar}  label="Mid Exams"     value="14" tone="bg-cocoa text-bone" />
        <StatCard Icon={Calendar}  label="Final Exams"   value="22" tone="bg-coffee text-bone" />
        <StatCard Icon={FileCheck} label="Ready to Publish" value={HOD_APPROVED.length} tone="bg-moss text-cream" />
        <StatCard Icon={FilePen}   label="Retakes Pending" value="4" tone="bg-mustard text-ink" />
      </div>
      <SectionCard title="HOD-Approved Grade Sheets — Ready to Publish" right={<ActionButton onClick={() => navigate('/exam/finalize')}>Open Finalizer</ActionButton>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Section</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Faculty</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Students</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {HOD_APPROVED.map((r, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{r.course}</td>
                <td className="px-5 py-3"><span className="tag bg-bone text-ink">{r.section}</span></td>
                <td className="px-5 py-3 text-ink">{r.faculty}</td>
                <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">{r.students}</span></td>
                <td className="px-5 py-3 text-center"><ActionButton tone="cocoa" Icon={FileCheck}>Publish</ActionButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
