import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import {
  selectStudentProfile,
  selectCurrentStudent,
} from "@/store/selectors/studentDashboard";
import { getStudentNav } from "./navigation";
import { useInstitution } from "@/context/InstitutionContext";
import useStudentPortal from "@/hooks/useStudentPortal";
import { studentsLoaded } from "@/store/Slices/studentsSlice";
import { schedulesLoaded } from "@/store/Slices/timetableSlice";
import { studentAttendanceLoaded } from "@/store/Slices/studentAttendanceSlice";
import { feesLoaded } from "@/store/Slices/feesSlice";
import { resultsLoaded } from "@/store/Slices/resultsSlice";
import { examsLoaded } from "@/store/Slices/examsSlice";
import {
  assignmentsLoaded,
  submissionsLoaded,
} from "@/store/Slices/assignmentsSlice";
import { diaryLoaded } from "@/store/Slices/diarySlice";
import { conversationsLoaded } from "@/store/Slices/messagesSlice";
import "./Student.css";

export default function StudentLayout() {
  const { isSchool } = useInstitution();
  const dispatch = useDispatch();
  const profile = useSelector(selectStudentProfile);
  const student = useSelector(selectCurrentStudent);
  const hasDemoData = useSelector((state) =>
    Boolean(
      student &&
      (student.academicSummaryDemo ||
        [state.results, state.fees, state.studentAttendance].some(
          (collection) =>
            collection.records.some(
              (row) => row.studentId === student.id && row.demo,
            ),
        )),
    ),
  );
  const location = useLocation();
  const nav = getStudentNav(isSchool);

  const pageLabel = {
    "/student/id-card": "Student ID Card",
    "/student/courses": isSchool ? "Subjects" : "Courses",
    "/student/assignments": isSchool ? "Daily Diary & Homework" : "Assignments",
    "/student/attendance": "Attendance Record",
    "/student/diary": isSchool ? "Daily Diary & Homework" : "Diary",
    "/student/grades": isSchool ? "Progress Report Card" : "Results",
    "/student/fees": isSchool ? "School Fee Challan" : "Fees",
    "/student/transport": isSchool ? "School Bus & Route" : "Transport & Commute",
    "/student/messages": "Messages",
    "/student/timetable": isSchool ? "Class Routine & Timetable" : "Timetable",
    "/student/schedule": isSchool ? "Class Routine & Timetable" : "Timetable",
  }[location.pathname];

  const focusSummary = () => {
    const summary = document.getElementById("student-profile-summary");
    summary?.scrollIntoView({ block: "nearest" });
    summary?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (
      location.pathname === "/student/dashboard" &&
      location.state?.focusStudentProfile
    )
      focusSummary();
  }, [location]);

  // Primary data query with caching via React Query
  useStudentPortal();


  return (
    <MainLayout
      navigation={nav}
      className="student-shell"
      profile={
        hasDemoData
          ? { ...profile, roleLabel: `${profile.roleLabel} · Demo` }
          : profile
      }
      headerProps={{
        homePath: "/student/dashboard",
        homeLabel: pageLabel ? "Dashboard" : "Home",
        breadcrumbItems: [pageLabel || "Dashboard"],
        onViewProfile: () => {
          if (pageLabel)
            navigate("/student/dashboard", {
              state: { focusStudentProfile: true },
            });
          else focusSummary();
        },
      }}
    />
  );
}
