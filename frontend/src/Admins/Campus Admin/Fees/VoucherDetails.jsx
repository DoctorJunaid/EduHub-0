import { Coins, FileText, User, Calendar, CheckCircle2 } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import FeeStatusBadge from "./FeeStatusBadge";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

export default function VoucherDetails({ voucher, onClose }) {
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

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Fee Management
          </button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
