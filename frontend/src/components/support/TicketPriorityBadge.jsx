import React from "react";
import { AlertCircle, Clock } from "lucide-react";

export const PRIORITY_CONFIG = {
  Urgent: {
    label: "Urgent (2h SLA)",
    shortLabel: "Urgent",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: AlertCircle,
  },
  High: {
    label: "High (8h SLA)",
    shortLabel: "High",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  Medium: {
    label: "Medium (24h SLA)",
    shortLabel: "Medium",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    icon: Clock,
  },
  Low: {
    label: "Low (72h SLA)",
    shortLabel: "Low",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    icon: Clock,
  },
};

export const TicketPriorityBadge = ({ priority = "Medium", showSla = false, className = "" }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 leading-none ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{showSla ? config.label : config.shortLabel}</span>
    </span>
  );
};

export default TicketPriorityBadge;
