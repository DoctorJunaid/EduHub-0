import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { CATEGORY_ICONS } from "./TicketCategoryBadge";
import { EmptyConversationsState } from "./EmptyConversationsState";
import { ChevronRight } from "lucide-react";

export const ConversationList = ({ conversations = [], onNewConversation }) => {
  const navigate = useNavigate();

  if (!conversations || conversations.length === 0) {
    return <EmptyConversationsState onNewConversation={onNewConversation} isAdmin={false} />;
  }

  return (
    <div className="space-y-2.5">
      {conversations.map((conv) => {
        const catInfo = CATEGORY_ICONS[conv.category] || { icon: "💬", label: conv.category };
        const timeAgo = conv.lastActivityAt
          ? formatDistanceToNow(new Date(conv.lastActivityAt), { addSuffix: true })
          : "Just now";

        return (
          <div
            key={conv._id}
            onClick={() => navigate(`/support/${conv._id}`)}
            className="group relative flex items-center justify-between p-4 bg-card hover:bg-muted/40 border border-border/70 hover:border-primary/40 rounded-2xl cursor-pointer transition-all duration-150 shadow-xs hover:shadow-sm"
          >
            <div className="flex items-start gap-3.5 min-w-0 flex-1 pr-4">
              {/* Category Icon Badge */}
              <div className="w-11 h-11 rounded-xl bg-muted/60 dark:bg-muted/30 flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
                <span>{catInfo.icon}</span>
              </div>

              {/* Subject & Preview */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {conv.subject}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {conv.description || "No message preview"}
                </p>
              </div>
            </div>

            {/* Status & Time */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
              <TicketStatusBadge status={conv.status} isAdmin={false} />
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{timeAgo}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
