import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import auth, { demoLoggedIn } from "../Slices/authSlice.js";
import students, { studentUpdated } from "../Slices/studentsSlice.js";
import timetable, { classUpdated } from "../Slices/timetableSlice.js";
import studentAttendance, {
  studentAttendanceMarked,
} from "../Slices/studentAttendanceSlice.js";
import faculty, { facultyUpdated } from "../Slices/facultySlice.js";
import results from "../Slices/resultsSlice.js";
import { loadDemoState, persistDemoState } from "../persistence.js";
import { selectStudentCourses, courseScheduleLabel } from "./studentCourses.js";
import { selectStudentDashboard } from "./studentDashboard.js";

const reducer = {
  auth,
  students,
  timetable,
  studentAttendance,
  faculty,
  results,
};
const create = () => {
  const store = configureStore({ reducer });
  store.dispatch(
    demoLoggedIn({ role: "student", email: "ali.raza@nust.edu.pk" }),
  );
  return store;
};

test("course cards use dashboard enrollments and never borrow another section or guess subject aliases", () => {
  const store = create();
  const cards = selectStudentCourses(store.getState());
  assert.equal(
    cards.length,
    selectStudentDashboard(store.getState()).courses.length,
  );
  assert.deepEqual(
    cards.map((card) => card.title),
    ["Advanced Web Design", "Data Structures", "AI"],
  );
  assert.equal(cards[0].routines[0].room, "Lab 302");
  assert.equal(cards[0].routines[0].instructor, "Dr. Usman Khan");
  assert.equal(cards[1].routines.length, 0);
  assert.equal(cards[2].routines.length, 0);
  store.dispatch(
    studentUpdated({
      id: "student-demo-1",
      subjects: "Data Structures & Algorithms",
      section: "CS-4A",
    }),
  );
  assert.equal(selectStudentCourses(store.getState())[0].routines.length, 0);
  store.dispatch(studentUpdated({ id: "student-demo-1", section: "CS-3B" }));
  assert.equal(
    selectStudentCourses(store.getState())[0].routines[0].room,
    "Hall B",
  );
  assert.equal(selectStudentDashboard(store.getState()).courses.length, 1);
});

test("schedule updates, faculty matches and per-course personal attendance stay live", () => {
  const store = create();
  store.dispatch(
    facultyUpdated({ id: "faculty-demo-1", name: "Dr. Updated Teacher" }),
  );
  store.dispatch(
    classUpdated({
      id: "schedule-1",
      instructor: "dr. updated teacher",
      room: "Lab 500",
      startTime: "11:00",
      endTime: "12:30",
    }),
  );
  store.dispatch(
    studentAttendanceMarked({
      studentId: "student-demo-1",
      classId: "schedule-1",
      date: "2026-09-07",
      status: "Present",
    }),
  );
  store.dispatch(
    studentAttendanceMarked({
      studentId: "student-demo-1",
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
      studentId: "student-demo-1",
      classId: "schedule-2",
      date: "2026-09-08",
      status: "Present",
    }),
  );
  const card = selectStudentCourses(store.getState())[0];
  assert.equal(card.routines[0].instructor, "Dr. Updated Teacher");
  assert.equal(card.routines[0].room, "Lab 500");
  assert.match(card.routines[0].schedule, /11:00 AM – 12:30 PM/);
  assert.equal(card.attendance.rate, 50);
  assert.equal(selectStudentCourses(store.getState())[1].attendance.rate, null);
});

test("invalid schedule fields yield a clean fallback instead of malformed punctuation", () => {
  const valid = { days: [3, 1], startTime: "10:00", endTime: "12:00" };
  assert.equal(courseScheduleLabel(valid), "Mon & Wed · 10:00 AM – 12:00 PM");
  for (const patch of [
    { days: [] },
    { days: [9] },
    { startTime: "" },
    { endTime: "bad" },
    { endTime: "09:00" },
  ])
    assert.equal(
      courseScheduleLabel({ ...valid, ...patch }),
      "Schedule not available",
    );
});

test("empty/unlinked enrollments and refreshed shared records remain synchronized", () => {
  const store = create();
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  const unsubscribe = persistDemoState(store, storage);
  store.dispatch(studentUpdated({ id: "student-demo-1", subjects: "" }));
  const restored = configureStore({
    reducer,
    preloadedState: loadDemoState(storage),
  });
  assert.deepEqual(selectStudentCourses(restored.getState()), []);
  assert.equal(selectStudentDashboard(restored.getState()).courses.length, 0);
  store.dispatch(
    demoLoggedIn({ role: "student", email: "unlinked@example.com" }),
  );
  assert.deepEqual(selectStudentCourses(store.getState()), []);
  unsubscribe();
});
