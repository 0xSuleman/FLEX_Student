import { useState } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const INITIAL = [
  { id: 1, roll: '24L-3091', course: 'CS3001', section: 'BSE-243A', remarks: '', status: 'DRAFT' },
  { id: 2, roll: '24L-3088', course: 'CS3003', section: 'BSE-243B', remarks: 'Hospitalized first 2 weeks of registration window', status: 'WITH_HOD' },
  { id: 3, roll: '24L-3087', course: 'MT3005', section: 'BSE-243A', remarks: 'Re-admitted after gap semester', status: 'WITH_REGISTRAR' },
]

const TONE = {
  DRAFT:           'bg-tan text-ink',
  WITH_HOD:        'bg-mustard text-ink',
  WITH_REGISTRAR:  'bg-coffee text-bone',
  WITH_FLEX:       'bg-burn text-bone',
  REJECTED:        'bg-bad text-bone',
  COMPLETED:       'bg-moss text-cream',
}

export default function AoLateRegistration() {
  const [rows, setRows] = useState(INITIAL)

  const submit = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'WITH_HOD' } : r))
  const updateRemarks = (id, v) => setRows(prev => prev.map(r => r.id === id ? { ...r, remarks: v } : r))

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Approvals" KickerIcon={ClipboardList} title="LATE REGISTRATION" subtitle="Stage AO remarks then forward to HOD → Registrar → Flex Support." />
      <SectionCard title={`Active Cases — ${rows.length}`}>
        <div className="p-5 space-y-4">
          {rows.map(r => (
            <div key={r.id} className="bg-bone border-2 border-ink rounded-md p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-extrabold text-ink">{r.roll}</span>
                <span className="tag bg-bone text-ink">{r.course}</span>
                <span className="tag bg-coffee text-bone">{r.section}</span>
                <span className={`tag ${TONE[r.status]} ml-auto`}>{r.status.replace('_', ' ')}</span>
              </div>
              <textarea
                value={r.remarks}
                onChange={e => updateRemarks(r.id, e.target.value)}
                disabled={r.status !== 'DRAFT'}
                placeholder="AO remarks: why this student is in late registration..."
                className="w-full bg-cream border-2 border-ink rounded-md p-3 text-sm text-ink focus:outline-none min-h-[80px] font-mono disabled:opacity-60"
              />
              {r.status === 'DRAFT' && (
                <div className="flex justify-end">
                  <ActionButton tone="cocoa" Icon={Send} onClick={() => submit(r.id)} disabled={!r.remarks.trim()}>Submit to HOD</ActionButton>
                </div>
              )}
              {r.status !== 'DRAFT' && (
                <div className="text-[11px] font-bold text-cocoa uppercase tracking-wider border-t-2 border-dashed border-cocoa/30 pt-2">
                  &gt; Awaiting next stage in approval chain.
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
