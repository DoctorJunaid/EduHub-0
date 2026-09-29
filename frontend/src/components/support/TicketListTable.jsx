import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";
import { EmptyConversationsState } from "./EmptyConversationsState";
import { User, AlertCircle } from "lucide-react";

export const TicketListTable = ({
  tickets = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onNewTicket,
}) => {
  const navigate = useNavigate();

  if (!tickets || tickets.length === 0) {
    return <EmptyConversationsState onNewConversation={onNewTicket} isAdmin={true} />;
  }

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/80 bg-card">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {onToggleSelect && (
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
              </th>
            )}
            <th className="p-3.5">Ticket #</th>
            <th className="p-3.5">Subject</th>
            <th className="p-3.5">Creator</th>
            <th className="p-3.5">Category</th>
            <th className="p-3.5">Priority</th>
            <th className="p-3.5">Status</th>
            <th className="p-3.5">Assigned To</th>
            <th className="p-3.5 text-right">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {tickets.map((ticket) => {
            const isSelected = selectedIds.includes(ticket._id);
            const timeAgo = ticket.lastActivityAt
              ? formatDistanceToNow(new Date(ticket.lastActivityAt), { addSuffix: true })
              : "Just now";

            return (
              <tr
                key={ticket._id}
                onClick={() => navigate(`/support/${ticket._id}`)}
                className={`group cursor-pointer transition-colors hover:bg-muted/50 ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                {onToggleSelect && (
                  <td
                    className="p-3.5 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(ticket._id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(ticket._id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                  </td>
                )}
                <td className="p-3.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>{ticket.ticketNumber}</span>
                    {ticket.isOverdue && (
                      <span title="Overdue SLA">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3.5 font-medium text-foreground max-w-xs truncate group-hover:text-primary transition-colors">
                  {ticket.subject}
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      {ticket.createdBySnapshot?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-none text-foreground">
                        {ticket.createdBySnapshot?.name || "User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {ticket.createdBySnapshot?.role || "student"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <TicketCategoryBadge category={ticket.category} />
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <TicketPriorityBadge priority={ticket.priority} />
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  <TicketStatusBadge status={ticket.status} isAdmin={true} />
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  {ticket.assignedToSnapshot?.name ? (
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{ticket.assignedToSnapshot.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                  )}
                </td>
                <td className="p-3.5 text-right text-xs text-muted-foreground whitespace-nowrap">
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
