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
import useStudentFees from "@/hooks/useStudentFees";
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
  const {
    student,
    vouchers,
    payments,
    summary,
    isLoading: loading,
    submitPayment,
  } = useStudentFees();

  const [paymentVoucher, setPaymentVoucher] = useState(null);
  const [receiptVoucher, setReceiptVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState("vouchers"); // "vouchers" | "payments"

  const handleSubmitPayment = async (data) => {
    try {
      const voucherId = paymentVoucher._id || paymentVoucher.id;
      await submitPayment({ voucherId, data });
      setPaymentVoucher(null);
    } catch {
      // Handled in mutation toast
    }
  };

  return (
    <section className="student-fees-page">
      {/* KPI Cards */}
      <div className="sf-stats">
        <Card className="sf-stat-card sf-stat-paid">
          <div className="sf-stat-icon-wrap sf-stat-icon-paid">
            <WalletCards className="w-5 h-5" />
          </div>
          <div className="sf-stat-info">
            <span className="sf-stat-num">{formatPKR(summary.totalPaid)}</span>
            <span className="sf-stat-label">Total Paid Fees</span>
            <span className="sf-stat-desc">Cleared vouchers &amp; receipts</span>
          </div>
        </Card>

        <Card className="sf-stat-card sf-stat-due">
          <div className="sf-stat-icon-wrap sf-stat-icon-due">
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

        <Card className="sf-stat-card sf-stat-waiver">
          <div className="sf-stat-icon-wrap sf-stat-icon-waiver">
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

        <Card className="sf-stat-card sf-stat-student">
          <div className="sf-stat-icon-wrap sf-stat-icon-student">
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
      <div className="sf-tabs-wrap" role="tablist" aria-label="Fee Views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "vouchers"}
          onClick={() => setActiveTab("vouchers")}
          className={`sf-tab-btn ${activeTab === "vouchers" ? "active" : ""}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="sf-tab-text-full">
            Active Invoices &amp; Challans ({vouchers.length})
          </span>
          <span className="sf-tab-text-short">
            Challans ({vouchers.length})
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "payments"}
          onClick={() => setActiveTab("payments")}
          className={`sf-tab-btn ${activeTab === "payments" ? "active" : ""}`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span className="sf-tab-text-full">
            Payment Receipts &amp; History ({payments.length})
          </span>
          <span className="sf-tab-text-short">
            Receipts ({payments.length})
          </span>
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

          {/* Desktop & Tablet Table (Hidden on small mobile screens) */}
          <div className="sf-desktop-table sf-table-wrapper">
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
                          <span className="sf-fee-note block text-[11px] font-medium text-purple-700">
                            (Waiver relief:{" "}
                            {formatPKR(voucher.waiver.amount)})
                          </span>
                        )}
                        {voucher.scholarshipDiscount > 0 && (
                          <span className="sf-fee-note block text-[11px] font-medium text-emerald-700">
                            (Scholarship grant: -
                            {formatPKR(voucher.scholarshipDiscount)})
                          </span>
                        )}
                        {voucher.concessionAmount > 0 && (
                          <span className="sf-fee-note block text-[11px] font-medium text-emerald-700">
                            (Special concession: -
                            {formatPKR(voucher.concessionAmount)})
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
                          className={`sf-status sf-status-${(
                            voucher.status ||
                            voucher.paymentStatus ||
                            ""
                          ).toLowerCase()}`}
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

          {/* Mobile Card List (Visible only on mobile screens < 768px) */}
          <div className="sf-mobile-cards">
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
              const isOverdue =
                statusNormalized === "OVERDUE" ||
                (voucher.dueDate &&
                  new Date(voucher.dueDate) < new Date() &&
                  statusNormalized !== "PAID");

              return (
                <div
                  key={voucher._id || voucher.id}
                  className="sf-voucher-card"
                >
                  {/* Card Top: Voucher Number & Status Pill */}
                  <div className="sf-voucher-card-header">
                    <div className="sf-voucher-meta">
                      <span className="sf-voucher-no font-mono font-bold">
                        {voucher.voucherNo}
                      </span>
                      <span className="sf-voucher-period">
                        {voucher.month || voucher.semester || "Term Fee"}
                      </span>
                    </div>
                    <span
                      className={`sf-status sf-status-${(
                        voucher.status ||
                        voucher.paymentStatus ||
                        ""
                      ).toLowerCase()}`}
                    >
                      {voucher.status || voucher.paymentStatus}
                    </span>
                  </div>

                  {/* Card Body: Fee Category & Breakdown Badges */}
                  <div className="sf-voucher-card-body">
                    <div className="sf-fee-title-row">
                      <h4 className="sf-fee-title">
                        {voucher.feeCategory || voucher.feeType || "Tuition Fee"}
                      </h4>
                      <div className="sf-fee-tags">
                        {voucher.previousArrears > 0 && (
                          <span className="sf-tag sf-tag-arrears">
                            +{formatPKR(voucher.previousArrears)} prior arrears
                          </span>
                        )}
                        {voucher.waiver?.amount > 0 && (
                          <span className="sf-tag sf-tag-waiver">
                            Waiver: -{formatPKR(voucher.waiver.amount)}
                          </span>
                        )}
                        {voucher.scholarshipDiscount > 0 && (
                          <span className="sf-tag sf-tag-scholarship">
                            Scholarship: -{formatPKR(voucher.scholarshipDiscount)}
                          </span>
                        )}
                        {voucher.concessionAmount > 0 && (
                          <span className="sf-tag sf-tag-concession">
                            Concession: -{formatPKR(voucher.concessionAmount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Snapshot */}
                    <div className="sf-financial-grid">
                      <div className="sf-fin-box sf-fin-payable">
                        <span className="sf-fin-label">Payable</span>
                        <span className="sf-fin-value font-bold text-foreground">
                          {formatPKR(totalBilled)}
                        </span>
                      </div>
                      <div className="sf-fin-box sf-fin-paid">
                        <span className="sf-fin-label">Paid</span>
                        <span
                          className={`sf-fin-value ${
                            voucher.paidAmount > 0
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatPKR(voucher.paidAmount || 0)}
                        </span>
                      </div>
                      <div className="sf-fin-box sf-fin-due">
                        <span className="sf-fin-label">Due Date</span>
                        <span
                          className={`sf-fin-value sf-due-date ${
                            isOverdue
                              ? "text-rose-600 dark:text-rose-400 font-bold"
                              : ""
                          }`}
                        >
                          {voucher.dueDate
                            ? new Date(voucher.dueDate).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="sf-voucher-card-actions">
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
                </div>
              );
            })}

            {loading && !vouchers.length ? (
              <div className="sf-mobile-skeletons">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="sf-mobile-skel-card animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-10 bg-muted/70 rounded mb-3" />
                    <div className="h-9 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : !vouchers.length ? (
              <div className="sf-mobile-empty">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p>No fee vouchers issued for your account yet.</p>
              </div>
            ) : null}
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

          {/* Desktop & Tablet Table */}
          <div className="sf-desktop-table sf-table-wrapper">
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
                      <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {p.receiptNo || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-zinc-700 dark:text-zinc-300">
                        {p.voucherNo || parentVoucher?.voucherNo || "—"}
                      </TableCell>
                      <TableCell className="sf-paid-amount font-bold text-emerald-600 dark:text-emerald-400">
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

          {/* Mobile Payment Cards */}
          <div className="sf-mobile-cards">
            {payments.map((p) => {
              const isConfirmed = p.status === "CONFIRMED";
              const isRejected = p.status === "REJECTED";
              const parentVoucher = vouchers.find(
                (v) => String(v._id || v.id) === String(p.feeRecordId),
              );

              return (
                <div key={p._id} className="sf-payment-card">
                  <div className="sf-voucher-card-header">
                    <div className="sf-voucher-meta">
                      <span className="sf-voucher-no font-mono font-bold">
                        {p.receiptNo || "Receipt"}
                      </span>
                      <span className="sf-voucher-period">
                        Voucher: {p.voucherNo || parentVoucher?.voucherNo || "—"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="sf-payment-status">
                      {p.status}
                    </Badge>
                  </div>

                  <div className="sf-voucher-card-body">
                    <div className="sf-financial-grid">
                      <div className="sf-fin-box">
                        <span className="sf-fin-label">Amount Paid</span>
                        <span className="sf-fin-value font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPKR(p.amount)}
                        </span>
                      </div>
                      <div className="sf-fin-box">
                        <span className="sf-fin-label">Payment Date</span>
                        <span className="sf-fin-value">
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                      <div className="sf-fin-box">
                        <span className="sf-fin-label">Method</span>
                        <span className="sf-fin-value">
                          {p.paymentMethod || "Bank Transfer"}
                        </span>
                      </div>
                    </div>

                    {p.referenceNo && (
                      <div className="sf-payment-ref-row">
                        <span className="sf-fin-label">TID / Ref:</span>
                        <code className="sf-ref-code">{p.referenceNo}</code>
                      </div>
                    )}

                    {isRejected && p.rejectionReason && (
                      <div className="sf-rejection-box">
                        <strong>Rejection Reason:</strong> {p.rejectionReason}
                      </div>
                    )}
                  </div>

                  {isConfirmed && parentVoucher && (
                    <div className="sf-voucher-card-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReceiptVoucher({
                            voucher: parentVoucher,
                            payment: p,
                          })
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5"
                      >
                        <Receipt className="size-3.5" />
                        View Official Receipt
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && !payments.length ? (
              <div className="sf-mobile-skeletons">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="sf-mobile-skel-card animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-9 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : !payments.length ? (
              <div className="sf-mobile-empty">
                <Receipt className="w-8 h-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p>No payment submissions recorded yet.</p>
              </div>
            ) : null}
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
