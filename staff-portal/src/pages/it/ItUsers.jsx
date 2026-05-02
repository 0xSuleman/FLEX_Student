import { useState } from 'react'
import { Users, UserPlus, KeyRound, Lock, Unlock } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const SAMPLE = [
  { username: 'zeeshan.rana', name: 'Zeeshan Ali Rana', role: 'FACULTY',     status: 'ACTIVE',   last: '5m ago' },
  { username: 'hammad.afzal', name: 'Hammad Afzal',     role: 'FACULTY',     status: 'ACTIVE',   last: '32m ago' },
  { username: 'hod.cs',       name: 'Dr. Tariq Mahmood',role: 'HOD',         status: 'ACTIVE',   last: '2h ago' },
  { username: 'ao.foc',       name: 'Asma Ali',         role: 'AO',          status: 'ACTIVE',   last: '14m ago' },
  { username: 'finance.lhr',  name: 'Imran Sheikh',     role: 'FINANCE',     status: 'ACTIVE',   last: '1d ago' },
  { username: 'old.user',     name: 'John Doe',         role: 'FACULTY',     status: 'INACTIVE', last: '6mo ago' },
]

const TONE = { ACTIVE: 'bg-moss text-cream', INACTIVE: 'bg-bad text-bone', LOCKED: 'bg-mustard text-ink' }

export default function ItUsers() {
  const [rows, setRows] = useState(SAMPLE)
  const toggle = (u) => setRows(prev => prev.map(r => r.username === u ? { ...r, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : r))

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Identity" KickerIcon={Users} title="USERS"
        subtitle="Create / deactivate accounts; assign or modify roles."
        right={<ActionButton tone="cocoa" Icon={UserPlus}>New User</ActionButton>}
      />
      <SectionCard title={`All Accounts — ${rows.length}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <Th>Username</Th><Th>Name</Th><Th>Role</Th><Th center>Status</Th><Th center>Last Login</Th><Th center>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.username} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-mono text-xs text-ink">{r.username}</td>
                <td className="px-5 py-3 font-extrabold text-ink">{r.name}</td>
                <td className="px-5 py-3"><span className="tag bg-cocoa text-bone">{r.role}</span></td>
                <td className="px-5 py-3 text-center"><span className={`tag ${TONE[r.status]}`}>{r.status}</span></td>
                <td className="px-5 py-3 text-center text-[11px] font-mono text-cocoa">{r.last}</td>
                <td className="px-5 py-3 text-center">
                  <div className="inline-flex gap-1">
                    <ActionButton Icon={KeyRound}>Reset PW</ActionButton>
                    <ActionButton tone={r.status === 'ACTIVE' ? 'bad' : 'moss'} Icon={r.status === 'ACTIVE' ? Lock : Unlock} onClick={() => toggle(r.username)}>
                      {r.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                    </ActionButton>
                  </div>
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
