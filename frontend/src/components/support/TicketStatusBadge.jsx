import React from "react";

export const USER_STATUS_CONFIG = {
  Open: {
    label: "Waiting for reply",
    dotColor: "bg-emerald-500",
    className: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  "In Progress": {
    label: "Being looked at",
    dotColor: "bg-amber-500",
    className: "bg-[#fefce8] text-[#854d0e] border-[#fde047] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Resolved: {
    label: "Answered",
    dotColor: "bg-blue-500",
    className: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  Closed: {
    label: "Done",
    dotColor: "bg-zinc-400",
    className: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7] dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
  },
  Escalated: {
    label: "Being looked at",
    dotColor: "bg-amber-500",
    className: "bg-[#fefce8] text-[#854d0e] border-[#fde047] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Cancelled: {
    label: "Done",
    dotColor: "bg-zinc-400",
    className: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7] dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
  },
};

export const ADMIN_STATUS_CONFIG = {
  Open: {
    label: "Open",
    dotColor: "bg-emerald-500",
    className: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  "In Progress": {
    label: "In Progress",
    dotColor: "bg-amber-500",
    className: "bg-[#fefce8] text-[#854d0e] border-[#fde047] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Resolved: {
    label: "Resolved",
    dotColor: "bg-blue-500",
    className: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  Closed: {
    label: "Closed",
    dotColor: "bg-zinc-400",
    className: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7] dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
  },
  Escalated: {
    label: "Escalated",
    dotColor: "bg-rose-500",
    className: "bg-[#fff1f2] text-[#9f1239] border-[#fecdd3] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  Cancelled: {
    label: "Cancelled",
    dotColor: "bg-zinc-400",
    className: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7] dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
  },
};

export const TicketStatusBadge = ({ status = "Open", isAdmin = false, className = "" }) => {
  const config = isAdmin
    ? (ADMIN_STATUS_CONFIG[status] || ADMIN_STATUS_CONFIG.Open)
    : (USER_STATUS_CONFIG[status] || USER_STATUS_CONFIG.Open);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs leading-none shrink-0 ${config.className} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default TicketStatusBadge;
