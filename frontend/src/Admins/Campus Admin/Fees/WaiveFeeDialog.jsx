import { useState, useId } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ShieldAlert, Sparkles, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency";
import { waiveFeeVoucher, omitFeeVoucher, fetchFees } from "@/store/Slices/feesSlice.js";

export default function WaiveFeeDialog({ voucher, onClose, onUpdated }) {
  const id = useId();
  const dispatch = useDispatch();

  const [mode, setMode] = useState("waive"); // "waive" or "omit"
  const totalBilled = voucher?.totalPayable > 0 ? voucher.totalPayable : voucher?.amount || 0;
  const remaining = Math.max(0, totalBilled - (voucher?.paidAmount || 0));

  const [amount, setAmount] = useState(String(remaining));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!voucher) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      return toast.error("A justification/reason is required for financial adjustment.");
    }

    setLoading(true);
    try {
      if (mode === "waive") {
        const numAmt = Number(amount);
        if (numAmt <= 0) return toast.error("Waiver amount must be greater than zero.");
        if (numAmt > remaining) return toast.error(`Waiver amount cannot exceed balance (${remaining}).`);

        await dispatch(
          waiveFeeVoucher({
            id: voucher._id || voucher.id,
            amount: numAmt,
            reason: reason.trim(),
          })
        ).unwrap();
        toast.success(`Fee voucher waived by ${formatPKR(numAmt)}.`);
      } else {
        await dispatch(
          omitFeeVoucher({
            id: voucher._id || voucher.id,
            reason: reason.trim(),
          })
        ).unwrap();
        toast.success("Fee voucher omitted and marked as cancelled.");
      }

      dispatch(fetchFees());
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to apply adjustment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[560px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border border-zinc-200 shadow-2xl bg-white gap-0"
        showCloseButton={false}
        aria-describedby="waive-dialog-desc"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className={`size-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${mode === "waive" ? "bg-purple-700" : "bg-zinc-800"}`}>
              {mode === "waive" ? <Sparkles className="size-5" /> : <XCircle className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                {mode === "waive" ? "Waive Fee Dues" : "Omit Fee Voucher"}
              </DialogTitle>
              <DialogDescription id="waive-dialog-desc" className="text-xs text-zinc-500 mt-1">
                {voucher.voucherNo} &middot; {voucher.student?.name}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mx-7 mt-6 flex bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 text-xs flex-shrink-0">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${mode === "waive" ? "bg-white shadow-xs text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
            onClick={() => setMode("waive")}
          >
            Fee Waiver / Concession
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${mode === "omit" ? "bg-white shadow-xs text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
            onClick={() => setMode("omit")}
          >
            Omit / Cancel Voucher
          </button>
        </div>

        {/* Balance Card */}
        <div className="mx-7 mt-3.5 bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex justify-between items-center text-xs flex-shrink-0">
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Total Payable</span>
            <strong className="text-zinc-900 text-sm font-bold">{formatPKR(totalBilled)}</strong>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Paid Amount</span>
            <span className="text-zinc-900 text-sm font-semibold">{formatPKR(voucher.paidAmount || 0)}</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Outstanding</span>
            <strong className="text-rose-600 font-bold text-sm">{formatPKR(remaining)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden m-0">
          <div className="px-7 py-6 space-y-5 overflow-y-auto flex-1 min-h-0">
            {mode === "waive" && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-amount`} className="text-xs font-semibold text-zinc-700">
                  Waiver Amount (PKR) *
                </Label>
                <Input
                  id={`${id}-amount`}
                  type="number"
                  required
                  min={1}
                  max={remaining}
                  value={amount}
                  className="h-10 text-sm px-3.5 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="text-xs text-zinc-500 block">
                  Up to remaining outstanding balance: {formatPKR(remaining)}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`${id}-reason`} className="text-xs font-semibold text-zinc-700">
                Justification / Reason (Recorded in Financial Audit Log) *
              </Label>
              <textarea
                id={`${id}-reason`}
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Merit scholarship approval, Special hardship waiver approved by Principal, Mistaken billing omitted."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-y"
              />
            </div>
          </div>

          <div className="px-7 py-5 border-t border-zinc-200 bg-white flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`h-10 px-6 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer ${
                mode === "waive" ? "bg-purple-700 hover:bg-purple-800" : "bg-rose-700 hover:bg-rose-800"
              }`}
            >
              {loading ? "Processing..." : mode === "waive" ? "Confirm Waiver" : "Omit Voucher"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
