import { Users, AlertTriangle, ClipboardList } from 'lucide-react'
import StubPage from '../../components/StubPage'

export function ManagerEnrollments() {
  return <StubPage kicker="Operations" KickerIcon={Users} title="ENROLLMENTS"
    subtitle="Wide-access enrollment view spanning the whole faculty of computing."
    bullets={['Cross-department enrollment search', 'Approve / reject AO escalations', 'Bulk export to Excel']} />
}
export function ManagerSectionClashes() {
  return <StubPage kicker="Conflicts" KickerIcon={AlertTriangle} title="SECTION CLASHES"
    subtitle="All current section clashes across the faculty."
    bullets={['Aggregated from each AO\'s scope', 'Assign clash-resolution tickets to AOs', 'Resolution audit log']} />
}
export function ManagerLateRegistration() {
  return <StubPage kicker="Approvals" KickerIcon={ClipboardList} title="LATE REGISTRATION"
    subtitle="Manager-level oversight on the late-registration pipeline."
    bullets={['View all in-flight cases by stage', 'Identify SLA breaches', 'Escalate to HOD or Registrar']} />
}
export function ManagerStudents() {
  return <StubPage kicker="Records" KickerIcon={Users} title="STUDENT RECORDS"
    subtitle="Wide read/write access to all departmental student records."
    bullets={['Search · update · place academic holds · change status', 'Same scope as the Academic Officer']} />
}
