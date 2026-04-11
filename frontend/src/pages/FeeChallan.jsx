import { useState, useEffect } from 'react'
import { Download, Info, CreditCard } from 'lucide-react'
import api from '../services/api'

const MOCK_SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025']
const FEE_TYPES = ['Tuition Fee', 'Hostel Fee', 'Exam Fee', 'Other']

const MOCK_CHALLANS = [
  {
    id: 1,
    challanNo: 'CHN-2026-001',
    semester: 'Spring 2026',
    amount: 185000,
    dueDate: '2026-01-20',
    status: 'UNPAID',
    generatedDate: '2026-01-05',
    paidDate: null,
  },
  {
    id: 2,
    challanNo: 'CHN-2025-004',
    semester: 'Fall 2025',
    amount: 175000,
    dueDate: '2025-08-20',
    status: 'PAID',
    generatedDate: '2025-08-01',
    paidDate: '2025-08-15',
  },
  {
    id: 3,
    challanNo: 'CHN-2025-003',
    semester: 'Fall 2025',
    amount: 5000,
    dueDate: '2025-11-01',
    status: 'PAID',
    generatedDate: '2025-10-15',
    paidDate: '2025-10-28',
  },
  {
    id: 4,
    challanNo: 'CHN-2025-002',
    semester: 'Spring 2025',
    amount: 175000,
    dueDate: '2025-01-20',
    status: 'PAID',
    generatedDate: '2025-01-03',
    paidDate: '2025-01-18',
  },
]

function FeeChallan() {
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [genSemester, setGenSemester] = useState(MOCK_SEMESTERS[0])
  const [genType, setGenType] = useState(FEE_TYPES[0])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const res = await api.get('/fees/challans')
        setChallans(Array.isArray(res.data) ? res.data : [])
      } catch {
        setChallans(MOCK_CHALLANS)
      } finally {
        setLoading(false)
      }
    }
    fetchChallans()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/fees/challans', {
        semester: genSemester,
        type: genType,
      })
      setChallans((prev) => [res.data, ...prev])
    } catch {
      const newChallan = {
        id: Date.now(),
        challanNo: `CHN-2026-${String(challans.length + 1).padStart(3, '0')}`,
        semester: genSemester,
        amount: genType === 'Tuition Fee' ? 185000 : genType === 'Hostel Fee' ? 50000 : genType === 'Exam Fee' ? 5000 : 10000,
        dueDate: '2026-02-15',
        status: 'UNPAID',
        generatedDate: new Date().toISOString().split('T')[0],
        paidDate: null,
      }
      setChallans((prev) => [newChallan, ...prev])
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = (challanId) => {
    window.alert(`Downloading challan ${challanId}...`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Challan Generation Form */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Generate Fee Challan</div>
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={genSemester}
                onChange={(e) => setGenSemester(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {MOCK_SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Type
              </label>
              <select
                value={genType}
                onChange={(e) => setGenType(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {FEE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-accent hover:bg-blue-600 text-white px-5 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Challan'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-800 text-sm mb-1">
                KuickPay Payment
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>1. Visit any KuickPay enabled bank branch or use online banking.</li>
                <li>2. Select &quot;Educational Institutions&quot; &gt; &quot;FAST-NUCES&quot;.</li>
                <li>3. Enter your Challan ID as the consumer number.</li>
                <li>4. Verify the amount and complete the transaction.</li>
                <li>5. Keep the receipt for your records.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-green-800 text-sm mb-1">
                Faysal Bank Payment
              </h4>
              <ul className="text-xs text-green-700 space-y-1">
                <li>1. Visit any Faysal Bank branch with the printed challan.</li>
                <li>2. Submit the challan at the designated fee counter.</li>
                <li>3. Verify the amount before making payment.</li>
                <li>4. Collect the stamped student copy as proof of payment.</li>
                <li>5. Fee reflects in FLEX within 48 working hours.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Challan List */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Fee Challans</div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-left font-medium">Challan No</th>
                <th className="px-4 py-2 text-left font-medium">Semester</th>
                <th className="px-4 py-2 text-right font-medium">Amount (Rs.)</th>
                <th className="px-4 py-2 text-left font-medium">Due Date</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((ch) => {
                const isPaid = (ch?.status || '').toUpperCase() === 'PAID'
                return (
                  <tr key={ch?.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs">{ch?.challanNo || ''}</td>
                    <td className="px-4 py-2">{ch?.semester || ''}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {(ch?.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{ch?.dueDate || ''}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                          isPaid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {ch?.status || ''}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDownload(ch?.challanNo || ch?.id)}
                        className="inline-flex items-center gap-1 text-accent hover:text-blue-700 text-xs font-medium"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FeeChallan
