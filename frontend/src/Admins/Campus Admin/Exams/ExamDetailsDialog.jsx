import { FileClock, Calendar, Clock, MapPin, User, Award } from "lucide-react";
import { examFields } from "./examData.js";
import { timeLabel } from "../../../lib/schedule.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function ExamDetailsDialog({ record, onClose }) {
  if (!record) return null;

  return (
    <FullPageFormShell
      title={`${record.subject} — Examination`}
      subtitle={`${record.examType || "Midterm"} details and assigned hall invigilation.`}
      parentName="Exam Schedules"
      icon={<FileClock size={22} />}
      onBack={onClose}
      maxWidth={850}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {examFields.map(([key, label, type]) => (
            <div
              key={key}
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
                {label}
              </span>
              <strong style={{ fontSize: "15px", color: "#09090b" }}>
                {type === "time"
                  ? timeLabel(record[key])
                  : record[key] || "Not specified"}
              </strong>
            </div>
          ))}
        </div>

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Exam Schedules
          </button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
