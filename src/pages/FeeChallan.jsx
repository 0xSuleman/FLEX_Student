import { useState } from 'react'
import { Download, CreditCard, Info } from 'lucide-react'

const SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']
const FEE_TYPES = ['Tuition Fee', 'Hostel Fee', 'Exam Fee', 'Other']
const FEE_AMOUNTS = { 'Tuition Fee': 185000, 'Hostel Fee': 50000, 'Exam Fee': 5000, 'Other': 10000 }

const INITIAL_CHALLANS = [
  { id: 1, no: 'CHN-2026-001', semester: 'Spring 2026', amount: 185000, due: '2026-01-20', status: 'UNPAID' },
  { id: 2, no: 'CHN-2025-004', semester: 'Fall 2025',   amount: 175000, due: '2025-08-20', status: 'PAID' },
  { id: 3, no: 'CHN-2025-003', semester: 'Fall 2025',   amount: 5000,   due: '2025-11-01', status: 'PAID' },
  { id: 4, no: 'CHN-2025-002', semester: 'Spring 2025', amount: 175000, due: '2025-01-20', status: 'PAID' },
]

export default function FeeChallan() {
  const [challans, setChallans] = useState(INITIAL_CHALLANS)
  const [genSem, setGenSem] = useState(SEMESTERS[0])
  const [genType, setGenType] = useState(FEE_TYPES[0])

  const handleGenerate = () => {
    const newChallan = {
      id: Date.now(),
      no: `CHN-2026-${String(challans.length + 1).padStart(3, '0')}`,
      semester: genSem,
      amount: FEE_AMOUNTS[genType],
      due: '2026-02-15',
      status: 'UNPAID',
    }
    setChallans(prev => [newChallan, ...prev])
  }

  const handleDownload = (no) => alert(`Downloading challan ${no}...`)

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="cascade-in">
        <div className="text-sm font-bold text-coffee uppercase tracking-wider">Fees / Fee Challan</div>
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">FEE CHALLAN</h1>
        <p className="text-sm text-cocoa mt-2">Generate and download your fee challans.</p>
      </div>

      {/* GENERATE */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.05s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">Generate New Challan</h3>
        </div>
        <div className="p-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1">Semester</label>
            <select value={genSem} onChange={(e) => setGenSem(e.target.value)} className="styled-select">
              {SEMESTERS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1">Fee Type</label>
            <select value={genType} onChange={(e) => setGenType(e.target.value)} className="styled-select">
              {FEE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} className="btn-primary">Generate Challan</button>
        </div>
      </div>

      {/* PAYMENT INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-rust" strokeWidth={2.5} />
            <h3 className="font-display text-[10px] text-ink uppercase">KuickPay</h3>
          </div>
          <ol className="text-xs text-cocoa space-y-1.5 list-decimal pl-4 font-medium">
            <li>Visit any KuickPay-enabled bank branch or use online banking.</li>
            <li>Select "Educational Institutions" → "FAST-NUCES".</li>
            <li>Enter your Challan ID as the consumer number.</li>
            <li>Verify the amount and complete the transaction.</li>
            <li>Keep the receipt for your records.</li>
          </ol>
        </div>
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-moss" strokeWidth={2.5} />
            <h3 className="font-display text-[10px] text-ink uppercase">Faysal Bank</h3>
          </div>
          <ol className="text-xs text-cocoa space-y-1.5 list-decimal pl-4 font-medium">
            <li>Visit any Faysal Bank branch with the printed challan.</li>
            <li>Submit the challan at the designated fee counter.</li>
            <li>Verify the amount before making payment.</li>
            <li>Collect the stamped student copy as proof of payment.</li>
            <li>Fee reflects in NUKED within 48 working hours.</li>
          </ol>
        </div>
      </div>

      {/* CHALLAN LIST */}
      <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.2s' }}>
        <div className="px-5 py-3.5 border-b-2 border-ink bg-tan">
          <h3 className="heading-retro text-sm">All Challans</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Challan No</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Semester</th>
              <th className="px-5 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest">Amount</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Due</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {challans.map((c, i) => (
              <tr key={c.id} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                <td className="px-5 py-3 font-mono text-xs font-extrabold text-ink">{c.no}</td>
                <td className="px-5 py-3 text-ink">{c.semester}</td>
                <td className="px-5 py-3 text-right"><span className="tag bg-bad/15 text-ink">Rs {c.amount.toLocaleString()}</span></td>
                <td className="px-5 py-3 text-cocoa font-mono text-xs">{c.due}</td>
                <td className="px-5 py-3 text-center"><span className={`tag ${c.status === 'PAID' ? 'bg-moss text-cream' : 'bg-cocoa text-bone'}`}>{c.status}</span></td>
                <td className="px-5 py-3 text-center">
                  <button onClick={() => handleDownload(c.no)} className="text-rust hover:text-burn font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-1">
                    <Download size={12} strokeWidth={3} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
