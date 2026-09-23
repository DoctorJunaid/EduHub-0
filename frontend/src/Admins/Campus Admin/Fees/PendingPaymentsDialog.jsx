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
      const res = await axiosInstance.get("/api/campus-admin/fees/payments/pending");
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
    try {
      await axiosInstance.post(`/api/campus-admin/fees/payments/${paymentId}/${action}`);
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
      <DialogContent aria-describedby={`${id}-description`} className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-lg font-bold text-foreground">Review Pending Payments</DialogTitle>
          <DialogDescription id={`${id}-description`} className="text-sm text-muted-foreground mt-1">
            Review and confirm student-submitted fee payments.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No pending payments to review.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map(payment => (
              <div key={payment._id} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-900">{payment.submittedBy?.name || "Student"}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {payment.feeRecordId?.feeType} · {payment.feeRecordId?.month}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Method: {payment.paymentMethod}
                      {payment.referenceNo && <span> · Ref: {payment.referenceNo}</span>}
                    </p>
                    {payment.notes && <p className="text-xs italic text-zinc-500 mt-1">Note: {payment.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600 block">{formatPKR(payment.amount)}</span>
                    <span className="text-[10px] text-zinc-400">
                      {format(new Date(payment.paymentDate), "MMM dd, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-200">
                  <Button variant="outline" size="sm" onClick={() => handleAction(payment._id, "reject")}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleAction(payment._id, "confirm")}>
                    Confirm Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="border-t border-border pt-4 mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
