import { useState } from "react";
import { Coins, Receipt } from "lucide-react";
import { Label } from "@/components/ui/label";
import { paymentStatuses, validateVoucher } from "./feeData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function FeeVoucherForm({
  record,
  students,
  options,
  onSave,
  onClose,
}) {
  const [values, setValues] = useState(() => ({
    studentId: record?.studentId ?? "",
    voucherNo: record?.voucherNo ?? "",
    feeCategory: record?.feeCategory ?? "",
    semester: record?.semester ?? "",
    amount: record?.amount ?? "",
    dueDate: record?.dueDate ?? "",
    paymentStatus: record?.paymentStatus ?? "Pending",
    paymentDate: record?.paymentDate ?? "",
  }));
  const [error, setError] = useState("");

  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError("");
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
              onChange={(event) => change("studentId", event.target.value)}
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
            <Label htmlFor="voucher-sem">Semester (Optional)</Label>
            <input
              id="voucher-sem"
              placeholder="e.g. 4th Semester"
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
