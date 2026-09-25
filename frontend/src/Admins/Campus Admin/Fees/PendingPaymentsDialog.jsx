import { useId, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
      const res = await axiosInstance.get(
        "/campus-admin/fees/payments/pending",
      );
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
      notes = window.prompt(
        "Reason for rejecting payment (will be shown to student):",
        "Proof could not be verified",
      );
      if (notes === null) return; // user cancelled prompt
    }

    try {
      await axiosInstance.post(
        `/campus-admin/fees/payments/${paymentId}/${action}`,
        { notes, reason: notes },
      );
      toast.success(
        `Payment ${action === "confirm" ? "confirmed" : "rejected"} successfully.`,
      );
      fetchPending();
      onConfirm(); // to refresh main table
    } catch (err) {
      toast.error(
        err.response?.data?.message || `Failed to ${action} payment.`,
      );
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
        className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl bg-white flex flex-col"
        style={{
          width: "calc(100vw - 2rem)",
          maxWidth: "640px",
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
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
              Review Pending Student Payments
            </DialogTitle>
            <DialogDescription
              id={`${id}-description`}
              className="text-xs text-zinc-500"
              style={{ marginTop: "4px" }}
            >
              Review, verify bank slips, and confirm or reject student payments.
            </DialogDescription>
          </div>
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close pending payments dialog"
            variant="ghost"
            size="icon-sm"
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            style={{ width: "32px", height: "32px", flexShrink: 0 }}
          >
            <span className="text-xl leading-none">&times;</span>
          </Button>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ padding: "24px clamp(20px, 4vw, 32px)" }}
        >
          {loading ? (
            <div
              className="flex justify-center"
              style={{ padding: "40px 20px" }}
            >
              <Loader2 className="animate-spin text-zinc-400 size-6" />
            </div>
          ) : payments.length === 0 ? (
            <div
              className="text-center text-zinc-500 text-sm"
              style={{ padding: "56px 20px" }}
            >
              No pending student payments to review.
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: "14px" }}>
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="border border-zinc-200 rounded-xl bg-zinc-50/70 shadow-2xs"
                  style={{ padding: "16px" }}
                >
                  <div
                    className="flex justify-between items-start"
                    style={{ marginBottom: "12px", gap: "16px" }}
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900">
                        {payment.submittedBy?.name || "Student"}
                      </h4>
                      <p
                        className="text-xs text-zinc-500"
                        style={{ marginTop: "3px" }}
                      >
                        {payment.feeRecordId?.feeType} &middot;{" "}
                        {payment.feeRecordId?.month}
                      </p>
                      <p
                        className="text-xs text-zinc-500"
                        style={{ marginTop: "3px" }}
                      >
                        Method:{" "}
                        <strong className="text-zinc-700">
                          {payment.paymentMethod}
                        </strong>
                        {payment.referenceNo && (
                          <span>
                            {" "}
                            &middot; Ref:{" "}
                            <code className="font-mono text-zinc-800">
                              {payment.referenceNo}
                            </code>
                          </span>
                        )}
                      </p>
                      {payment.notes && (
                        <p
                          className="text-xs italic text-zinc-500"
                          style={{ marginTop: "6px" }}
                        >
                          Note: {payment.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-base text-zinc-900 block">
                        {formatPKR(payment.amount)}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {format(
                          new Date(payment.paymentDate),
                          "MMM dd, yyyy h:mm a",
                        )}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex justify-end border-t border-zinc-200/80"
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      gap: "10px",
                    }}
                  >
                    <Button
                      type="button"
                      onClick={() => handleAction(payment._id, "reject")}
                      variant="outline"
                      className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                      style={{ height: "36px", padding: "0 16px" }}
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAction(payment._id, "confirm")}
                      className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold shadow-2xs"
                      style={{ height: "36px", padding: "0 20px" }}
                    >
                      Confirm Payment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="border-t border-zinc-200 bg-white flex items-center justify-end flex-shrink-0"
          style={{ padding: "20px clamp(20px, 4vw, 32px)" }}
        >
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="text-sm font-semibold"
            style={{ height: "44px", padding: "0 24px" }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
