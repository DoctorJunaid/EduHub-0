import { useState } from "react";
import { Clock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { attendanceStatuses, validateAttendance } from "./attendanceData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function AttendanceForm({
  record,
  faculty,
  date,
  facultyId,
  records,
  onSave,
  onClose,
}) {
  const [values, setValues] = useState(() => ({
    facultyId: record?.facultyId ?? facultyId ?? "",
    date: record?.date ?? date,
    checkInTime: record?.checkInTime ?? "",
    checkOutTime: record?.checkOutTime ?? "",
    status: record?.status ?? "",
  }));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError("");
  };

  const existing = records.find(
    (item) =>
      item.facultyId === values.facultyId &&
      item.date === values.date &&
      item.id !== record?.id,
  );

  const submit = async (event) => {
    event.preventDefault();
    const message = validateAttendance(values);
    if (message) return setError(message);
    if (!faculty.some((person) => person.id === values.facultyId))
      return setError(
        "This faculty member is no longer available. Select a current member.",
      );
    if (existing)
      return setError(
        "Attendance already exists for this member and date. Open that record to update it.",
      );
    try {
      setIsSubmitting(true);
      await onSave({ ...values, ...(record ? { id: record.id } : {}) });
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to save attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FullPageFormShell
      title={record ? "Update Faculty Attendance" : "Record Faculty Attendance"}
      subtitle="Record duty presence, check-in, and check-out times for faculty and staff."
      parentName="Staff Attendance"
      icon={<Clock size={22} />}
      onBack={onClose}
      maxWidth={1600}
      className="attendance-form-page"
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Attendance Logging</div>

          <div className="activity-form-field span-2">
            <Label htmlFor="att-faculty">Faculty Member / Staff *</Label>
            <select
              id="att-faculty"
              required
              value={values.facultyId}
              onChange={(e) => change("facultyId", e.target.value)}
            >
              <option value="">Select faculty member</option>
              {faculty.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} — {person.department} ({person.email})
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="att-date">Attendance Date *</Label>
            <input
              id="att-date"
              type="date"
              required
              value={values.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="att-status">Duty Status *</Label>
            <select
              id="att-status"
              required
              value={values.status}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="">Select status</option>
              {attendanceStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="att-checkin">Check-in Time (Optional)</Label>
            <input
              id="att-checkin"
              type="time"
              value={values.checkInTime}
              onChange={(e) => change("checkInTime", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="att-checkout">Check-out Time (Optional)</Label>
            <input
              id="att-checkout"
              type="time"
              value={values.checkOutTime}
              onChange={(e) => change("checkOutTime", e.target.value)}
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
          <button
            type="button"
            className="activity-cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="activity-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {record ? "Save Changes" : "Record Attendance"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
