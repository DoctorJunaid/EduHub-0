import { useId, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { validDate } from "@/lib/dates";
import { formatPKR } from "@/lib/currency";
export default function MarkPaidDialog({ voucher, onConfirm, onClose }) {
  const id = useId();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-[520px] w-[95vw] p-0 overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl bg-white flex flex-col gap-0"
        aria-describedby={`${id}-description`}
        showCloseButton={false}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-200 bg-white flex-shrink-0">
          <div>
            <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
              Mark Voucher Paid
            </DialogTitle>
            <DialogDescription id={`${id}-description`} className="text-xs text-zinc-500 mt-1">
              Confirm full payment receipt for {voucher.voucherNo}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider block">Student</span>
              <strong className="text-zinc-900 text-sm">{voucher.student?.name}</strong>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider block">Payable</span>
              <strong className="text-zinc-900 text-base font-bold">{formatPKR(voucher.amount)}</strong>
            </div>
          </div>

          <form
            id="mark-paid-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validDate(paymentDate))
                return setError("Enter a valid payment date.");
              onConfirm(paymentDate);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={id} className="text-xs font-semibold text-zinc-700 block">Payment Date *</Label>
              <Input
                id={id}
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
            {error && (
              <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-zinc-200 bg-zinc-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="mark-paid-form"
            className="h-10 px-6 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Confirm Paid
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
