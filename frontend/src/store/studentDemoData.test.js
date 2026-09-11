import test from "node:test";
import assert from "node:assert/strict";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import students from "./Slices/studentsSlice.js";
import faculty from "./Slices/facultySlice.js";
import timetable from "./Slices/timetableSlice.js";
import assignments, {
  submissionsReducer as submissions,
} from "./Slices/assignmentsSlice.js";
import diary from "./Slices/diarySlice.js";
import results from "./Slices/resultsSlice.js";
import exams from "./Slices/examsSlice.js";
import studentAttendance from "./Slices/studentAttendanceSlice.js";
import fees from "./Slices/feesSlice.js";
import messages from "./Slices/messagesSlice.js";
import auth, { demoLoggedIn } from "./Slices/authSlice.js";
import {
  populateStudentDemo,
  preferRealStudentData,
} from "./studentDemoData.js";
import { loadDemoState, persistDemoState } from "./persistence.js";
import { selectStudentAssignments } from "./selectors/studentAssignments.js";
import { selectStudentDiary } from "./selectors/studentDiary.js";
import { selectStudentCourses } from "./selectors/studentCourses.js";
import { selectStudentGrades } from "./selectors/studentGrades.js";
import { selectStudentConversations } from "./selectors/studentMessages.js";
const reducer = combineReducers({
  students,
  faculty,
  timetable,
  assignments,
  submissions,
  diary,
  results,
  exams,
  studentAttendance,
  fees,
  messages,
  auth,
});
const make = () =>
  populateStudentDemo(
    reducer(undefined, { type: "@@INIT" }),
    new Date("2026-09-10T12:00:00"),
  );
test("coordinated demo populates all Student pages with valid shared relationships", () => {
  const store = configureStore({ reducer, preloadedState: make() });
  store.dispatch(
    demoLoggedIn({ role: "student", email: "ali.raza@nust.edu.pk" }),
  );
  const state = store.getState();
  assert.equal(selectStudentCourses(state).length, 3);
  assert.ok(
    selectStudentCourses(state).every(
      (course) =>
        course.routines.length &&
        course.attendance.marked === 4 &&
        course.creditHours === 3,
    ),
  );
  assert.deepEqual(
    new Set(selectStudentAssignments(state).map((row) => row.status)),
    new Set(["Submitted", "Pending Submission", "Graded"]),
  );
  assert.equal(selectStudentDiary(state).length, 3);
  assert.equal(selectStudentGrades(state).periods[0].rows.length, 3);
  assert.equal(selectStudentGrades(state).cgpa, 3.93);
  assert.ok(selectStudentConversations(state).length >= 1);
  assert.equal(
    state.fees.records.reduce((sum, row) => sum + row.amount, 0),
    100000,
  );
  assert.equal(state.students.records.length, 2);
});
test("demo is idempotent and all populated collections survive existing validation/persistence", () => {
  const state = make();
  assert.deepEqual(
    populateStudentDemo(state, new Date("2026-09-10T12:00:00")),
    state,
  );
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  const store = configureStore({ reducer, preloadedState: state });
  const unsubscribe = persistDemoState(store, storage);
  const restored = loadDemoState(storage);
  for (const collection of [
    "students",
    "timetable",
    "assignments",
    "submissions",
    "diary",
    "results",
    "exams",
    "studentAttendance",
    "fees",
    "messages",
  ])
    assert.deepEqual(
      restored[collection].records,
      state[collection].records,
      collection,
    );
  unsubscribe();
});
test("real records are preserved and supersede generated collection records", () => {
  const state = make();
  const real = {
    ...state.fees.records[0],
    id: "real-voucher",
    demo: false,
    amount: 2300,
  };
  const mixed = { ...state, fees: { records: [...state.fees.records, real] } };
  assert.deepEqual(preferRealStudentData(mixed).fees.records, [real]);
  const existing = {
    ...state,
    fees: { records: [real] },
    students: {
      records: state.students.records.map((row) =>
        row.id === "student-demo-1" ? { ...row, cgpa: 3.1 } : row,
      ),
    },
  };
  const filled = populateStudentDemo(existing);
  assert.deepEqual(filled.fees.records, [real]);
  assert.equal(filled.students.records[0].cgpa, 3.1);
});
