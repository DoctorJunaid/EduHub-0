import {
  LayoutGrid,
  BookOpen,
  FileText,
  CircleCheck,
  NotebookPen,
  Award,
  WalletCards,
  MessageCircle,
} from "lucide-react";

export const studentNavigation = [
  {
    label: "Overview",
    path: "/student/dashboard",
    exact: true,
    icon: <LayoutGrid size={20} />,
  },
  { label: "My Courses", path: '/student/courses', icon: <BookOpen size={20} /> },
  { label: "Assignments", path: "/student/assignments", icon: <FileText size={20} /> },
  { label: "Attendance Record", path: "/student/attendance", icon: <CircleCheck size={20} /> },
  { label: "Daily Diary", icon: <NotebookPen size={20} /> },
  { label: "Grades & CGPA", icon: <Award size={20} /> },
  { label: "Fee Vouchers", icon: <WalletCards size={20} /> },
  { label: "Messages", icon: <MessageCircle size={20} /> },
];
