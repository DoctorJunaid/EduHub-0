import { useSelector } from "react-redux";
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from "@/layouts/MainLayout";
import { selectStudentProfile, selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { getStudentNav } from "./navigation";
import { useInstitution } from "@/context/InstitutionContext";
import "./Student.css";

export default function StudentLayout() {
  const { isSchool } = useInstitution();
  const profile = useSelector(selectStudentProfile);
  const student = useSelector(selectCurrentStudent);
  const hasDemoData = useSelector((state) => Boolean(student && (
    student.academicSummaryDemo ||
    [state.results, state.fees, state.studentAttendance].some((collection) =>
      collection.records.some((row) => row.studentId === student.id && row.demo))
  )));
  const location = useLocation();
  const navigate = useNavigate();
  const nav = getStudentNav(isSchool);

  const pageLabel = {
    '/student/courses': isSchool ? 'Subjects' : 'Courses',
    '/student/assignments': isSchool ? 'Homework' : 'Assignments',
    '/student/attendance': 'Attendance',
    '/student/diary': 'Diary',
    '/student/grades': isSchool ? 'Report Card' : 'Results',
    '/student/fees': isSchool ? 'Challans' : 'Fees',
    '/student/messages': 'Messages',
  }[location.pathname];

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
      navigation={nav}
      className="student-shell"
      profile={hasDemoData ? { ...profile, roleLabel: `${profile.roleLabel} · Demo` } : profile}
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
