import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, ClipboardList, Calendar, Inbox, FilePen, FileX, BookOpen } from 'lucide-react'
import { PageHeader, StatCard, SectionCard, ActionButton } from '../../components/PageShell'

const PENDING_FACULTY = [
  { faculty: 'Hammad Afzal', course: 'CS3003', section: 'BSE-243B', missing: 'Mid-1 marks', daysOverdue: 12 },
  { faculty: 'Sara Iftikhar', course: 'CS2002', section: 'BSE-244A', missing: 'Attendance (April)', daysOverdue: 4 },
  { faculty: 'Ali Hasan',     course: 'MT3005', section: 'BSE-243A', missing: 'Quiz 3 marks', daysOverdue: 2 },
]

export default function AoDashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Academic Officer" KickerIcon={ClipboardList}
        title="ACADEMIC OPERATIONS"
        subtitle="Faculty of Computing · Spring 2026 · Manage windows, enrollments, late registrations, faculty inputs."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard Icon={Users}         label="Active Students" value="382" tone="bg-cocoa text-bone" />
        <StatCard Icon={BookOpen}      label="Sections"        value="34"  tone="bg-coffee text-bone" />
        <StatCard Icon={AlertTriangle} label="Section Clashes" value="6"   tone="bg-mustard text-ink" />
        <StatCard Icon={ClipboardList} label="Late-Reg Pending" value="3"  tone="bg-bad text-bone" />
      </div>

      <SectionCard title="Pending Faculty Inputs (Reminder Watch)" right={<ActionButton onClick={() => navigate('/ao/pending-faculty')}>Open Watchlist</ActionButton>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bone border-b-2 border-ink text-coffee">
              <Th>Faculty</Th><Th>Course / Section</Th><Th>Missing</Th><Th center>Days Overdue</Th><Th center>Action</Th>
            </tr>
          </thead>
          <tbody>
            {PENDING_FACULTY.map((p, i) => (
              <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                <td className="px-5 py-3 font-extrabold text-ink">{p.faculty}</td>
                <td className="px-5 py-3 text-ink">{p.course} · {p.section}</td>
                <td className="px-5 py-3 text-ink">{p.missing}</td>
                <td className="px-5 py-3 text-center"><span className={`tag ${p.daysOverdue > 7 ? 'bg-bad text-bone' : 'bg-mustard text-ink'}`}>{p.daysOverdue}d</span></td>
                <td className="px-5 py-3 text-center"><ActionButton tone="cocoa" Icon={Inbox}>Send Reminder</ActionButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Quick icon={Calendar}      label="Semester Windows" sub="Reg / Drop / Feedback / Retake" onClick={() => navigate('/ao/semester')} />
        <Quick icon={Users}         label="Enrollments"      sub="Search · approve · drop"        onClick={() => navigate('/ao/enrollments')} />
        <Quick icon={AlertTriangle} label="Section Clashes"  sub="6 active conflicts"            onClick={() => navigate('/ao/section-clashes')} />
        <Quick icon={ClipboardList} label="Late Registration" sub="3 pending HOD"                  onClick={() => navigate('/ao/late-registration')} />
        <Quick icon={FilePen}       label="Grade Changes"    sub="2 pending"                       onClick={() => navigate('/ao/grade-changes')} />
        <Quick icon={FileX}         label="Withdrawals"      sub="Process AO decisions"           onClick={() => navigate('/ao/withdrawals')} />
      </div>
    </div>
  )
}

function Th({ children, center }) {
  return <th className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}

function Quick({ icon: Icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="chunky-card chunky-card-hover p-4 text-left flex items-center gap-3">
      <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
        <Icon size={16} className="text-bone" strokeWidth={2.8} />
      </div>
      <div>
        <div className="font-black text-sm text-ink uppercase tracking-wider">{label}</div>
        <div className="text-[11px] text-cocoa font-bold mt-0.5">&gt; {sub}</div>
      </div>
    </button>
  )
}
