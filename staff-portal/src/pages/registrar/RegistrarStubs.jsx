import { FilePen, Users, BookOpen } from 'lucide-react'
import StubPage from '../../components/StubPage'

export function RegistrarGradeChanges() {
  return <StubPage kicker="Approvals" KickerIcon={FilePen} title="GRADE CHANGE PROCESSING"
    subtitle="Process HOD-cleared grade change requests."
    bullets={['Receive HOD-cleared appeals', 'Apply change in transcript ledger', 'Notify student + faculty']} />
}
export function RegistrarStudents() {
  return <StubPage kicker="Records" KickerIcon={Users} title="STUDENT RECORDS"
    subtitle="University-wide student record search + status updates."
    bullets={['Cross-faculty student search', 'Update enrolment status / disciplinary warnings', 'Retake registrations']} />
}
export function RegistrarOfferings() {
  return <StubPage kicker="Records" KickerIcon={BookOpen} title="COURSE OFFERINGS"
    subtitle="Approve the per-semester course offering plan."
    bullets={['Review which courses are open for registration', 'Set visibility rules per program / batch', 'Lock registration once published']} />
}
