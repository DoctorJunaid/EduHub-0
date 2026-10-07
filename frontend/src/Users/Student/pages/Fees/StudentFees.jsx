import { useState, useEffect } from "react";
import {
  WalletCards,
  Clock3,
  FileText,
  Receipt,
  Award,
  Printer,
  CreditCard,
  Building2,
} from "lucide-react";
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
import { formatPKR } from "@/lib/currency";
import StudentChallanDialog from "../../components/StudentChallanDialog";
import SubmitPaymentDialog from "./SubmitPaymentDialog";
import PaymentReceiptDialog from "@/Admins/Campus Admin/Fees/PaymentReceiptDialog";
import TableSkeleton from "@/components/shared/TableSkeleton";
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
          className="sf-btn-print"
          aria-label={`Print Challan ${voucher.voucherNo}`}
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
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
      await axiosInstance.post(
        `/student/fees/${voucherId}/submit-payment`,
        data,
      );
      toast.success(
        "Payment submitted successfully! Awaiting finance verification.",
      );
      setPaymentVoucher(null);
      fetchStudentFees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment.");
    }
  };

  return (
    <section className="student-fees-page">
      {/* KPI Cards */}
      <div className="sf-stats">
        <Card className="sf-stat-card">
          <div className="sf-stat-icon-wrap">
            <WalletCards className="w-5 h-5" />
          </div>
          <div className="sf-stat-info">
            <span className="sf-stat-num">{formatPKR(summary.totalPaid)}</span>
            <span className="sf-stat-label">Total Paid Fees</span>
            <span className="sf-stat-desc">
              Cleared vouchers &amp; receipts
            </span>
          </div>
        </Card>

        <Card className="sf-stat-card">
          <div className="sf-stat-icon-wrap">
            <Clock3 className="w-5 h-5" />
          </div>
          <div className="sf-stat-info">
            <span className="sf-stat-num">
              {formatPKR(summary.totalOutstanding)}
            </span>
            <span className="sf-stat-label">Outstanding Dues</span>
            <span className="sf-stat-desc">
              {summary.totalOverdue > 0
                ? `${formatPKR(summary.totalOverdue)} overdue`
                : "Current payable dues"}
            </span>
          </div>
        </Card>

        <Card className="sf-stat-card">
          <div className="sf-stat-icon-wrap">
            <Award className="w-5 h-5" />
          </div>
          <div className="sf-stat-info">
            <span className="sf-stat-num">
              {formatPKR(summary.totalWaiver)}
            </span>
            <span className="sf-stat-label">Waiver / Scholarship</span>
            <span className="sf-stat-desc">Approved fee concessions</span>
          </div>
        </Card>

        <Card className="sf-stat-card">
          <div className="sf-stat-icon-wrap">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="sf-stat-info">
            <span className="sf-stat-num">{student?.roll || "STU-9A"}</span>
            <span className="sf-stat-label">Student Billing ID</span>
            <span className="sf-stat-desc">
              {student?.gradeOrClass || "Class 9"} - Sec{" "}
              {student?.section || "A"}
            </span>
          </div>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="sf-tabs-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`sf-tab-btn ${activeTab === "vouchers" ? "active" : ""}`}
        >
          <FileText className="w-3.5 h-3.5" />
          Active Invoices &amp; Challans ({vouchers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`sf-tab-btn ${activeTab === "payments" ? "active" : ""}`}
        >
          <Receipt className="w-3.5 h-3.5" />
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
          <div className="sf-table-wrapper">
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
                  const totalBilled =
                    voucher.totalPayable > 0
                      ? voucher.totalPayable
                      : voucher.amount;
                  const statusNormalized = (
                    voucher.status ||
                    voucher.paymentStatus ||
                    ""
                  ).toUpperCase();
                  const canPay =
                    statusNormalized === "UNPAID" ||
                    statusNormalized === "PARTIALLY_PAID" ||
                    statusNormalized === "OVERDUE" ||
                    statusNormalized === "GENERATED";

                  return (
                    <TableRow key={voucher._id || voucher.id}>
                      <TableCell>
                        <strong className="block text-foreground">
                          {voucher.voucherNo}
                        </strong>
                        <small className="text-muted-foreground">
                          {voucher.feeCategory || voucher.feeType}
                        </small>
                        {voucher.previousArrears > 0 && (
                          <span className="sf-fee-note block text-[11px] font-medium">
                            (Includes {formatPKR(voucher.previousArrears)} prior
                            arrears)
                          </span>
                        )}
                        {voucher.waiver?.amount > 0 && (
                          <span className="sf-fee-note block text-[11px] font-medium">
                            (Waiver concession:{" "}
                            {formatPKR(voucher.waiver.amount)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {voucher.month || voucher.semester || "—"}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        {formatPKR(totalBilled)}
                      </TableCell>
                      <TableCell className="sf-paid-amount font-bold">
                        {formatPKR(voucher.paidAmount || 0)}
                      </TableCell>
                      <TableCell>
                        <time
                          dateTime={voucher.dueDate}
                          className="font-medium"
                        >
                          {voucher.dueDate
                            ? new Date(voucher.dueDate).toLocaleDateString()
                            : "—"}
                        </time>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`sf-status sf-status-${(voucher.status || voucher.paymentStatus || "").toLowerCase()}`}
                        >
                          {voucher.status || voucher.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="sf-btn-group">
                          <PrintChallan
                            voucher={voucher}
                            student={student}
                            demo={false}
                          />
                          {canPay && (
                            <button
                              type="button"
                              className="sf-btn-pay"
                              onClick={() => setPaymentVoucher(voucher)}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay Online
                            </button>
                          )}
                          {(voucher.paidAmount > 0 ||
                            statusNormalized === "PAID") && (
                            <button
                              type="button"
                              className="sf-btn-receipt"
                              onClick={() => setReceiptVoucher({ voucher })}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Receipt
                            </button>
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
          </div>
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
          <div className="sf-table-wrapper">
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
                    (v) => String(v._id || v.id) === String(p.feeRecordId),
                  );

                  return (
                    <TableRow key={p._id}>
                      <TableCell className="font-mono font-bold text-zinc-900">
                        {p.receiptNo || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-zinc-700">
                        {p.voucherNo || parentVoucher?.voucherNo || "—"}
                      </TableCell>
                      <TableCell className="sf-paid-amount font-bold">
                        {formatPKR(p.amount)}
                      </TableCell>
                      <TableCell>
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.paymentMethod || "Bank Transfer"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.referenceNo || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="sf-payment-status"
                        >
                          {p.status}
                        </Badge>
                        {isRejected && p.rejectionReason && (
                          <span className="sf-rejection-reason block text-[10px] mt-0.5">
                            Reason: {p.rejectionReason}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isConfirmed && parentVoucher && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setReceiptVoucher({
                                voucher: parentVoucher,
                                payment: p,
                              })
                            }
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
          </div>
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
