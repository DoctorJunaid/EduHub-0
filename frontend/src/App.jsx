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
import InstituteRevenue from "./Admins/Institute Admin/Revenue/InstituteRevenue";
import CampusBranches from "./Admins/Institute Admin/Campuses/CampusBranches";
import ManageCampusPage from "./Admins/Institute Admin/Campuses/ManageCampusPage";
import InstituteStudents from "./Admins/Institute Admin/Students/InstituteStudents";
import InstituteStaff from "./Admins/Institute Admin/Staff/InstituteStaff";
import InstituteAuditLogs from "./Admins/Institute Admin/AuditLogs/InstituteAuditLogs";
import "./Admins/Institute Admin/InstituteAdmin.css";
import { instituteNavigation } from "./Admins/Institute Admin/navigation";
import SalaryPolicies from "./Admins/Institute Admin/Payroll/SalaryPolicies";
import Settings from "./components/Settings/Settings";
import SalaryProfiles from "./pages/SalaryProfiles";
import MySalary from "./pages/MySalary";
import SalaryPayroll from "./pages/SalaryPayroll";
import PayrollApprovals from "./pages/PayrollApprovals";
import SubstituteAssignments from "./components/Substitutes/SubstituteAssignments";
import ProtectedRoute, { AuthEntry } from "./auth/ProtectedRoute";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import CampusOverview from "./Admins/Campus Admin/Dashboard/CampusOverview";
import FacultyDirectory from "./Admins/Campus Admin/Faculty/FacultyDirectory";
import TeacherProfile from "./pages/TeacherProfile";
import StudentsDirectory from "./Admins/Campus Admin/Students/StudentsDirectory";
import ClassTimetable from "./Admins/Campus Admin/Timetable/ClassTimetable";
import ExamSchedules from "./Admins/Campus Admin/Exams/ExamSchedules";
import AcademicsConfig from "./Admins/Campus Admin/Academics/AcademicsConfig";
import TeacherAssignments from "./Admins/Campus Admin/Faculty/TeacherAssignments";
import SuperAdminDashboard from "./Admins/Super Admin/Dashboard/SuperAdminDashboard";
import Institutes from "./Admins/Super Admin/Institutes/Institutes";
import ManageInstitutePage from "./Admins/Super Admin/Institutes/ManageInstitutePage";
import GlobalUsers from "./Admins/Super Admin/Users/GlobalUsers";
import SuperAdminBroadcasts from "./Admins/Super Admin/Broadcasts/SuperAdminBroadcasts";
import SuperAdminInquiries from "./Admins/Super Admin/Inquiries/SuperAdminInquiries";
import EditInstitute from "./Admins/Super Admin/Institutes/EditInstitute";
import InstituteDetails from "./Admins/Super Admin/Institutes/InstituteDetails";
import PlansManagement from "./Admins/Super Admin/Plans/PlansManagement";
import SubscriptionsManagement from "./Admins/Super Admin/Subscriptions/SubscriptionsManagement";
import InstituteSubscription from "./Admins/Institute Admin/Subscription/InstituteSubscription";
import AuditLogs from "./Admins/Super Admin/AuditLogs/AuditLogs";
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
import MyPayslips from "./pages/MyPayslips";
import TeacherLayout from "./Users/Teacher/TeacherLayout";
import TeacherDashboard from "./Users/Teacher/TeacherDashboard";
import TeacherPage from "./Users/Teacher/TeacherPage";
import TeacherClassCredits from "./Users/Teacher/TeacherClassCredits";
import MyClass from "./pages/teacher/MyClass";
import ClassAttendance from "./pages/teacher/ClassAttendance";
import MyClassResults from "./pages/teacher/MyClassResults";
import TeachingPerformance from "./pages/TeachingPerformance";
import SalaryReviewCenter from "./pages/SalaryReviewCenter";
import AdminSeed from "./pages/AdminSeed";
import SupportList from "./pages/SupportList";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import SupportManage from "./pages/SupportManage";
import FloatingHelpWidget from "./components/support/FloatingHelpWidget";

const App = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  useEffect(() => {
    if (localStorage.getItem("eduHubToken")) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <FloatingHelpWidget />
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
            <Route
              path="student/assignments"
              element={<StudentAssignments />}
            />
            <Route
              path="student/attendance"
              element={<StudentAttendancePage />}
            />
            <Route
              path="student/diary"
              element={<Navigate to="/student/assignments" replace />}
            />
            <Route path="student/grades" element={<StudentGrades />} />
            <Route path="student/fees" element={<StudentFees />} />
            <Route path="student/support" element={<SupportList />} />
            <Route path="student/support/:id" element={<SupportTicketDetail />} />
            <Route path="student/messages" element={<SupportList />} />
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
            <Route
              path="institute-admin/revenue"
              element={<InstituteRevenue />}
            />
            <Route
              path="institute-admin/fees"
              element={<InstituteRevenue />}
            />
            <Route
              path="institute-admin/campuses"
              element={<CampusBranches />}
            />
            <Route
              path="institute-admin/campuses/new"
              element={<ManageCampusPage />}
            />
            <Route
              path="institute-admin/campuses/:id"
              element={<ManageCampusPage />}
            />
            <Route
              path="institute-admin/alerts"
              element={<BroadcastAlerts />}
            />
            <Route
              path="institute-admin/students"
              element={<InstituteStudents />}
            />
            <Route path="institute-admin/staff" element={<InstituteStaff />} />
            <Route path="institute-admin/audit-logs" element={<InstituteAuditLogs />} />
            <Route path="institute-admin/subscription" element={<InstituteSubscription />} />
            <Route path="institute-admin/salary-policies" element={<SalaryPolicies />} />
            <Route path="institute-admin/settings" element={<Settings />} />
            <Route path="institute-admin/support" element={<SupportManage />} />
            <Route path="institute-admin/support/:id" element={<SupportTicketDetail />} />
            <Route path="institute-admin/messages" element={<SupportManage />} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "campus_admin",
                "campus_manager",
                "institute_admin",
                "principal",
                "super_admin",
              ]}
            />
          }
        >
          <Route element={<MainLayout />}>
            <Route path="dashboard" element={<CampusOverview />} />
            <Route path="faculty" element={<FacultyDirectory />} />
            <Route path="faculty/:teacherId" element={<TeacherProfile />} />
            <Route path="teachers/:teacherId" element={<TeacherProfile />} />
            <Route path="teacher/:teacherId" element={<TeacherProfile />} />
            <Route path="faculty-profile/:teacherId" element={<TeacherProfile />} />
            <Route path="students" element={<StudentsDirectory />} />
            <Route path="timetable" element={<ClassTimetable />} />
            <Route path="exams" element={<ExamSchedules />} />
            <Route path="faculty-attendance" element={<FacultyAttendance />} />
            <Route path="student-attendance" element={<StudentAttendance />} />
            <Route path="results" element={<ExamResults />} />
            <Route path="fees" element={<FeeManagement />} />
            <Route path="support" element={<SupportList />} />
            <Route path="support/manage" element={<SupportManage />} />
            <Route path="support/:id" element={<SupportTicketDetail />} />
            <Route path="messages" element={<SupportList />} />
            <Route path="settings" element={<Settings />} />
            <Route path="teaching-performance" element={<TeachingPerformance />} />
            <Route path="substitutes" element={<SubstituteAssignments />} />
            <Route path="academics" element={<AcademicsConfig />} />
            <Route path="teacher-assignments" element={<TeacherAssignments />} />
            <Route path="admin/seed" element={<AdminSeed />} />
            <Route path="seed" element={<AdminSeed />} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "campus_admin",
                "campus_manager",
                "institute_admin",
                "accountant",
                "principal",
              ]}
            />
          }
        >
          <Route element={<MainLayout />}>
            <Route path="salary-profiles" element={<SalaryProfiles />} />
            <Route path="salary-payroll" element={<SalaryPayroll />} />
            <Route path="payroll-approvals" element={<PayrollApprovals />} />
            <Route path="salary-review-center" element={<SalaryReviewCenter />} />
          </Route>
        </Route>

        <Route
          element={<ProtectedRoute allowedRoles={["teacher", "faculty"]} />}
        >
          <Route element={<TeacherLayout />}>
            <Route path="teacher" element={<TeacherDashboard />} />
            <Route path="teacher/my-class" element={<MyClass />} />
            <Route path="teacher/my-class/attendance" element={<ClassAttendance />} />
            <Route path="teacher/my-class/results" element={<MyClassResults />} />
            <Route path="teacher/credits" element={<TeacherClassCredits />} />
            <Route path="teacher/classes" element={<TeacherPage />} />
            <Route path="teacher/assignments" element={<TeacherPage />} />
            <Route path="teacher/attendance" element={<TeacherPage />} />
            <Route path="teacher/diary" element={<TeacherPage />} />
            <Route path="teacher/gradebook" element={<TeacherPage />} />
            <Route path="teacher/support" element={<SupportList />} />
            <Route path="teacher/support/:id" element={<SupportTicketDetail />} />
            <Route path="teacher/messages" element={<SupportList />} />
            <Route path="my-payslips" element={<MyPayslips />} />
            <Route path="my-salary" element={<MySalary />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route element={<MainLayout navigation={ADMIN_NAV} />}>
            <Route path="super-admin" element={<SuperAdminDashboard />} />
            <Route path="institutes" element={<Institutes />} />
            <Route path="institutes/new" element={<ManageInstitutePage />} />
            <Route
              path="institutes/:instituteId/edit"
              element={<EditInstitute />}
            />
            <Route
              path="institutes/:instituteId/view"
              element={<InstituteDetails />}
            />
            <Route path="institutes/:id" element={<ManageInstitutePage />} />
            <Route path="super-admin/plans" element={<PlansManagement />} />
            <Route path="super-admin/subscriptions" element={<SubscriptionsManagement />} />
            <Route path="super-admin/users" element={<GlobalUsers />} />
            <Route
              path="super-admin/inquiries"
              element={<SuperAdminInquiries />}
            />
            <Route
              path="super-admin/broadcasts"
              element={<SuperAdminBroadcasts />}
            />
            <Route path="super-admin/audit-logs" element={<AuditLogs />} />
            <Route path="super-admin/support" element={<SupportManage />} />
            <Route path="super-admin/support/:id" element={<SupportTicketDetail />} />
            <Route path="super-admin/messages" element={<SupportManage />} />
          </Route>
        </Route>

        {/* Global 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
