import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function TeacherConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !loading && onCancel?.()}>
      <DialogContent
        className="teacher-dialog teacher-confirm-dialog"
        showCloseButton={false}
        role="alertdialog"
      >
        <div className="teacher-dialog-header">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        <DialogFooter className="teacher-dialog-footer">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="teacher-dialog-destructive-action"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner className="mr-2 size-4 text-white" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
