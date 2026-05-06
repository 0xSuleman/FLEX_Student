import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
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
  { code: 'CS3001', name: 'Software Engineering',    section: 'BSE-243A', cr: 3, attendance: 92, latestGrade: null },
  { code: 'CS3002', name: 'Database Systems',         section: 'BSE-243A', cr: 4, attendance: 88, latestGrade: null },
  { code: 'CS3003', name: 'Operating Systems',        section: 'BSE-243B', cr: 3, attendance: 70, latestGrade: null },
  { code: 'MT3005', name: 'Probability & Statistics', section: 'BSE-243A', cr: 3, attendance: 95, latestGrade: null },
  { code: 'HS3006', name: 'Technical Writing',        section: 'BSE-243B', cr: 2, attendance: 84, latestGrade: null },
]

const RECENT_MARKS = [
  { course: 'CS3001', type: 'Quiz 3',      obtained: 4.8, total: 5,  avg: 3.5,  w: 5  },
  { course: 'CS3002', type: 'Sessional 1', obtained: 22,  total: 25, avg: 19,   w: 10 },
  { course: 'CS3001', type: 'Assignment 2',obtained: 9.0, total: 10, avg: 8.0,  w: 5  },
  { course: 'CS3003', type: 'Sessional 1', obtained: 38,  total: 50, avg: 34,   w: 20 },
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
  const { user } = useAuth()
  const [dashData, setDashData] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState(ENROLLED)
  const [recentMarks, setRecentMarks] = useState(RECENT_MARKS)
  const [feeData, setFeeData] = useState(FEE)
  const [transcriptStats, setTranscriptStats] = useState({ cgpa: 0, sgpa: 0, creditsEarned: 0, creditsAttempted: 0 })
  const [pendingFeedback, setPendingFeedback] = useState(PENDING.feedback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch all data in parallel
        const [dashRes, enrollRes, attRes, marksRes, transcriptRes, feeRes, feedbackRes] = await Promise.allSettled([
          api.get('/dashboard'),
          api.get('/enrollments?semester=Spring+2026'),
          api.get('/attendance?semester=Spring+2026'),
          api.get('/marks?semester=Spring+2026'),
          api.get('/transcript'),
          api.get('/fees/challans'),
          api.get('/feedback'),
        ])

        // Dashboard data
        if (dashRes.status === 'fulfilled') setDashData(dashRes.value.data)

        // Build enrolled courses with attendance
        const enrollments = enrollRes.status === 'fulfilled' && Array.isArray(enrollRes.value.data) ? enrollRes.value.data : []
        const attendanceData = attRes.status === 'fulfilled' && Array.isArray(attRes.value.data) ? attRes.value.data : []
        const attMap = {}
        attendanceData.forEach(a => { attMap[a.courseCode] = Math.round(a.percentage) })

        if (enrollments.length > 0) {
          setEnrolledCourses(enrollments.map(e => ({
            code: e.courseCode,
            name: e.courseName,
            section: e.section,
            cr: e.creditHours,
            attendance: attMap[e.courseCode] ?? 0,
            latestGrade: null,
          })))
        }

        // Recent marks
        if (marksRes.status === 'fulfilled' && Array.isArray(marksRes.value.data)) {
          const allMarks = []
          marksRes.value.data.forEach(course => {
            (course.evaluations || []).forEach(ev => {
              if (ev.obtained != null) {
                allMarks.push({
                  course: course.courseCode,
                  type: ev.evaluationName,
                  obtained: ev.obtained,
                  total: ev.total,
                  avg: ev.average,
                  w: ev.weightage,
                })
              }
            })
          })
          if (allMarks.length > 0) setRecentMarks(allMarks.slice(-4))
        }

        // Transcript stats (CGPA, SGPA, credits)
        if (transcriptRes.status === 'fulfilled') {
          const semesters = transcriptRes.value.data?.semesters || []
          if (semesters.length > 0) {
            // Sort chronologically to get the correct last semester
            const semOrder = (name) => {
              const [term, year] = name.split(' ')
              return parseInt(year) * 10 + (term === 'Spring' ? 0 : term === 'Summer' ? 1 : 2)
            }
            const sorted = [...semesters].sort((a, b) => semOrder(a.semester) - semOrder(b.semester))
            const last = sorted[sorted.length - 1]
            const totalEarned = sorted.reduce((s, sem) => s + (sem.crEarned || 0), 0)
            const totalAttempted = sorted.reduce((s, sem) => s + (sem.crAttempted || 0), 0)
            setTranscriptStats({
              cgpa: last.cgpa || 0,
              sgpa: last.sgpa || 0,
              creditsEarned: totalEarned,
              creditsAttempted: totalAttempted,
            })
          }
        }

        // Fee challan (latest unpaid or most recent)
        if (feeRes.status === 'fulfilled' && Array.isArray(feeRes.value.data) && feeRes.value.data.length > 0) {
          const challans = feeRes.value.data
          const unpaid = challans.find(c => (c.status || '').toUpperCase() === 'UNPAID')
          const latest = unpaid || challans[0]
          setFeeData({
            challanNo: latest.challanNo || '—',
            semester: latest.semester || '—',
            amount: latest.amount || 0,
            dueDate: latest.dueDate || '—',
            status: latest.status || 'UNKNOWN',
          })
        }

        // Pending feedback count
        if (feedbackRes.status === 'fulfilled' && Array.isArray(feedbackRes.value.data)) {
          const pending = feedbackRes.value.data.filter(f => (f.status || '').toUpperCase() === 'PENDING').length
          setPendingFeedback(pending)
        }
      } catch { /* fallbacks already set */ }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [user])

  // Merge API data with fallbacks
  const personalInfo = dashData?.personalInfo || PERSONAL
  const studentInfo = {
    rollNo: personalInfo.rollNo || STUDENT.rollNo,
    name: personalInfo.name || STUDENT.name,
    degree: personalInfo.degree || STUDENT.degree,
    batch: personalInfo.batch || STUDENT.batch,
    section: personalInfo.section || STUDENT.section,
    campus: personalInfo.campus || STUDENT.campus,
    status: personalInfo.status || STUDENT.status,
    cgpa: transcriptStats.cgpa,
    sgpa: transcriptStats.sgpa,
    creditsEarned: transcriptStats.creditsEarned,
    creditsAttempted: transcriptStats.creditsAttempted,
  }
  const calendarEvents = (dashData?.academicCalendar || []).length > 0
    ? dashData.academicCalendar.map((e) => ({
        label: e.eventName,
        range: e.endDate ? `${e.startDate} – ${e.endDate}` : e.startDate,
        tone: 'tan',
      }))
    : CALENDAR_EVENTS
  const contactInfo = dashData?.contactInfo || CONTACT.permanent
  const familyInfo = dashData?.familyInfo || FAMILY
  const personalDisplay = {
    name: personalInfo.name || PERSONAL.name,
    dob: personalInfo.dob || PERSONAL.dob,
    bloodGroup: personalInfo.bloodGroup || PERSONAL.bloodGroup,
    gender: personalInfo.gender || PERSONAL.gender,
    cnic: personalInfo.cnic || PERSONAL.cnic,
    nationality: personalInfo.nationality || PERSONAL.nationality,
    email: personalInfo.email || PERSONAL.email,
    mobile: personalInfo.mobileNo || personalInfo.mobile || PERSONAL.mobile,
  }

  const aggAttendance = enrolledCourses.length > 0 ? Math.round(enrolledCourses.reduce((s, c) => s + c.attendance, 0) / enrolledCourses.length) : 0
  const cgpaAnim = useCountUp(studentInfo.cgpa, 1500)
  const sgpaAnim = useCountUp(studentInfo.sgpa, 1500)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-5 max-w-[1500px]">
      {/* LEFT */}
      <div className="col-span-12 xl:col-span-8 space-y-5">
        {/* welcome + compact calendar */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 xl:gap-6">
          <div className="min-w-0">
            <div className="text-sm font-bold text-coffee uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(',', ' ·')}
            </div>
            <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">
              HELLO,{' '}
              {studentInfo.name.split(' ')[0].toUpperCase().split('').map((ch, i) => (
                <span
                  key={i}
                  className="inline-block letter-wave"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {ch}
                </span>
              ))}
            </h1>
            <p className="text-sm text-cocoa mt-2">
              Spring 2026 · {enrolledCourses.length} courses · Aggregate attendance {aggAttendance}%.
            </p>
          </div>
          <DashboardCalendar />
        </div>

        {/* UNIVERSITY INFO */}
        <div className="chunky-card p-5 cascade-in" style={{ animationDelay: '0.03s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-retro text-sm">University Info</h3>
            <span className="tag bg-moss text-cream">{studentInfo.status}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <InfoBox label="Roll No" value={studentInfo.rollNo} />
            <InfoBox label="Degree" value={studentInfo.degree} />
            <InfoBox label="Batch" value={studentInfo.batch} />
            <InfoBox label="Section" value={studentInfo.section} />
            <InfoBox label="Campus" value={studentInfo.campus} />
            <InfoBox label="Status" value={studentInfo.status} />
          </div>
        </div>

        {/* BENTO */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 sm:col-span-5 chunky-card chunky-card-hover p-5 relative overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-burn/10" />
            <div className="relative">
              <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">CGPA</div>
              <div className="flex items-end gap-3 mt-2">
                <div className="font-black text-6xl text-ink leading-none tabular-nums">{cgpaAnim.toFixed(2)}</div>
                <div className="flex items-center gap-1 text-moss font-extrabold text-sm pb-2">
                  <TrendingUp size={14} strokeWidth={3} /> SGPA {sgpaAnim.toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <MiniStat label="Cr. Earned" value={studentInfo.creditsEarned} />
                <MiniStat label="Cr. Attempted" value={studentInfo.creditsAttempted} />
              </div>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4 chunky-card chunky-card-hover p-5 cascade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-xs font-extrabold text-coffee uppercase tracking-widest mb-2">Attendance</div>
            <div className="flex items-center gap-3">
              <AttendanceBar pct={aggAttendance} />
              <div className={`flex-1 ${enrolledCourses.length > 5 ? 'space-y-0.5' : 'space-y-1'}`}>
                {enrolledCourses.map((c, idx) => (
                  <div key={c.code} className="flex items-center gap-1.5">
                    <span className={`font-extrabold text-ink ${enrolledCourses.length > 6 ? 'text-[9px] w-12' : 'text-[11px] w-14'}`}>{c.code}</span>
                    <div className={`flex-1 bg-bone border border-ink rounded-sm overflow-hidden ${enrolledCourses.length > 6 ? 'h-1' : 'h-1.5'}`}>
                      <div
                        className="h-full bar-fill"
                        style={{
                          '--target': `${c.attendance}%`,
                          animationDelay: `${idx * 0.1}s`,
                          backgroundColor: c.attendance >= 80 ? '#10B981' : '#DC2626',
                        }}
                      />
                    </div>
                    <span className={`font-extrabold w-8 text-right ${enrolledCourses.length > 6 ? 'text-[8px]' : 'text-[10px]'}`} style={{ color: c.attendance >= 80 ? '#10B981' : '#DC2626' }}>
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
              <div className="text-xs font-extrabold text-coffee uppercase tracking-widest">Fee</div>
              <div className="text-[10px] text-cocoa/70 uppercase font-bold mt-2">Next Challan</div>
              <div className="font-black text-xl text-ink mt-0.5">Rs {(feeData.amount / 1000).toFixed(0)}K</div>
              <div className="text-[11px] font-bold text-coffee mt-1">{feeData.challanNo}</div>
              <div className="text-[10px] text-cocoa mt-0.5">Due {feeData.dueDate}</div>
              <span className={`tag mt-3 inline-block ${feeData.status === 'UNPAID' ? 'bg-cocoa text-bone' : 'bg-moss text-cream'}`}>
                {feeData.status}
              </span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="cascade-in" style={{ animationDelay: '0.04s' }}>
          <h2 className="heading-retro text-2xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickAction icon={BookOpen}       label="Register"   sub="Courses"           onClick={() => navigate('/course-registration')} />
            <QuickAction icon={Wallet}         label="Pay Fee"    sub="Challan"           onClick={() => navigate('/fee-challan')} />
            <QuickAction icon={MessageSquare}  label="Feedback"   sub={`${pendingFeedback} pending`} onClick={() => navigate('/feedback')} />
            <QuickAction icon={RotateCcw}      label="Retake"     sub="Request"           onClick={() => navigate('/retake-exam')} />
            <QuickAction icon={FileX}          label="Withdraw"   sub="Course"            onClick={() => navigate('/course-withdraw')} />
            <QuickAction icon={Download}       label="Transcript" sub="PDF"               onClick={() => navigate('/transcript')} />
          </div>
        </div>

        {/* ENROLLED COURSES */}
        <div className="chunky-card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between gap-2">
            <h3 className="heading-retro text-xs sm:text-sm truncate">Enrolled Courses — Spring 2026</h3>
            <span className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider shrink-0">{enrolledCourses.reduce((s, c) => s + c.cr, 0)} CR</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
              {enrolledCourses.map((c, i) => (
                <tr key={c.code} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-5 py-3 font-extrabold text-ink">{c.code}</td>
                  <td className="px-5 py-3 text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.section}</span></td>
                  <td className="px-5 py-3 text-center"><span className="tag bg-bone text-ink">{c.cr}</span></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`tag ${c.attendance >= 80 ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>{c.attendance}%</span>
                  </td>
                  <td className="px-5 py-3 text-center"><span className={`tag ${gradeColor(c.latestGrade)}`}>{c.latestGrade || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* RECENT MARKS */}
        <div className="chunky-card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between gap-2">
            <h3 className="heading-retro text-xs sm:text-sm truncate">Recent Evaluations</h3>
            <span className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider shrink-0">Latest 4</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
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
              {recentMarks.map((m, i) => {
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

      </div>

      {/* RIGHT RAIL */}
      <div className="col-span-12 xl:col-span-4 space-y-5">
        {/* ACADEMIC CALENDAR */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-cocoa text-bone">
            <span className="font-black text-xs uppercase tracking-widest">Academic Calendar</span>
            <Calendar size={14} />
          </div>
          <div className="p-4 space-y-2.5">
            {calendarEvents.map((e, i) => (
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
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.18s' }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">Personal Information</h3>
            <User size={14} className="text-ink" />
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBox label="Name" value={personalDisplay.name} />
            <InfoBox label="Date of Birth" value={personalDisplay.dob} />
            <InfoBox label="Blood Group" value={personalDisplay.bloodGroup} />
            <InfoBox label="Gender" value={personalDisplay.gender} />
            <InfoBox label="CNIC" value={personalDisplay.cnic} />
            <InfoBox label="Nationality" value={personalDisplay.nationality} />
            <InfoBox label="Email" value={personalDisplay.email} />
            <InfoBox label="Mobile" value={personalDisplay.mobile} />
          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="space-y-4 cascade-in" style={{ animationDelay: '0.12s' }}>
          <ContactBlock label="Permanent Address" data={contactInfo} />
          <ContactBlock label="Current Address"   data={contactInfo} />
        </div>

        {/* FAMILY INFO */}
        <div className="chunky-card overflow-hidden cascade-in" style={{ animationDelay: '0.26s' }}>
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between">
            <h3 className="heading-retro text-sm">Family Information</h3>
            <User size={14} className="text-ink" />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="bg-bone border-b-2 border-ink text-coffee">
                <th className="px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Relation</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Name</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest">Tax</th>
              </tr>
            </thead>
            <tbody>
              {familyInfo.map((f, i) => (
                <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'} hover:bg-tan/30 transition-colors`}>
                  <td className="px-3 py-3 font-extrabold text-ink text-xs">{f.relation}</td>
                  <td className="px-3 py-3 text-ink text-xs">{f.name}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`tag ${(f.tax || f.taxWithholding) === 'Filer' ? 'bg-moss text-cream' : 'bg-burn text-bone'}`}>{f.tax || f.taxWithholding}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
    <div className="bg-cream border-2 border-ink rounded-md p-3 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel-sm transition-all">
      <div className="text-[9px] font-extrabold text-ink/60 uppercase tracking-widest mb-1">{label}</div>
      <div className="font-extrabold text-sm text-ink truncate">{value}</div>
    </div>
  )
}

function ContactBlock({ label, data }) {
  return (
    <div className="border-2 border-ink rounded-md overflow-hidden hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel-sm transition-all">
      <div className="bg-cocoa px-4 py-2 flex items-center gap-2">
        <Cpu size={12} className="text-bone" />
        <h4 className="font-display text-[10px] text-bone uppercase tracking-widest">{label}</h4>
      </div>
      <div className="p-4 bg-cream space-y-2.5 text-xs">
        {Object.entries({ Address: data.address, Phone: data.phone, Postal: data.postal, City: data.city, Country: data.country }).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3">
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
  const pkNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
  const todayMonth = pkNow.getMonth() + 1
  const todayDay = pkNow.getDate()
  const todayYear = pkNow.getFullYear()
  // Default the calendar to today's month/year. Arrows let you navigate
  // forwards / backwards from there.
  const [month, setMonth] = useState(todayMonth)
  const [year, setYear] = useState(todayYear)
  const eventsByMonth = { 1: [14, 19, 26], 2: [16, 18, 20], 4: [14, 16, 18, 22], 5: [4, 6, 8] }
  const events = eventsByMonth[month] || []

  const firstPos = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const goNext = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const cells = []
  for (let i = firstPos - 1; i >= 0; i--) cells.push({ d: prevMonthLastDay - i, muted: true })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, muted: false })
  let next = 1
  while (cells.length % 7 !== 0) cells.push({ d: next++, muted: true })

  return (
    <div className="bg-cream border-2 border-ink rounded-lg shadow-pixel overflow-hidden cascade-in shrink-0 w-full xl:w-[260px] max-w-full" style={{ animationDelay: '0.05s' }}>
      <div className="bg-cocoa border-b-2 border-ink px-3 py-2 flex items-center justify-between">
        <button onClick={goPrev} className="transition-all text-bone/80 hover:text-burn hover:-translate-x-0.5">
          <ChevronLeft size={16} strokeWidth={3} />
        </button>
        <div className="font-display text-[10px] text-bone uppercase tracking-wider">{monthNames[month - 1]} {year}</div>
        <button onClick={goNext} className="transition-all text-bone/80 hover:text-burn hover:translate-x-0.5">
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
