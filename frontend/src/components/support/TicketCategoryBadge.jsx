import React from "react";
import { Badge } from "@/components/ui/badge";

export const CATEGORY_ICONS = {
  Academic: { icon: "📚", label: "Homework or subject" },
  Attendance: { icon: "📅", label: "Attendance" },
  "Fees & Payments": { icon: "💰", label: "Fees or payment" },
  Library: { icon: "📖", label: "Library" },
  Transport: { icon: "🚌", label: "Transport" },
  "Technical Issue": { icon: "👤", label: "My account" },
  Discipline: { icon: "⚠️", label: "Discipline" },
  Payroll: { icon: "💵", label: "Salary" },
  Other: { icon: "❓", label: "Something else" },
  "Platform Bug": { icon: "🐛", label: "Platform Bug" },
  "Feature Request": { icon: "💡", label: "Feature Request" },
};

export const TicketCategoryBadge = ({ category = "Other", showIconOnly = false, className = "" }) => {
  const info = CATEGORY_ICONS[category] || { icon: "❓", label: category };

  if (showIconOnly) {
    return (
      <span className={`inline-flex items-center justify-center text-base select-none ${className}`} title={info.label}>
        {info.icon}
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-normal bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <span className="text-xs leading-none">{info.icon}</span>
      <span>{info.label}</span>
    </Badge>
  );
};

export default TicketCategoryBadge;
