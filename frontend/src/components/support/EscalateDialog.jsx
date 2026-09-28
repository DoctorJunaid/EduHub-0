import React, { useState } from "react";
import { ArrowUpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function EscalateDialog({
  open,
  onClose,
  onEscalate,
  ticket,
  isEscalating = false,
}) {
  const [reason, setReason] = useState("");
  const nextLevel = (ticket?.escalationLevel || 1) + 1;
  const targetRole = nextLevel === 2 ? "Institute Admin" : "Super Admin";

  const handleConfirm = async () => {
    await onEscalate(reason.trim());
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader className="pb-3 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-purple-600" />
            Escalate Support Ticket
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Escalating <strong className="font-mono text-zinc-800">{ticket?.ticketNumber}</strong> to <strong>Level {nextLevel} ({targetRole})</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2 text-xs">
          <label className="font-semibold text-zinc-700 block">
            Escalation Reason & Notes
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this ticket requires higher-level administrative intervention..."
            className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-purple-600 resize-none transition-colors"
          />
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isEscalating}
            className="h-8 text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800 gap-1.5"
          >
            {isEscalating ? (
              <Spinner className="size-3.5 text-white" />
            ) : (
              <span>Confirm Escalation</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
