import { useNavigate } from 'react-router-dom'
import { Wallet, Receipt, Lock, FileBarChart, AlertTriangle } from 'lucide-react'
import { PageHeader, StatCard, SectionCard, ActionButton } from '../../components/PageShell'

const RECENT = [
  { challan: 'CHN-2026-001', roll: '24L-3072', amount: 185000, status: 'PAID',   paidAt: '2026-01-18' },
  { challan: 'CHN-2026-002', roll: '24L-3081', amount: 185000, status: 'UNPAID', paidAt: '—'         },
  { challan: 'CHN-2026-003', roll: '24L-3091', amount: 185000, status: 'PAID',   paidAt: '2026-01-21' },
  { challan: 'CHN-2026-004', roll: '24L-3088', amount: 185000, status: 'PARTIAL',paidAt: '2026-02-01' },
]

export default function FinanceDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Finance / Accounts" KickerIcon={Wallet} title="FEE OPERATIONS" subtitle="Generate challans, record payments, manage holds and fines." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={Wallet}        label="Outstanding"  value="Rs 2.1M"    sub="38 unpaid"   tone="bg-bad text-bone" />
        <StatCard Icon={Receipt}       label="Collected"    value="Rs 70.7M"   sub="382 paid"    tone="bg-moss text-cream" />
        <StatCard Icon={Lock}          label="Active Holds" value="6"          sub="Block enroll" tone="bg-mustard text-ink" />
        <StatCard Icon={AlertTriangle} label="Past Due"     value="12"         sub="> 30 days"   tone="bg-bad text-bone" />
      </div>
      <SectionCard title="Recent Challan Activity" right={<ActionButton onClick={() => navigate('/finance/challans')}>Open Challans</ActionButton>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Challan</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Amount</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Paid On</th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-mono text-xs text-ink">{r.challan}</td>
                <td className="px-5 py-3 font-extrabold text-ink">{r.roll}</td>
                <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">Rs {(r.amount / 1000).toFixed(0)}K</span></td>
                <td className="px-5 py-3 text-center">
                  <span className={`tag ${r.status === 'PAID' ? 'bg-moss text-cream' : r.status === 'PARTIAL' ? 'bg-mustard text-ink' : 'bg-bad text-bone'}`}>{r.status}</span>
                </td>
                <td className="px-5 py-3 text-center text-[11px] font-mono text-cocoa">{r.paidAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  )
}
