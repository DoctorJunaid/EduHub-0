import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";
import { EmptyConversationsState } from "./EmptyConversationsState";
import { User, AlertCircle, ChevronRight } from "lucide-react";
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
    <div className="w-full bg-white overflow-hidden shadow-none">
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/70">
              {selectHandler && (
                <th className="w-10 text-center px-4 py-3 bg-neutral-50/70 border-b border-neutral-200">
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
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left whitespace-nowrap w-[130px]">
                Ticket #
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left min-w-[200px]">
                Subject
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left whitespace-nowrap w-[150px]">
                Creator
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left whitespace-nowrap w-[150px]">
                Category
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left whitespace-nowrap w-[110px]">
                Priority
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left whitespace-nowrap w-[110px]">
                Status
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-left whitespace-nowrap w-[150px]">
                Assigned To
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-right whitespace-nowrap w-[110px]">
                Last Activity
              </th>
              <th className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4 bg-neutral-50/70 border-b border-neutral-200 text-center w-[60px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
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
                  className={`group hover:bg-neutral-50/80 transition-colors cursor-pointer ${
                    isSelected ? "bg-neutral-50" : ""
                  }`}
                >
                  {selectHandler && (
                    <td
                      className="w-10 text-center px-4 py-3.5 align-middle border-b border-neutral-100 last:border-none"
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
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-mono text-xs font-semibold text-neutral-900 whitespace-nowrap">
                        {ticket.ticketNumber || ticket.ticketNo}
                      </span>
                      {ticket.isOverdue && (
                        <span
                          title="Overdue SLA"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-1.5 py-0.5 rounded shadow-none"
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Overdue</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle">
                    <p className="font-semibold text-xs text-neutral-900 hover:text-neutral-700 transition-colors line-clamp-1 max-w-sm">
                      {ticket.subject}
                    </p>
                    {ticket.description && (
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 max-w-sm">
                        {ticket.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 font-semibold text-xs flex items-center justify-center shrink-0">
                        {creatorInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight text-neutral-900 truncate max-w-[120px]">
                          {creatorName}
                        </p>
                        <p className="text-[10px] text-neutral-500 capitalize leading-tight mt-0.5 font-medium">
                          {creatorRole}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle whitespace-nowrap">
                    <TicketCategoryBadge category={ticket.category} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle whitespace-nowrap">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle whitespace-nowrap">
                    <TicketStatusBadge status={ticket.status} isAdmin={true} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-700 border-b border-neutral-100 last:border-none align-middle whitespace-nowrap">
                    {assigneeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 font-semibold text-xs flex items-center justify-center shrink-0">
                          {assigneeInitial}
                        </div>
                        <span className="text-xs font-medium text-neutral-900 truncate max-w-[120px]">
                          {assigneeName}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 italic">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-500 text-right whitespace-nowrap border-b border-neutral-100 last:border-none align-middle">
                    {timeAgo}
                  </td>
                  <td className="py-3.5 px-4 text-center align-middle border-b border-neutral-100 last:border-none">
                    <span className="w-7 h-7 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors mx-auto cursor-pointer">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
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
