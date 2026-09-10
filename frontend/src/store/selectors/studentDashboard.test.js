import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import auth, { demoLoggedIn, loggedOut } from "../Slices/authSlice.js";
import students, { studentUpdated } from "../Slices/studentsSlice.js";
import timetable, { classUpdated } from "../Slices/timetableSlice.js";
import studentAttendance, {
  studentAttendanceMarked,
} from "../Slices/studentAttendanceSlice.js";
import results from "../Slices/resultsSlice.js";
import { loadDemoState, persistDemoState } from "../persistence.js";
import {
  matchCurrentStudent,
  selectCurrentStudent,
  selectStudentDashboard,
  selectStudentProfile,
} from "./studentDashboard.js";

const reducers = { auth, students, timetable, studentAttendance, results };
const create = () => configureStore({ reducer: reducers });
const login = (store, email = "ali.raza@nust.edu.pk") =>
  store.dispatch(demoLoggedIn({ role: "student", email }));

test("identity resolution uses a Student role and unique email or exact ID, never a fallback record", () => {
  const records = [
    { id: "one", email: "one@example.com" },
    { id: "two", email: "two@example.com" },
  ];
  assert.equal(
    matchCurrentStudent({ role: "student", id: "one" }, records).id,
    "one",
  );
  assert.equal(
    matchCurrentStudent(
      { role: "student", email: " TWO@example.com " },
      records,
    ).id,
    "two",
  );
  assert.equal(
    matchCurrentStudent({ role: "campus-admin", id: "one" }, records),
    null,
  );
  assert.equal(
    matchCurrentStudent(
      { role: "student", email: "unknown@example.com" },
      records,
    ),
    null,
  );
  assert.equal(
    matchCurrentStudent({ role: "student", email: "one@example.com" }, [
      ...records,
      { id: "duplicate", email: "one@example.com" },
    ]),
    null,
  );
});

test("dashboard tracks shared student and timetable edits without other sections or made-up metrics", () => {
  const store = create();
  login(store);
  let view = selectStudentDashboard(store.getState());
  assert.equal(view.student.name, "Ali Raza");
  assert.equal(view.courses.length, 3);
  assert.deepEqual(
    view.timetable.map((item) => item.id),
    ["schedule-1"],
  );
  assert.equal(view.attendance.rate, null);
  assert.equal(view.cgpa, null);
  store.dispatch(
    studentUpdated({
      id: view.student.id,
      name: "Updated Student",
      subjects: "Mathematics, Mathematics, Physics",
      section: "CS-3B",
    }),
  );
  view = selectStudentDashboard(store.getState());
  assert.deepEqual(view.courses, ["Mathematics", "Physics"]);
  assert.deepEqual(
    view.timetable.map((item) => item.id),
    ["schedule-2"],
  );
  assert.equal(selectStudentProfile(store.getState()).name, "Updated Student");
  store.dispatch(classUpdated({ id: "schedule-2", room: "Updated Hall" }));
  assert.equal(
    selectStudentDashboard(store.getState()).timetable[0].room,
    "Updated Hall",
  );
  login(store, "unlinked@example.com");
  assert.equal(selectCurrentStudent(store.getState()), null);
  assert.equal(selectStudentDashboard(store.getState()).timetable.length, 0);
  assert.equal(selectStudentDashboard(store.getState()).courses.length, 0);
});

test("attendance is personal, excludes orphan records and does not assume Late/Leave rules", () => {
  const store = create();
  login(store);
  const studentId = selectCurrentStudent(store.getState()).id;
  store.dispatch(
    studentAttendanceMarked({
      studentId,
      classId: "schedule-1",
      date: "2026-09-07",
      status: "Present",
    }),
  );
  store.dispatch(
    studentAttendanceMarked({
      studentId,
      classId: "schedule-1",
      date: "2026-09-09",
      status: "Absent",
    }),
  );
  store.dispatch(
    studentAttendanceMarked({
      studentId: "student-demo-2",
      classId: "schedule-1",
      date: "2026-09-09",
      status: "Present",
    }),
  );
  store.dispatch(
    studentAttendanceMarked({
      studentId,
      classId: "removed",
      date: "2026-09-09",
      status: "Present",
    }),
  );
  assert.equal(selectStudentDashboard(store.getState()).attendance.rate, 50);
  assert.equal(selectStudentDashboard(store.getState()).attendance.marked, 2);
  store.dispatch(
    studentAttendanceMarked({
      studentId,
      classId: "schedule-1",
      date: "2026-09-09",
      status: "Late",
    }),
  );
  assert.equal(selectStudentDashboard(store.getState()).attendance.rate, null);
  assert.equal(
    selectStudentDashboard(store.getState()).attendance.policyPending,
    true,
  );
});

test("Student session and academic records survive centralized persistence and logout clears identity", () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  const store = create();
  const unsubscribe = persistDemoState(store, storage);
  login(store);
  const student = selectCurrentStudent(store.getState());
  store.dispatch(
    studentUpdated({ ...student, name: "Persisted Student", cgpa: 3.9 }),
  );
  const restored = configureStore({
    reducer: reducers,
    preloadedState: loadDemoState(storage),
  });
  assert.equal(
    selectStudentProfile(restored.getState()).name,
    "Persisted Student",
  );
  assert.equal(selectStudentDashboard(restored.getState()).cgpa, 3.9);
  restored.dispatch(loggedOut());
  assert.equal(selectStudentProfile(restored.getState()), null);
  assert.equal(selectStudentDashboard(restored.getState()).student, null);
  unsubscribe();
});
