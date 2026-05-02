import { FileX } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function AoWithdrawals() {
  return (
    <StubPage
      kicker="Records" KickerIcon={FileX}
      title="WITHDRAWAL DECISIONS"
      subtitle="Approve / reject HOD-cleared withdrawals; updates student enrollment record."
      bullets={[
        'List HOD-approved withdrawal requests for AO finalisation',
        'Approve → updates Enrollment status within 5 minutes; notifies student',
        'Reject → notifies student with reason',
      ]}
    />
  )
}
