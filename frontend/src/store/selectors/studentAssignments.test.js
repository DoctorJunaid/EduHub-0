import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import auth, { demoLoggedIn, loggedOut } from "../Slices/authSlice.js";
import students from "../Slices/studentsSlice.js";
import timetable from "../Slices/timetableSlice.js";
import studentAttendance from "../Slices/studentAttendanceSlice.js";
import results from "../Slices/resultsSlice.js";
import assignments, {
  submissionsReducer as submissions,
} from "../Slices/assignmentsSlice.js";
import { selectStudentAssignments } from "./studentAssignments.js";
import { submitStudentAssignment } from "../submitStudentAssignment.js";
import { loadDemoState, persistDemoState } from "../persistence.js";
import { validAssignmentRecords } from "../assignmentData.js";

const reducer = {
  auth,
  students,
  timetable,
  studentAttendance,
  results,
  assignments,
  submissions,
};
const assignment = {
  id: "task-1",
  classId: "schedule-1",
  title: "Test assignment",
  dueDate: "2026-09-10",
  totalMarks: 50,
};
const create = (records = [assignment], saved = []) => {
  const store = configureStore({
    reducer,
    preloadedState: {
      assignments: { records },
      submissions: { records: saved },
    },
  });
  store.dispatch(
    demoLoggedIn({ role: "student", email: "ali.raza@nust.edu.pk" }),
  );
  return store;
};
test("assignments require enrolled subject, own section and linked student; empty stays empty", () => {
  const store = create([
    assignment,
    { ...assignment, id: "other", classId: "schedule-2" },
    { ...assignment, id: "orphan", classId: "missing" },
  ]);
  assert.equal(selectStudentAssignments(store.getState()).length, 1);
  store.dispatch(
    demoLoggedIn({ role: "student", email: "unknown@example.com" }),
  );
  assert.deepEqual(selectStudentAssignments(store.getState()), []);
  assert.equal(
    store.dispatch(
      submitStudentAssignment({ assignmentId: "task-1", notes: "Work" }),
    ),
    "This assignment is no longer available to your account.",
  );
  assert.deepEqual(selectStudentAssignments(create([]).getState()), []);
});
test("submit/edit validates notes, keeps one personal record, updates derived pending count and survives refresh", () => {
  const store = create();
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  const unsubscribe = persistDemoState(store, storage);
  const pending = () =>
    selectStudentAssignments(store.getState()).filter(
      (row) => row.status === "Pending Submission",
    ).length;
  assert.equal(pending(), 1);
  assert.ok(
    store.dispatch(
      submitStudentAssignment({ assignmentId: "task-1", notes: "  " }),
    ),
  );
  assert.equal(store.getState().submissions.records.length, 0);
  assert.equal(
    store.dispatch(
      submitStudentAssignment({
        assignmentId: "task-1",
        notes: " First work ",
      }),
    ),
    null,
  );
  assert.equal(pending(), 0);
  store.dispatch(
    submitStudentAssignment({ assignmentId: "task-1", notes: "Revised work" }),
  );
  assert.equal(store.getState().submissions.records.length, 1);
  const restored = configureStore({
    reducer,
    preloadedState: loadDemoState(storage),
  });
  assert.equal(
    selectStudentAssignments(restored.getState())[0].submission.notes,
    "Revised work",
  );
  assert.equal(
    selectStudentAssignments(restored.getState())[0].scoreLabel,
    "Awaiting Grading",
  );
  store.dispatch(loggedOut());
  assert.deepEqual(selectStudentAssignments(store.getState()), []);
  unsubscribe();
});
test("grades are read-only, zero scores preserved and other student submissions hidden", () => {
  const submission = {
    id: "sub-1",
    assignmentId: "task-1",
    studentId: "student-demo-1",
    notes: "My work",
    status: "Graded",
    score: 0,
    feedback: "Please review the requirements.",
  };
  const store = create([assignment], [submission]);
  assert.equal(
    selectStudentAssignments(store.getState())[0].scoreLabel,
    "0 / 50",
  );
  assert.equal(
    store.dispatch(
      submitStudentAssignment({ assignmentId: "task-1", notes: "Overwrite" }),
    ),
    "Graded submissions cannot be edited.",
  );
  assert.deepEqual(store.getState().submissions.records[0], submission);
  const other = create(
    [assignment],
    [{ ...submission, studentId: "student-demo-2" }],
  );
  assert.equal(
    selectStudentAssignments(other.getState())[0].status,
    "Pending Submission",
  );
});
test("persistence rejects malformed assignments and duplicate personal submissions", () => {
  assert.equal(
    validAssignmentRecords([{ ...assignment, dueDate: "2026-02-30" }]),
    false,
  );
  assert.equal(
    validAssignmentRecords([{ ...assignment, totalMarks: -1 }]),
    false,
  );
  const row = {
    id: "s",
    assignmentId: "task-1",
    studentId: "student-demo-1",
    notes: "Work",
    status: "Submitted",
    score: null,
    feedback: "",
  };
  assert.equal(
    validAssignmentRecords([row, { ...row, id: "s2" }], true),
    false,
  );
  const state = loadDemoState({
    getItem: (key) =>
      key === "eduhub_assignments"
        ? JSON.stringify({
            version: 1,
            records: [{ ...assignment, dueDate: "bad" }],
          })
        : null,
  });
  assert.equal(state.assignments, undefined);
});
