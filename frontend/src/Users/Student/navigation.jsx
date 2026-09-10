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
  { label: "Daily Diary", path: "/student/diary", icon: <NotebookPen size={20} /> },
  { label: "Grades & CGPA", path: "/student/grades", icon: <Award size={20} /> },
  { label: "Fee Vouchers", path: "/student/fees", icon: <WalletCards size={20} /> },
  { label: "Messages", path: "/student/messages", icon: <MessageCircle size={20} /> },
];
