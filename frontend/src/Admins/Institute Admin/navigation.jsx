import { Home, Building2, Users, BookOpen, MessageCircle } from "lucide-react";
export const instituteNavigation = [
  { label: "Overview", path: "/institute-admin", exact: true, icon: <Home size={20} /> },
  { label: "Campuses", path: '/institute-admin/campuses', icon: <Building2 size={20} /> },
  { label: "Staff Directory", path: '/institute-admin/staff', icon: <Users size={20} /> },
  { label: "Students", path: '/institute-admin/students', icon: <BookOpen size={20} /> },
  { label: "Broadcast Alerts", path: "/institute-admin/alerts", icon: <MessageCircle size={20} /> },
];

