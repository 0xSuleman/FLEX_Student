import { useState } from 'react'
import { ClipboardList, Send, X } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const INITIAL = [
  { id: 1, roll: '24L-3091', course: 'CS3001', section: 'BSE-243A', remarks: 'Re-admission after gap; HOD approved.', status: 'WITH_REGISTRAR' },
  { id: 2, roll: '24L-3088', course: 'CS3003', section: 'BSE-243B', remarks: 'Hospitalisation; HOD approved.', status: 'WITH_REGISTRAR' },
  { id: 3, roll: '24L-3087', course: 'MT3005', section: 'BSE-243A', remarks: 'Re-admitted after gap semester.', status: 'WITH_FLEX' },
]

const TONE = {
  WITH_REGISTRAR: 'bg-mustard text-ink',
  WITH_FLEX:      'bg-burn text-bone',
  REJECTED:       'bg-bad text-bone',
}

export default function RegistrarLateReg() {
  const [rows, setRows] = useState(INITIAL)
  const allow = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'WITH_FLEX' } : r))
  const reject = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r))

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Approvals" KickerIcon={ClipboardList} title="LATE REGISTRATION QUEUE" subtitle="Review HOD-cleared cases. Allow → Flex Support performs the actual enrollment." />
      <SectionCard title={`Queue — ${rows.length}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <Th>Roll</Th><Th>Course</Th><Th>Section</Th><Th>Remarks</Th><Th center>Status</Th><Th center>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{r.roll}</td>
                <td className="px-5 py-3 text-ink">{r.course}</td>
                <td className="px-5 py-3"><span className="tag bg-bone text-ink">{r.section}</span></td>
                <td className="px-5 py-3 text-ink text-xs">{r.remarks}</td>
                <td className="px-5 py-3 text-center"><span className={`tag ${TONE[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                <td className="px-5 py-3 text-center">
                  {r.status === 'WITH_REGISTRAR' ? (
                    <div className="inline-flex gap-2">
                      <ActionButton tone="bad" Icon={X} onClick={() => reject(r.id)}>Reject</ActionButton>
                      <ActionButton tone="cocoa" Icon={Send} onClick={() => allow(r.id)}>Allow → Flex</ActionButton>
                    </div>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cocoa">Done</span>
                  )}
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
