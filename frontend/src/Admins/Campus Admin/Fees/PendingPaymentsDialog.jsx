import { useId, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/api/axiosInstance";
import { formatPKR } from "@/lib/currency";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function PendingPaymentsDialog({ onClose, onConfirm }) {
  const id = useId();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/campus-admin/fees/payments/pending");
      setPayments(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load pending payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (paymentId, action) => {
    let notes = "";
    if (action === "reject") {
      notes = window.prompt("Reason for rejecting payment (will be shown to student):", "Proof could not be verified");
      if (notes === null) return; // user cancelled prompt
    }

    try {
      await axiosInstance.post(`/campus-admin/fees/payments/${paymentId}/${action}`, { notes, reason: notes });
      toast.success(`Payment ${action === "confirm" ? "confirmed" : "rejected"} successfully.`);
      fetchPending();
      onConfirm(); // to refresh main table
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} payment.`);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={`${id}-description`}
        className="sm:max-w-[640px] w-[95vw] p-0 overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl bg-white flex flex-col max-h-[90vh] gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-200 bg-white flex-shrink-0">
          <div>
            <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
              Review Pending Student Payments
            </DialogTitle>
            <DialogDescription id={`${id}-description`} className="text-xs text-zinc-500 mt-1">
              Review, verify bank slips, and confirm or reject student payments.
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
        
        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-400 size-6" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">No pending student payments to review.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {payments.map(payment => (
                <div key={payment._id} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 shadow-2xs">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900">{payment.submittedBy?.name || "Student"}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {payment.feeRecordId?.feeType} &middot; {payment.feeRecordId?.month}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Method: <strong className="text-zinc-700">{payment.paymentMethod}</strong>
                        {payment.referenceNo && <span> &middot; Ref: <code className="font-mono text-zinc-800">{payment.referenceNo}</code></span>}
                      </p>
                      {payment.notes && <p className="text-xs italic text-zinc-500 mt-1">Note: {payment.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-base text-zinc-900 block">{formatPKR(payment.amount)}</span>
                      <span className="text-xs text-zinc-400">
                        {format(new Date(payment.paymentDate), "MMM dd, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-zinc-200/80">
                    <button
                      type="button"
                      onClick={() => handleAction(payment._id, "reject")}
                      className="h-9 px-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(payment._id, "confirm")}
                      className="h-9 px-5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-7 py-5 border-t border-zinc-200 bg-white flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
