import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
        className="w-[calc(100vw-2rem)] max-w-[680px] max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col p-0 rounded-2xl border border-zinc-200 shadow-2xl bg-white gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6 border-b border-zinc-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <CreditCard className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                Record Payment
              </DialogTitle>
              <DialogDescription
                id={`${id}-description`}
                className="text-xs text-zinc-500 mt-1"
              >
                {voucher.voucherNo} &middot; {voucher.student?.name}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close record payment dialog"
            className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Amount Summary Ribbon */}
        <div className="mx-6 mt-6 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5 min-[480px]:grid-cols-3 sm:mx-8 sm:mt-7 sm:p-5 flex-shrink-0">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Total Payable
            </span>
            <span className="text-base font-bold text-zinc-900">
              {formatPKR(effectiveTotal)}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0 min-[480px]:border-l min-[480px]:border-zinc-200 min-[480px]:pl-5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Already Paid
            </span>
            <span className="text-base font-bold text-emerald-700">
              {formatPKR(voucher.paidAmount || 0)}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0 min-[480px]:items-end min-[480px]:border-l min-[480px]:border-zinc-200 min-[480px]:pl-5">
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
          <div className="px-6 py-7 space-y-6 overflow-y-auto flex-1 min-h-0 sm:px-8 sm:py-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div className="space-y-2">
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
                  className="h-10 text-sm px-3.5 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div className="space-y-2">
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
                  className="h-10 text-sm px-3.5 rounded-lg"
                  onChange={(event) => {
                    setPaymentDate(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div className="space-y-2">
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
                  className="h-10 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-2xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="space-y-2">
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
                  className="h-10 text-sm px-3.5 rounded-lg"
                  onChange={(event) => setReferenceNo(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
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
                className="h-10 text-sm px-3.5 rounded-lg"
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:px-8 sm:py-6 sm:gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 w-full px-6 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 text-sm font-semibold transition-colors cursor-pointer sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full px-7 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer sm:w-auto"
            >
              {loading ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
