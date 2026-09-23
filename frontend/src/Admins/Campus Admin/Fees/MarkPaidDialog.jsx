import { useId, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { validDate } from "@/lib/dates";
import { formatPKR } from "@/lib/currency";
export default function MarkPaidDialog({ voucher, onConfirm, onClose }) {
  const id = useId();
  const [paymentDate, setPaymentDate] = useState(""),
    [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="tt-dialog fee-payment-dialog"
        overlayClassName="tt-overlay"
        aria-describedby={`${id}-description`}
      >
        <div className="tt-dialog-heading">
          <DialogTitle>Mark Voucher Paid</DialogTitle>
        </div>
        <p id={`${id}-description`} className="fee-form-note">
          {voucher.voucherNo} · {voucher.student.name} ·{" "}
          {formatPKR(voucher.amount)}
          <br />
          Enter the payment date to confirm this manual record update.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!validDate(paymentDate))
              return setError("Enter a valid payment date.");
            onConfirm(paymentDate);
          }}
        >
          <div className="tt-field">
            <Label htmlFor={id}>Payment Date *</Label>
            <Input
              id={id}
              type="date"
              required
              value={paymentDate}
              onChange={(event) => {
                setPaymentDate(event.target.value);
                setError("");
              }}
            />
          </div>
          {error && (
            <p role="alert" className="tt-error">
              {error}
            </p>
          )}
          <div className="tt-dialog-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Confirm Paid</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
