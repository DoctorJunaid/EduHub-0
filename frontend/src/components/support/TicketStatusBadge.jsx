import React from "react";

export const USER_STATUS_CONFIG = {
  Open: {
    label: "Waiting for reply",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  },
  "In Progress": {
    label: "Being looked at",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200/70",
  },
  Resolved: {
    label: "Answered",
    dotColor: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200/70",
  },
  Closed: {
    label: "Done",
    dotColor: "bg-neutral-400",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
  },
  Escalated: {
    label: "Being looked at",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200/70",
  },
  Cancelled: {
    label: "Done",
    dotColor: "bg-neutral-400",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
  },
};

export const ADMIN_STATUS_CONFIG = {
  Open: {
    label: "Open",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  },
  "In Progress": {
    label: "In Progress",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200/70",
  },
  Resolved: {
    label: "Resolved",
    dotColor: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200/70",
  },
  Closed: {
    label: "Closed",
    dotColor: "bg-neutral-400",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
  },
  Escalated: {
    label: "Escalated",
    dotColor: "bg-rose-500",
    className: "bg-rose-50 text-rose-700 border-rose-200/70",
  },
  Cancelled: {
    label: "Cancelled",
    dotColor: "bg-neutral-400",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
  },
};

export const TicketStatusBadge = ({ status = "Open", isAdmin = false, className = "" }) => {
  const config = isAdmin
    ? (ADMIN_STATUS_CONFIG[status] || ADMIN_STATUS_CONFIG.Open)
    : (USER_STATUS_CONFIG[status] || USER_STATUS_CONFIG.Open);

  return (
    <span
      className={`isu-ticket-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border shrink-0 whitespace-nowrap leading-none ${config.className} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default TicketStatusBadge;
