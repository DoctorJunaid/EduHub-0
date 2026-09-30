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
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
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
            const catInfo = CATEGORY_ICONS[conv.category] || { icon: "💬", label: conv.category };
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
  );
};

export default ConversationList;
