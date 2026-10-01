import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle } from "lucide-react";
import Spinner from "@/components/ui/spinner";

export const EscalateDialog = ({
  open = false,
  onOpenChange,
  ticket = {},
  onConfirm,
  isPending = false,
}) => {
  const [reason, setReason] = useState("");
  const currentLevel = ticket.escalationLevel || 1;
  const nextLevel = currentLevel + 1;

  const targetRole =
    nextLevel === 2 ? "Institute Admin" : nextLevel === 3 ? "Super Admin" : "Higher Authority";

  const handleEscalate = async () => {
    await onConfirm({ ticketId: ticket._id, reason: reason.trim() });
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ticket-escalate-dialog sm:max-w-[560px] rounded-2xl p-0 gap-0">
        <DialogHeader className="ticket-escalate-dialog__header">
          <div className="ticket-escalate-dialog__heading">
            <span className="ticket-escalate-dialog__icon border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" aria-hidden="true">
              <ArrowUpCircle className="w-5 h-5" />
            </span>
            <DialogTitle className="ticket-escalate-dialog__title">Escalate Ticket</DialogTitle>
          </div>
          <DialogDescription className="ticket-escalate-dialog__description">
            This will elevate the ticket from <strong>Level {currentLevel}</strong> to{" "}
            <strong>Level {nextLevel} ({targetRole})</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="ticket-escalate-dialog__body">
          <label htmlFor="ticket-escalation-reason" className="text-sm font-medium text-foreground">
            Reason for Escalation (Optional)
          </label>
          <Textarea
            id="ticket-escalation-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this ticket requires higher authority intervention..."
            rows={4}
            className="ticket-escalate-dialog__textarea"
          />
        </div>

        <DialogFooter className="ticket-escalate-dialog__footer">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="ticket-escalate-dialog__cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleEscalate}
            disabled={isPending}
            className="ticket-escalate-dialog__confirm bg-amber-700 text-white hover:bg-amber-800"
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Escalating...</span>
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-4 h-4" />
                <span>Confirm Escalation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EscalateDialog;
