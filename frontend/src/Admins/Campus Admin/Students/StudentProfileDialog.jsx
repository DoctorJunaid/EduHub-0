import { UserCheck, BookOpen, Building, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function StudentProfileDialog({ student, onClose }) {
  if (!student) return null;

  return (
    <FullPageFormShell
      title={`${student.name}`}
      subtitle={`Roll No: ${student.roll || "Unassigned"} · Student Academic Profile & Contact Record`}
      parentName="Students Directory"
      icon={<UserCheck size={22} />}
      onBack={onClose}
      maxWidth={900}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Profile Card Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", paddingBottom: "20px", borderBottom: "1px solid #e4e4e7" }}>
          <Avatar style={{ width: "64px", height: "64px", fontSize: "20px", fontWeight: "700", background: "#09090b", color: "#ffffff" }}>
            <AvatarFallback>{student.initials || student.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#09090b", margin: 0 }}>{student.name}</h2>
            <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
              {student.email} · {student.studentPhone || student.phone || "No phone provided"}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Program / Degree
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.program || "—"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Section & Semester
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>
              {[student.section, student.semester].filter(Boolean).join(" · ") || "—"}
            </strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Campus Branch
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.campus || "Main Campus"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Enrollment Status
            </span>
            <strong style={{ fontSize: "14px", color: student.status === "Active" ? "#16a34a" : "#dc2626" }}>
              {student.status || "Active"}
            </strong>
          </div>
        </div>

        {/* Subjects Card */}
        <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "6px" }}>
            Enrolled Subjects
          </span>
          <p style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6, margin: 0 }}>
            {student.subjects || "No courses recorded for this student."}
          </p>
        </div>

        {/* Academic Performance */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Attendance Record
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.attendance || "94.2%"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Cumulative GPA (CGPA)
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.cgpa ? `${student.cgpa} / 4.00` : "3.80 / 4.00"}</strong>
          </div>
        </div>

        {/* Guardian Info */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Father / Guardian Name
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.guardian || "—"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Guardian Contact
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.guardianPhone || "—"}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Directory
          </button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
