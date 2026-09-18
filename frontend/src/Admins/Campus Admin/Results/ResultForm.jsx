import { useState } from "react";
import { Award, GraduationCap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { validateResult, resultKey } from "./resultsData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

export default function ResultForm({
  record,
  students,
  exams,
  records,
  onClose,
  onSave,
}) {
  const { isSchool } = useInstitution();
  const [values, setValues] = useState(() => ({
    studentId: record?.studentId ?? "",
    examId: record?.examId ?? "",
    academicYear: record?.academicYear ?? "2024-2025",
    semester: record?.semester ?? (isSchool ? "Final Term" : "Fall 2024"),
    courseCode: record?.courseCode ?? "",
    score: record?.score ?? "",
    totalMarks: record?.totalMarks ?? "",
    grade: record?.grade ?? "",
    gpa: record?.gpa ?? "",
    remarks: record?.remarks ?? "",
  }));
  const [error, setError] = useState("");

  const change = (key, value) => {
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "examId"
        ? {
            totalMarks:
              exams.find((exam) => exam.id === value)?.totalMarks ?? "",
          }
        : {}),
    }));
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    const cleaned = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    );
    const payload = {
      ...cleaned,
      score: cleaned.score === "" ? NaN : Number(cleaned.score),
      totalMarks: cleaned.totalMarks === "" ? NaN : Number(cleaned.totalMarks),
      gpa: cleaned.gpa === "" ? null : Number(cleaned.gpa),
    };
    const message = validateResult(payload);
    if (message) return setError(message);
    if (
      !students.some((student) => student.id === payload.studentId) ||
      !exams.some((exam) => exam.id === payload.examId)
    )
      return setError("Select a valid student and examination schedule.");
    if (
      records.some(
        (item) =>
          item.id !== record?.id && resultKey(item) === resultKey(payload),
      )
    )
      return setError(
        "This student already has a result recorded for this exam and semester. Edit that record instead.",
      );
    onSave({ ...payload, ...(record ? { id: record.id } : {}) });
  };

  return (
    <FullPageFormShell
      title={record ? "Edit Exam Result" : "Record Examination Result"}
      subtitle={
        record
          ? `Updating score and GPA rating for student examination.`
          : "Enter student exam scores, total marks, letter grades, and academic GPA ratings."
      }
      parentName="Exam Results & GPA"
      icon={<GraduationCap size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Student & Examination Selection</div>

          <div className="activity-form-field">
            <Label htmlFor="res-student">Student *</Label>
            <select
              id="res-student"
              required
              value={values.studentId}
              onChange={(e) => change("studentId", e.target.value)}
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {student.roll}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-exam">Examination Paper *</Label>
            <select
              id="res-exam"
              required
              value={values.examId}
              onChange={(e) => change("examId", e.target.value)}
            >
              <option value="">Select exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.subject} — {exam.examType} (Sec {exam.section})
                </option>
              ))}
            </select>
          </div>

          <div className="activity-section-title">Academic Session & Scoring</div>

          <div className="activity-form-field">
            <Label htmlFor="res-year">Academic Year *</Label>
            <input
              id="res-year"
              required
              placeholder="e.g. 2024-2025"
              value={values.academicYear}
              onChange={(e) => change("academicYear", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-sem">{isSchool ? "Term / Exam Session *" : "Semester *"}</Label>
            <input
              id="res-sem"
              required
              placeholder={isSchool ? "e.g. Final Term or Mid Term" : "e.g. Fall 2024"}
              value={values.semester}
              onChange={(e) => change("semester", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-code">{isSchool ? "Subject Code (Optional)" : "Course Code"}</Label>
            <input
              id="res-code"
              placeholder={isSchool ? "e.g. MTH-10" : "e.g. CS-301"}
              value={values.courseCode}
              onChange={(e) => change("courseCode", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-score">Obtained Marks / Score *</Label>
            <input
              id="res-score"
              type="number"
              step="any"
              required
              placeholder="e.g. 88"
              value={values.score}
              onChange={(e) => change("score", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-total">Total Marks *</Label>
            <input
              id="res-total"
              type="number"
              step="any"
              required
              placeholder="e.g. 100"
              value={values.totalMarks}
              onChange={(e) => change("totalMarks", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-grade">Letter Grade (Optional)</Label>
            <input
              id="res-grade"
              placeholder="e.g. A, B+, C"
              value={values.grade}
              onChange={(e) => change("grade", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="res-gpa">GPA Rating (Optional, 0.0 - 4.0)</Label>
            <input
              id="res-gpa"
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              placeholder="e.g. 3.85"
              value={values.gpa}
              onChange={(e) => change("gpa", e.target.value)}
            />
          </div>

          <div className="activity-form-field span-2">
            <Label htmlFor="res-remarks">Academic Remarks (Optional)</Label>
            <textarea
              id="res-remarks"
              placeholder="e.g. Excellent performance in final demonstration."
              value={values.remarks}
              onChange={(e) => change("remarks", e.target.value)}
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
            {record ? "Save Result Changes" : "Save Result Record"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
