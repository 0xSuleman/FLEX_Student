import { Users } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function AdmissionsRecords() {
  return (
    <StubPage
      kicker="Records" KickerIcon={Users} title="ADMISSION RECORDS"
      subtitle="Browse all admitted students. Re-issue credentials, update particulars."
      bullets={[
        'Filter by intake / program / status',
        'Re-issue credentials (resends welcome email + new password)',
        'Update particulars before student gains portal access',
      ]}
    />
  )
}
