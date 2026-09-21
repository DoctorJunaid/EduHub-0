import { useState } from "react";
import { Coins, Receipt } from "lucide-react";
import { Label } from "@/components/ui/label";
import { paymentStatuses, validateVoucher } from "./feeData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

export default function FeeVoucherForm({
  record,
  students,
  options,
  onSave,
  onClose,
}) {
  const { isSchool } = useInstitution();

  const generateVoucherNo = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `VCH-${year}-${rand}`;
  };

  const [values, setValues] = useState(() => ({
    studentId: record?.studentId ?? "",
    voucherNo: record?.voucherNo || (record ? "" : generateVoucherNo()),
    feeCategory: record?.feeCategory || "Tuition Fee",
    semester: record?.semester || "",
    description: record?.description || record?.notes || "",
    breakdown: Array.isArray(record?.breakdown) && record.breakdown.length > 0
      ? record.breakdown
      : [],
    amount: record?.amount ?? "",
    dueDate: record?.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    paymentStatus: record?.paymentStatus ?? "Pending",
    paymentDate: record?.paymentDate ?? "",
  }));
  const [error, setError] = useState("");

  const change = (key, value) => {
    setValues((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "paymentStatus" && value === "Paid" && !next.paymentDate) {
        next.paymentDate = new Date().toISOString().split("T")[0];
      }
      return next;
    });
    setError("");
  };

  const handleStudentChange = (selectedId) => {
    const matched = students.find((s) => s.id === selectedId);
    setValues((prev) => ({
      ...prev,
      studentId: selectedId,
      semester: prev.semester || (matched?.program ? matched.program : (matched?.gradeOrClass || "Fall 2025")),
    }));
    setError("");
  };

  const handleAddLineItem = () => {
    setValues((prev) => ({
      ...prev,
      breakdown: [...prev.breakdown, { title: "", amount: "" }],
    }));
  };

  const handleRemoveLineItem = (index) => {
    setValues((prev) => {
      const nextBreakdown = prev.breakdown.filter((_, i) => i !== index);
      const total = nextBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return {
        ...prev,
        breakdown: nextBreakdown,
        amount: total > 0 ? total : prev.amount,
      };
    });
  };

  const handleLineItemChange = (index, field, val) => {
    setValues((prev) => {
      const nextBreakdown = prev.breakdown.map((item, i) =>
        i === index ? { ...item, [field]: val } : item
      );
      const total = nextBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return {
        ...prev,
        breakdown: nextBreakdown,
        amount: total > 0 ? total : prev.amount,
      };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    );
    payload.amount = Number(payload.amount);
    payload.breakdown = values.breakdown
      .filter((item) => item.title && Number(item.amount) > 0)
      .map((item) => ({ title: item.title.trim(), amount: Number(item.amount) }));
    payload.notes = payload.description;
    const message = validateVoucher(payload);
    if (message) return setError(message);
    if (!students.some((student) => student.id === payload.studentId))
      return setError("Select a valid enrolled student.");
    onSave({ ...payload, ...(record ? { id: record.id } : {}) });
  };

  return (
    <FullPageFormShell
      title={record ? "Edit Fee Voucher" : "Create New Fee Voucher"}
      subtitle={
        record
          ? `Updating fee record and payment log for voucher #${record.voucherNo}.`
          : "Issue a new tuition fee, exam fee, or campus dues voucher with due date."
      }
      parentName="Fee Management"
      icon={<Coins size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Voucher & Student Assignment</div>

          <div className="activity-form-field span-2">
            <Label htmlFor="voucher-student">Assigned Student *</Label>
            <select
              id="voucher-student"
              value={values.studentId}
              required
              onChange={(event) => handleStudentChange(event.target.value)}
            >
              <option value="">Select student</option>
              {!students.some((student) => student.id === values.studentId) &&
                values.studentId && (
                  <option value={values.studentId} disabled>
                    Student record unavailable
                  </option>
                )}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {student.roll} ({student.program})
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-no">Voucher Serial Number *</Label>
            <input
              id="voucher-no"
              required
              placeholder="e.g. VCH-2024-001"
              value={values.voucherNo}
              onChange={(e) => change("voucherNo", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-cat">Fee Category *</Label>
            <input
              id="voucher-cat"
              required
              placeholder="e.g. Tuition Fee, Exam Fee, Lab Charges"
              value={values.feeCategory}
              list={options.feeCategory ? "voucher-cat-options" : undefined}
              onChange={(e) => change("feeCategory", e.target.value)}
            />
            {options.feeCategory && (
              <datalist id="voucher-cat-options">
                {options.feeCategory.map((val) => (
                  <option key={val} value={val} />
                ))}
              </datalist>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-sem">{isSchool ? "Term / Fee Period (Optional)" : "Semester (Optional)"}</Label>
            <input
              id="voucher-sem"
              placeholder={isSchool ? "e.g. 1st Term / Monthly" : "e.g. 4th Semester"}
              value={values.semester}
              list={options.semester ? "voucher-sem-options" : undefined}
              onChange={(e) => change("semester", e.target.value)}
            />
            {options.semester && (
              <datalist id="voucher-sem-options">
                {options.semester.map((val) => (
                  <option key={val} value={val} />
                ))}
              </datalist>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-amount">Amount (PKR) *</Label>
            <input
              id="voucher-amount"
              type="number"
              step="any"
              required
              placeholder="e.g. 45000"
              value={values.amount}
              onChange={(e) => change("amount", e.target.value)}
            />
          </div>

          <div className="activity-form-field span-2">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <Label htmlFor="voucher-description">Description & Particulars (Prints on Bank Challan)</Label>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => change("description", isSchool ? "Regular Monthly Tuition Fee, Computer Lab & Library dues" : "Semester Tuition Fee, Laboratory and Examination charges")}
                  style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "11px", cursor: "pointer", padding: 0 }}
                >
                  + Auto-fill description
                </button>
              </div>
            </div>
            <textarea
              id="voucher-description"
              rows={2}
              placeholder="e.g. Regular Monthly Tuition Fee and Computer Lab dues. A late fine of Rs. 200 applies after due date."
              value={values.description}
              onChange={(e) => change("description", e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #d4d4d8",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Optional Breakdown Line Items */}
          <div className="activity-form-field span-2" style={{ borderTop: "1px dashed #e4e4e7", paddingTop: "12px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <strong style={{ fontSize: "13px", color: "#09090b", display: "block" }}>
                  Itemized Fee Breakdown (Optional)
                </strong>
                <span style={{ fontSize: "11px", color: "#71717a" }}>
                  Add specific fee heads to show a detailed breakdown on the 3-part bank slip.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                style={{
                  background: "#f4f4f5",
                  border: "1px solid #d4d4d8",
                  padding: "4px 8px",
                  borderRadius: "5px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                + Add Fee Head
              </button>
            </div>

            {values.breakdown.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {values.breakdown.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="e.g. Tuition Fee, Lab Charges, Sports Fund"
                      value={item.title}
                      onChange={(e) => handleLineItemChange(idx, "title", e.target.value)}
                      style={{ flex: 2, padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(idx, "amount", e.target.value)}
                      style={{ flex: 1, padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontSize: "16px",
                        cursor: "pointer",
                        padding: "0 6px",
                      }}
                      aria-label="Remove fee head"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="activity-section-title">Billing & Due Dates</div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-due">Payment Due Date *</Label>
            <input
              id="voucher-due"
              type="date"
              required
              value={values.dueDate}
              onChange={(e) => change("dueDate", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-status">Payment Status *</Label>
            <select
              id="voucher-status"
              required
              value={values.paymentStatus}
              onChange={(e) => change("paymentStatus", e.target.value)}
            >
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="voucher-paid-date">
              Payment Settlement Date {values.paymentStatus === "Paid" && "*"}
            </Label>
            <input
              id="voucher-paid-date"
              type="date"
              required={values.paymentStatus === "Paid"}
              value={values.paymentDate}
              onChange={(e) => change("paymentDate", e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#dc2626",
            }}
          >
            {error}
          </p>
        )}

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="activity-submit-btn">
            {record ? "Save Voucher Changes" : "Issue Fee Voucher"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
