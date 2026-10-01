import React, { useState, useRef } from "react";
import { Send, Paperclip, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import toast from "react-hot-toast";

export const ReplyBox = ({
  onSend,
  isSending = false,
  isClosed = false,
  isAdmin = false,
  onSolve,
  canSolve = false,
  isSolving = false,
}) => {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > 3) {
      toast.error("You can attach a maximum of 3 files");
      return;
    }

    const newAttachments = [...attachments];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 5MB limit`);
        continue;
      }
      newAttachments.push({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      });
    }
    setAttachments(newAttachments);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (
      (!message.trim() && attachments.length === 0) ||
      isSending ||
      isClosed
    ) {
      return;
    }

    try {
      await onSend({
        message: message.trim(),
        attachments,
        isInternal: isAdmin ? isInternal : false,
      });
      setMessage("");
      setAttachments([]);
      setIsInternal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isClosed) {
    return (
      <div className="ticket-reply-box ticket-reply-box--closed">
        <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>This conversation is resolved and closed.</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`ticket-reply-box${isInternal ? " ticket-reply-box--internal" : ""}`}
    >
      {/* Top row: solve button or internal note indicator if applicable */}
      <div className="ticket-reply-box__options">
        {/* Internal note checkbox for staff */}
        {isAdmin ? (
          <label className="ticket-reply-box__internal-note">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>
              <strong>Internal note</strong>
              <small>Visible to staff only</small>
            </span>
          </label>
        ) : (
          <div />
        )}

        {/* Solve button for creators */}
        {canSolve && onSolve && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSolve}
            disabled={isSolving}
            className="h-8 px-3 rounded-lg text-xs font-medium border-emerald-500/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-colors"
          >
            {isSolving ? (
              <Spinner className="w-3.5 h-3.5 mr-1" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            )}
            <span>✓ This is solved</span>
          </Button>
        )}
      </div>

      {/* Attachments preview list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs text-foreground border border-border"
            >
              <Paperclip className="w-3 h-3 text-muted-foreground" />
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-muted-foreground hover:text-destructive ml-1"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input flex row */}
      <form onSubmit={handleSubmit} className="ticket-reply-box__form">
        <div className="ticket-reply-box__compose">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          />

          {/* Attach Button (Circular 40x40 icon button) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            title="Attach files (max 3 files, 5MB each)"
            aria-label="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Textarea (Flex-1, min 44px, max 160px) */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInternal
                ? "Write an internal note for staff members..."
                : "Type your reply..."
            }
            rows={1}
            className={`flex-1 min-h-[44px] max-h-40 rounded-xl border border-input bg-background px-4 py-3 resize-none text-sm leading-relaxed transition-colors ${
              isInternal
                ? "border-amber-500/50 bg-amber-500/5 focus-visible:ring-amber-500/30"
                : ""
            }`}
          />

          {/* Send Button (Circular 40x40 primary button) */}
          <button
            type="submit"
            disabled={
              (!message.trim() && attachments.length === 0) || isSending
            }
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              isInternal
                ? "bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            }`}
            title="Send message"
            aria-label="Send message"
          >
            {isSending ? (
              <Spinner className="w-4 h-4 text-current" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Hint text below input */}
        <p className="text-xs text-muted-foreground mt-2 pl-1">
          Press Enter to send, Shift+Enter for newline
        </p>
      </form>
    </div>
  );
};

export default ReplyBox;
