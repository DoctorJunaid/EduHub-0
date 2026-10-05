import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";
import { EmptyConversationsState } from "./EmptyConversationsState";
import { User, AlertCircle } from "lucide-react";
import { getSupportTicketPath } from "@/utils/supportRouting";

export const TicketListTable = ({
  tickets = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onNewTicket,
}) => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const role = auth?.user?.role;

  if (!tickets || tickets.length === 0) {
    return <EmptyConversationsState onNewConversation={onNewTicket} isAdmin={true} />;
  }

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;

  return (
    <div className="isu-table-wrapper w-full overflow-x-auto">
      <table className="isu-ticket-table w-full text-left text-sm border-collapse">
        <thead className="bg-zinc-50/80 border-b border-zinc-200">
          <tr className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            {onToggleSelect && (
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 h-4 w-4 transition-colors cursor-pointer"
                />
              </th>
            )}
            <th className="py-3 px-3.5 whitespace-nowrap">Ticket #</th>
            <th className="py-3 px-3.5 min-w-[200px]">Subject</th>
            <th className="py-3 px-3.5 min-w-[140px]">Creator</th>
            <th className="py-3 px-3.5 whitespace-nowrap">Category</th>
            <th className="py-3 px-3.5 whitespace-nowrap">Priority</th>
            <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
            <th className="py-3 px-3.5 min-w-[130px]">Assigned To</th>
            <th className="py-3 px-3.5 text-right whitespace-nowrap">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tickets.map((ticket) => {
            const isSelected = selectedIds.includes(ticket._id);
            const timeAgo = ticket.lastActivityAt
              ? formatDistanceToNow(new Date(ticket.lastActivityAt), { addSuffix: true })
              : "Just now";

            const creatorName = ticket.createdBySnapshot?.name || "User";
            const creatorRole = ticket.createdBySnapshot?.role || "student";
            const creatorInitial = creatorName.charAt(0).toUpperCase();

            const assigneeName = ticket.assignedToSnapshot?.name;
            const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

            return (
              <tr
                key={ticket._id}
                onClick={() => navigate(getSupportTicketPath(role, ticket._id))}
                className={`group cursor-pointer transition-colors hover:bg-zinc-50/80 ${
                  isSelected ? "bg-zinc-100/60" : ""
                }`}
              >
                {onToggleSelect && (
                  <td
                    className="py-3 px-3.5 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(ticket._id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(ticket._id)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 h-4 w-4 transition-colors cursor-pointer"
                    />
                  </td>
                )}
                <td className="py-3 px-3.5 font-mono text-xs font-semibold text-zinc-900 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>{ticket.ticketNumber}</span>
                    {ticket.isOverdue && (
                      <span title="Overdue SLA" className="inline-flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3.5 text-zinc-900 font-medium text-[13px] max-w-xs truncate group-hover:text-zinc-950 transition-colors">
                  {ticket.subject}
                </td>
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-semibold text-zinc-700 shrink-0">
                      {creatorInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-none text-zinc-900 truncate">
                        {creatorName}
                      </p>
                      <p className="text-[10px] text-zinc-500 capitalize leading-none mt-1">
                        {creatorRole}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <TicketCategoryBadge category={ticket.category} />
                </td>
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <TicketPriorityBadge priority={ticket.priority} />
                </td>
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <TicketStatusBadge status={ticket.status} isAdmin={true} />
                </td>
                <td className="py-3 px-3.5 whitespace-nowrap">
                  {assigneeName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-semibold text-zinc-700 shrink-0">
                        {assigneeInitial}
                      </div>
                      <span className="text-xs font-medium text-zinc-900 truncate">
                        {assigneeName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 italic">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Unassigned</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3.5 text-right text-xs text-zinc-500 whitespace-nowrap">
                  {timeAgo}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TicketListTable;
