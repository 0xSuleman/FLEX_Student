import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import Attendance from './pages/Attendance'
import Marks from './pages/Marks'
import MarksPLO from './pages/MarksPLO'
import Transcript from './pages/Transcript'
import CourseRegistration from './pages/CourseRegistration'
import FeeChallan from './pages/FeeChallan'
import FeeDetails from './pages/FeeDetails'
import CourseFeedback from './pages/CourseFeedback'
import RetakeExam from './pages/RetakeExam'
import CourseWithdraw from './pages/CourseWithdraw'
import GradeChange from './pages/GradeChange'
import StudyPlan from './pages/StudyPlan'
import GradeReport from './pages/GradeReport'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="marks" element={<Marks />} />
        <Route path="marks-plo" element={<MarksPLO />} />
        <Route path="transcript" element={<Transcript />} />
        <Route path="course-registration" element={<CourseRegistration />} />
        <Route path="fee-challan" element={<FeeChallan />} />
        <Route path="fee-details" element={<FeeDetails />} />
        <Route path="course-feedback" element={<CourseFeedback />} />
        <Route path="retake-exam" element={<RetakeExam />} />
        <Route path="course-withdraw" element={<CourseWithdraw />} />
        <Route path="grade-change" element={<GradeChange />} />
        <Route path="study-plan" element={<StudyPlan />} />
        <Route path="grade-report" element={<GradeReport />} />
      </Route>
    </Routes>
  )
}

export default App
