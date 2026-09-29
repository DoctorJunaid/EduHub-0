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
import { ArrowUpCircle, AlertTriangle } from "lucide-react";
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg">Escalate Ticket</DialogTitle>
          <DialogDescription className="text-xs">
            This will elevate the ticket from <strong>Level {currentLevel}</strong> to{" "}
            <strong>Level {nextLevel} ({targetRole})</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="text-xs font-medium text-foreground">
            Reason for Escalation (Optional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this ticket requires higher authority intervention..."
            rows={3}
            className="rounded-xl text-xs"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleEscalate}
            disabled={isPending}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
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
