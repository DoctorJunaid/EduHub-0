import { nanoid } from "@reduxjs/toolkit";
import { selectCurrentStudent } from "./selectors/studentDashboard.js";
import { selectStudentAssignments } from "./selectors/studentAssignments.js";
import { submissionSaved } from "./Slices/assignmentsSlice.js";

export const submitStudentAssignment =
  ({ assignmentId, notes }) =>
  (dispatch, getState) => {
    const state = getState();
    const student = selectCurrentStudent(state);
    const assignment = selectStudentAssignments(state).find(
      (record) => record.id === assignmentId,
    );
    if (!state.auth.isAuthenticated || !student || !assignment)
      return "This assignment is no longer available to your account.";
    if (assignment.status === "Graded")
      return "Graded submissions cannot be edited.";
    if (typeof notes !== "string" || !notes.trim())
      return "Enter your submission text or notes.";
    dispatch(
      submissionSaved({
        id: assignment.submission?.id ?? nanoid(),
        assignmentId,
        studentId: student.id,
        notes: notes.trim(),
        status: "Submitted",
        score: null,
        feedback: "",
      }),
    );
    return null;
  };
