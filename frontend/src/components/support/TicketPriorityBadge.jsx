import React from "react";
import { AlertCircle, Clock } from "lucide-react";

export const PRIORITY_CONFIG = {
  Urgent: {
    label: "Urgent (2h SLA)",
    shortLabel: "Urgent",
    className: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: AlertCircle,
  },
  High: {
    label: "High (8h SLA)",
    shortLabel: "High",
    className: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  Medium: {
    label: "Medium (24h SLA)",
    shortLabel: "Medium",
    className: "bg-neutral-100 text-neutral-700 border-neutral-200/70 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    icon: Clock,
  },
  Low: {
    label: "Low (72h SLA)",
    shortLabel: "Low",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200/70 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    icon: Clock,
  },
};

export const TicketPriorityBadge = ({ priority = "Medium", showSla = false, className = "" }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  const Icon = config.icon;

  return (
    <span
      className={`isu-ticket-badge inline-flex items-center gap-1.5 h-6 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 whitespace-nowrap leading-none ${config.className} ${className}`}
      style={{ padding: "3px 10px" }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{showSla ? config.label : config.shortLabel}</span>
    </span>
  );
};

export default TicketPriorityBadge;
