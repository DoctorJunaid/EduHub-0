import {
  Clock,
  User,
  Mail,
  Building,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { longDate } from "@/lib/dates";
import { timeLabel } from "@/lib/schedule";
import AttendanceStatusBadge from "@/components/common/AttendanceStatusBadge";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function AttendanceDetails({ record, person, onEdit, onClose }) {
  if (!record || !person) return null;

  return (
    <FullPageFormShell
      title={`Check-in Log: ${person.name}`}
      subtitle={`Attendance verified record for ${longDate(record.date)}.`}
      parentName="Staff Attendance"
      icon={<Clock size={22} />}
      onBack={onClose}
      maxWidth="100%"
      className="faculty-attendance-details-page"
    >
      <div className="faculty-attendance-details-content">
        <div className="faculty-attendance-details-grid">
          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Teacher / Staff
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {person.name}
            </strong>
          </div>

          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Institutional Email
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {person.email}
            </strong>
          </div>

          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Department
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {person.department}
            </strong>
          </div>

          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Attendance Date
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {longDate(record.date)}
            </strong>
          </div>

          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Check-in Time
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {record.checkInTime ? timeLabel(record.checkInTime) : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Check-out Time
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {record.checkOutTime ? timeLabel(record.checkOutTime) : "—"}
            </strong>
          </div>

          <div
            style={{
              padding: "16px",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              background: "#fafafa",
              gridColumn: "span 2",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                color: "#71717a",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Recorded Status
            </span>
            <AttendanceStatusBadge status={record.status} />
          </div>
        </div>

        <div
          className="activity-form-actions"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="activity-cancel-btn"
            onClick={onClose}
          >
            Back to Attendance
          </button>
          {onEdit && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              style={{ height: "36px", padding: "0 16px" }}
              onClick={() => onEdit(person.id, record.id)}
            >
              Update Attendance Record
            </button>
          )}
        </div>
      </div>
    </FullPageFormShell>
  );
}
