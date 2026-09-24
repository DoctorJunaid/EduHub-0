import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { validDate } from "@/lib/dates";
import { formatPKR } from "@/lib/currency";

export default function RecordPaymentDialog({ voucher, onConfirm, onClose }) {
  const id = useId();
  const effectiveTotal =
    voucher?.totalPayable > 0 ? voucher.totalPayable : voucher?.amount || 0;
  const remaining = Math.max(0, effectiveTotal - (voucher?.paidAmount || 0));

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState(String(remaining));
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={`${id}-description`}
        className="max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col rounded-2xl border border-zinc-200 shadow-2xl bg-white"
        style={{
          width: "calc(100vw - 2rem)",
          maxWidth: "760px",
          padding: 0,
          gap: 0,
        }}
        showCloseButton={false}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-zinc-200 bg-white flex-shrink-0"
          style={{ padding: "24px clamp(20px, 4vw, 32px)", gap: "16px" }}
        >
          <div className="flex items-center" style={{ gap: "14px" }}>
            <div className="size-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <CreditCard className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                Record Payment
              </DialogTitle>
              <DialogDescription
                id={`${id}-description`}
                className="text-xs text-zinc-500"
                style={{ marginTop: "4px" }}
              >
                {voucher.voucherNo} &middot; {voucher.student?.name}
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close record payment dialog"
            variant="ghost"
            size="icon-sm"
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            style={{ width: "32px", height: "32px", flexShrink: 0 }}
          >
            <span className="text-xl leading-none">&times;</span>
          </Button>
        </div>

        {/* Amount Summary Ribbon */}
        <div
          className="grid grid-cols-1 rounded-xl border border-zinc-200 bg-zinc-50 min-[480px]:grid-cols-3 flex-shrink-0"
          style={{
            margin: "24px clamp(16px, 4vw, 32px) 0",
            padding: "18px clamp(16px, 3vw, 20px)",
            gap: "16px",
          }}
        >
          <div className="flex flex-col min-w-0" style={{ gap: "4px" }}>
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Total Payable
            </span>
            <span className="text-base font-bold text-zinc-900">
              {formatPKR(effectiveTotal)}
            </span>
          </div>
          <div
            className="flex flex-col min-w-0 min-[480px]:border-l min-[480px]:border-zinc-200"
            style={{ gap: "4px" }}
          >
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Already Paid
            </span>
            <span className="text-base font-bold text-emerald-700">
              {formatPKR(voucher.paidAmount || 0)}
            </span>
          </div>
          <div
            className="flex flex-col min-w-0 min-[480px]:items-end min-[480px]:border-l min-[480px]:border-zinc-200"
            style={{ gap: "4px" }}
          >
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Remaining
            </span>
            <span className="text-base font-bold text-rose-600">
              {formatPKR(remaining)}
            </span>
          </div>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!validDate(paymentDate))
              return setError("Enter a valid payment date.");

            const numAmount = Number(amount);
            if (numAmount <= 0)
              return setError("Amount must be greater than zero.");
            if (numAmount > remaining)
              return setError(
                `Amount cannot exceed remaining balance (${remaining}).`,
              );

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
          className="flex flex-col flex-1 min-h-0 overflow-hidden m-0"
        >
          <div
            className="overflow-y-auto flex-1 min-h-0"
            style={{ padding: "24px clamp(20px, 4vw, 32px)" }}
          >
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ columnGap: "24px", rowGap: "24px" }}
            >
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor={`${id}-amount`}
                  className="text-xs font-semibold text-zinc-700"
                >
                  Amount Paid *
                </Label>
                <Input
                  id={`${id}-amount`}
                  type="number"
                  required
                  max={remaining}
                  min={1}
                  value={amount}
                  className="text-sm rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ height: "42px", padding: "0 14px" }}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor={`${id}-date`}
                  className="text-xs font-semibold text-zinc-700"
                >
                  Payment Date *
                </Label>
                <Input
                  id={`${id}-date`}
                  type="date"
                  required
                  value={paymentDate}
                  className="text-sm rounded-lg"
                  style={{ height: "42px", padding: "0 14px" }}
                  onChange={(event) => {
                    setPaymentDate(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor={`${id}-method`}
                  className="text-xs font-semibold text-zinc-700"
                >
                  Payment Method *
                </Label>
                <select
                  id={`${id}-method`}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 shadow-2xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  style={{ height: "42px", padding: "0 14px" }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor={`${id}-ref`}
                  className="text-xs font-semibold text-zinc-700"
                >
                  Reference / Receipt No
                </Label>
                <Input
                  id={`${id}-ref`}
                  type="text"
                  placeholder="e.g. TR-98214"
                  value={referenceNo}
                  className="text-sm rounded-lg"
                  style={{ height: "42px", padding: "0 14px" }}
                  onChange={(event) => setReferenceNo(event.target.value)}
                />
              </div>
            </div>

            <div
              className="flex flex-col"
              style={{ gap: "8px", marginTop: "24px" }}
            >
              <Label
                htmlFor={`${id}-notes`}
                className="text-xs font-semibold text-zinc-700"
              >
                Notes (Optional)
              </Label>
              <Input
                id={`${id}-notes`}
                type="text"
                placeholder="Additional details or remarks"
                value={notes}
                className="text-sm rounded-lg"
                style={{ height: "42px", padding: "0 14px" }}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs font-medium text-rose-600 bg-rose-50 rounded-xl border border-rose-200"
                style={{ marginTop: "20px", padding: "12px" }}
              >
                {error}
              </p>
            )}
          </div>

          <div
            className="flex flex-col-reverse items-stretch justify-end border-t border-zinc-200 bg-white sm:flex-row sm:items-center flex-shrink-0"
            style={{
              padding: "20px clamp(20px, 4vw, 32px)",
              gap: "12px",
            }}
          >
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="outline"
              className="w-full text-sm font-semibold sm:w-auto"
              style={{ height: "44px", padding: "0 24px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-semibold sm:w-auto"
              style={{ height: "44px", padding: "0 28px" }}
            >
              {loading ? "Recording..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
