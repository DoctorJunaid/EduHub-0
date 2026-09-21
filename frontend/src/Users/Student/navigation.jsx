import {
  LayoutGrid,
  BookOpen,
  FileText,
  CircleCheck,
  Award,
  WalletCards,
  MessageCircle,
} from "lucide-react";

export const getStudentNav = (isSchool) => [
  {
    label: "Overview",
    path: "/student/dashboard",
    exact: true,
    icon: <LayoutGrid size={20} />,
  },
  {
    label: isSchool ? "My Subjects" : "My Courses",
    path: "/student/courses",
    icon: <BookOpen size={20} />,
  },
  {
    label: isSchool ? "Daily Diary & Homework" : "Assignments",
    path: "/student/assignments",
    icon: <FileText size={20} />,
  },
  {
    label: "Attendance Record",
    path: "/student/attendance",
    icon: <CircleCheck size={20} />,
  },
  {
    label: "Progress Report Card",
    path: "/student/grades",
    icon: <Award size={20} />,
  },
  {
    label: isSchool ? "School Fee Challan" : "Fee Vouchers",
    path: "/student/fees",
    icon: <WalletCards size={20} />,
  },
  {
    label: "Messages",
    path: "/student/messages",
    icon: <MessageCircle size={20} />,
  },
];

export const studentNavigation = getStudentNav(false);
