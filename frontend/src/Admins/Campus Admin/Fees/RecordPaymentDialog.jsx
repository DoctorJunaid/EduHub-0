import { useId, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { validDate } from "@/lib/dates";
import { formatPKR } from "@/lib/currency";

export default function RecordPaymentDialog({ voucher, onConfirm, onClose }) {
  const id = useId();
  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState((voucher.amount - voucher.paidAmount).toString());
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = voucher.amount - voucher.paidAmount;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={`${id}-description`} className="sm:max-w-[520px] w-[95vw]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-border">
          <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <CreditCard className="size-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-foreground leading-tight">Record Payment</DialogTitle>
            <DialogDescription id={`${id}-description`} className="text-xs text-muted-foreground mt-0.5">
              {voucher.voucherNo} &middot; {voucher.student?.name}
            </DialogDescription>
          </div>
        </div>

        <div className="mx-6 mt-5 bg-zinc-50 border border-border rounded-xl p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Fee</span>
            <span className="text-sm font-semibold text-foreground">{formatPKR(voucher.amount)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Already Paid</span>
            <span className="text-sm font-semibold text-foreground">{formatPKR(voucher.paidAmount)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Remaining</span>
            <span className="text-sm font-bold text-foreground">{formatPKR(remaining)}</span>
          </div>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!validDate(paymentDate)) return setError("Enter a valid payment date.");
            
            const numAmount = Number(amount);
            if (numAmount <= 0) return setError("Amount must be greater than zero.");
            if (numAmount > remaining) return setError(`Amount cannot exceed remaining balance (${remaining}).`);

            setLoading(true);
            try {
              await onConfirm({
                amount: numAmount,
                paymentDate,
                paymentMethod,
                referenceNo,
                notes,
              });
            } catch (err) {
              setError(err.message || "Failed to record payment.");
              setLoading(false);
            }
          }}
          className="flex flex-col gap-4 px-6 pt-4 pb-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-amount`} className="text-xs font-semibold text-foreground">Amount Paid *</Label>
              <Input
                id={`${id}-amount`}
                type="number"
                required
                max={remaining}
                min={1}
                value={amount}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-date`} className="text-xs font-semibold text-foreground">Payment Date *</Label>
              <Input
                id={`${id}-date`}
                type="date"
                required
                value={paymentDate}
                onChange={(event) => {
                  setPaymentDate(event.target.value);
                  setError("");
                }}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-method`} className="text-xs font-semibold text-foreground">Payment Method *</Label>
              <select
                id={`${id}-method`}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-ref`} className="text-xs font-semibold text-foreground">Reference / Receipt No</Label>
              <Input
                id={`${id}-ref`}
                type="text"
                value={referenceNo}
                onChange={(event) => setReferenceNo(event.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-notes`} className="text-xs font-semibold text-foreground">Notes (Optional)</Label>
            <Input
              id={`${id}-notes`}
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
