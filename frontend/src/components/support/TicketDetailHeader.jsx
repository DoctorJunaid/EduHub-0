import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketCategoryBadge from "./TicketCategoryBadge";

export default function TicketDetailHeader({ ticket }) {
  const navigate = useNavigate();

  if (!ticket) return null;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-4 mb-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>

          <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
            {ticket.ticketNumber}
          </span>

          <div className="flex items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketCategoryBadge category={ticket.category} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            Created {new Date(ticket.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
        {ticket.subject}
      </h1>
    </div>
  );
}
