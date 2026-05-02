import { useState } from 'react'
import { FileCheck, Send, RotateCcw, Lock } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const INITIAL = [
  { id: 1, course: 'CS3001', section: 'BSE-243A', faculty: 'Zeeshan Rana', students: 42, status: 'HOD_APPROVED' },
  { id: 2, course: 'CS3002', section: 'BSE-243A', faculty: 'Zeeshan Rana', students: 39, status: 'HOD_APPROVED' },
  { id: 3, course: 'CS3003', section: 'BSE-243B', faculty: 'Hammad Afzal', students: 36, status: 'PUBLISHED' },
  { id: 4, course: 'MT3005', section: 'BSE-243A', faculty: 'Sara Iftikhar', students: 30, status: 'WITH_FACULTY' },
]

const TONE = {
  WITH_FACULTY: 'bg-tan text-ink',
  HOD_APPROVED: 'bg-mustard text-ink',
  PUBLISHED:    'bg-moss text-cream',
}

export default function ExamFinalize() {
  const [rows, setRows] = useState(INITIAL)
  const publish = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'PUBLISHED' } : r))
  const ret = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'WITH_FACULTY' } : r))

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Examination" KickerIcon={FileCheck} title="GRADE FINALIZATION" subtitle="Publish HOD-approved grades. Once published, faculty editing is permanently disabled." />
      <SectionCard title="Grade Sheets">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Section</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Faculty</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Students</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{r.course}</td>
                <td className="px-5 py-3"><span className="tag bg-bone text-ink">{r.section}</span></td>
                <td className="px-5 py-3 text-ink">{r.faculty}</td>
                <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">{r.students}</span></td>
                <td className="px-5 py-3 text-center"><span className={`tag ${TONE[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                <td className="px-5 py-3 text-center">
                  {r.status === 'HOD_APPROVED' && (
                    <div className="inline-flex gap-2">
                      <ActionButton tone="bad" Icon={RotateCcw} onClick={() => ret(r.id)}>Return to Faculty</ActionButton>
                      <ActionButton tone="cocoa" Icon={Send} onClick={() => publish(r.id)}>Publish</ActionButton>
                    </div>
                  )}
                  {r.status === 'PUBLISHED' && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cocoa"><Lock size={11} strokeWidth={3} /> Locked</span>}
                  {r.status === 'WITH_FACULTY' && <span className="text-[10px] font-extrabold uppercase tracking-wider text-cocoa">Awaiting Faculty</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
