import React, { useEffect, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Paperclip, ShieldAlert, Check, CheckCheck, FileText } from "lucide-react";

export const MessageThread = ({ messages = [], currentUserId, isAdmin = false }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
        No messages yet in this conversation.
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((msg) => {
        const isOwn = String(msg.senderId?._id || msg.senderId) === String(currentUserId);
        const senderName = msg.senderSnapshot?.name || "Support Team";
        const senderRole = msg.senderSnapshot?.role || "";
        const senderInitial = senderName.charAt(0).toUpperCase();
        const formattedTime = msg.createdAt
          ? format(new Date(msg.createdAt), "h:mm a")
          : "";
        const isInternal = Boolean(msg.isInternal);

        // Internal note bubble (admin only)
        if (isInternal) {
          return (
            <div key={msg._id} className="flex justify-center my-3">
              <div className="max-w-xl w-full bg-amber-500/10 border border-dashed border-amber-500/30 text-amber-900 dark:text-amber-200 p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Internal Staff Note ({senderName})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">{formattedTime}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={msg._id}
            className={`flex items-end gap-2.5 ${isOwn ? "justify-end" : "justify-start"}`}
          >
            {/* Other User Avatar */}
            {!isOwn && (
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                {senderInitial}
              </div>
            )}

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 space-y-1.5 shadow-xs ${
                isOwn
                  ? "bg-primary text-primary-foreground rounded-br-xs"
                  : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs"
              }`}
            >
              {/* Sender Name for other users */}
              {!isOwn && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
                  <span>{isAdmin ? senderName : (senderRole === "student" ? senderName : "Support Team")}</span>
                  {isAdmin && senderRole && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-background/60 text-muted-foreground capitalize">
                      {senderRole}
                    </span>
                  )}
                </div>
              )}

              {/* Message Text */}
              <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                {msg.message}
              </p>

              {/* Attachments if any */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  {msg.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isOwn
                          ? "bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground"
                          : "bg-background hover:bg-background/80 text-foreground border border-border/60"
                      }`}
                    >
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[160px]">{att.name || "Attachment"}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Time + Delivery Indicator */}
              <div
                className={`flex items-center justify-end gap-1 text-[10px] ${
                  isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
                }`}
              >
                <span>{formattedTime}</span>
                {isOwn && (
                  <CheckCheck className="w-3 h-3 ml-0.5 text-primary-foreground/90" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageThread;
