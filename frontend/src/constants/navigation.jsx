import React from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  Trophy,
  MessageSquare,
  Settings,
  Building2,
  Home,
} from "lucide-react";

export const ADMIN_NAV = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "Institutes", path: "/institutes", icon: <Building2 size={20} /> },
  { label: "Students", path: "/students", icon: <Users size={20} /> },
  { label: "Teachers", path: "/teachers", icon: <GraduationCap size={20} /> },
  { label: "Classes", path: "/classes", icon: <BookOpen size={20} /> },
  { label: "Courses", path: "/courses", icon: <ClipboardList size={20} /> },
  { label: "Attendance", path: "/attendance", icon: <Calendar size={20} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={20} /> },
];

export const CAMPUS_ADMIN_NAV = [
  { label: "Campus Overview", path: "/dashboard", icon: <Home size={20} /> },
  { label: "Faculty Directory", path: "/faculty", group: "People", icon: <Users size={20} /> },
  { label: "Students Directory", path: "/students", group: "People", icon: <Users size={20} /> },
  { label: "Class Timetable", path: "/timetable", group: "Academics", icon: <Calendar size={20} /> },
  { label: "Exam Schedules", path: "/exams", group: "Academics", icon: <Calendar size={20} /> },
];

export const TEACHER_NAV = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "My Classes", path: "/classes", icon: <BookOpen size={20} /> },
  { label: "Students", path: "/students", icon: <Users size={20} /> },
  { label: "Attendance", path: "/attendance", icon: <Calendar size={20} /> },
  {
    label: "Assignments",
    path: "/assignments",
    icon: <ClipboardList size={20} />,
  },
  { label: "Exams", path: "/exams", icon: <Award size={20} /> },
  { label: "Results", path: "/results", icon: <Trophy size={20} /> },
  { label: "Messages", path: "/messages", icon: <MessageSquare size={20} /> },
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
