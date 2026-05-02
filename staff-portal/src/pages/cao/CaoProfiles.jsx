import { Send } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function CaoProfiles() {
  return (
    <StubPage
      kicker="Operations" KickerIcon={Send} title="PROFILE DISTRIBUTION"
      subtitle="Distribute initial student profiles created here to the local Academic Offices."
      bullets={[
        'Pull from Admissions intake → review → batch dispatch to AOs',
        'Per-campus distribution lists',
        'Tracks which AO confirmed receipt + onboarded each profile',
      ]}
    />
  )
}
