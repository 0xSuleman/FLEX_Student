import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const FALLBACK = {
  universityInfo: {},
  academicCalendar: [],
  personalInfo: {
    rollNo: '24L-3072', name: 'Suleman Ahmed', degree: 'BS(SE)', batch: 'Fall 2024',
    section: 'BSE-243A', campus: 'Lahore', status: 'Current', gender: 'Male',
    email: 'zsuleman437@gmail.com', dob: '2005-07-22', cnic: '35202-4955765-7',
    mobileNo: '0318-4567625', bloodGroup: '0', nationality: 'Pakistani',
  },
  contactInfo: { address: 'House 123, Street 5', city: 'Lahore', postalCode: '54000', phone: '042-1234567' },
  familyInfo: [
    { relation: 'Father', name: 'Ahmed Sheikh', cnic: '35202-1234567-1', taxWithholding: 'Filer' },
    { relation: 'Mother', name: 'Fatima Sheikh', cnic: '35202-7654321-2', taxWithholding: 'Non-Filer' },
  ],
}

function Home() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard')
        setData(res.data)
      } catch {
        setData(FALLBACK)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const d = data || FALLBACK
  const p = d.personalInfo || {}
  const c = d.contactInfo || {}
  const cal = d.academicCalendar || []
  const fam = d.familyInfo || []

  return (
    <div className="space-y-6">
      {/* University Information */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">University Information</div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <InfoItem label="Roll No" value={p.rollNo} />
            <InfoItem label="Degree" value={p.degree} />
            <InfoItem label="Batch" value={p.batch} />
            <InfoItem label="Section" value={p.section} />
            <InfoItem label="Campus" value={p.campus} />
            <InfoItem label="Status" value={p.status} highlight />
          </div>
        </div>
      </div>

      {/* Academic Calendar */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Academic Calendar</div>
        <div className="card-body">
          {cal.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cal.map((event, i) => (
                <InfoItem
                  key={i}
                  label={event.eventName}
                  value={event.endDate ? `${event.startDate} to ${event.endDate}` : event.startDate}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoItem label="Registration" value="14-Jan-2026 to 01-Feb-2026" />
              <InfoItem label="Classes" value="19-Jan-2026 to 08-May-2026" />
              <InfoItem label="Online Feedback #1" value="16-Feb-2026 to 20-Feb-2026" />
              <InfoItem label="Online Feedback #2" value="04-May-2026 to 08-May-2026" />
              <InfoItem label="Online Withdraw Request" value="13-Jan-2026 to 15-May-2026" />
              <InfoItem label="Online Retake Request" value="After Mid Exam / After Final Exam" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="rounded shadow overflow-hidden">
          <div className="card-header">Personal Information</div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Name" value={p.name} />
              <InfoItem label="DOB" value={p.dob} />
              <InfoItem label="Blood Group" value={p.bloodGroup} />
              <InfoItem label="Gender" value={p.gender} />
              <InfoItem label="CNIC" value={p.cnic} />
              <InfoItem label="Nationality" value={p.nationality} />
              <InfoItem label="Email" value={p.email} />
              <InfoItem label="Mobile No" value={p.mobileNo} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded shadow overflow-hidden">
          <div className="card-header">Contact Information</div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InfoItem label="Address" value={c.address} />
              </div>
              <InfoItem label="City" value={c.city} />
              <InfoItem label="Postal Code" value={c.postalCode} />
              <InfoItem label="Phone" value={c.phone} />
              <InfoItem label="Emergency Contact" value={c.emergencyContact} />
            </div>
          </div>
        </div>
      </div>

      {/* Family Information */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">Family Information</div>
        <div className="card-body p-0">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-left font-medium">Relation</th>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">CNIC</th>
                <th className="px-4 py-2 text-left font-medium">Tax Withholding Status</th>
              </tr>
            </thead>
            <tbody>
              {fam.map((member, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2">{member.relation}</td>
                  <td className="px-4 py-2">{member.name}</td>
                  <td className="px-4 py-2">{member.cnic}</td>
                  <td className="px-4 py-2">{member.taxWithholding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div
        className={`text-sm font-medium ${
          highlight ? 'text-green-600' : 'text-gray-800'
        }`}
      >
        {value || '-'}
      </div>
    </div>
  )
}

export default Home
