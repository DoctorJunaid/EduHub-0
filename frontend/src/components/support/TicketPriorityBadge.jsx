import React from "react";
import { Badge } from "@/components/ui/badge";

export default function TicketPriorityBadge({ priority = "Medium" }) {
  const map = {
    Urgent: {
      className: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
      dot: "bg-rose-600 animate-pulse",
      label: "Urgent (2h)",
    },
    High: {
      className: "bg-orange-100 text-orange-800 border-orange-300 font-semibold",
      dot: "bg-orange-500",
      label: "High (8h)",
    },
    Medium: {
      className: "bg-amber-50 text-amber-800 border-amber-200 font-medium",
      dot: "bg-amber-400",
      label: "Medium (24h)",
    },
    Low: {
      className: "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium",
      dot: "bg-emerald-400",
      label: "Low (72h)",
    },
  };

  const item = map[priority] || map.Medium;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-md border ${item.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <span>{priority}</span>
    </Badge>
  );
}
