import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Spinner from "@/components/ui/spinner";

export const CloseTicketDialog = ({
  open = false,
  onOpenChange,
  ticket = {},
  onConfirm,
  isPending = false,
  isAdmin = false,
}) => {
  const handleClose = async () => {
    await onConfirm(ticket._id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg">
            {isAdmin ? "Close Support Ticket" : "Mark as Solved"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isAdmin
              ? "Are you sure you want to resolve and close this ticket? Future replies will be disabled."
              : "Is everything sorted out with this question? Closing it lets the support team know your issue is resolved."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
            onClick={handleClose}
            disabled={isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Closing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAdmin ? "Confirm Close" : "✓ Yes, it's solved"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseTicketDialog;
