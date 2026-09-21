import { Link, useLocation } from "react-router-dom";
import MyClasses from "./MyClasses";
import TeacherAssignments from "./TeacherAssignments";
import TeacherAttendance from "./TeacherAttendance";
import TeacherDiary from "./TeacherDiary";
import TeacherGradebook from "./TeacherGradebook";
import TeacherMessages from "./TeacherMessages";

const copy = {
  "/teacher/classes": [
    "My Classes",
    "Assigned courses, sections, and weekly teaching schedule.",
  ],
  "/teacher/assignments": [
    "Assignments & Grading",
    "Review student submissions and record assessment feedback.",
  ],
  "/teacher/attendance": [
    "Take Student Attendance",
    "Select an assigned class to mark student attendance.",
  ],
  "/teacher/diary": [
    "Daily Lecture Diary",
    "Record lecture topics, homework, and class notes.",
  ],
  "/teacher/gradebook": [
    "Gradebook & Marks",
    "Manage marks for students in your assigned classes.",
  ],
  "/teacher/messages": [
    "Messages",
    "View conversations available to your teacher account.",
  ],
};

export default function TeacherPage() {
  const { pathname } = useLocation();
  if (pathname === "/teacher/classes") return <MyClasses />;
  if (pathname === "/teacher/assignments") return <TeacherAssignments />;
  if (pathname === "/teacher/attendance") return <TeacherAttendance />;
  if (pathname === "/teacher/diary") return <TeacherDiary />;
  if (pathname === "/teacher/gradebook") return <TeacherGradebook />;
  if (pathname === "/teacher/messages") return <TeacherMessages />;
  const [title, description] = copy[pathname] || [
    "Teacher Portal",
    "Choose an item from the Teacher navigation.",
  ];
  return (
    <section
      className="teacher-page-placeholder"
      aria-labelledby="teacher-page-title"
    >
      <p className="page-eyebrow">Teacher portal</p>
      <h1 id="teacher-page-title">{title}</h1>
      <p>{description}</p>
      <Link className="teacher-primary-link" to="/teacher">
        Back to Overview
      </Link>
    </section>
  );
}
