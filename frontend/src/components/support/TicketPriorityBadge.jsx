import React from "react";
import { AlertCircle, Clock } from "lucide-react";

export const PRIORITY_CONFIG = {
  Urgent: {
    label: "Urgent (2h SLA)",
    shortLabel: "Urgent",
    className: "bg-rose-50 text-rose-700 border-rose-200/70",
    icon: AlertCircle,
  },
  High: {
    label: "High (8h SLA)",
    shortLabel: "High",
    className: "bg-amber-50 text-amber-700 border-amber-200/70",
    icon: Clock,
  },
  Medium: {
    label: "Medium (24h SLA)",
    shortLabel: "Medium",
    className: "bg-neutral-100 text-neutral-700 border-neutral-200/70",
    icon: Clock,
  },
  Low: {
    label: "Low (72h SLA)",
    shortLabel: "Low",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
    icon: Clock,
  },
};

export const TicketPriorityBadge = ({ priority = "Medium", showSla = false, className = "" }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  const Icon = config.icon;

  return (
    <span
      className={`isu-ticket-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border shrink-0 whitespace-nowrap leading-none ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{showSla ? config.label : config.shortLabel}</span>
    </span>
  );
};

export default TicketPriorityBadge;
