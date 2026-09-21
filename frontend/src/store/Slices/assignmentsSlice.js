import { createSlice } from "@reduxjs/toolkit";
import { validAssignment, validSubmission } from "../assignmentData.js";

// Shared collections intentionally start empty. Assignment publication/grading belongs to the future Teacher integration.
const assignments = createSlice({
  name: "assignments",
  initialState: { records: [] },
  reducers: {
    assignmentsLoaded: (state, { payload }) => {
      state.records = Array.isArray(payload) ? payload : [];
    assignmentSaved(state, { payload }) {
      if (!validAssignment(payload)) return;
      const existing = state.records.find((record) => record.id === payload.id);
      if (existing) Object.assign(existing, payload);
      else state.records.push(payload);
    },
    assignmentDeleted(state, { payload }) {
      state.records = state.records.filter((record) => record.id !== payload);
    },
  },
});
const submissions = createSlice({
  name: "submissions",
  initialState: { records: [] },
  reducers: {
    submissionsLoaded: (state, { payload }) => {
      state.records = Array.isArray(payload) ? payload : [];
    },
    submissionSaved(state, { payload }) {
      if (!validSubmission(payload) || payload.status !== "Submitted") return;
      const existing = state.records.find(
        (record) =>
          record.assignmentId === payload.assignmentId &&
          record.studentId === payload.studentId,
      );
      if (existing?.status === "Graded") return;
      if (existing) existing.notes = payload.notes;
      else if (!state.records.some((record) => record.id === payload.id))
        state.records.push(payload);
    },
    submissionGraded(state, { payload }) {
      const record = state.records.find((item) => item.id === payload.id);
      if (!record || !Number.isFinite(payload.score) || payload.score < 0) return;
      record.status = "Graded";
      record.score = payload.score;
      record.feedback = typeof payload.feedback === "string" ? payload.feedback : record.feedback || "";
    },
  },
});
export default assignments.reducer;
export const submissionsReducer = submissions.reducer;
export const { assignmentsLoaded } = assignments.actions;
export const { submissionsLoaded, submissionSaved } = submissions.actions;
export const { assignmentSaved, assignmentDeleted } = assignments.actions;
export const { submissionSaved, submissionGraded } = submissions.actions;
