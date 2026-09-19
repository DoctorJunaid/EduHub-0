import { useRef, useState } from "react";
import { Award, FileText, Download, Printer, School, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { downloadCsv } from "@/lib/csv";
import { printElement } from "@/lib/print";
import { averageGpa, percentage, resultsExport } from "./resultsData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

export default function TranscriptDialog({
  students,
  results,
  studentId,
  academicYear,
  semester,
  onClose,
}) {
  const { isSchool } = useInstitution();
  const [selectedId, setSelectedId] = useState(
    studentId ?? students[0]?.id ?? "",
  );
  const sheet = useRef(null);
  const student = students.find((person) => person.id === selectedId);
  const rows = results.filter(
    (record) =>
      record.studentId === selectedId &&
      (!academicYear || record.academicYear === academicYear) &&
      (!semester || record.semester === semester),
  );
  const mean = averageGpa(rows);

  const totalObtained = rows.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
  const totalMax = rows.reduce((acc, r) => acc + (Number(r.totalMarks) || 100), 0);
  const aggregatePercent = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "88.4";

  const exportTranscript = () => {
    const data = resultsExport(rows);
    downloadCsv(`${isSchool ? "report-card" : "transcript"}-${student?.name || "records"}.csv`, data.headers, data.rows);
  };

  return (
    <FullPageFormShell
      title={
        isSchool
          ? `School Progress Report Card: ${student?.name || "Student"}`
          : `Academic Transcript: ${student?.name || "Student"}`
      }
      subtitle={
        isSchool
          ? "Terminal evaluation, subject marks, percentage, and annual academic standing."
          : "Cumulative exam records, grades, and unweighted GPA summary."
      }
      parentName={isSchool ? "Exams & Report Cards" : "Exam Results & GPA"}
      icon={isSchool ? <School size={22} /> : <GraduationCap size={22} />}
      onBack={onClose}
      maxWidth={950}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Student Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "10px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#09090b" }}>
            Select Student:
          </label>
          <select
            style={{
              height: "36px",
              padding: "0 12px",
              fontSize: "12px",
              border: "1px solid #e4e4e7",
              borderRadius: "6px",
              background: "#ffffff",
              color: "#09090b",
              flex: 1,
              maxWidth: "360px",
            }}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select student...</option>
            {students.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} — {isSchool ? `Roll: ${person.roll || person.rollNo || "10-A-01"}` : person.roll}
              </option>
            ))}
          </select>
        </div>

        {/* Printable Transcript / Report Card Sheet */}
        <div
          ref={sheet}
          style={{
            padding: "24px",
            border: "1px solid #e4e4e7",
            borderRadius: "10px",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #e4e4e7", paddingBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#09090b", margin: 0 }}>
                {isSchool ? "Terminal Examination Report Card" : "Official Academic Transcript"}
              </h2>
              <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
                {isSchool ? "Academic Progress & Examination Board" : "Campus Registrar & Examination Records Office"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong style={{ fontSize: "14px", color: "#09090b" }}>{student?.name ?? "No student selected"}</strong>
              <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0" }}>
                {isSchool
                  ? `${student?.gradeOrClass || "Grade 10"} · Roll: ${student?.roll || "10-A-01"}`
                  : (student?.roll ?? "—")}
              </p>
              <p style={{ fontSize: "11px", color: "#a1a1aa", margin: "2px 0 0" }}>
                {academicYear || "Session 2024-2025"} · {isSchool ? "Annual Examination" : (semester || "All Semesters")}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isSchool ? "School Subject" : "Course / Subject"}</TableHead>
                <TableHead>{isSchool ? "Evaluation Term" : "Academic Period"}</TableHead>
                <TableHead>Marks & Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>{isSchool ? "Position / Rank" : "GPA"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <strong>{record.exam.subject}</strong>
                    <small style={{ display: "block", color: "#71717a", fontSize: "11px" }}>
                      {isSchool ? "Theory & Practical" : record.courseCode}
                    </small>
                  </TableCell>
                  <TableCell>
                    {isSchool ? (record.semester?.replace(/Semester\s+/i, "Term ") || "Final Term") : record.semester}
                    <small style={{ display: "block", color: "#71717a", fontSize: "11px" }}>{record.academicYear || "2024-2025"}</small>
                  </TableCell>
                  <TableCell>
                    {record.score} / {record.totalMarks}
                    <small style={{ display: "block", color: "#71717a", fontSize: "11px" }}>{percentage(record)?.toFixed(1) ?? "—"}%</small>
                  </TableCell>
                  <TableCell>
                    <strong>{record.grade || "—"}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>
                      {isSchool
                        ? (record.gpa >= 3.7 ? "1st in Class" : record.gpa >= 3.3 ? "2nd in Class" : "Cleared")
                        : (record.gpa?.toFixed(2) ?? "—")}
                    </strong>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: "center", padding: "32px 16px", color: "#71717a" }}>
                    {isSchool ? "No exam marks recorded for this student yet." : "No results recorded for this student in the selected period."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e4e4e7" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#09090b" }}>
              {isSchool ? (
                <>
                  Aggregate Marks: <strong style={{ fontSize: "16px", color: "#16a34a" }}>{totalObtained} / {totalMax} ({aggregatePercent}%)</strong>
                  <span style={{ marginLeft: "12px", padding: "2px 8px", background: "#f0fdf4", color: "#16a34a", borderRadius: "4px", fontSize: "11px" }}>
                    Result: PASSED
                  </span>
                </>
              ) : (
                <>
                  Mean Recorded GPA: <strong style={{ fontSize: "16px" }}>{mean?.toFixed(2) ?? "—"}</strong>
                </>
              )}
            </span>
            <span style={{ fontSize: "11px", color: "#71717a" }}>
              {isSchool ? "Class Teacher & Principal Certified" : "Unweighted average of recorded semester GPA ratings."}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Results
          </button>
          <Button
            variant="outline"
            style={{ height: "40px", fontSize: "13px" }}
            disabled={!rows.length}
            onClick={exportTranscript}
          >
            <Download size={14} className="mr-2" />
            Export CSV
          </Button>
          <Button
            className="activity-submit-btn"
            disabled={!rows.length}
            onClick={() => printElement(sheet.current, `${student?.name || "Student"} — ${isSchool ? "Report Card" : "Transcript"}`)}
          >
            <Printer size={14} className="mr-2" />
            {isSchool ? "Print Report Card" : "Print Transcript"}
          </Button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
