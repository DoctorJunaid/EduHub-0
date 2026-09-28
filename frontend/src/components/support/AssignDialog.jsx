import React, { useState } from "react";
import { UserCheck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSupportContacts } from "@/hooks/useSupportContacts";

export default function AssignDialog({
  open,
  onClose,
  onAssign,
  ticket,
  isAssigning = false,
}) {
  const { contacts = [] } = useSupportContacts();
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const handleConfirm = async () => {
    if (!selectedAssignee) return;
    await onAssign(selectedAssignee);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader className="pb-3 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-zinc-700" />
            Assign Support Ticket
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Assign ticket <strong className="font-mono text-zinc-800">{ticket?.ticketNumber}</strong> to an authorized staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3 text-xs">
          <label className="font-semibold text-zinc-700 block">
            Select Staff Member
          </label>
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger className="h-9 text-xs bg-zinc-50 border-zinc-200">
              <SelectValue placeholder="Choose a staff member..." />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[220px]">
              {contacts.map((person) => (
                <SelectItem key={person._id} value={person._id} className="text-xs py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-zinc-900">{person.name}</span>
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {person.role?.replace(/_/g, " ")} &bull; {person.department || "Academic"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedAssignee || isAssigning}
            className="h-8 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
          >
            {isAssigning ? (
              <Spinner className="size-3.5 text-white" />
            ) : (
              <span>Confirm Assignment</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
