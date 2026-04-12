import { useState } from 'react'

const CHALLANS = [
  { id: 1, no: 'CHN-2026-001', semester: 'Spring 2026', status: 'UNPAID' },
  { id: 2, no: 'CHN-2025-004', semester: 'Fall 2025',   status: 'PAID' },
  { id: 3, no: 'CHN-2025-003', semester: 'Fall 2025',   status: 'PAID' },
  { id: 4, no: 'CHN-2025-002', semester: 'Spring 2025', status: 'PAID' },
]

const DETAILS = {
  1: [
    { desc: 'Tuition Fee',     arrears: 0, due: 165000, discount: 18500, sponsored: 0, collection: 146500, balance: 0, instr: 'TXN-78234', type: 'Online Banking' },
    { desc: 'Exam Fee',        arrears: 0, due: 5000,   discount: 0,     sponsored: 0, collection: 5000,   balance: 0, instr: 'TXN-81023', type: 'KuickPay' },
    { desc: 'Library Fee',     arrears: 0, due: 5000,   discount: 0,     sponsored: 0, collection: 5000,   balance: 0, instr: 'TXN-78234', type: 'Online Banking' },
    { desc: 'IT Services Fee', arrears: 0, due: 10000,  discount: 0,     sponsored: 0, collection: 10000,  balance: 0, instr: 'TXN-78234', type: 'Online Banking' },
  ],
  2: [
    { desc: 'Tuition Fee',     arrears: 0, due: 155000, discount: 0,     sponsored: 0, collection: 155000, balance: 0, instr: 'TXN-67123', type: 'KuickPay' },
    { desc: 'Library Fee',     arrears: 0, due: 5000,   discount: 0,     sponsored: 0, collection: 5000,   balance: 0, instr: 'TXN-67123', type: 'KuickPay' },
    { desc: 'IT Services Fee', arrears: 0, due: 15000,  discount: 0,     sponsored: 0, collection: 15000,  balance: 0, instr: 'TXN-67123', type: 'KuickPay' },
  ],
  3: [
    { desc: 'Exam Fee',        arrears: 0, due: 5000,   discount: 0,     sponsored: 0, collection: 5000,   balance: 0, instr: 'TXN-72100', type: 'KuickPay' },
  ],
  4: [
    { desc: 'Tuition Fee',     arrears: 0, due: 175000, discount: 0,     sponsored: 0, collection: 175000, balance: 0, instr: 'TXN-58000', type: 'Online Banking' },
  ],
}

export default function FeeDetails() {
  const [selected, setSelected] = useState(1)
  const items = DETAILS[selected] || []
  const selectedChallan = CHALLANS.find(c => c.id === selected)

  const summary = items.reduce((acc, it) => ({
    arrears: acc.arrears + it.arrears,
    due: acc.due + it.due,
    discount: acc.discount + it.discount,
    sponsored: acc.sponsored + it.sponsored,
    collection: acc.collection + it.collection,
    balance: acc.balance + it.balance,
  }), { arrears: 0, due: 0, discount: 0, sponsored: 0, collection: 0, balance: 0 })

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Fees / Fee Details</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">FEE DETAILS</h1>
        <p className="text-sm text-cocoa mt-2">Line-item breakdown for each challan.</p>
      </div>

      <div className="flex items-center gap-3 cascade-in" style={{ animationDelay: '0.05s' }}>
        <span className="text-xs font-extrabold text-coffee uppercase tracking-widest">Challan:</span>
        <select value={selected} onChange={(e) => setSelected(Number(e.target.value))} className="styled-select">
          {CHALLANS.map(c => <option key={c.id} value={c.id}>{c.no} — {c.semester} ({c.status})</option>)}
        </select>
      </div>

      {/* SUMMARY */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">Summary {selectedChallan && `— ${selectedChallan.no}`}</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <SummaryBox label="Arrears" value={summary.arrears} color="text-cocoa" />
          <SummaryBox label="Due" value={summary.due} color="text-bad" />
          <SummaryBox label="Discount" value={summary.discount} color="text-moss" />
          <SummaryBox label="Sponsored" value={summary.sponsored} color="text-coffee" />
          <SummaryBox label="Collection" value={summary.collection} color="text-moss" />
          <SummaryBox label="Balance" value={summary.balance} color="text-ink" />
        </div>
      </div>

      {/* LINE ITEMS */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.15s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Description</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Arrears</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Due</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Discount</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Sponsored</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Collection</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Balance</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Instrument</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Type</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-4 py-2.5 font-extrabold text-ink">{it.desc}</td>
                  <td className="px-4 py-2.5 text-right">{it.arrears.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right"><span className="tag bg-bad/15 text-ink">{it.due.toLocaleString()}</span></td>
                  <td className="px-4 py-2.5 text-right">{it.discount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">{it.sponsored.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right"><span className="tag bg-moss/15 text-ink">{it.collection.toLocaleString()}</span></td>
                  <td className="px-4 py-2.5 text-right"><span className="tag bg-mustard/20 text-ink">{it.balance.toLocaleString()}</span></td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-cocoa">{it.instr}</td>
                  <td className="px-4 py-2.5 text-cocoa text-xs">{it.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryBox({ label, value, color }) {
  return (
    <div className="bg-bone border-2 border-ink rounded p-3 text-center">
      <div className="text-[9px] font-extrabold text-coffee uppercase tracking-widest mb-1">{label}</div>
      <div className={`font-black text-base ${color}`}>Rs {value.toLocaleString()}</div>
    </div>
  )
}
