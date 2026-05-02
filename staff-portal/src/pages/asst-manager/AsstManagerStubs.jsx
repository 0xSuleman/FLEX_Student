import { Mail, Users } from 'lucide-react'
import StubPage from '../../components/StubPage'

export function AsstManagerMailing() {
  return <StubPage kicker="Mail" KickerIcon={Mail} title="MAILING LISTS"
    subtitle="Same composer as Asst Academic Officer; scoped to lists assigned by Manager."
    bullets={['Pre-built lists', 'Compose · attach · send', 'Excel roll+email export']} />
}
export function AsstManagerStudents() {
  return <StubPage kicker="View" KickerIcon={Users} title="STUDENT RECORDS — READ ONLY"
    subtitle="Read-only access to records inside Manager's scope."
    bullets={['Search by Roll · Name', 'View profile / enrollments / attendance / fees', 'No writes — escalate to Manager']} />
}
