import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import assignments, {
  assignmentDeleted,
  assignmentSaved,
  submissionGraded,
  submissionSaved,
  submissionsReducer,
} from "./assignmentsSlice.js";

const task = {
  id: "assignment-1",
  classId: "class-1",
  title: "Responsive exercise",
  dueDate: "2026-09-30",
  totalMarks: 50,
  teacherId: "faculty-1",
};
const submission = {
  id: "submission-1",
  assignmentId: task.id,
  studentId: "student-1",
  notes: "Finished the responsive layout.",
  status: "Submitted",
  score: null,
  feedback: "",
};
const makeStore = () =>
  configureStore({ reducer: { assignments, submissions: submissionsReducer } });

test("teacher assignment records validate, submissions grade within the assignment maximum, and deletion never silently removes submissions", () => {
  const store = makeStore();
  store.dispatch(assignmentSaved(task));
  store.dispatch(
    assignmentSaved({
      ...task,
      id: "assignment-2",
      title: "A second assignment",
    }),
  );
  assert.equal(store.getState().assignments.records.length, 2);
  assert.equal(store.getState().assignments.records[0].title, task.title);
  store.dispatch(
    assignmentSaved({ ...task, id: "invalid", dueDate: "2026-02-30" }),
  );
  assert.deepEqual(
    store.getState().assignments.records.map((row) => row.id),
    [task.id, "assignment-2"],
  );

  store.dispatch(submissionSaved(submission));
  store.dispatch(
    submissionSaved({ ...submission, notes: "Updated submission" }),
  );
  assert.equal(store.getState().submissions.records.length, 1);
  assert.equal(store.getState().submissions.records[0].id, submission.id);
  assert.equal(
    store.getState().submissions.records[0].notes,
    "Updated submission",
  );

  store.dispatch(
    submissionGraded({
      id: submission.id,
      score: 20,
      feedback: "Missing maximum",
    }),
  );
  store.dispatch(
    submissionGraded({
      id: submission.id,
      score: 51,
      maxMarks: task.totalMarks,
      feedback: "Over maximum",
    }),
  );
  assert.equal(store.getState().submissions.records[0].status, "Submitted");
  store.dispatch(
    submissionGraded({
      id: submission.id,
      score: 0,
      maxMarks: task.totalMarks,
      feedback: "Please review the layout.",
    }),
  );
  assert.equal(store.getState().submissions.records[0].status, "Graded");
  assert.equal(store.getState().submissions.records[0].score, 0);
  assert.equal(
    store.getState().submissions.records[0].feedback,
    "Please review the layout.",
  );

  store.dispatch(assignmentDeleted(task.id));
  assert.deepEqual(
    store.getState().assignments.records.map((row) => row.id),
    ["assignment-2"],
  );
  assert.deepEqual(
    store.getState().submissions.records.map((row) => row.id),
    [submission.id],
  );
});
