import { useState, useId } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency";

export default function SubmitPaymentDialog({ voucher, onClose, onSubmit }) {
  const id = useId();
  const [amount, setAmount] = useState((voucher.amount - (voucher.paidAmount || 0)).toString());
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={`${id}-desc`}>
        <div className="tt-dialog-heading">
          <DialogTitle>Submit Payment Details</DialogTitle>
        </div>
        <p id={`${id}-desc`} className="text-sm text-zinc-500 mb-4">
          Please enter the details of the payment you have made. This will be reviewed and confirmed by the administration.
        </p>

        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          await onSubmit({
            amount: Number(amount),
            paymentMethod,
            referenceNo,
            paymentDate
          });
          setLoading(false);
        }}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="tt-field">
              <Label htmlFor={`${id}-amount`}>Amount Paid</Label>
              <Input
                id={`${id}-amount`}
                type="number"
                required
                min="1"
                max={voucher.amount - (voucher.paidAmount || 0)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="tt-field">
              <Label htmlFor={`${id}-date`}>Payment Date</Label>
              <Input
                id={`${id}-date`}
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="tt-field">
              <Label htmlFor={`${id}-method`}>Payment Method</Label>
              <select
                id={`${id}-method`}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash Deposit">Cash Deposit</option>
                <option value="Online">Online / Mobile App</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            
            <div className="tt-field">
              <Label htmlFor={`${id}-ref`}>Reference / Receipt No</Label>
              <Input
                id={`${id}-ref`}
                type="text"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. TID-12345"
              />
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs mb-5">
            <strong>Note:</strong> Your payment status will be marked as "Pending Confirmation" until verified by the campus finance team. Keep your original receipt safe.
          </div>

          <div className="tt-dialog-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
