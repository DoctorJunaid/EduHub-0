import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Paperclip, ShieldAlert, CheckCheck } from "lucide-react";

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
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-background"
    >
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
            <div key={msg._id} className="flex justify-center my-2">
              <div className="max-w-lg w-full bg-amber-500/10 border border-dashed border-amber-500/30 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Internal Staff Note ({senderName})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {formattedTime}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              </div>
            </div>
          );
        }

        // Own Message (Right Side)
        if (isOwn) {
          return (
            <div key={msg._id} className="flex flex-col items-end w-full">
              {/* Bubble */}
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] sm:max-w-md break-words shadow-xs">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </p>

                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {msg.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">
                          {att.name || "Attachment"}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp & Delivery indicator below the bubble */}
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1 select-none pr-1">
                <span>{formattedTime}</span>
                <CheckCheck className="w-3.5 h-3.5 text-primary ml-0.5" />
              </div>
            </div>
          );
        }

        // Support / Other Message (Left Side)
        return (
          <div key={msg._id} className="flex items-start gap-2.5 max-w-full">
            {/* Avatar 32x32 */}
            <div className="w-8 h-8 rounded-full bg-muted border border-border/80 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5 select-none">
              {senderInitial}
            </div>

            {/* Content Column */}
            <div className="flex flex-col items-start min-w-0">
              {/* Sender Name */}
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <span>{isAdmin ? senderName : (senderRole === "student" ? senderName : "Support Team")}</span>
                {isAdmin && senderRole && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground capitalize">
                    {senderRole}
                  </span>
                )}
              </div>

              {/* Bubble */}
              <div className="bg-muted text-foreground border border-border/60 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%] sm:max-w-md break-words shadow-xs">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </p>

                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {msg.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-background hover:bg-background/80 text-foreground border border-border transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">
                          {att.name || "Attachment"}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp below the bubble */}
              <div className="text-xs text-muted-foreground mt-1 pl-1 select-none">
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageThread;
