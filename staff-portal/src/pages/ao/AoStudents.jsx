import { Users } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function AoStudents() {
  return (
    <StubPage
      kicker="Records" KickerIcon={Users}
      title="STUDENT RECORDS"
      subtitle="Search by Roll / Name / CNIC. Update program, batch, status. Place or remove academic holds."
      bullets={[
        'Search students by Roll No / Name / CNIC',
        'View complete academic history (semesters, courses, grades, attendance, fee status)',
        'Update student status: Active · On Leave · Graduated · Expelled',
        'Place or remove academic holds (blocks future enrollment)',
      ]}
    />
  )
}
