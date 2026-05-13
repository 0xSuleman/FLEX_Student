import { ShieldCheck, KeyRound, Database, Settings } from 'lucide-react'
import StubPage from '../../components/StubPage'

export function ItRoles() {
  return <StubPage kicker="Identity" KickerIcon={ShieldCheck} title="ROLES & ACCESS"
    subtitle="Define which routes / actions each role can perform."
    bullets={['Per-role permission matrix', 'Department scoping (e.g. AO of FoC vs MS)', 'Audit changes to role definitions']} />
}
export function ItPasswords() {
  return <StubPage kicker="Identity" KickerIcon={KeyRound} title="PASSWORD RESETS"
    subtitle="Reset queue + manual force-reset by IT Admin."
    bullets={['Email reset link delivered within 2 minutes', 'Manual password assignment (one-time)', 'Failed-reset audit log']} />
}
export function ItLogs() {
  return <StubPage kicker="System" KickerIcon={Database} title="AUDIT LOGS"
    subtitle="Critical-event log searchable by user / module / time window."
    bullets={['Login success / failure', 'Sensitive actions (grade publish, hold place, role change)', 'Export as CSV', 'Retention 1 year']} />
}
export function ItSettings() {
  return <StubPage kicker="System" KickerIcon={Settings} title="SYSTEM SETTINGS"
    subtitle="No-code configuration for academic year, semester windows, fee defaults."
    bullets={['Configure new academic year + semester without code', 'Automated attendence network defaults', 'Notification channel routing']} />
}
