import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  BookOpen, Calendar, KeyRound, GraduationCap, FileX, BarChart3,
  Users, Clock, AlertTriangle, ChevronRight, MessageSquare, Award,
} from 'lucide-react'

const FALLBACK_ASSIGNED = []

const TODAY = [
  { time: '10:00', course: 'CS3001 — BSE-243A', room: 'C-204', status: 'Upcoming' },
  { time: '11:30', course: 'CS3001 — BSE-243B', room: 'C-204', status: 'Upcoming' },
]

const PENDING_TASKS = [
  { type: 'WITHDRAWAL',  count: 2, label: 'Withdrawal requests',     link: '/faculty/withdrawals', tone: 'burn' },
  { type: 'MARKS',       count: 1, label: 'Mid-1 marks pending',     link: '/faculty/marks',       tone: 'mustard' },
  { type: 'GRADE',       count: 1, label: 'Grade sheet returned',    link: '/faculty/grading',     tone: 'bad' },
  { type: 'ATTENDANCE',  count: 3, label: 'Sessions awaiting topic', link: '/faculty/attendance',  tone: 'tan' },
]

const LOW_ATT = []

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const FAC = {
    name: user?.name || 'Faculty',
    designation: user?.designation || 'Lecturer',
    department: user?.department || '—',
    employeeId: user?.employeeId || '—',
    username: user?.username || '—',
  }

  const [assigned, setAssigned] = useState(FALLBACK_ASSIGNED)

  useEffect(() => {
    let cancelled = false
    api.get('/faculty/courses?semester=Spring%202026')
      .then(res => {
        if (cancelled) return
        const arr = Array.isArray(res.data) ? res.data : []
        if (arr.length === 0) return
        setAssigned(arr.map(s => ({
          code: s.courseCode,
          name: s.courseName,
          section: s.section,
          enrolled: s.enrolled,
          room: s.room || '—',
          day: s.dayPattern || '—',
          time: s.timeSlot || '—',
        })))
      })
      .catch(() => { /* fall back to mock */ })
    return () => { cancelled = true }
  }, [])

  const totalEnrolled = assigned.reduce((s, c) => s + c.enrolled, 0)
  const totalSections = assigned.length
  const pendingCount = PENDING_TASKS.reduce((s, t) => s + t.count, 0)

  return (
    <div className="grid grid-cols-12 gap-5 max-w-[1500px]">
      {/* LEFT */}
      <div className="col-span-12 xl:col-span-8 space-y-5">
        {/* welcome */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-bold text-coffee uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(',', ' ·')}
            </div>
            <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">
              HELLO,{' '}
              {FAC.name.split(' ')[0].toUpperCase().split('').map((ch, i) => (
                <span key={i} className="inline-block letter-wave" style={{ animationDelay: `${i * 0.07}s` }}>{ch}</span>
              ))}
            </h1>
            <p className="text-sm text-cocoa mt-2">
              Spring 2026 · {totalSections} sections · {totalEnrolled} students · {pendingCount} pending tasks.
            </p>
          </div>
        </div>

        {/* FACULTY INFO */}
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.03s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-retro text-sm">Faculty Profile</h3>
            <span className="tag bg-moss text-cream">Active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <InfoBox label="Name" value={FAC.name} />
            <InfoBox label="Username" value={FAC.username} />
            <InfoBox label="Employee ID" value={FAC.employeeId} />
            <InfoBox label="Designation" value={FAC.designation} />
            <InfoBox label="Department" value={FAC.department} />
            <InfoBox label="Campus" value="Lahore" />
          </div>
        </div>

        {/* BENTO */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 sm:col-span-5 chunky-card chunky-card-hover p-5 relative overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-burn/10" />
            <div className="relative">
              <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">Sections</div>
              <div className="flex items-end gap-3 mt-2">
                <div className="font-black text-6xl text-ink leading-none tabular-nums">{totalSections}</div>
                <div className="flex items-center gap-1 text-moss font-extrabold text-sm pb-2">
                  <Users size={14} strokeWidth={3} /> {totalEnrolled} STUDENTS
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <MiniStat label="Today" value={TODAY.length} />
                <MiniStat label="Below 75%" value={LOW_ATT.length} />
              </div>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4 chunky-card chunky-card-hover p-5 cascade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-xs font-extrabold text-coffee uppercase tracking-widest mb-2">Today</div>
            <div className="space-y-2">
              {TODAY.map((t, i) => (
                <div key={i} className="bg-bone border-2 border-ink rounded p-2.5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel-sm transition-all">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-burn shrink-0" strokeWidth={3} />
                    <span className="font-extrabold text-xs text-ink">{t.time}</span>
                    <span className="tag bg-tan text-ink ml-auto text-[9px]">{t.room}</span>
                  </div>
                  <div className="text-[11px] font-bold text-cocoa mt-1">{t.course}</div>
                </div>
              ))}
              {TODAY.length === 0 && (
                <div className="text-center text-[11px] text-cocoa font-bold py-4">No classes today</div>
              )}
            </div>
          </div>

          <div className="col-span-6 sm:col-span-3 chunky-card chunky-card-hover p-5 relative overflow-hidden cascade-in" style={{ animationDelay: '0.3s' }}>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-burn/10" />
            <div className="relative">
              <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">PIN</div>
              <div className="text-[10px] text-cocoa/70 uppercase font-bold mt-2">Attendance</div>
              <div className="font-black text-xl text-ink mt-0.5">Idle</div>
              <div className="text-[11px] font-bold text-coffee mt-1">No active session</div>
              <button
                onClick={() => navigate('/faculty/attendance')}
                className="mt-3 inline-flex items-center gap-1.5 bg-cocoa text-bone border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                <KeyRound size={11} strokeWidth={3} /> Open
              </button>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="cascade-in" style={{ animationDelay: '0.04s' }}>
          <h2 className="heading-retro text-2xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickAction icon={KeyRound}       label="PIN"        sub="Attendance"       onClick={() => navigate('/faculty/attendance')} />
            <QuickAction icon={Award}          label="Marks"      sub="Entry"            onClick={() => navigate('/faculty/marks')} />
            <QuickAction icon={GraduationCap}  label="Grading"    sub="Submit to HOD"    onClick={() => navigate('/faculty/grading')} />
            <QuickAction icon={FileX}          label="Withdraw"   sub="Requests"         onClick={() => navigate('/faculty/withdrawals')} />
            <QuickAction icon={BarChart3}      label="Reports"    sub="OBE / CLO"        onClick={() => navigate('/faculty/reports')} />
            <QuickAction icon={MessageSquare}  label="Feedback"   sub="Summary"          onClick={() => navigate('/faculty/feedback')} />
          </div>
        </div>

        {/* ASSIGNED SECTIONS */}
        <div className="chunky-card overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">Assigned Sections — Spring 2026</h3>
            <span className="text-xs font-bold text-ink uppercase tracking-wider">{totalSections} SECTIONS · {totalEnrolled} STUDENTS</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Code</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Section</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Enrolled</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Room</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Schedule</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((c, i) => (
                <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                  <td className="px-5 py-3 text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.section}</span></td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-coffee text-bone">{c.enrolled}</span></td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-tan text-ink">{c.room}</span></td>
                  <td className="px-5 py-3 text-ink text-xs">{c.day} · {c.time}</td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => navigate('/faculty/courses')}
                      className="inline-flex items-center gap-1 bg-cocoa text-bone border-2 border-ink rounded px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                      Roster <ChevronRight size={10} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOW ATTENDANCE */}
        <div className="chunky-card overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-ink bg-bad flex items-center justify-between">
            <h3 className="heading-retro text-sm text-bone flex items-center gap-2">
              <AlertTriangle size={14} strokeWidth={3} /> Below 75% Attendance
            </h3>
            <span className="text-xs font-bold text-bone uppercase tracking-wider">{LOW_ATT.length} STUDENTS</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Name</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Course</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {LOW_ATT.map((s, i) => (
                <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{s.roll}</td>
                  <td className="px-5 py-3 text-ink">{s.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{s.course}</span></td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bad text-bone">{s.pct}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT RAIL */}
      <div className="col-span-12 xl:col-span-4 space-y-5">
        {/* PENDING TASKS */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-cocoa text-bone">
            <span className="font-black text-xs uppercase tracking-widest">Pending Tasks</span>
            <Calendar size={14} />
          </div>
          <div className="p-4 space-y-2.5">
            {PENDING_TASKS.map((t, i) => (
              <button
                key={i}
                onClick={() => navigate(t.link)}
                className="w-full flex items-center gap-3 p-2.5 bg-bone border-2 border-ink rounded shadow-pixel-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel transition-all text-left cascade-in"
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
              >
                <div className={`w-1.5 self-stretch rounded-full ${t.tone === 'burn' ? 'bg-burn' : t.tone === 'mustard' ? 'bg-mustard' : t.tone === 'bad' ? 'bg-bad' : 'bg-tan'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-ink uppercase tracking-wider">{t.label}</div>
                  <div className="text-[10px] text-cocoa mt-0.5 font-bold">{t.type}</div>
                </div>
                <span className={`tag ${t.tone === 'burn' ? 'bg-burn text-bone' : t.tone === 'mustard' ? 'bg-mustard text-ink' : t.tone === 'bad' ? 'bg-bad text-bone' : 'bg-tan text-ink'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* WEEKLY SCHEDULE STRIP */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.18s' }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">This Week</h3>
            <Calendar size={14} className="text-ink" />
          </div>
          <div className="p-4 space-y-2">
            {['MON','TUE','WED','THU','FRI'].map((d, i) => {
              const has = i === 0 || i === 1 || i === 2
              return (
                <div key={d} className="flex items-center gap-3">
                  <div className="w-10 text-[10px] font-extrabold text-ink uppercase tracking-widest">{d}</div>
                  <div className="flex-1 h-6 bg-bone border-2 border-ink rounded relative overflow-hidden">
                    {has && (
                      <>
                        <div className="absolute top-0 bottom-0 left-[15%] w-[30%] bg-coffee rounded-sm border-r-2 border-ink flex items-center justify-center text-[8px] font-extrabold text-bone uppercase tracking-wider">
                          CS3001-A
                        </div>
                        {(i === 0 || i === 2) && (
                          <div className="absolute top-0 bottom-0 left-[48%] w-[30%] bg-burn rounded-sm border-l-2 border-r-2 border-ink flex items-center justify-center text-[8px] font-extrabold text-bone uppercase tracking-wider">
                            CS3001-B
                          </div>
                        )}
                        {i === 1 && (
                          <div className="absolute top-0 bottom-0 left-[60%] w-[28%] bg-mustard rounded-sm border-l-2 border-ink flex items-center justify-center text-[8px] font-extrabold text-ink uppercase tracking-wider">
                            CS5005
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SYSTEM */}
        <div className="chunky-card p-5 bg-ink text-bone">
          <div className="font-black text-xs uppercase tracking-widest mb-3 text-mossL">System</div>
          <div className="space-y-1.5 text-sm font-bold">
            <SysLine label="Semester" value="Spring 26" />
            <SysLine label="Sections" value={String(totalSections)} />
            <SysLine label="Students" value={String(totalEnrolled)} />
            <SysLine label="Node" value="FAST-LHR-FAC" />
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
    <div className="bg-cream border-2 border-ink rounded-md p-3 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel-sm transition-all">
      <div className="text-[9px] font-extrabold text-ink/60 uppercase tracking-widest mb-1">{label}</div>
      <div className="font-extrabold text-sm text-ink truncate">{value}</div>
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
