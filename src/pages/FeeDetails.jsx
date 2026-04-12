import { useState, useEffect } from 'react'
import api from '../services/api'

const MOCK_CHALLANS = [
  { id: 1, no: 'CHN-2026-001', semester: 'Spring 2026', status: 'UNPAID' },
  { id: 2, no: 'CHN-2025-004', semester: 'Fall 2025',   status: 'PAID' },
  { id: 3, no: 'CHN-2025-003', semester: 'Fall 2025',   status: 'PAID' },
  { id: 4, no: 'CHN-2025-002', semester: 'Spring 2025', status: 'PAID' },
]

const MOCK_DETAILS = {
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
  const [challans, setChallans] = useState([])
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Fetch challans on mount
  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const res = await api.get('/fees/challans')
        const data = res.data
        setChallans(data)
        if (data.length > 0) setSelected(data[0].id)
      } catch {
        setChallans(MOCK_CHALLANS)
        setSelected(MOCK_CHALLANS[0].id)
      } finally {
        setLoading(false)
      }
    }
    fetchChallans()
  }, [])

  // Fetch details when selected challan changes
  useEffect(() => {
    if (selected == null) return

    // If we already fetched details for this challan, skip
    if (details[selected]) return

    const fetchDetails = async () => {
      setDetailsLoading(true)
      try {
        const res = await api.get(`/fees/challans/${selected}/details`)
        setDetails(prev => ({ ...prev, [selected]: res.data }))
      } catch {
        setDetails(prev => ({ ...prev, [selected]: MOCK_DETAILS[selected] || [] }))
      } finally {
        setDetailsLoading(false)
      }
    }
    fetchDetails()
  }, [selected])

  const items = details[selected] || []
  const selectedChallan = challans.find(c => c.id === selected)

  const summary = items.reduce((acc, it) => ({
    arrears: acc.arrears + it.arrears,
    due: acc.due + it.due,
    discount: acc.discount + it.discount,
    sponsored: acc.sponsored + it.sponsored,
    collection: acc.collection + it.collection,
    balance: acc.balance + it.balance,
  }), { arrears: 0, due: 0, discount: 0, sponsored: 0, collection: 0, balance: 0 })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
      </div>
    )
  }

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
          {challans.map(c => <option key={c.id} value={c.id}>{c.no} — {c.semester} ({c.status})</option>)}
        </select>
      </div>

      {detailsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
        </div>
      ) : (
        <>
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
        </>
      )}
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
