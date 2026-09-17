import { useRef, useState } from "react";
import { Award, FileText, Download, Printer } from "lucide-react";
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

export default function TranscriptDialog({
  students,
  results,
  studentId,
  academicYear,
  semester,
  onClose,
}) {
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

  const exportTranscript = () => {
    const data = resultsExport(rows);
    downloadCsv(`student-transcript-${student?.name || "records"}.csv`, data.headers, data.rows);
  };

  return (
    <FullPageFormShell
      title={`Academic Transcript: ${student?.name || "Student"}`}
      subtitle={`Cumulative exam records, grades, and unweighted GPA summary.`}
      parentName="Exam Results & GPA"
      icon={<FileText size={22} />}
      onBack={onClose}
      maxWidth={950}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Student Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "10px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#09090b" }}>Select Student:</label>
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
            <option value="">Select student</option>
            {students.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} — {person.roll}
              </option>
            ))}
          </select>
        </div>

        {/* Printable Transcript Sheet */}
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
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#09090b", margin: 0 }}>Official Academic Transcript</h2>
              <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
                Campus Registrar & Examination Records Office
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong style={{ fontSize: "14px", color: "#09090b" }}>{student?.name ?? "No student selected"}</strong>
              <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0" }}>{student?.roll ?? "—"}</p>
              <p style={{ fontSize: "11px", color: "#a1a1aa", margin: "2px 0 0" }}>{academicYear || "All Academic Years"} · {semester || "All Semesters"}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course / Subject</TableHead>
                <TableHead>Academic Period</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>GPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <strong>{record.exam.subject}</strong>
                    <small style={{ display: "block", color: "#71717a", fontSize: "11px" }}>{record.courseCode}</small>
                  </TableCell>
                  <TableCell>
                    {record.semester}
                    <small style={{ display: "block", color: "#71717a", fontSize: "11px" }}>{record.academicYear}</small>
                  </TableCell>
                  <TableCell>
                    {record.score} / {record.totalMarks}
                    <small style={{ display: "block", color: "#71717a", fontSize: "11px" }}>{percentage(record)?.toFixed(1) ?? "—"}%</small>
                  </TableCell>
                  <TableCell>
                    <strong>{record.grade || "—"}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{record.gpa?.toFixed(2) ?? "—"}</strong>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: "center", padding: "32px 16px", color: "#71717a" }}>
                    No results recorded for this student in the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e4e4e7" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#09090b" }}>
              Mean Recorded GPA: <strong style={{ fontSize: "16px" }}>{mean?.toFixed(2) ?? "—"}</strong>
            </span>
            <span style={{ fontSize: "11px", color: "#71717a" }}>
              Unweighted average of recorded semester GPA ratings.
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
            onClick={() => printElement(sheet.current, `${student?.name || "Student"} — Transcript`)}
          >
            <Printer size={14} className="mr-2" />
            Print Transcript
          </Button>
        </div>
      </div>
    </FullPageFormShell>
  );
}
