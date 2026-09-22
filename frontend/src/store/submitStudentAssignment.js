import { nanoid } from "@reduxjs/toolkit";
import { selectCurrentStudent } from "./selectors/studentDashboard.js";
import { selectStudentAssignments } from "./selectors/studentAssignments.js";
import { submissionSaved } from "./Slices/assignmentsSlice.js";
import axiosInstance from "../api/axiosInstance.js";

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
    const payload = {
      id: assignment.submission?.id ?? nanoid(),
      assignmentId,
      studentId: student.id,
      notes: notes.trim(),
      status: "Submitted",
      score: null,
      feedback: "",
    };
    if (!localStorage.getItem("eduHubToken")) {
      dispatch(submissionSaved(payload));
      return null;
    }
    return axiosInstance
      .post(`/student/assignments/${assignmentId}/submission`, {
        notes: notes.trim(),
      })
      .then(({ data }) => {
        dispatch(submissionSaved({ ...payload, ...data.data }));
        return null;
      })
      .catch(
        (error) =>
          error.response?.data?.message || "Unable to submit assignment.",
      );
  };
