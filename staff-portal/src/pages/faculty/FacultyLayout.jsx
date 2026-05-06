import { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home, BookOpen, LogOut, Search, Bell, Zap,
  Target, Award, ClipboardList, FileX, FilePen,
  Calendar, BarChart3, MessageSquare, GraduationCap, Cpu, KeyRound,
} from 'lucide-react'

const NAV = [
  { group: null, items: [
    { to: '/faculty',              label: 'Dashboard',     icon: Home },
  ]},
  { group: 'Teaching', items: [
    { to: '/faculty/courses',      label: 'Courses',       icon: BookOpen },
    { to: '/faculty/timetable',    label: 'Timetable',     icon: Calendar },
  ]},
  { group: 'Attendance', items: [
    { to: '/faculty/attendance',   label: 'Attendance',    icon: KeyRound },
  ]},
  { group: 'Evaluation', items: [
    { to: '/faculty/marks',        label: 'Marks',         icon: Award },
    { to: '/faculty/grading',      label: 'Grading',       icon: GraduationCap },
  ]},
  { group: 'Requests', items: [
    { to: '/faculty/withdrawals',  label: 'Withdrawals',   icon: FileX },
  ]},
  { group: 'Reports', items: [
    { to: '/faculty/reports',      label: 'OBE / Reports', icon: BarChart3 },
    { to: '/faculty/feedback',     label: 'Feedback',      icon: MessageSquare },
  ]},
]

const ALL_NAV_ITEMS = NAV.flatMap(g => g.items)

const NOTIFICATIONS = [
  { id: 1, title: '2 withdrawal requests pending review', time: '5 min ago',  read: false, link: '/faculty/withdrawals' },
  { id: 2, title: 'CS3001 Mid-1 marks pending entry',     time: '1 hour ago', read: false, link: '/faculty/marks' },
  { id: 3, title: 'PIN attendance window closed',         time: '3 hours ago',read: false, link: '/faculty/attendance' },
  { id: 4, title: 'HOD returned grade sheet for review',  time: '1 day ago',  read: true,  link: '/faculty/grading' },
  { id: 5, title: 'Feedback window closes in 3 days',     time: '2 days ago', read: true,  link: '/faculty/feedback' },
]

export default function FacultyLayout() {
  const { user, logout } = useAuth()
  const FAC = {
    name: user?.name || 'Faculty',
    username: user?.username || '—',
    designation: user?.designation || 'Lecturer',
    department: user?.department || '—',
    employeeId: user?.employeeId || '—',
  }
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const notifRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const unreadCount = notifs.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cmd-K / Ctrl-K to focus search (real FLEX power-user pattern from AO interview)
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  const filtered = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return ALL_NAV_ITEMS.filter(it => it.label.toLowerCase().includes(q))
  }, [search])

  const currentPage = useMemo(() => {
    const item = ALL_NAV_ITEMS.find(it => it.to === location.pathname)
    return item ? item.label : 'Dashboard'
  }, [location.pathname])

  return (
    <div className="paper-bg min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 bg-cocoa border-r-2 border-ink hidden lg:flex flex-col text-bone">
          <div className="px-4 py-5 border-b-2 border-ink bg-coffee/40">
            <NavLink to="/faculty" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-coffee border-2 border-ink shadow-pixel-sm rounded-md flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Zap size={20} className="text-bone" strokeWidth={2.8} />
              </div>
              <div>
                <div className="font-display text-base text-bone tracking-wide leading-none">NUKED</div>
                <div className="text-[11px] text-tan mt-1.5">FACULTY · v1.0</div>
              </div>
            </NavLink>
          </div>

          <div className="px-4 py-5 border-b-2 border-ink text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-coffee border-2 border-ink shadow-pixel rounded-md font-black text-3xl text-bone mb-3 avatar-glow">
              {FAC.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="font-extrabold text-sm uppercase tracking-wider text-bone leading-tight">
              {FAC.name}
            </div>
            <div className="text-[11px] text-tan mt-0.5">{FAC.designation}</div>
            <div className="text-[10px] text-tan/70 mt-0.5">{FAC.department}</div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] text-mossL font-bold uppercase">
              <span className="w-2 h-2 bg-mossL rounded-sm animate-blink" />
              Online
            </div>
          </div>

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

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="border-b-2 border-ink bg-cocoa px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Cpu size={16} className="text-burnL" />
              <NavLink to="/faculty" className="text-tan hover:text-bone transition-colors">Faculty</NavLink>
              <span className="text-tan/50">/</span>
              <span className="text-bone">{currentPage}</span>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="hidden md:flex items-center gap-2 bg-coffee/60 border-2 border-ink rounded-md px-3 py-1.5 w-72">
                <Search size={14} className="text-tan" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Jump to module... (⌘K)"
                  className="bg-transparent text-sm text-bone placeholder:text-tan/60 focus:outline-none w-full font-medium"
                />
              </div>
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
                  No modules found
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
                  <div className="absolute top-full right-0 mt-2 w-80 bg-cream border-2 border-ink rounded-lg shadow-pixel overflow-hidden z-50 cascade-in">
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

          <div className="p-6 pt-10 flex-1">
            <Outlet />
          </div>

          <div className="border-t-2 border-ink bg-cocoa text-bone px-6 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-mossL rounded-sm animate-blink" />
                Connected
              </span>
              <span>·</span>
              <span>{FAC.username}</span>
              <span>·</span>
              <span>{FAC.employeeId}</span>
              <span>·</span>
              <span>{FAC.department}</span>
            </div>
            <div>NUKED · FACULTY v1.0</div>
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
      end={to === '/faculty'}
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
