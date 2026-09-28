import React, { useState } from "react";
import { Send, Paperclip, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

export default function TicketReplyBox({
  onSend,
  isSubmitting = false,
  isAdmin = false,
  isClosed = false,
}) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState([]);

  if (isClosed) {
    return (
      <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-4 text-center text-xs text-zinc-500 font-medium">
        This support ticket is closed. Re-open or create a new ticket to continue conversation.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      await onSend({
        message: message.trim(),
        isInternal: isAdmin ? isInternal : false,
        attachments,
      });
      setMessage("");
      setIsInternal(false);
      setAttachments([]);
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`border rounded-xl p-4 shadow-2xs transition-all ${
        isInternal ? "bg-amber-50/50 border-amber-300" : "bg-white border-zinc-200/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-zinc-800">
          {isInternal ? "Add Internal Staff Note" : "Post a Reply"}
        </label>

        {isAdmin && (
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 px-2 py-1 rounded select-none transition-colors">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-700" />
              Internal Note (Hidden from creator)
            </span>
          </label>
        )}
      </div>

      <textarea
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          isInternal
            ? "Write an internal note visible only to admins and support staff..."
            : "Type your reply to this ticket here..."
        }
        className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 resize-y min-h-[90px] transition-colors"
      />

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 my-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded text-xs"
            >
              <Paperclip className="w-3 h-3 text-zinc-400" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-zinc-400 hover:text-zinc-600 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
        <div className="text-[11px] text-zinc-400">
          Press Send Reply to post to the ticket thread.
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="h-8 px-4 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg gap-1.5"
        >
          {isSubmitting ? (
            <Spinner className="size-3.5 text-white" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{isInternal ? "Save Internal Note" : "Send Reply"}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
