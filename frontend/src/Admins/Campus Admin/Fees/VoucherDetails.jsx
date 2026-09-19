import { Coins, FileText, User, Calendar, CheckCircle2, Printer } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import FeeStatusBadge from "./FeeStatusBadge";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

export default function VoucherDetails({ voucher, onClose, onPrint }) {
  const { isSchool } = useInstitution();
  if (!voucher) return null;

  return (
    <FullPageFormShell
      title={`Fee Voucher #${voucher.voucherNo}`}
      subtitle={`Billing details and payment record for ${voucher.student?.name || "Student"}.`}
      parentName="Fee Management"
      icon={<Coins size={22} />}
      onBack={onClose}
      maxWidth={850}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Student Name
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{voucher.student.name}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Voucher Serial No.
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{voucher.voucherNo}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Fee Category
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{voucher.feeCategory}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              {isSchool ? "Term / Period" : "Semester"}
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {isSchool ? (voucher.semester?.replace(/Semester/i, "Term") || "Annual Term") : (voucher.semester || "—")}
            </strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Total Amount
            </span>
            <strong style={{ fontSize: "18px", color: "#09090b" }}>{formatPKR(voucher.amount)}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Payment Due Date
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{voucher.dueDate}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Settlement / Payment Date
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{voucher.paymentDate || "Unpaid"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Payment Status
            </span>
            <FeeStatusBadge status={voucher.paymentStatus} />
          </div>
        </div>

        {/* Voucher Description & Line Items Particulars */}
        {(voucher.description || voucher.notes || (Array.isArray(voucher.breakdown) && voucher.breakdown.length > 0)) && (
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "6px" }}>
              Voucher Description & Fee Particulars
            </span>
            {(voucher.description || voucher.notes) && (
              <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#3f3f46", lineHeight: "1.5" }}>
                {voucher.description || voucher.notes}
              </p>
            )}
            {Array.isArray(voucher.breakdown) && voucher.breakdown.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", borderTop: "1px solid #e4e4e7", paddingTop: "8px" }}>
                {voucher.breakdown.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#71717a" }}>{item.title}</span>
                    <strong style={{ color: "#09090b" }}>{formatPKR(item.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="activity-form-actions" style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Fee Management
          </button>
          {onPrint && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={() => onPrint(voucher)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Printer size={15} />
              Print Bank Challan
            </button>
          )}
        </div>
      </div>
    </FullPageFormShell>
  );
}
