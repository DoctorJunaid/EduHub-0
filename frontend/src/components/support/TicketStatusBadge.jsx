import React from "react";

export const USER_STATUS_CONFIG = {
  Open: {
    label: "Waiting for reply",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  "In Progress": {
    label: "Being looked at",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Resolved: {
    label: "Answered",
    dotColor: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  Closed: {
    label: "Done",
    dotColor: "bg-zinc-400",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
  Escalated: {
    label: "Being looked at",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Cancelled: {
    label: "Done",
    dotColor: "bg-zinc-400",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
};

export const ADMIN_STATUS_CONFIG = {
  Open: {
    label: "Open",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  "In Progress": {
    label: "In Progress",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Resolved: {
    label: "Resolved",
    dotColor: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  Closed: {
    label: "Closed",
    dotColor: "bg-zinc-400",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
  Escalated: {
    label: "Escalated",
    dotColor: "bg-rose-500",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  Cancelled: {
    label: "Cancelled",
    dotColor: "bg-zinc-400",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
};

export const TicketStatusBadge = ({ status = "Open", isAdmin = false, className = "" }) => {
  const config = isAdmin
    ? (ADMIN_STATUS_CONFIG[status] || ADMIN_STATUS_CONFIG.Open)
    : (USER_STATUS_CONFIG[status] || USER_STATUS_CONFIG.Open);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 leading-none ${config.className} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default TicketStatusBadge;
