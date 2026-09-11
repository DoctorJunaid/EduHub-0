import { createSelector } from "@reduxjs/toolkit";
import { selectStudentDashboard } from "./studentDashboard.js";
import { validAssignment, validSubmission } from "../assignmentData.js";
const empty = [];
const normalize = (value) => value.trim().toLowerCase();
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
        const session = timetable.find(
          (record) =>
            record.id === assignment.classId &&
            courses.some(
              (course) => normalize(course) === normalize(record.subject),
            ),
        );
        if (!session) return [];
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
            subject: session.subject,
            section: session.section,
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
