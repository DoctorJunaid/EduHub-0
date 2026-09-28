import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Bus,
  ShieldAlert,
  Wallet,
  Bug,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function TicketCategoryBadge({ category = "Other" }) {
  const iconMap = {
    "Technical Issue": <Wrench className="w-3 h-3 text-slate-500 mr-1" />,
    Academic: <GraduationCap className="w-3 h-3 text-indigo-500 mr-1" />,
    Attendance: <CalendarCheck className="w-3 h-3 text-emerald-500 mr-1" />,
    "Fees & Payments": <CreditCard className="w-3 h-3 text-teal-500 mr-1" />,
    Library: <BookOpen className="w-3 h-3 text-amber-500 mr-1" />,
    Transport: <Bus className="w-3 h-3 text-orange-500 mr-1" />,
    Discipline: <ShieldAlert className="w-3 h-3 text-rose-500 mr-1" />,
    Payroll: <Wallet className="w-3 h-3 text-blue-500 mr-1" />,
    "Platform Bug": <Bug className="w-3 h-3 text-red-500 mr-1" />,
    "Feature Request": <Sparkles className="w-3 h-3 text-purple-500 mr-1" />,
    Other: <HelpCircle className="w-3 h-3 text-zinc-500 mr-1" />,
  };

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-zinc-50 border-zinc-200 text-zinc-700"
    >
      {iconMap[category] || iconMap.Other}
      {category}
    </Badge>
  );
}
