import { useState, useEffect } from 'react'
import api from '../services/api'

// The FeeDetails page fetches challans first, then fetches details for a selected challan.
// API: GET /api/fees/challans returns array of challans
// API: GET /api/fees/challans/{id}/details returns array of detail line items

const MOCK_CHALLANS = [
  {
    id: 1, challanNo: 'CHN-2026-001', semester: 'Spring 2026', amount: 185000,
    dueDate: '2026-01-20', status: 'UNPAID', generatedDate: '2026-01-05', paidDate: null,
  },
  {
    id: 2, challanNo: 'CHN-2025-004', semester: 'Fall 2025', amount: 175000,
    dueDate: '2025-08-20', status: 'PAID', generatedDate: '2025-08-01', paidDate: '2025-08-15',
  },
  {
    id: 3, challanNo: 'CHN-2025-003', semester: 'Fall 2025', amount: 5000,
    dueDate: '2025-11-01', status: 'PAID', generatedDate: '2025-10-15', paidDate: '2025-10-28',
  },
  {
    id: 4, challanNo: 'CHN-2025-002', semester: 'Spring 2025', amount: 175000,
    dueDate: '2025-01-20', status: 'PAID', generatedDate: '2025-01-03', paidDate: '2025-01-18',
  },
]

const MOCK_DETAILS = [
  { id: 1, description: 'Tuition Fee', arrears: 0, due: 165000, discount: 18500, sponsored: 0, collection: 146500, balance: 0, instrumentNo: 'TXN-78234', instrumentType: 'Online Banking' },
  { id: 2, description: 'Exam Fee', arrears: 0, due: 5000, discount: 0, sponsored: 0, collection: 5000, balance: 0, instrumentNo: 'TXN-81023', instrumentType: 'KuickPay' },
  { id: 3, description: 'Library Fee', arrears: 0, due: 5000, discount: 0, sponsored: 0, collection: 5000, balance: 0, instrumentNo: 'TXN-78234', instrumentType: 'Online Banking' },
  { id: 4, description: 'IT Services Fee', arrears: 0, due: 10000, discount: 0, sponsored: 0, collection: 10000, balance: 0, instrumentNo: 'TXN-78234', instrumentType: 'Online Banking' },
]

function FeeDetails() {
  const [challans, setChallans] = useState([])
  const [selectedChallanId, setSelectedChallanId] = useState(null)
  const [details, setDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const res = await api.get('/fees/challans')
        const arr = Array.isArray(res.data) ? res.data : []
        setChallans(arr)
        if (arr.length > 0) {
          setSelectedChallanId(arr[0]?.id)
        }
      } catch {
        setChallans(MOCK_CHALLANS)
        setSelectedChallanId(MOCK_CHALLANS[0]?.id)
      } finally {
        setLoading(false)
      }
    }
    fetchChallans()
  }, [])

  useEffect(() => {
    if (selectedChallanId == null) return
    const fetchDetails = async () => {
      setDetailsLoading(true)
      try {
        const res = await api.get(`/fees/challans/${selectedChallanId}/details`)
        setDetails(Array.isArray(res.data) ? res.data : [])
      } catch {
        setDetails(MOCK_DETAILS)
      } finally {
        setDetailsLoading(false)
      }
    }
    fetchDetails()
  }, [selectedChallanId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  // Compute summary from details
  const summary = {
    arrears: details.reduce((s, d) => s + (d?.arrears ?? 0), 0),
    due: details.reduce((s, d) => s + (d?.due ?? 0), 0),
    discount: details.reduce((s, d) => s + (d?.discount ?? 0), 0),
    sponsored: details.reduce((s, d) => s + (d?.sponsored ?? 0), 0),
    collection: details.reduce((s, d) => s + (d?.collection ?? 0), 0),
    balance: details.reduce((s, d) => s + (d?.balance ?? 0), 0),
  }

  const selectedChallan = challans.find((c) => c?.id === selectedChallanId)

  return (
    <div className="space-y-6">
      {/* Challan Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select Challan:</label>
        <select
          value={selectedChallanId ?? ''}
          onChange={(e) => setSelectedChallanId(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {challans.map((ch) => (
            <option key={ch?.id} value={ch?.id}>
              {ch?.challanNo || ''} - {ch?.semester || ''} ({ch?.status || ''})
            </option>
          ))}
        </select>
      </div>

      {/* Summary Row */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">
          Fee Summary {selectedChallan ? `- ${selectedChallan?.challanNo || ''}` : ''}
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard label="Arrears" value={summary.arrears} color="text-gray-800" />
            <SummaryCard label="Due" value={summary.due} color="text-red-600" />
            <SummaryCard label="Discount" value={summary.discount} color="text-green-600" />
            <SummaryCard label="Sponsored" value={summary.sponsored} color="text-blue-600" />
            <SummaryCard label="Collection" value={summary.collection} color="text-green-700" />
            <SummaryCard label="Balance" value={summary.balance} color="text-red-700" />
          </div>
        </div>
      </div>

      {/* Detail Line Items */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Fee Details</div>
        <div className="bg-white overflow-x-auto">
          {detailsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : (
            <table className="w-full text-sm table-striped">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                  <th className="px-4 py-2 text-right font-medium">Arrears</th>
                  <th className="px-4 py-2 text-right font-medium">Due</th>
                  <th className="px-4 py-2 text-right font-medium">Discount</th>
                  <th className="px-4 py-2 text-right font-medium">Sponsored</th>
                  <th className="px-4 py-2 text-right font-medium">Collection</th>
                  <th className="px-4 py-2 text-right font-medium">Balance</th>
                  <th className="px-4 py-2 text-left font-medium">Instrument No</th>
                  <th className="px-4 py-2 text-left font-medium">Instrument Type</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d, i) => (
                  <tr key={d?.id ?? i} className="border-t border-gray-100">
                    <td className="px-4 py-2">{d?.description || ''}</td>
                    <td className="px-4 py-2 text-right">{(d?.arrears ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(d?.due ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(d?.discount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(d?.sponsored ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(d?.collection ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(d?.balance ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-xs">{d?.instrumentNo || '-'}</td>
                    <td className="px-4 py-2">{d?.instrumentType || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded">
      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-lg font-bold ${color}`}>
        Rs. {(value ?? 0).toLocaleString()}
      </div>
    </div>
  )
}

export default FeeDetails
