import { useState } from 'react'
import { Users, Search, Download } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const SAMPLE = [
  { roll: '24L-3072', name: 'Suleman Ahmed', course: 'CS3001', section: 'BSE-243A', status: 'APPROVED' },
  { roll: '24L-3073', name: 'Hassan Khan',   course: 'CS3001', section: 'BSE-243A', status: 'APPROVED' },
  { roll: '24L-3074', name: 'Ahmed Malik',   course: 'CS3002', section: 'BSE-243A', status: 'APPROVED' },
  { roll: '24L-3081', name: 'Shahzaib Saeed',course: 'CS3001', section: 'BSE-243A', status: 'PENDING' },
  { roll: '24L-3091', name: 'Aisha Tariq',   course: 'CS3003', section: 'BSE-243C', status: 'PENDING' },
  { roll: '24L-3088', name: 'Bilal Akhtar',  course: 'CS3003', section: 'BSE-243B', status: 'REJECTED' },
]

const TONE = { APPROVED: 'bg-moss text-cream', PENDING: 'bg-mustard text-ink', REJECTED: 'bg-bad text-bone' }

export default function AoEnrollments() {
  const [filter, setFilter] = useState('ALL')
  const [q, setQ] = useState('')
  const filtered = SAMPLE.filter(r =>
    (filter === 'ALL' || r.status === filter) &&
    (!q || r.roll.toLowerCase().includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Enrollments" KickerIcon={Users} title="ENROLLMENT REQUESTS" subtitle="View and act on enrollment activity. Spring 2026." />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-bone border-2 border-ink rounded-md px-3 py-1.5 w-64">
          <Search size={12} className="text-cocoa" strokeWidth={3} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Roll or name..." className="bg-transparent text-xs text-ink placeholder:text-cocoa/50 focus:outline-none w-full font-bold" />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`tag border-2 ${filter === f ? 'bg-cocoa text-bone border-burn' : 'bg-bone text-ink border-ink'}`}>{f}</button>
          ))}
        </div>
        <ActionButton Icon={Download}>Export Excel</ActionButton>
      </div>

      <SectionCard title={`Results — ${filtered.length} student${filtered.length !== 1 ? 's' : ''}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <Th>Roll</Th><Th>Name</Th><Th>Course</Th><Th>Section</Th><Th center>Status</Th><Th center>Action</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{r.roll}</td>
                <td className="px-5 py-3 text-ink">{r.name}</td>
                <td className="px-5 py-3 text-ink">{r.course}</td>
                <td className="px-5 py-3"><span className="tag bg-bone text-ink">{r.section}</span></td>
                <td className="px-5 py-3 text-center"><span className={`tag ${TONE[r.status]}`}>{r.status}</span></td>
                <td className="px-5 py-3 text-center">
                  <div className="inline-flex gap-1">
                    <ActionButton tone="bone">View</ActionButton>
                    <ActionButton tone="cocoa">Drop</ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No matches</td></tr>}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}
