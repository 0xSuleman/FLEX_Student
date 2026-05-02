import { FilePen } from 'lucide-react'
import StubPage from '../../components/StubPage'

export default function AoGradeChanges() {
  return (
    <StubPage
      kicker="Records" KickerIcon={FilePen}
      title="GRADE CHANGE APPEALS"
      subtitle="Forward student grade-change appeals to Faculty for review, then route to HOD."
      bullets={[
        'List of pending appeals (Roll · Course · Section · current Grade · submitted)',
        'Forward to relevant Faculty with one click',
        'Approve / reject after Faculty review',
      ]}
    />
  )
}
