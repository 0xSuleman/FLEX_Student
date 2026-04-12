import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, User, Wallet, Calendar, MessageSquare,
  Settings, LogOut, Search, Bell, Zap, ChevronLeft, ChevronRight,
  Target, Award, BookMarked, FileText, GraduationCap, Download,
  Cpu, Sparkles, Clock, TrendingUp, Radar, Receipt, FilePen,
  RotateCcw, FileX, Layers, ClipboardList,
} from 'lucide-react'

/* ------------ DATA (FLEX-style) ------------ */
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
  { label: 'Registration',         range: '14 Jan – 01 Feb 2026', tone: 'tan' },
  { label: 'Classes',               range: '19 Jan – 08 May 2026', tone: 'tan' },
  { label: 'Feedback #1',           range: '16 Feb – 20 Feb 2026', tone: 'mustard' },
  { label: 'Feedback #2',           range: '04 May – 08 May 2026', tone: 'mustard' },
  { label: 'Withdraw Request',      range: '13 Jan – 15 May 2026', tone: 'tan' },
  { label: 'Retake Request',        range: 'After Mid / Final',    tone: 'burn' },
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
  { course: 'CS3002', type: 'Sessional 1', obtained: 22,  total: 25, avg: 19,   w: 10 },
  { course: 'CS3001', type: 'Assignment 2',obtained: 9.0, total: 10, avg: 8.0,  w: 5  },
  { course: 'CS3003', type: 'Midterm',     obtained: 38,  total: 50, avg: 34,   w: 20 },
]

const PLO_SUMMARY = { overall: 78, strength: { name: 'PLO 8 · Ethics', score: 90 }, weakness: { name: 'PLO 7 · Environment', score: 65 } }

const FEE = {
  challanNo: 'CHN-2026-001',
  semester: 'Spring 2026',
  amount: 185000,
  dueDate: '20 Jan 2026',
  status: 'UNPAID',
}

const PENDING = {
  feedback: 3,     // courses with pending feedback
  retake: 0,
  withdraw: 0,
  gradeChange: 0,
}

const TICKER = '★ NUKED v1.0.90 ★ WELCOME BACK, SULEMAN ★ CGPA 3.68 ★ ATTENDANCE 86% ★ 3 FEEDBACKS PENDING ★ FEE CHALLAN UNPAID ★ REGISTRATION OPENS APR 20 ★ '

/* ------------ PAGE ------------ */
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [eventTab, setEventTab] = useState('upcoming')
  const navigate = useNavigate()

  const aggAttendance = Math.round(
    ENROLLED.reduce((s, c) => s + c.attendance, 0) / ENROLLED.length
  )

  return (
    <div className="paper-bg min-h-screen">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-60 shrink-0 bg-cocoa border-r-2 border-ink hidden lg:flex flex-col text-bone">
          <div className="px-4 py-5 border-b-2 border-ink bg-coffee/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
                <Zap size={20} className="text-bone" strokeWidth={2.8} />
              </div>
              <div>
                <div className="font-display text-base text-bone tracking-wide leading-none">NUKED</div>
                <div className="text-[11px] text-tan mt-1.5">v1.0.90</div>
              </div>
            </div>
          </div>

          {/* profile */}
          <div className="px-4 py-5 border-b-2 border-ink text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-coffee border-2 border-ink shadow-pixel rounded-md font-black text-3xl text-bone mb-3">
              SA
            </div>
            <div className="font-extrabold text-sm uppercase tracking-wider text-bone leading-tight">
              {STUDENT.name}
            </div>
            <div className="text-[11px] text-tan mt-0.5">{STUDENT.rollNo} · {STUDENT.section}</div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] text-mossL font-bold uppercase">
              <span className="w-2 h-2 bg-mossL rounded-sm animate-blink" />
              Online
            </div>
          </div>

          {/* nav */}
          <nav className="px-3 py-3 flex-1 space-y-1 overflow-y-auto">
            <NavItem icon={Home} label="Dashboard" id="dashboard" activeNav={activeNav} setActive={setActiveNav} />

            <SectionLabel>Academic</SectionLabel>
            <NavItem icon={Target} label="Attendance" id="attendance" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={Award} label="Marks" id="marks" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={Radar} label="PLO Marks" id="plo" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={BookMarked} label="Transcript" id="transcript" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={ClipboardList} label="Grade Report" id="gradeReport" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={Layers} label="Study Plan" id="studyPlan" activeNav={activeNav} setActive={setActiveNav} />

            <SectionLabel>Courses</SectionLabel>
            <NavItem icon={BookOpen} label="Registration" id="registration" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={FileX} label="Withdraw" id="withdraw" activeNav={activeNav} setActive={setActiveNav} />

            <SectionLabel>Requests</SectionLabel>
            <NavItem icon={RotateCcw} label="Retake Exam" id="retake" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={FilePen} label="Grade Change" id="gradeChange" activeNav={activeNav} setActive={setActiveNav} />

            <SectionLabel>Fees</SectionLabel>
            <NavItem icon={Wallet} label="Fee Challan" id="feeChallan" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={Receipt} label="Fee Details" id="feeDetails" activeNav={activeNav} setActive={setActiveNav} />

            <SectionLabel>Other</SectionLabel>
            <NavItem icon={MessageSquare} label="Feedback" id="feedback" activeNav={activeNav} setActive={setActiveNav} />
          </nav>

          <div className="px-3 py-3 border-t-2 border-ink space-y-1">
            <NavItem icon={Settings} label="Settings" id="settings" activeNav={activeNav} setActive={setActiveNav} />
            <NavItem icon={LogOut} label="Sign Out" onClick={() => navigate('/login')} />
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* breadcrumb */}
          <div className="border-b-2 border-ink bg-cocoa px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Cpu size={16} className="text-burnL" />
              <span className="text-tan">Home</span>
              <span className="text-tan/50">/</span>
              <span className="text-bone">Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-coffee/60 border-2 border-ink rounded-md px-3 py-1.5 w-64">
                <Search size={14} className="text-tan" />
                <input
                  placeholder="Search courses, fees, requests..."
                  className="bg-transparent text-sm text-bone placeholder:text-tan/60 focus:outline-none w-full font-medium"
                />
              </div>
              <button className="relative bg-coffee/60 border-2 border-ink rounded-md p-2 shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                <Bell size={14} className="text-bone" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-burn border-2 border-ink rounded-full" />
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 grid grid-cols-12 gap-5">
            {/* LEFT */}
            <div className="col-span-12 xl:col-span-8 space-y-5">
              {/* welcome + student strip */}
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

              {/* UNIVERSITY INFO */}
              <div className="chunky-card p-5">
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

              {/* BENTO: CGPA / ATTENDANCE / FEE */}
              <div className="grid grid-cols-12 gap-5">
                {/* CGPA */}
                <div className="col-span-12 sm:col-span-5 chunky-card chunky-card-hover p-5 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-burn/10" />
                  <div className="relative">
                    <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">// CGPA</div>
                    <div className="flex items-end gap-3 mt-2">
                      <div className="font-black text-6xl text-ink leading-none">{STUDENT.cgpa.toFixed(2)}</div>
                      <div className="flex items-center gap-1 text-moss font-extrabold text-sm pb-2">
                        <TrendingUp size={14} strokeWidth={3} /> SGPA {STUDENT.sgpa.toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <MiniStat label="Cr. Earned" value={STUDENT.creditsEarned} />
                      <MiniStat label="Cr. Attempted" value={STUDENT.creditsAttempted} />
                      <MiniStat label="Rank" value="#12" />
                    </div>
                  </div>
                </div>

                {/* ATTENDANCE */}
                <div className="col-span-6 sm:col-span-4 chunky-card chunky-card-hover p-5">
                  <div className="text-xs font-extrabold text-coffee uppercase tracking-widest mb-3">// Attendance</div>
                  <div className="flex items-center gap-4">
                    <AttendanceBar pct={aggAttendance} />
                    <div className="flex-1 space-y-1">
                      {ENROLLED.slice(0, 4).map((c) => (
                        <div key={c.code} className="flex items-center gap-2">
                          <span className="font-extrabold text-[11px] text-ink w-14">{c.code}</span>
                          <div className="flex-1 h-1.5 bg-bone border border-ink rounded-sm overflow-hidden">
                            <div className={`h-full ${c.attendance >= 80 ? 'bg-moss' : 'bg-bad'}`} style={{ width: `${c.attendance}%` }} />
                          </div>
                          <span className={`text-[10px] font-extrabold w-8 text-right ${c.attendance >= 80 ? 'text-moss' : 'text-bad'}`}>
                            {c.attendance}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FEE */}
                <div className="col-span-6 sm:col-span-3 chunky-card chunky-card-hover p-5 relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-burn/10" />
                  <div className="relative">
                    <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">// Fee</div>
                    <div className="text-[10px] text-cocoa/70 uppercase font-bold mt-2">Next Challan</div>
                    <div className="font-black text-xl text-ink mt-0.5">Rs {(FEE.amount / 1000)}K</div>
                    <div className="text-[11px] font-bold text-coffee mt-1">{FEE.challanNo}</div>
                    <div className="text-[10px] text-cocoa mt-0.5">Due {FEE.dueDate}</div>
                    <span className={`tag mt-3 inline-block ${FEE.status === 'UNPAID' ? 'bg-coffee text-bone' : 'bg-moss text-cream'}`}>
                      {FEE.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ENROLLED COURSES */}
              <div className="chunky-card overflow-hidden">
                <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
                  <h3 className="heading-retro text-sm">// Enrolled Courses — Spring 2026</h3>
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    {ENROLLED.reduce((s, c) => s + c.cr, 0)} CR
                  </span>
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
                      <tr
                        key={c.code}
                        className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}
                      >
                        <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                        <td className="px-5 py-3 text-ink">{c.name}</td>
                        <td className="px-5 py-3 text-center text-cocoa font-bold text-xs">{c.section}</td>
                        <td className="px-5 py-3 text-center font-extrabold">{c.cr}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`font-extrabold ${c.attendance >= 80 ? 'text-moss' : 'text-bad'}`}>
                            {c.attendance}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="tag bg-coffee text-bone">{c.latestGrade}</span>
                        </td>
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
                      const pct = (m.obtained / m.total) * 100
                      const avgPct = (m.avg / m.total) * 100
                      const above = pct >= avgPct
                      return (
                        <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                          <td className="px-5 py-3 font-extrabold text-ink">{m.course}</td>
                          <td className="px-5 py-3 text-ink">{m.type}</td>
                          <td className="px-5 py-3 text-center font-bold">{m.w}%</td>
                          <td className="px-5 py-3 text-center font-extrabold text-ink">{m.obtained} / {m.total}</td>
                          <td className="px-5 py-3 text-center text-cocoa">{m.avg}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`tag ${above ? 'bg-moss text-cream' : 'bg-burn text-cream'}`}>
                              {above ? '▲ ABOVE' : '▼ BELOW'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* QUICK ACTIONS */}
              <div>
                <h2 className="heading-retro text-2xl mb-4">// Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <QuickAction icon={BookOpen} label="Register" sub="Courses" />
                  <QuickAction icon={Wallet} label="Pay Fee" sub="Challan" />
                  <QuickAction icon={MessageSquare} label="Feedback" sub={`${PENDING.feedback} pending`} />
                  <QuickAction icon={RotateCcw} label="Retake" sub="Request" />
                  <QuickAction icon={FileX} label="Withdraw" sub="Course" />
                  <QuickAction icon={Download} label="Transcript" sub="PDF" />
                </div>
              </div>
            </div>

            {/* RIGHT RAIL */}
            <div className="col-span-12 xl:col-span-4 space-y-5">
              {/* PENDING ACTIONS ALERT */}
              {PENDING.feedback > 0 && (
                <div className="bg-cocoa text-bone border-2 border-ink rounded-lg shadow-pixel p-5 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-mustard/20" />
                  <div className="relative flex items-start gap-3">
                    <div className="w-10 h-10 bg-coffee border-2 border-ink rounded-md shadow-pixel-sm flex items-center justify-center shrink-0">
                      <Sparkles size={16} className="text-bone" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <div className="tag bg-bone text-ink">Action Required</div>
                      <h3 className="font-black text-base text-bone mt-2 leading-tight uppercase tracking-tight">
                        {PENDING.feedback} course feedbacks pending
                      </h3>
                      <p className="text-xs text-tan mt-1 leading-relaxed">
                        Feedback window closes May 8. Submit early and help us improve.
                      </p>
                      <button className="btn-primary mt-3 text-xs px-4 py-2">
                        Give Feedback <ChevronRight size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACADEMIC CALENDAR */}
              <div className="chunky-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-cocoa text-bone">
                  <span className="font-black text-xs uppercase tracking-widest">// Academic Calendar</span>
                  <Calendar size={14} />
                </div>
                <div className="p-4 space-y-2.5">
                  {CALENDAR_EVENTS.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 bg-bone border-2 border-ink rounded shadow-pixel-sm">
                      <div className={`w-1.5 self-stretch rounded-full ${
                        e.tone === 'burn' ? 'bg-burn' : e.tone === 'mustard' ? 'bg-mustard' : 'bg-tan'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold text-ink uppercase tracking-wider">{e.label}</div>
                        <div className="text-[11px] text-cocoa mt-0.5 font-medium">{e.range}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PLO MINI */}
              <div className="chunky-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="heading-retro text-sm">// PLO Attainment</h3>
                  <Radar size={14} className="text-cocoa" />
                </div>
                <div className="flex items-end gap-3">
                  <div className="font-black text-5xl text-ink leading-none">{PLO_SUMMARY.overall}%</div>
                  <div className="text-[11px] text-cocoa font-bold pb-1">overall</div>
                </div>
                <div className="h-2 bg-bone border border-ink mt-3 rounded-sm overflow-hidden">
                  <div className="h-full bg-moss" style={{ width: `${PLO_SUMMARY.overall}%` }} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-moss/20 border-2 border-ink rounded">
                    <div>
                      <div className="text-[9px] font-extrabold text-coffee uppercase">Strength</div>
                      <div className="text-xs font-extrabold text-ink">{PLO_SUMMARY.strength.name}</div>
                    </div>
                    <span className="font-black text-moss">{PLO_SUMMARY.strength.score}%</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-burn/20 border-2 border-ink rounded">
                    <div>
                      <div className="text-[9px] font-extrabold text-coffee uppercase">Weakness</div>
                      <div className="text-xs font-extrabold text-ink">{PLO_SUMMARY.weakness.name}</div>
                    </div>
                    <span className="font-black text-rust">{PLO_SUMMARY.weakness.score}%</span>
                  </div>
                </div>
              </div>

              {/* PENDING REQUESTS */}
              <div className="chunky-card p-5">
                <h3 className="heading-retro text-sm mb-3">// Pending Requests</h3>
                <div className="space-y-2">
                  <RequestRow label="Retake Exam" count={PENDING.retake} />
                  <RequestRow label="Course Withdraw" count={PENDING.withdraw} />
                  <RequestRow label="Grade Change" count={PENDING.gradeChange} />
                </div>
              </div>

              {/* SYSTEM */}
              <div className="chunky-card p-5 bg-ink text-bone">
                <div className="font-black text-xs uppercase tracking-widest mb-3 text-mossL">// System</div>
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

          {/* footer */}
          <div className="border-t-2 border-ink bg-cocoa text-bone px-6 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-mossL rounded-sm animate-blink" />
                Connected
              </span>
              <span>·</span>
              <span>{STUDENT.rollNo}</span>
              <span>·</span>
              <span>{STUDENT.section}</span>
              <span>·</span>
              <span>{STUDENT.campus}</span>
            </div>
            <div>NUKED v1.0.90 · Press F1 for Help</div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ------------ COMPONENTS ------------ */

function SectionLabel({ children }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.15em] text-tan">
      &gt; {children}
    </div>
  )
}

function NavItem({ icon: Icon, label, id, activeNav, setActive, onClick }) {
  const isActive = id && activeNav === id
  return (
    <button
      onClick={onClick || (() => setActive && setActive(id))}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left font-extrabold text-xs uppercase tracking-wider border-2 rounded-md transition-all ${
        isActive
          ? 'bg-coffee text-bone border-burn shadow-pixel-sm'
          : 'bg-transparent text-bone border-transparent hover:bg-coffee/60 hover:border-ink'
      }`}
    >
      <Icon size={14} strokeWidth={2.8} />
      <span>{label}</span>
      {isActive && <span className="ml-auto animate-blink">&lt;</span>}
    </button>
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
          <div
            key={i}
            className={`w-2 h-4 border border-ink rounded-[1px] ${
              i < filled ? (pct >= 80 ? 'bg-moss' : 'bg-bad') : 'bg-bone'
            }`}
          />
        ))}
      </div>
      <div className="text-center text-[9px] font-extrabold mt-1 uppercase tracking-widest" style={{ color: pct >= 80 ? '#0F766E' : '#DC2626' }}>
        {pct >= 80 ? 'On Track' : 'Low'}
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, sub }) {
  return (
    <button className="chunky-card chunky-card-hover p-3 text-left">
      <div className="w-9 h-9 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center mb-2">
        <Icon size={15} className="text-bone" strokeWidth={2.8} />
      </div>
      <div className="font-black text-xs text-ink uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-cocoa font-bold mt-0.5">&gt; {sub}</div>
    </button>
  )
}

function RequestRow({ label, count }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-bone border-2 border-ink rounded">
      <span className="text-xs font-extrabold text-ink uppercase tracking-wider">{label}</span>
      <span className={`tag ${count > 0 ? 'bg-burn text-cream' : 'bg-moss text-cream'}`}>
        {count > 0 ? `${count} open` : 'None'}
      </span>
    </div>
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
