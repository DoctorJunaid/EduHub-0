import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpCircle,
  HelpCircle,
} from "lucide-react";

export default function TicketStatusBadge({ status = "Open" }) {
  const map = {
    Open: {
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      icon: <Clock className="w-3 h-3 mr-1 text-blue-600" />,
    },
    "In Progress": {
      className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      icon: <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />,
    },
    Resolved: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />,
    },
    Closed: {
      className: "bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200",
      icon: <CheckCircle2 className="w-3 h-3 mr-1 text-zinc-500" />,
    },
    Escalated: {
      className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
      icon: <ArrowUpCircle className="w-3 h-3 mr-1 text-purple-600" />,
    },
    Cancelled: {
      className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
      icon: <XCircle className="w-3 h-3 mr-1 text-rose-600" />,
    },
  };

  const item = map[status] || {
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
    icon: <HelpCircle className="w-3 h-3 mr-1" />,
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border shadow-2xs ${item.className}`}
    >
      {item.icon}
      {status}
    </Badge>
  );
}
