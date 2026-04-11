import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Target,
  FileText,
  CreditCard,
  DollarSign,
  MessageSquare,
  RotateCcw,
  XCircle,
  RefreshCw,
  CalendarDays,
  Award,
  LogOut,
  User,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'

const sidebarLinks = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/course-registration', label: 'Course Registration', icon: BookOpen },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/marks', label: 'Marks', icon: BarChart3 },
  { to: '/marks-plo', label: 'Marks PLO Report', icon: Target },
  { to: '/transcript', label: 'Transcript', icon: FileText },
  { to: '/fee-challan', label: 'Fee Challan', icon: CreditCard },
  { to: '/fee-details', label: 'Fee Details', icon: DollarSign },
  { to: '/course-feedback', label: 'Course Feedback', icon: MessageSquare },
  { to: '/retake-exam', label: 'Retake Exam Request', icon: RotateCcw },
  { to: '/course-withdraw', label: 'Course Withdraw', icon: XCircle },
  { to: '/grade-change', label: 'Grade Change Request', icon: RefreshCw },
  { to: '/study-plan', label: 'Tentative Study Plan', icon: CalendarDays },
  { to: '/grade-report', label: 'Grade Report', icon: Award },
]

function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const currentPage = sidebarLinks.find((link) => {
    if (link.end) return location.pathname === link.to
    return location.pathname.startsWith(link.to)
  })

  const breadcrumbLabel = currentPage ? currentPage.label : 'Home'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] min-w-[220px] bg-primary flex flex-col h-full overflow-y-auto">
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2 border-b border-white/10">
          <GraduationCap className="text-white" size={28} />
          <div>
            <div className="text-white font-bold text-sm leading-tight">FLEX</div>
            <div className="text-gray-300 text-[10px] leading-tight">FAST NUCES Portal</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-[13px] text-gray-300 hover:bg-red-600/30 hover:text-white transition-colors border-t border-white/10"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between min-h-[60px]">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-primary" size={32} />
            <div>
              <div className="text-primary font-bold text-lg leading-tight">
                FAST - NUCES
              </div>
              <div className="text-gray-400 text-[10px]">
                National University of Computer & Emerging Sciences
              </div>
            </div>
          </div>

          <h1 className="text-primary font-semibold text-lg hidden md:block">
            Student Profile
          </h1>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-gray-500 text-xs">Welcome</div>
              <div className="text-primary font-medium text-sm">
                Hello Mr, {user?.name || 'Student'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <User className="text-white" size={18} />
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-white px-6 py-2 border-b border-gray-100 text-xs text-gray-500 flex items-center gap-1">
          <span>Home</span>
          {breadcrumbLabel !== 'Home' && (
            <>
              <ChevronRight size={12} />
              <span className="text-accent">{breadcrumbLabel}</span>
            </>
          )}
        </div>

        {/* Page Content */}
        <main className="flex-1 bg-bgGray overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2 text-center text-xs text-gray-400">
          2026 &copy; All rights reserved
        </footer>
      </div>
    </div>
  )
}

export default Layout
