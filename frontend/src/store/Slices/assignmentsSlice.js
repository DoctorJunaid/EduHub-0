import { createSlice } from "@reduxjs/toolkit";
import { validSubmission } from "../assignmentData.js";

// Shared collections intentionally start empty. Assignment publication/grading belongs to the future Teacher integration.
const assignments = createSlice({
  name: "assignments",
  initialState: { records: [] },
  reducers: {},
});
const submissions = createSlice({
  name: "submissions",
  initialState: { records: [] },
  reducers: {
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
  },
});
export default assignments.reducer;
export const submissionsReducer = submissions.reducer;
export const { submissionSaved } = submissions.actions;
