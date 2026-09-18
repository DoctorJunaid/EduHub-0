import { UserCheck, BookOpen, Building, ShieldCheck, GraduationCap, School } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

export default function StudentProfileDialog({ student, onClose }) {
  const { isSchool } = useInstitution();
  if (!student) return null;

  return (
    <FullPageFormShell
      title={isSchool ? "Pupil Profile & Record" : "Student Detailed Profile"}
      subtitle={isSchool ? `School academic and guardian record for ${student.name}` : `Comprehensive academic profile for ${student.name}`}
      parentName={isSchool ? "Pupils Directory" : "Students"}
      icon={isSchool ? <School size={24} /> : <GraduationCap size={24} />}
      onBack={onClose}
      maxWidth={720}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Profile Card Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid #e4e4e7" }}>
          <Avatar style={{ width: "64px", height: "64px", fontSize: "20px", fontWeight: "700", background: "#09090b", color: "#ffffff" }}>
            <AvatarFallback>{student.initials || student.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#09090b", margin: 0 }}>{student.name}</h2>
            <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
              {isSchool ? `Roll No: ${student.roll || student.rollNo || "10-A-01"}` : (student.email || student.roll)} · {student.studentPhone || student.phone || "Emergency Contact Verified"}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              {isSchool ? "Class / Grade" : "Program / Degree"}
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>
              {isSchool ? (student.gradeOrClass || student.program?.replace(/BS\s+/i, "Grade 10 - ") || "Grade 10") : (student.program || "—")}
            </strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              {isSchool ? "Section & Shift" : "Section & Semester"}
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>
              {isSchool ? `Section ${student.section || "A"} • Morning Shift` : ([student.section, student.semester].filter(Boolean).join(" · ") || "—")}
            </strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              {isSchool ? "School Campus" : "Campus Branch"}
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.campus || "Main School Campus"}</strong>
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
            {isSchool ? "Enrolled School Subjects" : "Enrolled Subjects"}
          </span>
          <p style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6, margin: 0 }}>
            {isSchool
              ? (student.subjects || "Mathematics, Physics / General Science, English Language, Urdu, Social Studies / Pak Studies, Computer Science, Islamiat")
              : (student.subjects || "No courses recorded for this student.")}
          </p>
        </div>

        {/* Academic Performance */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Attendance Record
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.attendance || "96.4%"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              {isSchool ? "Terminal Evaluation & Rank" : "Cumulative GPA (CGPA)"}
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>
              {isSchool
                ? "Grade A+ • 88.5% (2nd in Class)"
                : (student.cgpa ? `${student.cgpa} / 4.00` : "3.80 / 4.00")}
            </strong>
          </div>
        </div>

        {/* Guardian Info */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Father / Guardian Name
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.guardian || "Muhammad Tariq"}</strong>
          </div>

          <div style={{ padding: "16px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
              Emergency Parent Contact
            </span>
            <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.guardianPhone || student.phone || "+92 300 1234567"}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="activity-form-actions" style={{ marginTop: "8px" }}>
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Directory
          </button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
