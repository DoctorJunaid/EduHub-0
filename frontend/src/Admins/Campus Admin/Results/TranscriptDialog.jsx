import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
    downloadCsv("student-transcript.csv", data.headers, data.rows);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="tt-dialog results-transcript-dialog"
        overlayClassName="tt-overlay"
        aria-describedby={undefined}
      >
        <div className="tt-dialog-heading">
          <DialogTitle>Student Transcript</DialogTitle>
        </div>
        <label className="tt-field results-transcript-select">
          Student
          <select
            aria-label="Transcript student"
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
        </label>
        <div className="results-transcript-sheet" ref={sheet}>
          <h2>Academic Results Transcript</h2>
          <p>
            <strong>{student?.name ?? "No student selected"}</strong>
            <br />
            {student?.roll ?? "—"}
            <br />
            {academicYear || "All Academic Years"} ·{" "}
            {semester || "All Semesters"}
          </p>
          <Table aria-label="Transcript results">
            <TableHeader>
              <TableRow>
                {[
                  "Course / Subject",
                  "Academic Period",
                  "Score",
                  "Grade",
                  "GPA",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.exam.subject}
                    <small>{record.courseCode}</small>
                  </TableCell>
                  <TableCell>
                    {record.semester}
                    <small>{record.academicYear}</small>
                  </TableCell>
                  <TableCell>
                    {record.score} / {record.totalMarks}
                    <small>{percentage(record)?.toFixed(1) ?? "—"}%</small>
                  </TableCell>
                  <TableCell>{record.grade || "—"}</TableCell>
                  <TableCell>{record.gpa?.toFixed(2) ?? "—"}</TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    No results for this student and academic period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p>
            Mean recorded GPA (unweighted):{" "}
            <strong>{mean?.toFixed(2) ?? "—"}</strong>
          </p>
          <p className="results-form-note">
            Grade and GPA values are recorded awards. This frontend report does
            not calculate an official cumulative or credit-weighted GPA.
          </p>
        </div>
        <div className="tt-dialog-actions">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            disabled={!rows.length}
            onClick={exportTranscript}
          >
            Export CSV
          </Button>
          <Button
            disabled={!rows.length}
            onClick={() =>
              printElement(sheet.current, `${student.name} — Transcript`)
            }
          >
            Print Transcript
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
