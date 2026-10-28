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
  const CategoryIcon = getCategoryIcon(category);

  if (showIconOnly) {
    return (
      <span className={`inline-flex items-center justify-center text-zinc-600 ${className}`} title={label}>
        {React.createElement(CategoryIcon, { className: "w-3.5 h-3.5 text-muted-foreground shrink-0" })}
      </span>
    );
  }

  return (
    <span
      className={`isu-ticket-badge inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium max-w-[140px] truncate ${className}`}
      style={{ padding: "2px 8px", gap: "6px" }}
      title={label}
    >
      {React.createElement(CategoryIcon, { className: "w-3.5 h-3.5 text-neutral-600 shrink-0" })}
      <span className="truncate">{label}</span>
    </span>
  );
};

export default TicketCategoryBadge;
