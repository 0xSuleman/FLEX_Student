import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Marks from './pages/Marks'
import PloMarks from './pages/PloMarks'
import Transcript from './pages/Transcript'
import GradeReport from './pages/GradeReport'
import StudyPlan from './pages/StudyPlan'
import CourseRegistration from './pages/CourseRegistration'
import CourseWithdraw from './pages/CourseWithdraw'
import RetakeExam from './pages/RetakeExam'
import GradeChange from './pages/GradeChange'
import FeeChallan from './pages/FeeChallan'
import FeeDetails from './pages/FeeDetails'
import CourseFeedback from './pages/CourseFeedback'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/plo" element={<PloMarks />} />
        <Route path="/transcript" element={<Transcript />} />
        <Route path="/grade-report" element={<GradeReport />} />
        <Route path="/study-plan" element={<StudyPlan />} />
        <Route path="/course-registration" element={<CourseRegistration />} />
        <Route path="/course-withdraw" element={<CourseWithdraw />} />
        <Route path="/retake-exam" element={<RetakeExam />} />
        <Route path="/grade-change" element={<GradeChange />} />
        <Route path="/fee-challan" element={<FeeChallan />} />
        <Route path="/fee-details" element={<FeeDetails />} />
        <Route path="/feedback" element={<CourseFeedback />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
