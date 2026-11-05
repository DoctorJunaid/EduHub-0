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

export const TicketCategoryBadge = ({
  category = "Other",
  showIconOnly = false,
  className = "",
}) => {
  const label = getCategoryLabel(category);
  const CategoryIcon = getCategoryIcon(category);

  if (showIconOnly) {
    return (
      <span
        className={`inline-flex items-center justify-center text-zinc-600 ${className}`}
        title={label}
      >
        {React.createElement(CategoryIcon, {
          className: "w-3.5 h-3.5 text-muted-foreground shrink-0",
        })}
      </span>
    );
  }

  return (
    <span
      className={`isu-ticket-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/80 text-[11px] font-medium text-neutral-700 whitespace-nowrap ${className}`}
      title={label}
    >
      {React.createElement(CategoryIcon, {
        className: "w-3.5 h-3.5 text-neutral-500 shrink-0",
      })}
      <span className="truncate">{label}</span>
    </span>
  );
};

export default TicketCategoryBadge;
