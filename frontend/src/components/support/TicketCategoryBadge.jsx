import React from "react";
import { getCategoryIcon, getCategoryLabel } from "./supportCategories";

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
  const label = getCategoryLabel(category);
  const Icon = getCategoryIcon(category);

  if (showIconOnly) {
    return (
      <span className={`inline-flex items-center justify-center text-zinc-600 ${className}`} title={label}>
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shrink-0 whitespace-nowrap ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <span>{label}</span>
    </span>
  );
};

export default TicketCategoryBadge;
