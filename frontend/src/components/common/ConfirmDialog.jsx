import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import './ConfirmDialog.css';

export default function ConfirmDialog({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="confirmation-dialog" overlayClassName="confirmation-overlay" showCloseButton={false} role="alertdialog" onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus(); }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="confirmation-actions">
          <DialogClose asChild><Button ref={cancelRef} variant="outline">{cancelText}</Button></DialogClose>
          <Button variant="destructive" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
