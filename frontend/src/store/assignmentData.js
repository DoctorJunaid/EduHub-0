import { validDate } from "../lib/dates.js";

const text = (value) => typeof value === "string" && Boolean(value.trim());
export const validAssignment = (record) =>
  Boolean(
    record &&
    text(record.id) &&
    text(record.classId) &&
    text(record.title) &&
    (record.dueDate === "" || validDate(record.dueDate)) &&
    (record.totalMarks === null ||
      (Number.isFinite(record.totalMarks) && record.totalMarks > 0)),
  );
export const validSubmission = (record) =>
  Boolean(
    record &&
    text(record.id) &&
    text(record.assignmentId) &&
    text(record.studentId) &&
    text(record.notes) &&
    ["Submitted", "Graded"].includes(record.status) &&
    typeof record.feedback === "string" &&
    (record.score === null ||
      (Number.isFinite(record.score) && record.score >= 0)) &&
    (record.status === "Graded" ||
      (record.score === null && record.feedback === "")),
  );
export function validAssignmentRecords(records, submissions = false) {
  if (!Array.isArray(records)) return false;
  const ids = new Set();
  const pairs = new Set();
  return records.every((record) => {
    if (
      !(submissions ? validSubmission(record) : validAssignment(record)) ||
      ids.has(record.id)
    )
      return false;
    ids.add(record.id);
    if (submissions) {
      const pair = JSON.stringify([record.assignmentId, record.studentId]);
      if (pairs.has(pair)) return false;
      pairs.add(pair);
    }
    return true;
  });
}
export const assignmentAction = (status) =>
  ({
    "Pending Submission": "Submit Now",
    Submitted: "Edit Submission",
    Graded: "View Feedback",
  })[status];
