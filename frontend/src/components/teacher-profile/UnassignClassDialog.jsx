import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UnassignClassDialog({
  open,
  onClose,
  assignment,
  teacherName = "Teacher",
  onConfirm,
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!assignment) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    const success = await onConfirm(assignment.assignmentId || assignment.classId);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-white text-zinc-900">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-zinc-900">
            Unassign Class
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 pt-1">
            Are you sure you want to unassign <strong>{teacherName}</strong> from{" "}
            <strong>{assignment.className}</strong> ({assignment.subject})?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Unassigning...
              </>
            ) : (
              "Yes, Unassign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
