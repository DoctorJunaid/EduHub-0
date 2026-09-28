import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Clock, User, ArrowUpRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketCategoryBadge from "./TicketCategoryBadge";
import { Spinner } from "@/components/ui/spinner";
import TableSkeleton from "@/components/shared/TableSkeleton";

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function TicketListTable({
  tickets = [],
  isLoading = false,
  showCreator = false,
}) {
  const navigate = useNavigate();

  if (isLoading && tickets.length === 0) {
    return <TableSkeleton rows={6} columns={showCreator ? 7 : 6} />;
  }

  return (
    <div className="campus-table-container relative bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
      {isLoading && tickets.length > 0 && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
          <Spinner className="size-6 text-zinc-900" />
        </div>
      )}

      <Table className="campus-table">
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: "14%" }}>Ticket #</TableHead>
            <TableHead style={{ width: showCreator ? "28%" : "34%" }}>Subject</TableHead>
            {showCreator && <TableHead style={{ width: "16%" }}>Created By</TableHead>}
            <TableHead style={{ width: "15%" }}>Category</TableHead>
            <TableHead style={{ width: "12%" }}>Priority</TableHead>
            <TableHead style={{ width: "12%" }}>Status</TableHead>
            <TableHead style={{ width: "9%", textAlign: "right" }}>Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const creatorName =
              ticket.createdBySnapshot?.name || ticket.createdBy?.name || "User";
            const creatorRole =
              ticket.createdBySnapshot?.role || ticket.createdBy?.role || "";

            return (
              <TableRow
                key={ticket._id || ticket.ticketNumber}
                className="cursor-pointer hover:bg-zinc-50/80 transition-colors"
                onClick={() => navigate(`/support/${ticket._id}`)}
              >
                <TableCell className="font-mono text-xs font-bold text-zinc-900">
                  <div className="flex items-center gap-1.5">
                    <span>{ticket.ticketNumber}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col min-w-0">
                    <strong className="text-xs font-semibold text-zinc-900 truncate block">
                      {ticket.subject}
                    </strong>
                    <span className="text-[11px] text-zinc-500 truncate block max-w-md">
                      {ticket.description}
                    </span>
                  </div>
                </TableCell>

                {showCreator && (
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
                        {creatorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-zinc-800 truncate">
                          {creatorName}
                        </span>
                        <span className="text-[10px] text-zinc-400 capitalize">
                          {creatorRole.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                )}

                <TableCell>
                  <TicketCategoryBadge category={ticket.category} />
                </TableCell>

                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>

                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>

                <TableCell style={{ textAlign: "right" }}>
                  <span className="text-xs text-zinc-500 font-medium">
                    {formatRelativeTime(ticket.lastActivityAt || ticket.updatedAt)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
