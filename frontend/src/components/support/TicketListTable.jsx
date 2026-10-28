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
  handleSelectOne = onToggleSelect,
  onSelectAll,
  handleSelectAll = onSelectAll,
  onNewTicket,
}) => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const role = auth?.user?.role;

  if (!tickets || tickets.length === 0) {
    return <EmptyConversationsState onNewConversation={onNewTicket} isAdmin={true} />;
  }

  const selectHandler = handleSelectOne || onToggleSelect;
  const selectAllHandler = handleSelectAll || onSelectAll;

  return (
    <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="isu-ticket-table w-full min-w-[1100px] border-collapse text-left table-auto">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/70">
              {selectHandler && (
                <th className="w-10 text-center" style={{ padding: "12px 16px" }}>
                  <input
                    type="checkbox"
                    checked={tickets.length > 0 && selectedIds.length === tickets.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate =
                          selectedIds.length > 0 && selectedIds.length < tickets.length;
                      }
                    }}
                    onChange={(e) => selectAllHandler && selectAllHandler(e)}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                  />
                </th>
              )}
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "12%" }}
              >
                Ticket #
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "20%" }}
              >
                Subject
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "15%" }}
              >
                Creator
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "15%" }}
              >
                Category
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "10%" }}
              >
                Priority
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "10%" }}
              >
                Status
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                style={{ padding: "12px 16px", width: "10%" }}
              >
                Assigned To
              </th>
              <th
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-right"
                style={{ padding: "12px 16px", width: "8%" }}
              >
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {tickets.map((ticket) => {
              const ticketId = ticket._id || ticket.id;
              const isSelected = selectedIds.includes(ticketId);
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
                  key={ticketId}
                  onClick={() => navigate(getSupportTicketPath(role, ticketId))}
                  className={`hover:bg-neutral-50/50 transition-colors cursor-pointer ${
                    isSelected ? "bg-neutral-100/60" : ""
                  }`}
                >
                  {selectHandler && (
                    <td
                      className="w-10 text-center align-middle"
                      style={{ padding: "12px 16px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.target.tagName !== "INPUT") {
                          selectHandler(ticketId);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          selectHandler(ticketId);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                      />
                    </td>
                  )}
                  <td
                    className="text-xs font-mono font-medium text-neutral-900 whitespace-nowrap align-middle"
                    style={{ padding: "12px 16px" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{ticket.ticketNumber || ticket.ticketNo}</span>
                      {ticket.isOverdue && (
                        <span title="Overdue SLA" className="inline-flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="text-xs text-neutral-800 truncate max-w-xs align-middle"
                    style={{ padding: "12px 16px" }}
                  >
                    {ticket.subject}
                  </td>
                  <td className="text-xs text-neutral-700 align-middle" style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[10px] font-semibold text-neutral-700 shrink-0">
                        {creatorInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-none text-neutral-900 truncate">
                          {creatorName}
                        </p>
                        <p className="text-[10px] text-neutral-500 capitalize leading-none mt-1">
                          {creatorRole}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Category Cell with Ellipsis & Max Width to prevent spilling */}
                  <td className="text-xs text-neutral-700 align-middle" style={{ padding: "12px 16px" }}>
                    <TicketCategoryBadge category={ticket.category} className="max-w-[140px] truncate" />
                  </td>
                  <td className="text-xs align-middle" style={{ padding: "12px 16px" }}>
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="text-xs align-middle" style={{ padding: "12px 16px" }}>
                    <TicketStatusBadge status={ticket.status} isAdmin={true} />
                  </td>
                  <td className="text-xs text-neutral-700 truncate align-middle" style={{ padding: "12px 16px" }}>
                    {assigneeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[10px] font-semibold text-neutral-700 shrink-0">
                          {assigneeInitial}
                        </div>
                        <span className="text-xs font-medium text-neutral-900 truncate">
                          {assigneeName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 italic">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Unassigned</span>
                      </div>
                    )}
                  </td>
                  <td
                    className="text-xs text-neutral-500 text-right whitespace-nowrap font-mono align-middle"
                    style={{ padding: "12px 16px" }}
                  >
                    {timeAgo}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketListTable;
