import { Users } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function AsstAoStudents() {
  return (
    <StubPage
      kicker="View" KickerIcon={Users}
      title="STUDENT RECORDS — READ ONLY"
      subtitle="Browse departmental students. No write actions; escalate edits to the Academic Officer."
      bullets={[
        'Search by Roll · Name · CNIC',
        'View profile, current enrollments, attendance summary, fee status',
        'Read-only — edits go through the AO',
      ]}
    />
  )
}
