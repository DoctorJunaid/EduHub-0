import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'destructive'
}) {
  const cancelRef = useRef(null);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !loading) onCancel(); }}>
      <DialogContent
        className="confirmation-dialog"
        overlayClassName="confirmation-overlay"
        showCloseButton={false}
        role="alertdialog"
        onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus(); }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="confirmation-actions">
          <Button
            ref={cancelRef}
            variant="outline"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner className="mr-2 size-4" />}
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
