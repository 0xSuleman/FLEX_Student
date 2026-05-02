import { useState } from 'react'
import { Wallet, Plus, Download } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']
const BATCHES = ['BSE-243 (All)', 'BSE-244 (All)', 'BSE-245 (All)', 'Individual roll #']

export default function FinanceChallans() {
  const [semester, setSemester] = useState(SEMESTERS[0])
  const [batch, setBatch] = useState(BATCHES[0])
  const [amount, setAmount] = useState('185000')
  const [dueDate, setDueDate] = useState('2026-08-15')
  const [generated, setGenerated] = useState(null)

  const generate = () => {
    setGenerated({ count: 78, total: parseInt(amount) * 78, semester, batch, dueDate })
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Fees" KickerIcon={Wallet} title="GENERATE CHALLANS" subtitle="Issue semester-wise challans for a batch or one student." />
      <SectionCard title="Generate New Challan Run">
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Semester">
            <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none">
              {SEMESTERS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Target">
            <select value={batch} onChange={e => setBatch(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none">
              {BATCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Amount (PKR)">
            <input value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
          </Field>
          <Field label="Due Date">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
          </Field>
          <div className="md:col-span-4 flex justify-end">
            <ActionButton tone="cocoa" Icon={Plus} onClick={generate}>Generate</ActionButton>
          </div>
        </div>
      </SectionCard>

      {generated && (
        <SectionCard title="Generated Run" right={<ActionButton Icon={Download}>Export Excel</ActionButton>}>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Mini label="Challans Issued" value={generated.count} />
            <Mini label="Total Value" value={`Rs ${(generated.total / 1000000).toFixed(2)}M`} />
            <Mini label="Target" value={generated.batch} />
            <Mini label="Due" value={generated.dueDate} />
          </div>
          <div className="px-5 pb-5 text-[11px] font-bold text-cocoa uppercase tracking-wider">
            ✓ Notifications dispatched to all targeted students. Each will see their challan under <span className="text-burn">/fee-challan</span> on the student portal.
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; {label}</div>
      {children}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="bg-bone border-2 border-ink rounded px-3 py-2 text-center">
      <div className="text-[9px] font-extrabold text-coffee uppercase tracking-wider">{label}</div>
      <div className="font-black text-sm text-ink mt-0.5">{value}</div>
    </div>
  )
}
