import {
  Home,
  Building2,
  Users,
  GraduationCap,
  Megaphone,
  Headset,
  Settings,
  Wallet,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
export const instituteNavigation = [
  {
    label: "Overview",
    path: "/institute-admin",
    exact: true,
    icon: <Home size={20} />,
  },
  {
    label: "Campuses",
    path: "/institute-admin/campuses",
    icon: <Building2 size={20} />,
  },
  {
    label: "Staff Directory",
    path: "/institute-admin/staff",
    icon: <Users size={20} />,
  },
  {
    label: "Students",
    path: "/institute-admin/students",
    icon: <GraduationCap size={20} />,
  },
  {
    label: "Broadcast Alerts",
    path: "/institute-admin/alerts",
    icon: <Megaphone size={20} />,
  },
  {
    label: "Salary Policies",
    path: "/institute-admin/salary-policies",
    icon: <Wallet size={20} />,
  },
  {
    label: "Subscription & Plan",
    path: "/institute-admin/subscription",
    icon: <CreditCard size={20} />,
  },
  {
    label: "Audit Logs",
    path: "/institute-admin/audit-logs",
    icon: <ShieldCheck size={20} />,
  },
  {
    label: "Help & Support",
    path: "/institute-admin/support",
    icon: <Headset size={20} />,
  },
  {
    label: "Settings",
    path: "/institute-admin/settings",
    icon: <Settings size={20} />,
  },
];
