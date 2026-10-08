import React from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import "./ReceiptModal.css";

export default function ReceiptModal({ open, onClose, item, instituteName = "EduHub Institution" }) {
  const [copied, setCopied] = React.useState(false);

  if (!open || !item) return null;

  // Determine if it is a transaction or fee record
  const isTransaction = !!item.paymentMethod;
  const student = item.studentId || {};
  const campus = item.campusId || {};
  const feeRecord = isTransaction ? item.feeRecordId || {} : item;

  const receiptNo = item.receiptNo || feeRecord.receiptNo || "—";
  const challanNo = feeRecord.challanNo || item.challanNo || "—";
  const feeType = feeRecord.feeType || item.feeType || "Tuition & Composite Fee";
  const month = feeRecord.month || item.month || "Current Session";
  const amountPaid = isTransaction ? item.amount : item.paidAmount || 0;
  const totalPayable = feeRecord.totalPayable || feeRecord.amount || item.totalPayable || item.amount || amountPaid;
  const balanceDue = Math.max(0, totalPayable - (isTransaction ? (feeRecord.paidAmount || amountPaid) : item.paidAmount || 0));

  const dateStr = item.paymentDate
    ? new Date(item.paymentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const status = (item.status || feeRecord.status || "CONFIRMED").toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const text = `EduHub Receipt\nInstitute: ${instituteName}\nCampus: ${campus.name || "Main Branch"}\nReceipt #: ${receiptNo}\nChallan #: ${challanNo}\nStudent: ${student.name || "Student"} (${student.roll || student.rollNo || "N/A"})\nClass: ${student.gradeOrClass || "N/A"}\nFee Type: ${feeType}\nAmount Paid: Rs. ${amountPaid.toLocaleString()}\nDate: ${dateStr}\nStatus: ${status}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Receipt details copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy receipt details.");
    }
  };

  const breakdownItems = feeRecord.breakdown?.length
    ? feeRecord.breakdown
    : [{ title: feeType, amount: totalPayable }];

  return (
    <div className="rm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rm-header">
          <div className="rm-header-title">
            <div className="rm-icon-badge">
              <Receipt size={18} />
            </div>
            <div>
              <h3>{isTransaction ? "Official Fee Receipt" : "Fee Voucher Details"}</h3>
              <p>Challan No: {challanNo} • Receipt: {receiptNo}</p>
            </div>
          </div>
          <button className="rm-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="rm-body">
          <div className="rm-receipt-paper">
            {/* Watermark status */}
            <div
              className={`rm-watermark ${
                status === "CONFIRMED" || status === "PAID"
                  ? ""
                  : status === "PARTIALLY_PAID"
                  ? "partial"
                  : "unpaid"
              }`}
            >
              {status}
            </div>

            {/* Institution & Campus Header */}
            <div className="rm-brand-row">
              <div>
                <h4 className="rm-inst-name">{instituteName}</h4>
                <p className="rm-campus-name">
                  <Building2 size={13} style={{ display: "inline", marginRight: "4px" }} />
                  {campus.name || "Campus Branch"}
                  {campus.code ? ` (${campus.code})` : ""}
                </p>
                {campus.address && (
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#a1a1aa" }}>
                    {typeof campus.address === "object"
                      ? campus.address?.street || campus.address?.city
                      : campus.address}
                  </p>
                )}
              </div>

              <div className="rm-doc-meta">
                <div className="rm-doc-id">{receiptNo !== "—" ? receiptNo : challanNo}</div>
                <div className="rm-doc-date">
                  <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {dateStr}
                </div>
                <div style={{ marginTop: "4px" }}>
                  <Badge
                    variant="secondary"
                    style={{
                      background:
                        status === "CONFIRMED" || status === "PAID"
                          ? "#ecfdf5"
                          : status === "PARTIALLY_PAID"
                          ? "#fef3c7"
                          : "#fef2f2",
                      color:
                        status === "CONFIRMED" || status === "PAID"
                          ? "#065f46"
                          : status === "PARTIALLY_PAID"
                          ? "#92400e"
                          : "#991b1b",
                      border: `1px solid ${
                        status === "CONFIRMED" || status === "PAID"
                          ? "#a7f3d0"
                          : status === "PARTIALLY_PAID"
                          ? "#fde68a"
                          : "#fecaca"
                      }`,
                      fontWeight: 700,
                    }}
                  >
                    {status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Student & Class Details */}
            <div className="rm-student-box">
              <div>
                <div className="rm-field-label">Student Name</div>
                <div className="rm-field-value">{student.name || "Enrolled Student"}</div>
              </div>
              <div>
                <div className="rm-field-label">Roll / ID Number</div>
                <div className="rm-field-value">{student.roll || student.rollNo || student.admissionNo || "—"}</div>
              </div>
              <div>
                <div className="rm-field-label">Class / Grade</div>
                <div className="rm-field-value">{student.gradeOrClass || feeRecord.gradeOrClass || "General"}</div>
              </div>
              <div>
                <div className="rm-field-label">Billing Cycle</div>
                <div className="rm-field-value">{month}</div>
              </div>
            </div>

            {/* Itemized Fee Breakdown Table */}
            <table className="rm-table">
              <thead>
                <tr>
                  <th>Fee Description</th>
                  <th>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {breakdownItems.map((bi, idx) => (
                  <tr key={idx}>
                    <td>{bi.title || "Tuition Fee"}</td>
                    <td>Rs. {(bi.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {feeRecord.discount?.amount > 0 && (
                  <tr style={{ color: "#7c3aed" }}>
                    <td>Special Discount ({feeRecord.discount.reason || "Fee Concession"})</td>
                    <td>- Rs. {feeRecord.discount.amount.toLocaleString()}</td>
                  </tr>
                )}
                {feeRecord.waiver?.amount > 0 && (
                  <tr style={{ color: "#7c3aed" }}>
                    <td>Fee Waiver / Scholarship ({feeRecord.waiver.reason || "Approved Waiver"})</td>
                    <td>- Rs. {feeRecord.waiver.amount.toLocaleString()}</td>
                  </tr>
                )}
                {feeRecord.lateFine?.amount > 0 && (
                  <tr style={{ color: "#b45309" }}>
                    <td>Late Payment Fine</td>
                    <td>+ Rs. {feeRecord.lateFine.amount.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="rm-totals-card">
              <div className="rm-total-row">
                <span>Gross Payable Dues:</span>
                <span>Rs. {totalPayable.toLocaleString()}</span>
              </div>
              <div className="rm-total-row rm-paid-row">
                <span>Amount Paid / Deposited:</span>
                <span>Rs. {amountPaid.toLocaleString()}</span>
              </div>
              <div className="rm-total-row rm-due-row">
                <span>Remaining Balance Due:</span>
                <span>Rs. {balanceDue.toLocaleString()}</span>
              </div>

              {isTransaction && item.paymentMethod && (
                <div className="rm-total-row grand">
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Payment Method:</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#18181b" }}>
                    <CreditCard size={14} style={{ display: "inline", marginRight: "5px" }} />
                    {item.paymentMethod} {item.referenceNo ? `(${item.referenceNo})` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Note & Signature */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "14px",
                borderTop: "1px dashed #e4e4e7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                fontSize: "11px",
                color: "#71717a",
              }}
            >
              <div>
                <p style={{ margin: 0 }}>This is an official system-generated payment receipt.</p>
                <p style={{ margin: "2px 0 0 0" }}>Issued via EduHub Multi-Campus Management System</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ width: "120px", borderBottom: "1px solid #71717a", marginBottom: "4px" }} />
                <span>Authorized Stamp / Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="rm-footer">
          <button className="rm-btn rm-btn-outline" onClick={handleCopy} type="button">
            {copied ? <Check size={14} style={{ color: "green" }} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Details"}
          </button>
          <button className="rm-btn rm-btn-primary" onClick={handlePrint} type="button">
            <Printer size={14} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
