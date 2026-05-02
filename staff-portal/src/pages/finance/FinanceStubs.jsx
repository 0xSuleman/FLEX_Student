import { Receipt, Lock, FileBarChart } from 'lucide-react'
import StubPage from '../../components/StubPage'

export function FinancePayments() {
  return <StubPage kicker="Fees" KickerIcon={Receipt} title="PAYMENTS"
    subtitle="Record manual payments, sync gateway callbacks, generate receipts."
    bullets={['Manual payment entry', 'Gateway callback log + reconciliation', 'Receipt PDFs', 'Late fines / partial payments']} />
}
export function FinanceHolds() {
  return <StubPage kicker="Fees" KickerIcon={Lock} title="FINANCIAL HOLDS"
    subtitle="Block enrolment for students with outstanding dues; trigger portal access suspension."
    bullets={['Place / remove financial hold', 'Trigger portal-access suspension on extreme cases', 'Audit log of every hold action']} />
}
export function FinanceReports() {
  return <StubPage kicker="Reports" KickerIcon={FileBarChart} title="COLLECTION REPORTS"
    subtitle="Daily / weekly / monthly fee collection summaries."
    bullets={['By department · batch · payment channel', 'Outstanding aging report', 'Excel + PDF export']} />
}
