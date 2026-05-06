import { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home, BookOpen, User, Wallet, MessageSquare,
  LogOut, Search, Bell, Zap, Menu, X,
  Target, Award, BookMarked, Receipt, FilePen,
  RotateCcw, FileX, Layers, ClipboardList, Radar, Cpu,
} from 'lucide-react'

const NAV = [
  { group: null, items: [
    { to: '/',                 label: 'Dashboard',    icon: Home },
  ]},
  { group: 'Academic', items: [
    { to: '/attendance',       label: 'Attendance',   icon: Target },
    { to: '/marks',            label: 'Marks',        icon: Award },
    { to: '/plo',              label: 'PLO Marks',    icon: Radar },
    { to: '/transcript',       label: 'Transcript',   icon: BookMarked },
    { to: '/grade-report',     label: 'Grade Report', icon: ClipboardList },
    { to: '/study-plan',       label: 'Study Plan',   icon: Layers },
  ]},
  { group: 'Courses', items: [
    { to: '/course-registration', label: 'Registration', icon: BookOpen },
    { to: '/course-withdraw',     label: 'Withdraw',     icon: FileX },
  ]},
  { group: 'Requests', items: [
    { to: '/retake-exam',      label: 'Retake Exam',  icon: RotateCcw },
    { to: '/grade-change',     label: 'Grade Change', icon: FilePen },
  ]},
  { group: 'Fees', items: [
    { to: '/fee-challan',      label: 'Fee Challan',  icon: Wallet },
    { to: '/fee-details',      label: 'Fee Details',  icon: Receipt },
  ]},
  { group: 'Other', items: [
    { to: '/feedback',         label: 'Feedback',     icon: MessageSquare },
  ]},
]

const ALL_NAV_ITEMS = NAV.flatMap(g => g.items)

const NOTIFICATIONS = [
  { id: 1, title: '3 course feedbacks pending',       time: '2 min ago',  read: false, link: '/feedback' },
  { id: 2, title: 'Fee challan CHN-2026-001 is due',  time: '1 hour ago', read: false, link: '/fee-challan' },
  { id: 3, title: 'CS3003 attendance below 80%',      time: '3 hours ago',read: false, link: '/attendance' },
  { id: 4, title: 'Grade report published for Fall 25',time: '1 day ago', read: true,  link: '/grade-report' },
  { id: 5, title: 'Registration opens April 20',      time: '2 days ago', read: true,  link: '/course-registration' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const STUDENT = {
    name: user?.name || 'Student',
    rollNo: user?.rollNo || '—',
    section: user?.section || '—',
    campus: user?.campus || '—',
  }
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const notifRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const unreadCount = notifs.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  const filtered = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return ALL_NAV_ITEMS.filter(it => it.label.toLowerCase().includes(q))
  }, [search])

  // Page title from current route
  const currentPage = useMemo(() => {
    const item = ALL_NAV_ITEMS.find(it => it.to === location.pathname)
    return item ? item.label : 'Dashboard'
  }, [location.pathname])

  return (
    <div className="paper-bg min-h-screen">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-60 shrink-0 bg-cocoa border-r-2 border-ink hidden lg:flex flex-col text-bone">
          <div className="px-4 py-5 border-b-2 border-ink bg-coffee/40">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Zap size={20} className="text-bone" strokeWidth={2.8} />
              </div>
              <div>
                <div className="font-display text-base text-bone tracking-wide leading-none">NUKED</div>
                <div className="text-[11px] text-tan mt-1.5">v1.0.90</div>
              </div>
            </NavLink>
          </div>

          {/* profile */}
          <div className="px-4 py-5 border-b-2 border-ink text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-coffee border-2 border-ink shadow-pixel rounded-md font-black text-3xl text-bone mb-3 avatar-glow">
              {STUDENT.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
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
            {NAV.map((group, gi) => (
              <div key={gi}>
                {group.group && <SectionLabel>{group.group}</SectionLabel>}
                {group.items.map((item) => (
                  <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* MOBILE NAV DRAWER (lg:hidden) */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/70" onClick={() => setMobileNavOpen(false)} />
            <aside className="relative w-72 max-w-[80vw] h-full bg-cocoa border-r-2 border-ink flex flex-col text-bone">
              <div className="px-4 py-4 border-b-2 border-ink bg-coffee/40 flex items-center justify-between">
                <NavLink to="/" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center">
                    <Zap size={18} className="text-bone" strokeWidth={2.8} />
                  </div>
                  <div>
                    <div className="font-display text-base text-bone leading-none">NUKED</div>
                    <div className="text-[10px] text-tan mt-1">v1.0.90</div>
                  </div>
                </NavLink>
                <button onClick={() => setMobileNavOpen(false)} className="bg-coffee/60 border-2 border-ink rounded-md p-1.5">
                  <X size={16} className="text-bone" />
                </button>
              </div>
              <div className="px-4 py-4 border-b-2 border-ink text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-coffee border-2 border-ink shadow-pixel rounded-md font-black text-2xl text-bone mb-2">
                  {STUDENT.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="font-extrabold text-sm uppercase tracking-wider text-bone leading-tight">{STUDENT.name}</div>
                <div className="text-[10px] text-tan mt-0.5">{STUDENT.rollNo} · {STUDENT.section}</div>
              </div>
              <nav className="px-3 py-3 flex-1 space-y-1 overflow-y-auto">
                {NAV.map((group, gi) => (
                  <div key={gi}>
                    {group.group && <SectionLabel>{group.group}</SectionLabel>}
                    {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink key={item.to} to={item.to}
                          onClick={() => setMobileNavOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                              isActive ? 'bg-coffee text-bone shadow-pixel-sm' : 'text-tan hover:bg-coffee/40'
                            }`
                          }>
                          <Icon size={16} strokeWidth={2.5} /> {item.label}
                        </NavLink>
                      )
                    })}
                  </div>
                ))}
                <button onClick={() => { logout(); navigate('/login') }}
                  className="w-full mt-3 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider text-bad hover:bg-bad/15 transition-all">
                  <LogOut size={16} strokeWidth={2.5} /> Sign Out
                </button>
              </nav>
            </aside>
          </div>
        )}

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* breadcrumb */}
          <div className="border-b-2 border-ink bg-cocoa px-3 sm:px-4 md:px-6 py-3 md:py-3.5 flex items-center justify-between gap-2 sticky top-0 z-30">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider min-w-0">
              <button onClick={() => setMobileNavOpen(true)}
                className="lg:hidden bg-coffee/60 border-2 border-ink rounded-md p-1.5 shadow-pixel-sm">
                <Menu size={16} className="text-bone" />
              </button>
              <Cpu size={16} className="text-burnL hidden md:inline" />
              <NavLink to="/" className="text-tan hover:text-bone transition-colors">Home</NavLink>
              <span className="text-tan/50">/</span>
              <span className="text-bone truncate">{currentPage}</span>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="hidden md:flex items-center gap-2 bg-coffee/60 border-2 border-ink rounded-md px-3 py-1.5 w-72">
                <Search size={14} className="text-tan" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pages..."
                  className="bg-transparent text-sm text-bone placeholder:text-tan/60 focus:outline-none w-full font-medium"
                />
              </div>
              {/* search dropdown */}
              {filtered && filtered.length > 0 && (
                <div className="absolute top-full right-12 mt-2 w-72 bg-cream border-2 border-ink rounded-md shadow-pixel overflow-hidden z-50">
                  {filtered.map(item => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.to}
                        onClick={() => { navigate(item.to); setSearch('') }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-tan/40 transition-colors border-b border-cocoa/10 last:border-b-0"
                      >
                        <Icon size={14} className="text-rust" strokeWidth={2.5} />
                        <span className="font-extrabold text-xs text-ink uppercase tracking-wider">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {filtered && filtered.length === 0 && (
                <div className="absolute top-full right-12 mt-2 w-72 bg-cream border-2 border-ink rounded-md shadow-pixel p-4 text-center font-mono text-xs text-cocoa z-50">
                  No pages found
                </div>
              )}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative bg-coffee/60 border-2 border-ink rounded-md p-2 shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Bell size={14} className="text-bone" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-bad border-2 border-ink rounded-full text-bone text-[8px] font-black">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="fixed sm:absolute top-14 sm:top-full inset-x-3 sm:inset-x-auto sm:right-0 mt-2 w-auto sm:w-80 bg-cream border-2 border-ink rounded-lg shadow-pixel overflow-hidden z-50 cascade-in">
                    <div className="bg-cocoa text-bone px-4 py-2.5 border-b-2 border-ink flex items-center justify-between">
                      <span className="font-display text-[9px] uppercase tracking-wider">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[9px] font-extrabold text-burn hover:text-bone uppercase tracking-wider">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifs.map(n => (
                        <button
                          key={n.id}
                          onClick={() => { markRead(n.id); navigate(n.link); setShowNotifs(false) }}
                          className={`w-full text-left px-4 py-3 border-b border-dashed border-cocoa/20 hover:bg-tan/30 transition-colors flex items-start gap-3 ${
                            n.read ? 'opacity-60' : ''
                          }`}
                        >
                          {!n.read && <span className="w-2 h-2 bg-burn rounded-full mt-1.5 shrink-0" />}
                          {n.read && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-extrabold text-ink leading-tight">{n.title}</div>
                            <div className="text-[10px] text-cocoa mt-0.5 font-bold uppercase tracking-wider">{n.time}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {notifs.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-cocoa font-bold">No notifications</div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="bg-coffee/60 border-2 border-ink rounded-md px-3 py-1.5 text-bone text-[10px] font-extrabold uppercase tracking-wider hover:bg-bad hover:text-bone transition-all inline-flex items-center gap-1.5"
              >
                <LogOut size={12} strokeWidth={2.8} />
                Sign Out
              </button>
            </div>
          </div>

          {/* page content */}
          <div className="px-3 py-5 sm:px-4 sm:py-6 md:p-6 md:pt-10 flex-1 min-w-0">
            <Outlet />
          </div>

          {/* footer */}
          <div className="border-t-2 border-ink bg-cocoa text-bone px-3 sm:px-6 py-2 flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-wrap">
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 bg-mossL rounded-sm animate-blink" />
                Connected
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="truncate">{STUDENT.rollNo}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline truncate">{STUDENT.section}</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:inline truncate">{STUDENT.campus}</span>
            </div>
            <div className="shrink-0">v1.0.90</div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.15em] text-tan">
      &gt; {children}
    </div>
  )
}

function NavItem({ icon: Icon, label, to }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2 text-left font-extrabold text-xs uppercase tracking-wider border-2 rounded-md transition-all ${
          isActive
            ? 'bg-coffee text-bone border-burn shadow-pixel-sm'
            : 'bg-transparent text-bone border-transparent hover:bg-coffee/60 hover:border-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={14} strokeWidth={2.8} />
          <span>{label}</span>
          {isActive && <span className="ml-auto animate-blink">&lt;</span>}
        </>
      )}
    </NavLink>
  )
}
