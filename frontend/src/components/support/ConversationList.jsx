import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { CATEGORY_ICONS } from "./TicketCategoryBadge";
import { EmptyConversationsState } from "./EmptyConversationsState";
import { ChevronRight } from "lucide-react";
import { getSupportTicketPath } from "@/utils/supportRouting";

export const ConversationList = ({ conversations = [], onNewConversation }) => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const role = auth?.user?.role;

  if (!conversations || conversations.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8">
        <EmptyConversationsState onNewConversation={onNewConversation} isAdmin={false} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Mobile Card List (Visible on mobile < 640px) ── */}
      <div className="sm:hidden flex flex-col divide-y divide-zinc-100 bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {conversations.map((conv) => {
          const catInfo =
            CATEGORY_ICONS[conv.category] || { icon: "💬", label: conv.category };
          const timeAgo = conv.lastActivityAt
            ? formatDistanceToNow(new Date(conv.lastActivityAt), { addSuffix: true })
            : "Just now";

          return (
            <div
              key={conv._id}
              onClick={() => navigate(getSupportTicketPath(role, conv._id))}
              className="p-3.5 hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer transition-colors flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-base mt-0.5">
                <span>{catInfo.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {catInfo.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                    {timeAgo}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 truncate mt-0.5">
                  {conv.subject}
                </h4>
                {conv.description && (
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                    {conv.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                  <TicketStatusBadge status={conv.status} isAdmin={false} />
                  <span className="text-xs font-medium text-zinc-400 inline-flex items-center gap-0.5">
                    Open <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop Table View (Visible on sm: and up) ── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Topic / Conversation
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 text-right">
                Last Activity
              </th>
              <th className="w-12 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {conversations.map((conv) => {
              const catInfo =
                CATEGORY_ICONS[conv.category] || { icon: "💬", label: conv.category };
              const timeAgo = conv.lastActivityAt
                ? formatDistanceToNow(new Date(conv.lastActivityAt), { addSuffix: true })
                : "Just now";

              return (
                <tr
                  key={conv._id}
                  onClick={() => navigate(getSupportTicketPath(role, conv._id))}
                  className="hover:bg-zinc-50/70 cursor-pointer transition-colors group"
                >
                  {/* Topic / Subject with avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-base group-hover:scale-105 transition-transform">
                        <span>{catInfo.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 group-hover:text-black transition-colors truncate">
                          {conv.subject}
                        </p>
                        <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                          {conv.description || "No message preview"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5 text-xs font-medium text-zinc-600 whitespace-nowrap">
                    {catInfo.label}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <TicketStatusBadge status={conv.status} isAdmin={false} />
                  </td>

                  {/* Last Activity */}
                  <td className="px-4 py-3.5 text-xs text-zinc-500 text-right whitespace-nowrap">
                    {timeAgo}
                  </td>

                  {/* Arrow */}
                  <td className="px-3 py-3.5 text-center">
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all inline-block" />
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

export default ConversationList;
