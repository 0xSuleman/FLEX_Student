import { Routes, Route, Navigate } from 'react-router-dom'
import StaffLogin from './pages/StaffLogin'
import ProtectedRoute from './components/ProtectedRoute'
import StaffLayout from './components/StaffLayout'

// Faculty
import FacultyLayout from './pages/faculty/FacultyLayout'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyCourses from './pages/faculty/FacultyCourses'
import FacultyAttendance from './pages/faculty/FacultyAttendance'
import FacultyMarks from './pages/faculty/FacultyMarks'
import FacultyGrading from './pages/faculty/FacultyGrading'
import FacultyWithdrawals from './pages/faculty/FacultyWithdrawals'
import FacultyReports from './pages/faculty/FacultyReports'
import FacultyTimetable from './pages/faculty/FacultyTimetable'
import FacultyFeedback from './pages/faculty/FacultyFeedback'

// HOD
import HodDashboard from './pages/hod/HodDashboard'
import HodGradeApprovals from './pages/hod/HodGradeApprovals'
import HodWithdrawals from './pages/hod/HodWithdrawals'
import HodMonitoring from './pages/hod/HodMonitoring'
import HodSections from './pages/hod/HodSections'
import HodLateRegistration from './pages/hod/HodLateRegistration'
import HodRetakes from './pages/hod/HodRetakes'

// AO
import AoDashboard from './pages/ao/AoDashboard'
import AoEnrollments from './pages/ao/AoEnrollments'
import AoSectionClashes from './pages/ao/AoSectionClashes'
import AoSemester from './pages/ao/AoSemester'
import AoStudents from './pages/ao/AoStudents'
import AoLateRegistration from './pages/ao/AoLateRegistration'
import AoGradeChanges from './pages/ao/AoGradeChanges'
import AoWithdrawals from './pages/ao/AoWithdrawals'
import AoPendingFaculty from './pages/ao/AoPendingFaculty'

// Asst AO
import AsstAoDashboard from './pages/asst-ao/AsstAoDashboard'
import AsstAoMailingLists from './pages/asst-ao/AsstAoMailingLists'
import AsstAoStudents from './pages/asst-ao/AsstAoStudents'

// Manager
import ManagerDashboard from './pages/manager/ManagerDashboard'
import { ManagerEnrollments, ManagerSectionClashes, ManagerLateRegistration, ManagerStudents } from './pages/manager/ManagerStubs'

// Asst Manager
import AsstManagerDashboard from './pages/asst-manager/AsstManagerDashboard'
import { AsstManagerMailing, AsstManagerStudents } from './pages/asst-manager/AsstManagerStubs'

// Exam
import ExamDashboard from './pages/exam/ExamDashboard'
import ExamFinalize from './pages/exam/ExamFinalize'
import { ExamSchedule, ExamSeating, ExamRetakes, ExamTranscripts } from './pages/exam/ExamStubs'

// Finance
import FinanceDashboard from './pages/finance/FinanceDashboard'
import FinanceChallans from './pages/finance/FinanceChallans'
import { FinancePayments, FinanceHolds, FinanceReports } from './pages/finance/FinanceStubs'

// IT
import ItDashboard from './pages/it/ItDashboard'
import ItUsers from './pages/it/ItUsers'
import { ItRoles, ItPasswords, ItLogs, ItSettings } from './pages/it/ItStubs'

// Registrar
import RegistrarDashboard from './pages/registrar/RegistrarDashboard'
import RegistrarLateReg from './pages/registrar/RegistrarLateReg'
import { RegistrarGradeChanges, RegistrarStudents, RegistrarOfferings } from './pages/registrar/RegistrarStubs'

// Admissions
import AdmissionsDashboard from './pages/admissions/AdmissionsDashboard'
import AdmissionsNew from './pages/admissions/AdmissionsNew'
import AdmissionsRecords from './pages/admissions/AdmissionsRecords'

// CAO
import CaoDashboard from './pages/cao/CaoDashboard'
import CaoProfiles from './pages/cao/CaoProfiles'
import CaoDcCases from './pages/cao/CaoDcCases'

// Helper: any-role guard wrapping a layout configured for that role
const Gated = ({ role, children }) => (
  <ProtectedRoute requiredRole={role}>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<StaffLogin />} />

      {/* Faculty (uses its own existing layout) */}
      <Route element={<Gated role="faculty"><FacultyLayout /></Gated>}>
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/courses" element={<FacultyCourses />} />
        <Route path="/faculty/attendance" element={<FacultyAttendance />} />
        <Route path="/faculty/marks" element={<FacultyMarks />} />
        <Route path="/faculty/grading" element={<FacultyGrading />} />
        <Route path="/faculty/withdrawals" element={<FacultyWithdrawals />} />
        <Route path="/faculty/reports" element={<FacultyReports />} />
        <Route path="/faculty/timetable" element={<FacultyTimetable />} />
        <Route path="/faculty/feedback" element={<FacultyFeedback />} />
      </Route>

      {/* HOD */}
      <Route element={<Gated role="hod"><StaffLayout role="hod" /></Gated>}>
        <Route path="/hod" element={<HodDashboard />} />
        <Route path="/hod/grade-approvals" element={<HodGradeApprovals />} />
        <Route path="/hod/withdrawals" element={<HodWithdrawals />} />
        <Route path="/hod/late-registration" element={<HodLateRegistration />} />
        <Route path="/hod/retakes" element={<HodRetakes />} />
        <Route path="/hod/monitoring" element={<HodMonitoring />} />
        <Route path="/hod/sections" element={<HodSections />} />
      </Route>

      {/* AO */}
      <Route element={<Gated role="ao"><StaffLayout role="ao" /></Gated>}>
        <Route path="/ao" element={<AoDashboard />} />
        <Route path="/ao/semester" element={<AoSemester />} />
        <Route path="/ao/enrollments" element={<AoEnrollments />} />
        <Route path="/ao/section-clashes" element={<AoSectionClashes />} />
        <Route path="/ao/late-registration" element={<AoLateRegistration />} />
        <Route path="/ao/students" element={<AoStudents />} />
        <Route path="/ao/grade-changes" element={<AoGradeChanges />} />
        <Route path="/ao/withdrawals" element={<AoWithdrawals />} />
        <Route path="/ao/pending-faculty" element={<AoPendingFaculty />} />
      </Route>

      {/* Asst AO */}
      <Route element={<Gated role="asst_ao"><StaffLayout role="asst_ao" /></Gated>}>
        <Route path="/asst-ao" element={<AsstAoDashboard />} />
        <Route path="/asst-ao/mailing-lists" element={<AsstAoMailingLists />} />
        <Route path="/asst-ao/students" element={<AsstAoStudents />} />
      </Route>

      {/* Manager */}
      <Route element={<Gated role="manager"><StaffLayout role="manager" /></Gated>}>
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/enrollments" element={<ManagerEnrollments />} />
        <Route path="/manager/section-clashes" element={<ManagerSectionClashes />} />
        <Route path="/manager/late-registration" element={<ManagerLateRegistration />} />
        <Route path="/manager/students" element={<ManagerStudents />} />
      </Route>

      {/* Asst Manager */}
      <Route element={<Gated role="asst_manager"><StaffLayout role="asst_manager" /></Gated>}>
        <Route path="/asst-manager" element={<AsstManagerDashboard />} />
        <Route path="/asst-manager/mailing-lists" element={<AsstManagerMailing />} />
        <Route path="/asst-manager/students" element={<AsstManagerStudents />} />
      </Route>

      {/* Exam Office */}
      <Route element={<Gated role="exam_office"><StaffLayout role="exam_office" /></Gated>}>
        <Route path="/exam" element={<ExamDashboard />} />
        <Route path="/exam/schedule" element={<ExamSchedule />} />
        <Route path="/exam/seating" element={<ExamSeating />} />
        <Route path="/exam/finalize" element={<ExamFinalize />} />
        <Route path="/exam/retakes" element={<ExamRetakes />} />
        <Route path="/exam/transcripts" element={<ExamTranscripts />} />
      </Route>

      {/* Finance */}
      <Route element={<Gated role="finance"><StaffLayout role="finance" /></Gated>}>
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/finance/challans" element={<FinanceChallans />} />
        <Route path="/finance/payments" element={<FinancePayments />} />
        <Route path="/finance/holds" element={<FinanceHolds />} />
        <Route path="/finance/reports" element={<FinanceReports />} />
      </Route>

      {/* IT Admin */}
      <Route element={<Gated role="it_admin"><StaffLayout role="it_admin" /></Gated>}>
        <Route path="/it" element={<ItDashboard />} />
        <Route path="/it/users" element={<ItUsers />} />
        <Route path="/it/roles" element={<ItRoles />} />
        <Route path="/it/passwords" element={<ItPasswords />} />
        <Route path="/it/logs" element={<ItLogs />} />
        <Route path="/it/settings" element={<ItSettings />} />
      </Route>

      {/* Registrar */}
      <Route element={<Gated role="registrar"><StaffLayout role="registrar" /></Gated>}>
        <Route path="/registrar" element={<RegistrarDashboard />} />
        <Route path="/registrar/late-registration" element={<RegistrarLateReg />} />
        <Route path="/registrar/grade-changes" element={<RegistrarGradeChanges />} />
        <Route path="/registrar/students" element={<RegistrarStudents />} />
        <Route path="/registrar/offerings" element={<RegistrarOfferings />} />
      </Route>

      {/* Admissions */}
      <Route element={<Gated role="admissions"><StaffLayout role="admissions" /></Gated>}>
        <Route path="/admissions" element={<AdmissionsDashboard />} />
        <Route path="/admissions/new" element={<AdmissionsNew />} />
        <Route path="/admissions/records" element={<AdmissionsRecords />} />
      </Route>

      {/* CAO */}
      <Route element={<Gated role="cao"><StaffLayout role="cao" /></Gated>}>
        <Route path="/cao" element={<CaoDashboard />} />
        <Route path="/cao/profiles" element={<CaoProfiles />} />
        <Route path="/cao/dc-cases" element={<CaoDcCases />} />
      </Route>

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
