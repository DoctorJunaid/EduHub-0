import React from "react";
import { User, Paperclip, ShieldAlert, FileText, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TicketMessageThread({ ticket, messages = [] }) {
  if (!ticket) return null;

  const creatorName = ticket.createdBySnapshot?.name || ticket.createdBy?.name || "User";
  const creatorRole = ticket.createdBySnapshot?.role || ticket.createdBy?.role || "User";

  return (
    <div className="space-y-4">
      {/* 1. Original Issue Description (Root Post) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 text-xs bg-zinc-900 text-white font-bold">
              <AvatarFallback>{creatorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">{creatorName}</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-medium capitalize">
                  {creatorRole.replace(/_/g, " ")} &bull; Creator
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Opened {new Date(ticket.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </div>

        {/* Root Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <span className="text-[11px] font-semibold text-zinc-500 block mb-2">
              Attachments ({ticket.attachments.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {ticket.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 px-2.5 py-1.5 rounded-lg text-zinc-700 transition-colors"
                >
                  <Paperclip className="w-3 h-3 text-zinc-400" />
                  <span className="truncate max-w-[180px]">{att.name || `File ${idx + 1}`}</span>
                  <Download className="w-3 h-3 text-zinc-400 ml-1" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Threaded Replies */}
      {messages.map((msg) => {
        const senderName = msg.senderSnapshot?.name || msg.senderId?.name || "User";
        const senderRole = msg.senderSnapshot?.role || msg.senderId?.role || "Staff";
        const isInternal = Boolean(msg.isInternal);

        return (
          <div
            key={msg._id}
            className={`border rounded-xl p-5 shadow-2xs transition-all ${
              isInternal
                ? "bg-amber-50/60 border-amber-200/90"
                : "bg-white border-zinc-200/80"
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <Avatar
                  className={`w-8 h-8 text-xs font-bold ${
                    isInternal ? "bg-amber-600 text-white" : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  <AvatarFallback>{senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">{senderName}</span>
                    <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-medium capitalize">
                      {senderRole.replace(/_/g, " ")}
                    </span>
                    {isInternal && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Internal Staff Note
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(msg.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
              {msg.message}
            </div>

            {/* Message Attachments */}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
                {msg.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 px-2.5 py-1.5 rounded-lg text-zinc-700 transition-colors"
                  >
                    <Paperclip className="w-3 h-3 text-zinc-400" />
                    <span className="truncate max-w-[180px]">{att.name || `File ${idx + 1}`}</span>
                    <Download className="w-3 h-3 text-zinc-400 ml-1" />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
