import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Wallet, Calendar, MessageSquare,
  ChevronLeft, ChevronRight, Sparkles, Clock, TrendingUp,
  Download, RotateCcw, FileX, User, Cpu,
} from 'lucide-react'

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    let start = null
    const animate = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(target * eased)
      if (p < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

const STUDENT = {
  rollNo: '24L-3072',
  name: 'Suleman Ahmed',
  degree: 'BS(SE)',
  batch: 'Fall 2024',
  section: 'BSE-243A',
  campus: 'Lahore',
  status: 'Current',
  cgpa: 3.68,
  sgpa: 3.74,
  creditsEarned: 78,
  creditsAttempted: 78,
}

const CALENDAR_EVENTS = [
  { label: 'Registration',     range: '14 Jan – 01 Feb 2026', tone: 'tan' },
  { label: 'Classes',           range: '19 Jan – 08 May 2026', tone: 'tan' },
  { label: 'Feedback #1',       range: '16 Feb – 20 Feb 2026', tone: 'mustard' },
  { label: 'Feedback #2',       range: '04 May – 08 May 2026', tone: 'mustard' },
  { label: 'Withdraw Request',  range: '13 Jan – 15 May 2026', tone: 'tan' },
  { label: 'Retake Request',    range: 'After Mid / Final',    tone: 'burn' },
]

const ENROLLED = [
  { code: 'CS3001', name: 'Software Engineering',    section: 'BSE-243A', cr: 3, attendance: 92, latestGrade: 'A-' },
  { code: 'CS3002', name: 'Database Systems',         section: 'BSE-243A', cr: 4, attendance: 88, latestGrade: 'B+' },
  { code: 'CS3003', name: 'Operating Systems',        section: 'BSE-243B', cr: 3, attendance: 70, latestGrade: 'B'  },
  { code: 'MT3005', name: 'Probability & Statistics', section: 'BSE-243A', cr: 3, attendance: 95, latestGrade: 'A'  },
  { code: 'HS3006', name: 'Technical Writing',        section: 'BSE-243B', cr: 2, attendance: 84, latestGrade: 'B+' },
]

const RECENT_MARKS = [
  { course: 'CS3001', type: 'Quiz 3',      obtained: 4.8, total: 5,  avg: 3.5,  w: 5  },
  { course: 'CS3002', type: 'Mid 1',       obtained: 22,  total: 25, avg: 19,   w: 10 },
  { course: 'CS3001', type: 'Assignment 2',obtained: 9.0, total: 10, avg: 8.0,  w: 5  },
  { course: 'CS3003', type: 'Midterm',     obtained: 38,  total: 50, avg: 34,   w: 20 },
]

const FEE = {
  challanNo: 'CHN-2026-001',
  semester: 'Spring 2026',
  amount: 185000,
  dueDate: '20 Jan 2026',
  status: 'UNPAID',
}

const PENDING = { feedback: 3 }

const CONTACT = {
  permanent: { address: 'Housing Scheme 2v, Burewala', phone: '-', postal: '-', city: 'Burewala', country: 'Pakistan' },
  current:   { address: 'Housing Scheme 2v, Burewala', phone: '-', postal: '-', city: 'Burewala', country: 'Pakistan' },
}

const FAMILY = [
  { relation: 'Father', name: 'Muhammad Saeed', cnic: '35202-XXXXXXX-X', tax: 'Filer' },
  { relation: 'Mother', name: 'Fatima Saeed',   cnic: '35202-XXXXXXX-X', tax: 'Non-Filer' },
]

const PERSONAL = {
  name: 'Suleman Ahmed',
  dob: '2005-07-22',
  bloodGroup: 'O+',
  gender: 'Male',
  cnic: '35202-XXXXXXX-X',
  nationality: 'Pakistani',
  email: 'suleman@nu.edu.pk',
  mobile: '0318-4567625',
}

const gradeColor = (g) => {
  if (!g) return 'bg-bone/40 text-cocoa/40'
  if (g.startsWith('A')) return 'bg-cocoa text-bone'
  if (g.startsWith('B')) return 'bg-mustard text-ink'
  if (g.startsWith('C')) return 'bg-tan text-ink'
  if (g.startsWith('D')) return 'bg-burn text-bone'
  if (g === 'F') return 'bg-cocoa text-bone'
  return 'bg-cocoa text-bone'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const aggAttendance = Math.round(ENROLLED.reduce((s, c) => s + c.attendance, 0) / ENROLLED.length)
  const cgpaAnim = useCountUp(STUDENT.cgpa, 1500)
  const sgpaAnim = useCountUp(STUDENT.sgpa, 1500)

  return (
    <div className="grid grid-cols-12 gap-5 max-w-[1500px]">
      {/* LEFT */}
      <div className="col-span-12 xl:col-span-8 space-y-5">
        {/* welcome + compact calendar */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-bold text-coffee uppercase tracking-wider">
              Saturday · April 11, 2026
            </div>
            <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">
              HELLO, {STUDENT.name.split(' ')[0].toUpperCase()}
            </h1>
            <p className="text-sm text-cocoa mt-2">
              Spring 2026 · {ENROLLED.length} courses · Aggregate attendance {aggAttendance}%.
            </p>
          </div>
          <DashboardCalendar />
        </div>

        {/* UNIVERSITY INFO */}
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.03s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-retro text-sm">// University Info</h3>
            <span className="tag bg-moss text-cream">{STUDENT.status}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <InfoBox label="Roll No" value={STUDENT.rollNo} />
            <InfoBox label="Degree" value={STUDENT.degree} />
            <InfoBox label="Batch" value={STUDENT.batch} />
            <InfoBox label="Section" value={STUDENT.section} />
            <InfoBox label="Campus" value={STUDENT.campus} />
            <InfoBox label="Status" value={STUDENT.status} />
          </div>
        </div>

        {/* BENTO */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 sm:col-span-5 chunky-card chunky-card-hover p-5 relative overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-burn/10" />
            <div className="relative">
              <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">// CGPA</div>
              <div className="flex items-end gap-3 mt-2">
                <div className="font-black text-6xl text-ink leading-none tabular-nums">{cgpaAnim.toFixed(2)}</div>
                <div className="flex items-center gap-1 text-moss font-extrabold text-sm pb-2">
                  <TrendingUp size={14} strokeWidth={3} /> SGPA {sgpaAnim.toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <MiniStat label="Cr. Earned" value={STUDENT.creditsEarned} />
                <MiniStat label="Cr. Attempted" value={STUDENT.creditsAttempted} />
                <MiniStat label="Rank" value="#12" />
              </div>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4 chunky-card chunky-card-hover p-5 cascade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-xs font-extrabold text-coffee uppercase tracking-widest mb-3">// Attendance</div>
            <div className="flex items-center gap-4">
              <AttendanceBar pct={aggAttendance} />
              <div className="flex-1 space-y-1">
                {ENROLLED.slice(0, 4).map((c, idx) => (
                  <div key={c.code} className="flex items-center gap-2">
                    <span className="font-extrabold text-[11px] text-ink w-14">{c.code}</span>
                    <div className="flex-1 h-1.5 bg-bone border border-ink rounded-sm overflow-hidden">
                      <div
                        className="h-full bar-fill"
                        style={{
                          '--target': `${c.attendance}%`,
                          animationDelay: `${idx * 0.1}s`,
                          backgroundColor: c.attendance >= 80 ? '#10B981' : '#DC2626',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold w-8 text-right" style={{ color: c.attendance >= 80 ? '#10B981' : '#DC2626' }}>
                      {c.attendance}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-3 chunky-card chunky-card-hover p-5 relative overflow-hidden cascade-in" style={{ animationDelay: '0.3s' }}>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-burn/10" />
            <div className="relative">
              <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">// Fee</div>
              <div className="text-[10px] text-cocoa/70 uppercase font-bold mt-2">Next Challan</div>
              <div className="font-black text-xl text-ink mt-0.5">Rs {(FEE.amount / 1000)}K</div>
              <div className="text-[11px] font-bold text-coffee mt-1">{FEE.challanNo}</div>
              <div className="text-[10px] text-cocoa mt-0.5">Due {FEE.dueDate}</div>
              <span className={`tag mt-3 inline-block ${FEE.status === 'UNPAID' ? 'bg-cocoa text-bone' : 'bg-moss text-cream'}`}>
                {FEE.status}
              </span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="cascade-in" style={{ animationDelay: '0.04s' }}>
          <h2 className="heading-retro text-2xl mb-4">// Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickAction icon={BookOpen}       label="Register"   sub="Courses"           onClick={() => navigate('/course-registration')} />
            <QuickAction icon={Wallet}         label="Pay Fee"    sub="Challan"           onClick={() => navigate('/fee-challan')} />
            <QuickAction icon={MessageSquare}  label="Feedback"   sub={`${PENDING.feedback} pending`} onClick={() => navigate('/feedback')} />
            <QuickAction icon={RotateCcw}      label="Retake"     sub="Request"           onClick={() => navigate('/retake-exam')} />
            <QuickAction icon={FileX}          label="Withdraw"   sub="Course"            onClick={() => navigate('/course-withdraw')} />
            <QuickAction icon={Download}       label="Transcript" sub="PDF"               onClick={() => navigate('/transcript')} />
          </div>
        </div>

        {/* ENROLLED COURSES */}
        <div className="chunky-card overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">// Enrolled Courses — Spring 2026</h3>
            <span className="text-xs font-bold text-ink uppercase tracking-wider">{ENROLLED.reduce((s, c) => s + c.cr, 0)} CR</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Section</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">CrHrs</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Att</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Grade</th>
              </tr>
            </thead>
            <tbody>
              {ENROLLED.map((c, i) => (
                <tr key={c.code} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                  <td className="px-5 py-3 text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.section}</span></td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`tag ${c.attendance >= 80 ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>{c.attendance}%</span>
                  </td>
                  <td className="px-5 py-3 text-center"><span className={`tag ${gradeColor(c.latestGrade)}`}>{c.latestGrade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RECENT MARKS */}
        <div className="chunky-card overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">// Recent Evaluations</h3>
            <span className="text-xs font-bold text-ink uppercase tracking-wider">Latest 4</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Evaluation</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Weight</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Score</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Class Avg</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_MARKS.map((m, i) => {
                const above = (m.obtained / m.total) >= (m.avg / m.total)
                return (
                  <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                    <td className="px-5 py-3 font-extrabold text-ink">{m.course}</td>
                    <td className="px-5 py-3 text-ink">{m.type}</td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-tan/40 text-ink">{m.w}%</span></td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">{m.obtained} / {m.total}</span></td>
                    <td className="px-5 py-3 text-center"><span className="tag bg-mustard/20 text-ink">{m.avg}</span></td>
                    <td className="px-5 py-3 text-center">
                      <span className={`tag ${above ? 'bg-moss text-cream' : 'bg-cocoa text-bone'}`}>{above ? '▲ ABOVE' : '▼ BELOW'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* RIGHT RAIL */}
      <div className="col-span-12 xl:col-span-4 space-y-5">
        {/* ACADEMIC CALENDAR */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-cocoa text-bone">
            <span className="font-black text-xs uppercase tracking-widest">// Academic Calendar</span>
            <Calendar size={14} />
          </div>
          <div className="p-4 space-y-2.5">
            {CALENDAR_EVENTS.map((e, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2.5 bg-bone border-2 border-ink rounded shadow-pixel-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel transition-all cascade-in"
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
              >
                <div className={`w-1.5 self-stretch rounded-full ${e.tone === 'burn' ? 'bg-burn' : e.tone === 'mustard' ? 'bg-mustard' : 'bg-tan'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-ink uppercase tracking-wider">{e.label}</div>
                  <div className="text-[11px] text-cocoa mt-0.5 font-medium">{e.range}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.18s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-retro text-sm">// Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBox label="Name" value={PERSONAL.name} />
            <InfoBox label="Date of Birth" value={PERSONAL.dob} />
            <InfoBox label="Blood Group" value={PERSONAL.bloodGroup} />
            <InfoBox label="Gender" value={PERSONAL.gender} />
            <InfoBox label="CNIC" value={PERSONAL.cnic} />
            <InfoBox label="Nationality" value={PERSONAL.nationality} />
            <InfoBox label="Email" value={PERSONAL.email} />
            <InfoBox label="Mobile" value={PERSONAL.mobile} />
          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.12s' }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">Contact Information</h3>
            <Cpu size={14} className="text-ink" />
          </div>
          <div className="p-5 space-y-5">
            <ContactBlock label="Permanent" data={CONTACT.permanent} />
            <ContactBlock label="Current"   data={CONTACT.current}   />
          </div>
        </div>

        {/* FAMILY INFO */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.26s' }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">Family Information</h3>
            <User size={14} className="text-ink" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Relation</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Name</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Tax</th>
              </tr>
            </thead>
            <tbody>
              {FAMILY.map((f, i) => (
                <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-3 py-3 font-extrabold text-ink text-xs">{f.relation}</td>
                  <td className="px-3 py-3 text-ink text-xs">{f.name}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`tag ${f.tax === 'Filer' ? 'bg-moss text-cream' : 'bg-burn text-bone'}`}>{f.tax}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SYSTEM — at bottom */}
        <div className="chunky-card p-5 bg-ink text-bone">
          <div className="font-black text-xs uppercase tracking-widest mb-3 text-mossL">System</div>
          <div className="space-y-1.5 text-sm font-bold">
            <SysLine label="Semester" value="Spring 26" />
            <SysLine label="Last sync" value="3 min" />
            <SysLine label="Node" value="FAST-LHR" />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-dashed border-bone/20">
              <span className="w-2 h-2 bg-mossL rounded-sm animate-blink" />
              <span className="text-mossL uppercase tracking-wider text-[11px]">All systems nominal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-bone border-2 border-ink rounded p-2.5">
      <div className="text-[9px] font-extrabold text-coffee uppercase tracking-widest">{label}</div>
      <div className="font-extrabold text-sm text-ink mt-1 truncate">{value}</div>
    </div>
  )
}

function ContactBlock({ label, data }) {
  return (
    <div className="bg-bone border-2 border-ink rounded-md p-4 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel-sm transition-all">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-dashed border-cocoa/30">
        <span className="w-2 h-2 bg-burn rounded-sm" />
        <h4 className="font-display text-[10px] text-ink uppercase tracking-widest">{label}</h4>
      </div>
      <div className="space-y-2 text-xs">
        {Object.entries({ Address: data.address, 'Home Phone': data.phone, Postal: data.postal, City: data.city, Country: data.country }).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2">
            <span className="text-[10px] font-extrabold text-coffee uppercase tracking-wider min-w-[64px]">{k}</span>
            <span className="text-ink font-bold flex-1 truncate">{v || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-bone border-2 border-ink rounded px-2 py-1.5 text-center">
      <div className="text-[9px] font-extrabold text-coffee uppercase tracking-wider">{label}</div>
      <div className="font-black text-sm text-ink mt-0.5">{value}</div>
    </div>
  )
}

function AttendanceBar({ pct }) {
  const blocks = 8
  const filled = Math.round((pct / 100) * blocks)
  return (
    <div className="shrink-0">
      <div className="font-black text-3xl text-ink text-center leading-none mb-1">{pct}%</div>
      <div className="flex gap-0.5 justify-center">
        {[...Array(blocks)].map((_, i) => (
          <div key={i} className="w-2 h-4 border border-ink rounded-[1px]" style={{ backgroundColor: i < filled ? (pct >= 80 ? '#10B981' : '#DC2626') : '#FCF5DF' }} />
        ))}
      </div>
      <div className="text-center text-[9px] font-extrabold mt-1 uppercase tracking-widest" style={{ color: pct >= 80 ? '#10B981' : '#DC2626' }}>
        {pct >= 80 ? 'On Track' : 'Low'}
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="chunky-card chunky-card-hover p-3 text-left">
      <div className="w-9 h-9 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center mb-2">
        <Icon size={15} className="text-bone" strokeWidth={2.8} />
      </div>
      <div className="font-black text-xs text-ink uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-cocoa font-bold mt-0.5">&gt; {sub}</div>
    </button>
  )
}

function SysLine({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-bone/70 uppercase tracking-wider text-[11px]">&gt; {label}</span>
      <span className="text-mossL uppercase tracking-wider text-[11px]">{value}</span>
    </div>
  )
}

function DashboardCalendar() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const [month, setMonth] = useState(4)
  const year = 2026
  const pkNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
  const todayMonth = pkNow.getMonth() + 1
  const todayDay = pkNow.getDate()
  const eventsByMonth = { 1: [14, 19, 26], 2: [16, 18, 20], 4: [14, 16, 18, 22], 5: [4, 6, 8] }
  const events = eventsByMonth[month] || []

  const firstPos = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()

  const cells = []
  for (let i = firstPos - 1; i >= 0; i--) cells.push({ d: prevMonthLastDay - i, muted: true })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, muted: false })
  let next = 1
  while (cells.length % 7 !== 0) cells.push({ d: next++, muted: true })

  return (
    <div className="bg-cream border-2 border-ink rounded-lg shadow-pixel overflow-hidden cascade-in shrink-0 w-[260px]" style={{ animationDelay: '0.05s' }}>
      <div className="bg-cocoa border-b-2 border-ink px-3 py-2 flex items-center justify-between">
        <button onClick={() => month > 1 && setMonth(month - 1)} disabled={month <= 1} className={`transition-all ${month > 1 ? 'text-bone/80 hover:text-burn hover:-translate-x-0.5' : 'text-bone/20 cursor-not-allowed'}`}>
          <ChevronLeft size={16} strokeWidth={3} />
        </button>
        <div className="font-display text-[10px] text-bone uppercase tracking-wider">{monthNames[month - 1]} {year}</div>
        <button onClick={() => month < 12 && setMonth(month + 1)} disabled={month >= 12} className={`transition-all ${month < 12 ? 'text-bone/80 hover:text-burn hover:translate-x-0.5' : 'text-bone/20 cursor-not-allowed'}`}>
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>
      <div className="p-2.5">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {days.map((d, i) => <div key={i} className="text-[9px] font-extrabold text-cocoa text-center py-0.5 uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((c, i) => {
            const isToday = !c.muted && month === todayMonth && c.d === todayDay
            const isEvent = !c.muted && events.includes(c.d)
            return (
              <button key={i} className={`h-7 rounded border relative flex items-center justify-center text-[10px] font-extrabold transition-all ${
                isToday ? 'bg-cocoa text-bone border-ink today-pulse'
                  : c.muted ? 'bg-bone/40 text-cocoa/30 border-tan/30'
                  : isEvent ? 'bg-bone text-ink border-burn hover:scale-110'
                  : 'bg-bone text-ink border-tan/50 hover:bg-tan/30 hover:scale-110'
              }`}>
                {c.d}
                {isEvent && !isToday && <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-burn" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
