import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { WalletCards, Clock3, Link2, FileText, Receipt, Sparkles, CheckCircle2 } from "lucide-react";
import SummaryCard from "@/components/common/SummaryCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { formatFeeAmount } from "@/store/feeReferenceData";
import { formatPKR } from "@/lib/currency";
import StudentChallanDialog from "../../components/StudentChallanDialog";
import SubmitPaymentDialog from "./SubmitPaymentDialog";
import PaymentReceiptDialog from "@/Admins/Campus Admin/Fees/PaymentReceiptDialog";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { SpinnerCustom } from "@/components/ui/spinner";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./StudentFees.css";

function PrintChallan({ voucher, student, demo }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Print Challan ${voucher.voucherNo}`}
        >
          Print Challan
        </Button>
      </DialogTrigger>
      {open && (
        <StudentChallanDialog voucher={voucher} student={student} demo={demo} />
      )}
    </Dialog>
  );
}

export default function StudentFees() {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentVoucher, setPaymentVoucher] = useState(null);
  const [receiptVoucher, setReceiptVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState("vouchers"); // "vouchers" | "payments"

  const fetchStudentFees = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/student/fees");
      if (res.data?.success) {
        setPortalData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load student fees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFees();
  }, []);

  const student = portalData?.student;
  const vouchers = portalData?.vouchers || [];
  const payments = portalData?.payments || [];
  const summary = portalData?.summary || {
    totalPaid: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    totalWaiver: 0,
  };

  const handleSubmitPayment = async (data) => {
    try {
      const voucherId = paymentVoucher._id || paymentVoucher.id;
      await axiosInstance.post(`/student/fees/${voucherId}/submit-payment`, data);
      toast.success("Payment submitted successfully! Pending administration confirmation.");
      setPaymentVoucher(null);
      fetchStudentFees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment.");
    }
  };

  const stats = [
    {
      label: "Total Paid Fees",
      icon: WalletCards,
      value: formatPKR(summary.totalPaid),
      description: "Cleared dues & vouchers",
    },
    {
      label: "Outstanding Dues",
      icon: Clock3,
      value: formatPKR(summary.totalOutstanding),
      description: summary.totalOverdue > 0 ? `${formatPKR(summary.totalOverdue)} overdue` : "Current payable dues",
    },
    {
      label: "Waiver / Scholarship",
      icon: Sparkles,
      value: formatPKR(summary.totalWaiver),
      description: "Institutional concessions",
    },
    {
      label: "Billing Account",
      icon: FileText,
      value: student?.roll || "—",
      description: `${student?.gradeOrClass || "Student"} ID`,
    },
  ];

  return (
    <section className="student-fees-page">
      <div className="sf-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sf-stat" />
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-2 ${
            activeTab === "vouchers"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <FileText className="size-3.5" />
          Active Invoices &amp; Challans ({vouchers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-2 ${
            activeTab === "payments"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <Receipt className="size-3.5" />
          Payment Receipts &amp; History ({payments.length})
        </button>
      </div>

      {activeTab === "vouchers" ? (
        <Card className="sf-history">
          <div className="sf-history-heading">
            <h2>
              <span>
                <FileText aria-hidden="true" />
              </span>
              Fee Vouchers &amp; Challan Slips
            </h2>
            <p>All amounts in Pakistani Rupees (PKR)</p>
          </div>
          <Table aria-label="Fee vouchers and payment history">
            <TableHeader>
              <TableRow>
                {[
                  "Voucher No & Particulars",
                  "Billing Month",
                  "Total Payable",
                  "Paid Amount",
                  "Due Date",
                  "Status",
                  "Action",
                ].map((label) => (
                  <TableHead scope="col" key={label}>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => {
                const totalBilled = voucher.totalPayable > 0 ? voucher.totalPayable : voucher.amount;
                const statusNormalized = (voucher.status || voucher.paymentStatus || "").toUpperCase();
                const canPay =
                  statusNormalized === "UNPAID" ||
                  statusNormalized === "PARTIALLY_PAID" ||
                  statusNormalized === "OVERDUE" ||
                  statusNormalized === "GENERATED";

                return (
                  <TableRow key={voucher._id || voucher.id}>
                    <TableCell>
                      <strong className="block text-zinc-900">{voucher.voucherNo}</strong>
                      <small className="text-zinc-500">{voucher.feeCategory || voucher.feeType}</small>
                      {voucher.previousArrears > 0 && (
                        <span className="block text-[10px] text-amber-700">
                          (Includes {formatPKR(voucher.previousArrears)} prior arrears)
                        </span>
                      )}
                      {voucher.waiver?.amount > 0 && (
                        <span className="block text-[10px] text-purple-700">
                          (Waiver concession: {formatPKR(voucher.waiver.amount)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{voucher.month || voucher.semester || "—"}</TableCell>
                    <TableCell className="font-semibold">{formatPKR(totalBilled)}</TableCell>
                    <TableCell className="text-emerald-700 font-semibold">{formatPKR(voucher.paidAmount || 0)}</TableCell>
                    <TableCell>
                      <time dateTime={voucher.dueDate}>
                        {voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString() : "—"}
                      </time>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`sf-status sf-status-${(voucher.status || voucher.paymentStatus || "").toLowerCase()}`}
                      >
                        {voucher.status || voucher.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <PrintChallan
                          voucher={voucher}
                          student={student}
                          demo={false}
                        />
                        {canPay && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setPaymentVoucher(voucher)}
                          >
                            Submit Payment
                          </Button>
                        )}
                        {(voucher.paidAmount > 0 || statusNormalized === "PAID") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReceiptVoucher({ voucher })}
                            className="inline-flex items-center gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          >
                            <Receipt className="size-3.5" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {loading && !vouchers.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <TableSkeleton rows={4} columns={7} />
                  </TableCell>
                </TableRow>
              ) : !vouchers.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="sf-empty">
                    No fee vouchers issued for your account yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* ── PAYMENT RECEIPTS & HISTORY TAB ── */
        <Card className="sf-history">
          <div className="sf-history-heading">
            <h2>
              <span>
                <Receipt aria-hidden="true" />
              </span>
              Payment Transactions &amp; Receipts
            </h2>
            <p>Official ledger of payments submitted and confirmed</p>
          </div>
          <Table aria-label="Payment history">
            <TableHeader>
              <TableRow>
                {[
                  "Receipt #",
                  "Voucher #",
                  "Amount (PKR)",
                  "Payment Date",
                  "Method",
                  "Transaction / TID",
                  "Verification Status",
                  "Action",
                ].map((label) => (
                  <TableHead scope="col" key={label}>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const isConfirmed = p.status === "CONFIRMED";
                const isRejected = p.status === "REJECTED";
                const parentVoucher = vouchers.find(
                  (v) => String(v._id || v.id) === String(p.feeRecordId)
                );

                return (
                  <TableRow key={p._id}>
                    <TableCell className="font-mono font-bold text-zinc-900">
                      {p.receiptNo || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-700">
                      {p.voucherNo || parentVoucher?.voucherNo || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-700">
                      {formatPKR(p.amount)}
                    </TableCell>
                    <TableCell>
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>{p.paymentMethod || "Bank Transfer"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.referenceNo || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          isConfirmed
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isRejected
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }
                      >
                        {p.status}
                      </Badge>
                      {isRejected && p.rejectionReason && (
                        <span className="block text-[10px] text-rose-600 mt-0.5">
                          Reason: {p.rejectionReason}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isConfirmed && parentVoucher && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReceiptVoucher({ voucher: parentVoucher, payment: p })}
                          className="inline-flex items-center gap-1"
                        >
                          <Receipt className="size-3.5" />
                          View Receipt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {loading && !payments.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <TableSkeleton rows={4} columns={8} />
                  </TableCell>
                </TableRow>
              ) : !payments.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="sf-empty">
                    No payment submissions recorded yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      )}

      {paymentVoucher && (
        <SubmitPaymentDialog
          voucher={paymentVoucher}
          onClose={() => setPaymentVoucher(null)}
          onSubmit={handleSubmitPayment}
        />
      )}

      {receiptVoucher && (
        <PaymentReceiptDialog
          voucher={receiptVoucher.voucher}
          payment={receiptVoucher.payment}
          onClose={() => setReceiptVoucher(null)}
        />
      )}
    </section>
  );
}
