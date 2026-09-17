import { Calendar, Clock, MapPin, User, BookOpen } from "lucide-react";
import { dayLabel, timeLabel } from "../../../lib/schedule.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function ClassDetailsDialog({ record, onClose }) {
  if (!record) return null;

  return (
    <FullPageFormShell
      title={record.subject}
      subtitle={`Scheduled class details for section ${record.section || "A"}.`}
      parentName="Class Timetable"
      icon={<Calendar size={22} />}
      onBack={onClose}
      maxWidth={850}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Course / Subject
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{record.subject}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Program & Section
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {record.program} — Section {record.section}
            </strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Instructor
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{record.instructor}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Room / Laboratory
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{record.room}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Scheduled Days
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>{dayLabel(record.days)}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Lecture Timing
            </span>
            <strong style={{ fontSize: "15px", color: "#09090b" }}>
              {timeLabel(record.startTime)} – {timeLabel(record.endTime)}
            </strong>
          </div>
        </div>

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Timetable
          </button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
