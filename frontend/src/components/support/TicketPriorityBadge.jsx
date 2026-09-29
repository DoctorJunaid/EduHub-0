import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock } from "lucide-react";

export const PRIORITY_CONFIG = {
  Urgent: {
    label: "Urgent (2h SLA)",
    shortLabel: "Urgent",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 font-semibold",
    icon: AlertCircle,
  },
  High: {
    label: "High (8h SLA)",
    shortLabel: "High",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 font-medium",
    icon: Clock,
  },
  Medium: {
    label: "Medium (24h SLA)",
    shortLabel: "Medium",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 font-medium",
    icon: Clock,
  },
  Low: {
    label: "Low (72h SLA)",
    shortLabel: "Low",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 font-normal",
    icon: Clock,
  },
};

export const TicketPriorityBadge = ({ priority = "Medium", showSla = false, className = "" }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs shadow-none ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{showSla ? config.label : config.shortLabel}</span>
    </Badge>
  );
};

export default TicketPriorityBadge;
