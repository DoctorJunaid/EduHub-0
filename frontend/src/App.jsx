import DashboardContent from './Admins/Campus Admin/Dashboard/DashboardContent';
import FacultyAttendance from './Admins/Campus Admin/Attendance/FacultyAttendance';
import StudentAttendance from './Admins/Campus Admin/Attendance/Students/StudentAttendance';
import ExamResults from './Admins/Campus Admin/Results/ExamResults';
import FeeManagement from './Admins/Campus Admin/Fees/FeeManagement';
import Messages from './Admins/Campus Admin/Messages/Messages';
import Signup from './auth/Signup';
import Login from './auth/Login';
import ProtectedRoute, { AuthEntry } from './auth/ProtectedRoute';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CampusOverview from './Admins/Campus Admin/Dashboard/CampusOverview';
import FacultyDirectory from './Admins/Campus Admin/Faculty/FacultyDirectory';
import StudentsDirectory from './Admins/Campus Admin/Students/StudentsDirectory';
import ClassTimetable from './Admins/Campus Admin/Timetable/ClassTimetable';
import ExamSchedules from './Admins/Campus Admin/Exams/ExamSchedules';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthEntry />} />
      <Route path="signup" element={<AuthEntry><Signup /></AuthEntry>} />
      <Route path="login" element={<AuthEntry><Login /></AuthEntry>} />
      <Route element={<ProtectedRoute allowedRoles={['campus-admin']} />}>
      <Route element={<MainLayout />}>
        <Route path="dashboard" element={<CampusOverview />} />
        <Route path="faculty" element={<FacultyDirectory />} />
        <Route path="students" element={<StudentsDirectory />} />
        <Route path="timetable" element={<ClassTimetable />} />
        <Route path="exams" element={<ExamSchedules />} />
        <Route path="faculty-attendance" element={<FacultyAttendance />} />
        <Route path="student-attendance" element={<StudentAttendance />} />
        <Route path="results" element={<ExamResults />} />
        <Route path="fees" element={<FeeManagement />} />
        <Route path="messages" element={<Messages />} />
        <Route path="*" element={<DashboardContent />} />
      </Route>
      </Route>
    </Routes>
  );
};

export default App;
