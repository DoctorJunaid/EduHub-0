import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import auth, { demoLoggedIn } from "../Slices/authSlice.js";
import students, { studentUpdated } from "../Slices/studentsSlice.js";
import timetable, { classUpdated } from "../Slices/timetableSlice.js";
import faculty from "../Slices/facultySlice.js";
import studentAttendance from "../Slices/studentAttendanceSlice.js";
import results from "../Slices/resultsSlice.js";
import assignments, {
  submissionsReducer as submissions,
} from "../Slices/assignmentsSlice.js";
import diary, { validDiaryRecords } from "../Slices/diarySlice.js";
import {
  selectStudentDiary,
  filterDiaryBySubject,
  diaryEntriesForDate,
} from "./studentDiary.js";
import { loadDemoState, persistDemoState } from "../persistence.js";

const reducer = {
  auth,
  students,
  timetable,
  faculty,
  studentAttendance,
  results,
  assignments,
  submissions,
  diary,
};
const entry = {
  id: "note-1",
  classId: "schedule-1",
  title: "Lecture topic",
  date: "2026-09-10",
  recap: "Lecture recap",
  homework: "Practice notes",
  resources: "Reading notes",
};
const create = (records = [entry], tasks = []) => {
  const store = configureStore({
    reducer,
    preloadedState: { diary: { records }, assignments: { records: tasks } },
  });
  store.dispatch(
    demoLoggedIn({ role: "student", email: "ali.raza@nust.edu.pk" }),
  );
  return store;
};
test("diary uses enrolled classes and section, excludes orphan entries and unlinked accounts", () => {
  const store = create([
    entry,
    { ...entry, id: "other", classId: "schedule-2" },
    { ...entry, id: "orphan", classId: "missing" },
  ]);
  assert.equal(selectStudentDiary(store.getState()).length, 1);
  store.dispatch(studentUpdated({ id: "student-demo-1", subjects: "" }));
  assert.deepEqual(selectStudentDiary(store.getState()), []);
  store.dispatch(
    demoLoggedIn({ role: "student", email: "unknown@example.com" }),
  );
  assert.deepEqual(selectStudentDiary(store.getState()), []);
  assert.deepEqual(selectStudentDiary(create([]).getState()), []);
});
test("filter resets to all without mutation, dates sort newest first and today uses the same entries", () => {
  const store = create([{ ...entry, id: "old", date: "2026-09-01" }, entry]);
  const rows = selectStudentDiary(store.getState());
  assert.deepEqual(
    rows.map((row) => row.id),
    ["note-1", "old"],
  );
  assert.equal(filterDiaryBySubject(rows, "").length, 2);
  assert.equal(filterDiaryBySubject(rows, "Advanced Web Design").length, 2);
  assert.deepEqual(filterDiaryBySubject(rows, "AI"), []);
  assert.equal(diaryEntriesForDate(rows, "2026-09-10")[0], rows[0]);
  assert.deepEqual(
    store.getState().diary.records.map((row) => row.id),
    ["old", "note-1"],
  );
});
test("instructor and assignment references resolve from shared data, never from copied records", () => {
  const task = {
    id: "task-1",
    classId: "schedule-1",
    title: "Shared assignment",
    dueDate: "2026-09-12",
    totalMarks: 20,
  };
  const store = create([{ ...entry, assignmentId: "task-1" }], [task]);
  store.dispatch(
    classUpdated({ id: "schedule-1", instructor: "Updated Instructor" }),
  );
  const row = selectStudentDiary(store.getState())[0];
  assert.equal(row.instructor, "Updated Instructor");
  assert.equal(row.assignment.title, "Shared assignment");
  assert.equal(store.getState().assignments.records.length, 1);
  assert.equal(
    selectStudentDiary(
      create([{ ...entry, assignmentId: "missing" }]).getState(),
    )[0].assignment,
    undefined,
  );
  assert.equal(
    selectStudentDiary(
      create(
        [{ ...entry, assignmentId: "task-1" }],
        [{ ...task, classId: "schedule-2" }],
      ).getState(),
    )[0].assignment,
    undefined,
  );
});
test("centralized persistence retains diary and rejects invalid dates, duplicates and malformed content", () => {
  const store = create();
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  const unsubscribe = persistDemoState(store, storage);
  const restored = configureStore({
    reducer,
    preloadedState: loadDemoState(storage),
  });
  assert.deepEqual(
    selectStudentDiary(restored.getState()),
    selectStudentDiary(store.getState()),
  );
  assert.equal(validDiaryRecords([entry, entry]), false);
  assert.equal(validDiaryRecords([{ ...entry, date: "2026-02-30" }]), false);
  assert.equal(validDiaryRecords([{ ...entry, resources: {} }]), false);
  assert.equal(
    validDiaryRecords([
      {
        id: "minimal",
        classId: "schedule-1",
        date: "2026-09-10",
        title: "Topic",
      },
    ]),
    true,
  );
  unsubscribe();
});
