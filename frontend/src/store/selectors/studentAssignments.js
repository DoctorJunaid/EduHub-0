import { createSelector } from "@reduxjs/toolkit";
import { selectStudentDashboard } from "./studentDashboard.js";
import { validAssignment, validSubmission } from "../assignmentData.js";
const empty = [];
const normalize = (value) => value.trim().toLowerCase();
const referenceId = (value) => {
  if (value && typeof value === "object") return value._id || value.id || "";
  return value || "";
};
export const selectStudentAssignments = createSelector(
  [
    selectStudentDashboard,
    (state) => state.assignments?.records ?? empty,
    (state) => state.submissions?.records ?? empty,
  ],
  ({ student, courses, timetable }, assignments, submissions) => {
    if (!student) return [];
    return assignments
      .filter(validAssignment)
      .flatMap((assignment) => {
        const assignmentClassId = String(referenceId(assignment.classId));
        const session = timetable.find(
          (record) =>
            [record.id, record._id, record.classId]
              .map(referenceId)
              .some((id) => String(id) === assignmentClassId) &&
            courses.some(
              (course) => normalize(course) === normalize(record.subject),
            ),
        );
        const fallbackSession =
          session ||
          timetable.find(
            (record) =>
              courses.some(
                (course) => normalize(course) === normalize(record.subject),
              ) &&
              (normalize(record.subject) === normalize(assignment.subject) ||
                normalize(record.title) === normalize(assignment.subject)),
          );
        if (!fallbackSession) return [];
        const submission = submissions.find(
          (record) =>
            validSubmission(record) &&
            record.assignmentId === assignment.id &&
            record.studentId === student.id,
        );
        const status = submission?.status ?? "Pending Submission";
        return [
          {
            ...assignment,
            subject: fallbackSession.subject || assignment.subject || "General",
            section: fallbackSession.section || assignment.section || "",
            submission,
            status,
            scoreLabel:
              status === "Graded"
                ? submission.score == null
                  ? "Score not available"
                  : `${submission.score} / ${assignment.totalMarks ?? "—"}`
                : status === "Submitted"
                  ? "Awaiting Grading"
                  : "Not Submitted",
          },
        ];
      })
      .sort(
        (a, b) =>
          (a.dueDate || "9999").localeCompare(b.dueDate || "9999") ||
          a.title.localeCompare(b.title),
      );
  },
);
