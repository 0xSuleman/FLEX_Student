import {
  Home, BookOpen, GraduationCap, FileX, BarChart3, Bluetooth, Calendar,
  Award, MessageSquare, Users, ClipboardList, Building, Wallet, Receipt,
  AlertTriangle, FileText, Settings, KeyRound, Shield, Database, Mail,
  UserPlus, Send, Lock, FileCheck, FilePen, ShieldCheck, ScrollText,
  ListChecks, Inbox, Briefcase, FileBarChart, Layers, Building2,
} from 'lucide-react'

// Single source of truth for every role's home, sidebar nav, and label.
export const ROLES = {
  faculty: {
    label: 'Faculty',
    home: '/faculty',
    nav: [
      { group: null, items: [{ to: '/faculty', label: 'Dashboard', icon: Home }] },
      { group: 'Teaching',   items: [
        { to: '/faculty/courses',     label: 'Courses',       icon: BookOpen },
        { to: '/faculty/timetable',   label: 'Timetable',     icon: Calendar },
      ]},
      { group: 'Attendance', items: [
        { to: '/faculty/attendance',  label: 'BLE Attendance',icon: Bluetooth },
      ]},
      { group: 'Evaluation', items: [
        { to: '/faculty/marks',       label: 'Marks',         icon: Award },
        { to: '/faculty/grading',     label: 'Grading',       icon: GraduationCap },
      ]},
      { group: 'Requests',   items: [
        { to: '/faculty/withdrawals', label: 'Withdrawals',   icon: FileX },
      ]},
      { group: 'Reports',    items: [
        { to: '/faculty/reports',     label: 'OBE / Reports', icon: BarChart3 },
        { to: '/faculty/feedback',    label: 'Feedback',      icon: MessageSquare },
      ]},
    ],
  },

  hod: {
    label: 'Head of Department',
    home: '/hod',
    nav: [
      { group: null, items: [{ to: '/hod', label: 'Dashboard', icon: Home }] },
      { group: 'Approvals', items: [
        { to: '/hod/grade-approvals',    label: 'Grade Approvals',  icon: GraduationCap },
        { to: '/hod/withdrawals',        label: 'Withdrawals',      icon: FileX },
        { to: '/hod/late-registration',  label: 'Late Registration',icon: ClipboardList },
        { to: '/hod/retakes',            label: 'Retakes',          icon: FilePen },
      ]},
      { group: 'Monitoring', items: [
        { to: '/hod/monitoring',         label: 'Course Monitoring',icon: BarChart3 },
        { to: '/hod/sections',           label: 'Sections',         icon: Layers },
      ]},
    ],
  },

  ao: {
    label: 'Academic Officer',
    home: '/ao',
    nav: [
      { group: null, items: [{ to: '/ao', label: 'Dashboard', icon: Home }] },
      { group: 'Semester', items: [
        { to: '/ao/semester',          label: 'Semester / Windows', icon: Calendar },
        { to: '/ao/enrollments',       label: 'Enrollments',        icon: Users },
        { to: '/ao/section-clashes',   label: 'Section Clashes',    icon: AlertTriangle },
        { to: '/ao/late-registration', label: 'Late Registration',  icon: ClipboardList },
      ]},
      { group: 'Records', items: [
        { to: '/ao/students',          label: 'Student Records',    icon: Users },
        { to: '/ao/grade-changes',     label: 'Grade Changes',      icon: FilePen },
        { to: '/ao/withdrawals',       label: 'Withdrawals',        icon: FileX },
      ]},
      { group: 'Tools', items: [
        { to: '/ao/pending-faculty',   label: 'Pending Faculty Inputs', icon: Inbox },
      ]},
    ],
  },

  asst_ao: {
    label: 'Asst. Academic Officer',
    home: '/asst-ao',
    nav: [
      { group: null, items: [{ to: '/asst-ao', label: 'Dashboard', icon: Home }] },
      { group: 'Tools', items: [
        { to: '/asst-ao/mailing-lists', label: 'Mailing Lists', icon: Mail },
        { to: '/asst-ao/students',      label: 'Student Records (View)', icon: Users },
      ]},
    ],
  },

  manager: {
    label: 'Manager (Academics)',
    home: '/manager',
    nav: [
      { group: null, items: [{ to: '/manager', label: 'Dashboard', icon: Home }] },
      { group: 'Operations', items: [
        { to: '/manager/enrollments',       label: 'Enrollments',     icon: Users },
        { to: '/manager/section-clashes',   label: 'Section Clashes', icon: AlertTriangle },
        { to: '/manager/late-registration', label: 'Late Registration', icon: ClipboardList },
        { to: '/manager/students',          label: 'Student Records', icon: Users },
      ]},
    ],
  },

  asst_manager: {
    label: 'Asst. Manager (Academics)',
    home: '/asst-manager',
    nav: [
      { group: null, items: [{ to: '/asst-manager', label: 'Dashboard', icon: Home }] },
      { group: 'Tools', items: [
        { to: '/asst-manager/mailing-lists', label: 'Mailing Lists', icon: Mail },
        { to: '/asst-manager/students',      label: 'Student Records (View)', icon: Users },
      ]},
    ],
  },

  exam_office: {
    label: 'Exam Office',
    home: '/exam',
    nav: [
      { group: null, items: [{ to: '/exam', label: 'Dashboard', icon: Home }] },
      { group: 'Examination', items: [
        { to: '/exam/schedule',  label: 'Exam Schedule',  icon: Calendar },
        { to: '/exam/seating',   label: 'Seating Plan',   icon: Layers },
        { to: '/exam/finalize',  label: 'Grade Finalize', icon: FileCheck },
        { to: '/exam/retakes',   label: 'Retakes',        icon: FilePen },
        { to: '/exam/transcripts', label: 'Transcripts',  icon: ScrollText },
      ]},
    ],
  },

  finance: {
    label: 'Finance / Accounts',
    home: '/finance',
    nav: [
      { group: null, items: [{ to: '/finance', label: 'Dashboard', icon: Home }] },
      { group: 'Fees', items: [
        { to: '/finance/challans',  label: 'Challans',     icon: Wallet },
        { to: '/finance/payments',  label: 'Payments',     icon: Receipt },
        { to: '/finance/holds',     label: 'Holds',        icon: Lock },
      ]},
      { group: 'Reports', items: [
        { to: '/finance/reports',   label: 'Collection Reports', icon: FileBarChart },
      ]},
    ],
  },

  it_admin: {
    label: 'IT Administrator',
    home: '/it',
    nav: [
      { group: null, items: [{ to: '/it', label: 'Dashboard', icon: Home }] },
      { group: 'Identity', items: [
        { to: '/it/users',     label: 'Users',          icon: Users },
        { to: '/it/roles',     label: 'Roles & Access', icon: ShieldCheck },
        { to: '/it/passwords', label: 'Password Resets',icon: KeyRound },
      ]},
      { group: 'System', items: [
        { to: '/it/logs',      label: 'Audit Logs',     icon: Database },
        { to: '/it/settings',  label: 'System Settings',icon: Settings },
      ]},
    ],
  },

  registrar: {
    label: 'Registrar',
    home: '/registrar',
    nav: [
      { group: null, items: [{ to: '/registrar', label: 'Dashboard', icon: Home }] },
      { group: 'Approvals', items: [
        { to: '/registrar/late-registration', label: 'Late Registration', icon: ClipboardList },
        { to: '/registrar/grade-changes',     label: 'Grade Changes',     icon: FilePen },
      ]},
      { group: 'Records', items: [
        { to: '/registrar/students',  label: 'Student Records', icon: Users },
        { to: '/registrar/offerings', label: 'Course Offerings',icon: BookOpen },
      ]},
    ],
  },

  admissions: {
    label: 'Admissions Officer',
    home: '/admissions',
    nav: [
      { group: null, items: [{ to: '/admissions', label: 'Dashboard', icon: Home }] },
      { group: 'Admissions', items: [
        { to: '/admissions/new',      label: 'New Admission', icon: UserPlus },
        { to: '/admissions/records',  label: 'Records',       icon: Users },
      ]},
    ],
  },

  cao: {
    label: 'Central Academic Office',
    home: '/cao',
    nav: [
      { group: null, items: [{ to: '/cao', label: 'Dashboard', icon: Home }] },
      { group: 'Operations', items: [
        { to: '/cao/profiles',  label: 'Profile Distribution', icon: Send },
        { to: '/cao/dc-cases',  label: 'Disciplinary Cases',   icon: Shield },
      ]},
    ],
  },
}
