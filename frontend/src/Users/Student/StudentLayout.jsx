import { useSelector } from "react-redux";
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from "@/layouts/MainLayout";
import { selectStudentProfile } from "@/store/selectors/studentDashboard";
import { studentNavigation } from "./navigation";
import "./Student.css";

export default function StudentLayout() {
  const profile = useSelector(selectStudentProfile);
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = { '/student/courses': 'Courses', '/student/assignments': 'Assignments', '/student/attendance': 'Attendance', '/student/diary': 'Diary', '/student/grades': 'Results' }[location.pathname];
  const focusSummary = () => {
    const summary = document.getElementById('student-profile-summary');
    summary?.scrollIntoView({ block: 'nearest' });
    summary?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (location.pathname === '/student/dashboard' && location.state?.focusStudentProfile) focusSummary();
  }, [location]);
  return (
    <MainLayout
      navigation={studentNavigation}
      className="student-shell"
      profile={profile}
      headerProps={{
        homePath: "/student/dashboard",
        homeLabel: pageLabel ? 'Dashboard' : 'Home',
        breadcrumbItems: [pageLabel || 'Dashboard'],
        onViewProfile: () => {
          if (pageLabel) navigate('/student/dashboard', { state: { focusStudentProfile: true } });
          else focusSummary();
        },
      }}
    />
  );
}
