import { Shield } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function CaoDcCases() {
  return (
    <StubPage
      kicker="Discipline" KickerIcon={Shield} title="DISCIPLINARY CASES (DC)"
      subtitle="Out of AO scope — DCs route here. Per AO interview: F due to attendance shortage tagged as FA in transcripts."
      bullets={[
        'Open / track DC cases per student',
        'For DC-driven F on assignment / midterm: notify Faculty to enter zero',
        'For DC-driven course F: apply directly + tag transcript',
        'Audit log retained per Compliance NFR (10 years)',
      ]}
    />
  )
}
