import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import auth, { demoLoggedIn } from '../Slices/authSlice.js';
import students from '../Slices/studentsSlice.js';
import timetable from '../Slices/timetableSlice.js';
import faculty from '../Slices/facultySlice.js';
import results from '../Slices/resultsSlice.js';
import studentAttendance, { studentAttendanceMarked } from '../Slices/studentAttendanceSlice.js';
import { selectStudentAttendancePage } from './studentAttendance.js';
import { selectStudentDashboard } from './studentDashboard.js';
import { selectStudentCourses } from './studentCourses.js';
import { loadDemoState, persistDemoState } from '../persistence.js';

const reducer = { auth, students, timetable, faculty, results, studentAttendance };
const create = () => { const store = configureStore({ reducer }); store.dispatch(demoLoggedIn({ role: 'student', email: 'ali.raza@nust.edu.pk' })); return store; };
const mark = (store, date, status, extra = {}) => store.dispatch(studentAttendanceMarked({ studentId: 'student-demo-1', classId: 'schedule-1', date, status, ...extra }));

test('empty and unlinked attendance never becomes a fabricated rate or record', () => {
  const store = create();
  let view = selectStudentAttendancePage(store.getState());
  assert.equal(view.attendance.rate, null);
  assert.equal(view.attendance.present, 0);
  assert.equal(view.rows.length, 0);
  assert.equal(view.courses.length, 3);
  assert.ok(view.courses.every((course) => course.attendance.rate === null));
  store.dispatch(demoLoggedIn({ role: 'student', email: 'unknown@example.com' }));
  view = selectStudentAttendancePage(store.getState());
  assert.equal(view.student, null);
  assert.equal(view.attendance, null);
  assert.deepEqual(view.rows, []);
  assert.deepEqual(view.courses, []);
});

test('shared marking and corrections update page, dashboard and courses with one calculation', () => {
  const store = create();
  mark(store, '2026-09-02', 'Present');
  mark(store, '2026-09-01', 'Absent');
  mark(store, '2026-09-03', 'Present', { studentId: 'student-demo-2' });
  mark(store, '2026-09-04', 'Present', { classId: 'missing' });
  let view = selectStudentAttendancePage(store.getState());
  assert.equal(view.rows.length, 2);
  assert.deepEqual(view.rows.map((row) => row.date), ['2026-09-02', '2026-09-01']);
  assert.equal(view.attendance.rate, 50);
  assert.equal(view.absent, 1);
  assert.equal(view.attendance, selectStudentDashboard(store.getState()).attendance);
  assert.equal(view.courses, selectStudentCourses(store.getState()));
  assert.equal(view.courses[0].attendance.rate, 50);
  assert.equal(view.courses[1].attendance.rate, null);
  mark(store, '2026-09-01', 'Present');
  view = selectStudentAttendancePage(store.getState());
  assert.equal(view.attendance.rate, 100);
  assert.equal(view.courses[0].attendance.rate, 100);
  assert.equal(view.absent, 0);
});

test('Late and On Leave retain existing pending-policy behavior while counts remain visible', () => {
  const store = create();
  mark(store, '2026-09-01', 'Present');
  mark(store, '2026-09-02', 'Late');
  mark(store, '2026-09-03', 'On Leave');
  const view = selectStudentAttendancePage(store.getState());
  assert.equal(view.late, 1);
  assert.equal(view.leave, 1);
  assert.equal(view.attendance.present, 1);
  assert.equal(view.attendance.marked, 3);
  assert.equal(view.attendance.rate, null);
  assert.equal(view.courses[0].attendance.rate, null);
  assert.equal(view.attendance.policyPending, true);
});

test('existing centralized persistence restores the same history and course percentages', () => {
  const store = create(); const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const unsubscribe = persistDemoState(store, storage);
  mark(store, '2026-09-01', 'Absent');
  const restored = configureStore({ reducer, preloadedState: loadDemoState(storage) });
  const view = selectStudentAttendancePage(restored.getState());
  assert.equal(view.attendance.rate, 0);
  assert.equal(view.absent, 1);
  assert.equal(view.courses[0].attendance.rate, 0);
  assert.equal(view.rows.length, 1);
  unsubscribe();
});
