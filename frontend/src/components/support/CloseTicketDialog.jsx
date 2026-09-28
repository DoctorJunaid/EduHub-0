import React from "react";
import { Lock, AlertCircle } from "lucide-react";
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

export default function CloseTicketDialog({
  open,
  onClose,
  onConfirmClose,
  ticket,
  isClosing = false,
}) {
  const handleConfirm = async () => {
    await onConfirmClose();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-5">
        <DialogHeader className="pb-3 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-700" />
            Close Support Ticket
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Are you sure you want to close ticket <strong className="font-mono text-zinc-800">{ticket?.ticketNumber}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 text-xs text-zinc-600 space-y-2">
          <p>
            Closing the ticket marks this request as completed. You can still review the entire message history at any time.
          </p>
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Keep Open
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isClosing}
            className="h-8 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
          >
            {isClosing ? (
              <Spinner className="size-3.5 text-white" />
            ) : (
              <span>Confirm & Close</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
