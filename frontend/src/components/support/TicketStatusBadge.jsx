import React from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Maps internal ticket status to user-friendly emojis and admin badges
 * Backend -> User sees:
 * Open -> 🟢 Waiting for reply
 * In Progress -> 🟡 Being looked at
 * Resolved -> 🔵 Answered
 * Closed -> ⚪ Done
 */
export const USER_STATUS_CONFIG = {
  Open: {
    label: "Waiting for reply",
    emoji: "🟢",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  "In Progress": {
    label: "Being looked at",
    emoji: "🟡",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Resolved: {
    label: "Answered",
    emoji: "🔵",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  Closed: {
    label: "Done",
    emoji: "⚪",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  },
  Escalated: {
    label: "Being looked at",
    emoji: "🟡",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Cancelled: {
    label: "Done",
    emoji: "⚪",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  },
};

export const ADMIN_STATUS_CONFIG = {
  Open: {
    label: "Open",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  Resolved: {
    label: "Resolved",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
  },
  Closed: {
    label: "Closed",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
  },
  Escalated: {
    label: "Escalated",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-neutral-500/10 text-neutral-600 border-neutral-500/20 dark:text-neutral-400",
  },
};

export const TicketStatusBadge = ({ status = "Open", isAdmin = false, className = "" }) => {
  if (isAdmin) {
    const config = ADMIN_STATUS_CONFIG[status] || ADMIN_STATUS_CONFIG.Open;
    return (
      <Badge
        variant="outline"
        className={`font-medium px-2.5 py-0.5 rounded-full text-xs shadow-none ${config.className} ${className}`}
      >
        {config.label}
      </Badge>
    );
  }

  const config = USER_STATUS_CONFIG[status] || USER_STATUS_CONFIG.Open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      <span className="text-[10px] leading-none" aria-hidden="true">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default TicketStatusBadge;
