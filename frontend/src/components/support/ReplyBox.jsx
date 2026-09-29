import React, { useState, useRef } from "react";
import { Send, Paperclip, X, ShieldAlert, CheckCircle2 } from "lucide-react";
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

    // Process files (limit 5MB each)
    const newAttachments = [...attachments];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 5MB limit`);
        continue;
      }
      // Create a local object URL for preview/sending
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
    if ((!message.trim() && attachments.length === 0) || isSending || isClosed) {
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
      <div className="p-4 bg-muted/40 border-t border-border/80 text-center rounded-b-2xl">
        <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>This conversation is closed and resolved.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card border-t border-border/80 rounded-b-2xl space-y-3">
      {/* Attachments preview row */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Internal note banner toggle if active */}
      {isAdmin && isInternal && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Internal Note: Visible only to staff members</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInternal
                ? "Write an internal note for staff members..."
                : "Type your reply... (Press Enter to send, Shift+Enter for newline)"
            }
            rows={2}
            className={`resize-none pr-10 rounded-xl text-sm transition-colors ${
              isInternal
                ? "border-amber-500/50 bg-amber-500/5 focus-visible:ring-amber-500/30"
                : ""
            }`}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 hover:bg-muted"
              title="Attach files (max 3 files, 5MB each)"
            >
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Attach</span>
            </Button>

            {isAdmin && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-border text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                />
                <span>Internal Note</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canSolve && onSolve && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSolve}
                disabled={isSolving}
                className="h-8 px-3 rounded-lg text-xs font-medium border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              >
                {isSolving ? (
                  <Spinner className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                <span>✓ This is solved</span>
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={(!message.trim() && attachments.length === 0) || isSending}
              className={`h-8 px-4 rounded-lg text-xs font-semibold gap-1.5 shadow-xs ${
                isInternal
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : ""
              }`}
            >
              {isSending ? (
                <>
                  <Spinner className="w-3.5 h-3.5" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReplyBox;
