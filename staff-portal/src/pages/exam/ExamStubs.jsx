import { Calendar, Layers, FilePen, ScrollText } from 'lucide-react'
import StubPage from '../../components/StubPage'

export function ExamSchedule() {
  return <StubPage kicker="Exams" KickerIcon={Calendar} title="EXAM SCHEDULE"
    subtitle="Build mid + final exam timetables; conflict detection."
    bullets={['Assign date/start/end/room per section', 'Conflict detection within 5 seconds', 'Publish to all students + faculty simultaneously', 'Notify of changes within 10 minutes']} />
}
export function ExamSeating() {
  return <StubPage kicker="Exams" KickerIcon={Layers} title="SEATING PLAN"
    subtitle="Per-room, per-seat assignments for each scheduled exam."
    bullets={['Auto-generate or manually assign seats', 'Print room-wise sheets', 'Search by Roll No to find seat']} />
}
export function ExamRetakes() {
  return <StubPage kicker="Exams" KickerIcon={FilePen} title="RETAKE PROCESSING"
    subtitle="Approve / reject retake decisions following Director's call. Notify within 24 hours."
    bullets={['Receive Director-cleared cases', 'Final decision + notification', 'Retake exam scheduling']} />
}
export function ExamTranscripts() {
  return <StubPage kicker="Records" KickerIcon={ScrollText} title="TRANSCRIPTS"
    subtitle="Generate official transcript PDFs for individual students."
    bullets={['Pull from finalised grade history', 'Official letterhead PDF', 'Bulk export by batch']} />
}
