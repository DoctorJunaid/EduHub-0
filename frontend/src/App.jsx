import BroadcastAlerts from "./Admins/Institute Admin/Alerts/BroadcastAlerts";
import FacultyAttendance from "./Admins/Campus Admin/Attendance/FacultyAttendance";
import StudentAttendance from "./Admins/Campus Admin/Attendance/Students/StudentAttendance";
import ExamResults from "./Admins/Campus Admin/Results/ExamResults";
import FeeManagement from "./Admins/Campus Admin/Fees/FeeManagement";
import Messages from "./Admins/Campus Admin/Messages/Messages";
import Signup from "./auth/Signup";
import Login from "./auth/Login";
import SetPassword from "./auth/SetPassword";
import InstituteDashboard from "./Admins/Institute Admin/InstituteDashboard";
import CampusBranches from "./Admins/Institute Admin/Campuses/CampusBranches";
import InstituteStudents from "./Admins/Institute Admin/Students/InstituteStudents";
import InstituteStaff from "./Admins/Institute Admin/Staff/InstituteStaff";
import "./Admins/Institute Admin/InstituteAdmin.css";
import { instituteNavigation } from "./Admins/Institute Admin/navigation";
import ProtectedRoute, { AuthEntry } from "./auth/ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import CampusOverview from "./Admins/Campus Admin/Dashboard/CampusOverview";
import FacultyDirectory from "./Admins/Campus Admin/Faculty/FacultyDirectory";
import StudentsDirectory from "./Admins/Campus Admin/Students/StudentsDirectory";
import ClassTimetable from "./Admins/Campus Admin/Timetable/ClassTimetable";
import ExamSchedules from "./Admins/Campus Admin/Exams/ExamSchedules";
import SuperAdminDashboard from "./Admins/Super Admin/Dashboard/SuperAdminDashboard";
import Institutes from "./Admins/Super Admin/Institutes/Institutes";
import ManageInstitutePage from "./Admins/Super Admin/Institutes/ManageInstitutePage";
import GlobalUsers from "./Admins/Super Admin/Users/GlobalUsers";
import SuperAdminBroadcasts from "./Admins/Super Admin/Broadcasts/SuperAdminBroadcasts";
import { ADMIN_NAV } from "./constants/navigation";
import {
  StudentLayout,
  StudentDashboard,
  StudentCourses,
  StudentAssignments,
  StudentAttendancePage,
  StudentDiary,
  StudentGrades,
  StudentFees,
  StudentMessages,
} from "./Users/Student";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser, selectAuth } from "./store/Slices/authSlice";
import { Toaster } from "react-hot-toast";
import NotFound from "./components/common/NotFound";

const App = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  useEffect(() => {
    if (localStorage.getItem("eduHubToken") && !auth.user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, auth.user]);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
      <Route path="/" element={<AuthEntry />} />
      <Route
        path="signup"
        element={
          <AuthEntry>
            <Signup />
          </AuthEntry>
        }
      />
      <Route
        path="login"
        element={
          <AuthEntry>
            <Login />
          </AuthEntry>
        }
      />
      <Route
        path="set-password"
        element={
          <AuthEntry>
            <SetPassword />
          </AuthEntry>
        }
      />

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<StudentLayout />}>
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="student/courses" element={<StudentCourses />} />
          <Route path="student/assignments" element={<StudentAssignments />} />
          <Route
            path="student/attendance"
            element={<StudentAttendancePage />}
          />
          <Route path="student/diary" element={<StudentDiary />} />
          <Route path="student/grades" element={<StudentGrades />} />
          <Route path="student/fees" element={<StudentFees />} />
          <Route path="student/messages" element={<StudentMessages />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["institute_admin"]} />}>
        <Route
          element={
            <MainLayout
              navigation={instituteNavigation}
              className="institute-admin-shell"
            />
          }
        >
          <Route path="institute-admin" element={<InstituteDashboard />} />
          <Route path="institute-admin/campuses" element={<CampusBranches />} />
          <Route path="institute-admin/alerts" element={<BroadcastAlerts />} />
          <Route
            path="institute-admin/students"
            element={<InstituteStudents />}
          />
          <Route path="institute-admin/staff" element={<InstituteStaff />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["campus_admin"]} />}>
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
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route element={<MainLayout navigation={ADMIN_NAV} />}>
          <Route path="super-admin" element={<SuperAdminDashboard />} />
          <Route path="institutes" element={<Institutes />} />
          <Route path="institutes/new" element={<ManageInstitutePage />} />
          <Route path="institutes/:id" element={<ManageInstitutePage />} />
          <Route path="super-admin/users" element={<GlobalUsers />} />
          <Route path="super-admin/broadcasts" element={<SuperAdminBroadcasts />} />
        </Route>
      </Route>

      {/* Global 404 Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

export default App;
