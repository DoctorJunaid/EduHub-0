import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  Trophy,
  MessageSquare,
  Building2,
  Home,
  Radio,
  Wallet,
  ShieldCheck,
} from "lucide-react";

export const ADMIN_NAV = [
  {
    label: "Overview",
    path: "/super-admin",
    exact: true,
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Institutes",
    path: "/institutes",
    icon: <Building2 size={20} />,
  },
  {
    label: "Global Users",
    path: "/super-admin/users",
    icon: <Users size={20} />,
  },
  {
    label: "Broadcast Alerts",
    path: "/super-admin/broadcasts",
    icon: <Radio size={20} />,
  },
];

export const getCampusAdminNav = (isSchool = false) => [
  {
    label: isSchool ? "School Overview" : "Campus Overview",
    path: "/dashboard",
    icon: <Home size={20} />,
  },
  {
    label: isSchool ? "Teachers Directory" : "Faculty Directory",
    path: "/faculty",
    group: "People",
    icon: <Users size={20} />,
  },
  {
    label: "Students Directory",
    path: "/students",
    group: "People",
    icon: <Users size={20} />,
  },
  {
    label: isSchool ? "Class Routine & Timetable" : "Class Timetable",
    path: "/timetable",
    group: "Academics",
    icon: <Calendar size={20} />,
  },
  {
    label: isSchool ? "Classes & Subjects" : "Academic Programs",
    path: "/academics",
    group: "Academics",
    icon: <BookOpen size={20} />,
  },
  {
    label: "Teacher Assignments",
    path: "/teacher-assignments",
    group: "Academics",
    icon: <ClipboardList size={20} />,
  },
  {
    label: "Exam Schedules",
    path: "/exams",
    group: "Academics",
    icon: <Calendar size={20} />,
  },
  {
    label: isSchool ? "Teacher Attendance" : "Staff Attendance",
    path: "/faculty-attendance",
    group: "Academics",
    icon: <Users size={20} />,
  },
  {
    label: "Student Attendance",
    path: "/student-attendance",
    group: "Academics",
    icon: <Users size={20} />,
  },
  {
    label: isSchool ? "Exams & Report Cards" : "Exam Results & GPA",
    path: "/results",
    group: "Academics",
    icon: <Award size={20} />,
  },
  {
    label: "Teaching Performance",
    path: "/teaching-performance",
    group: "Academics",
    icon: <Award size={20} />,
  },
  {
    label: "Fee Management",
    path: "/fees",
    group: "Finance",
    icon: <ClipboardList size={20} />,
  },
  { label: "Messages", path: "/messages", icon: <MessageSquare size={20} /> },
  { label: "Substitutes", path: "/substitutes", icon: <Users size={20} /> },
  {
    label: "Salary Profiles",
    path: "/salary-profiles",
    group: "Finance",
    icon: <Wallet size={20} />,
  },
  {
    label: "Salary & Payroll",
    path: "/salary-payroll",
    group: "Finance",
    icon: <ClipboardList size={20} />,
  },
  {
    label: "Salary Approvals",
    path: "/payroll-approvals",
    group: "Finance",
    icon: <ShieldCheck size={20} />,
  },
  {
    label: "Salary Review Center",
    path: "/salary-review-center",
    group: "Finance",
    icon: <ShieldCheck size={20} />,
  },
  { label: "Settings", path: "/settings", icon: <ClipboardList size={20} /> },
];

export const CAMPUS_ADMIN_NAV = getCampusAdminNav(false);

export const TEACHER_NAV = [
  {
    label: "Overview",
    path: "/teacher",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "My Teaching Credits",
    path: "/teacher/credits",
    icon: <Award size={20} />,
  },
  {
    label: "My Salary",
    path: "/my-salary",
    icon: <Wallet size={20} />,
  },
  {
    label: "My Classes",
    path: "/teacher/classes",
    icon: <BookOpen size={20} />,
  },
  {
    label: "Assignments & Grading",
    path: "/teacher/assignments",
    icon: <ClipboardList size={20} />,
  },
  {
    label: "Take Attendance",
    path: "/teacher/attendance",
    icon: <Users size={20} />,
  },
  {
    label: "Daily Diary",
    path: "/teacher/diary",
    icon: <Calendar size={20} />,
  },
  {
    label: "Gradebook & Marks",
    path: "/teacher/gradebook",
    icon: <Trophy size={20} />,
  },
  {
    label: "Messages",
    path: "/teacher/messages",
    icon: <MessageSquare size={20} />,
  },
];

export const STUDENT_NAV = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "My Courses", path: "/courses", icon: <BookOpen size={20} /> },
  {
    label: "Assignments",
    path: "/assignments",
    icon: <ClipboardList size={20} />,
  },
  { label: "Exams", path: "/exams", icon: <Award size={20} /> },
  { label: "Results", path: "/results", icon: <Trophy size={20} /> },
  { label: "Achievements", path: "/achievements", icon: <Award size={20} /> },
  { label: "Competitions", path: "/competitions", icon: <Trophy size={20} /> },
  { label: "Messages", path: "/messages", icon: <MessageSquare size={20} /> },
];

export const PARENT_NAV = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "Children", path: "/students", icon: <Users size={20} /> },
  { label: "Attendance", path: "/attendance", icon: <Calendar size={20} /> },
  { label: "Results", path: "/results", icon: <Trophy size={20} /> },
  { label: "Messages", path: "/messages", icon: <MessageSquare size={20} /> },
];

export const ALUMNI_NAV = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "Events", path: "/events", icon: <Calendar size={20} /> },
  { label: "Network", path: "/alumni", icon: <Users size={20} /> },
  { label: "Messages", path: "/messages", icon: <MessageSquare size={20} /> },
];
