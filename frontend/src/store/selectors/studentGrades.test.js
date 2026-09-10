import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import auth, { demoLoggedIn } from '../Slices/authSlice.js';
import students, { studentUpdated } from '../Slices/studentsSlice.js';
import timetable from '../Slices/timetableSlice.js';
import studentAttendance from '../Slices/studentAttendanceSlice.js';
import results, { resultSaved } from '../Slices/resultsSlice.js';
import exams from '../Slices/examsSlice.js';
import { selectStudentGrades } from './studentGrades.js';
import { selectStudentDashboard } from './studentDashboard.js';
import { loadDemoState, persistDemoState } from '../persistence.js';

const reducer = { auth, students, timetable, studentAttendance, results, exams };
const create = () => { const store = configureStore({ reducer }); store.dispatch(demoLoggedIn({ role: 'student', email: 'ali.raza@nust.edu.pk' })); return store; };
const save = (store, extra = {}) => store.dispatch(resultSaved({ studentId: 'student-demo-1', examId: store.getState().exams.records[0].id, academicYear: '2025 - 2026', semester: 'Fall 2025', score: 0, totalMarks: 100, grade: 'F', gpa: 0, courseCode: '', remarks: '', ...extra }));
test('results are personal, joined to actual exams and grouped by academic year and semester', () => {
  const store = create();
  save(store); save(store, { studentId: 'student-demo-2' }); save(store, { examId: 'missing' }); save(store, { semester: 'Fall 2026', academicYear: '2026 - 2027' });
  const view = selectStudentGrades(store.getState());
  assert.equal(view.periods.length, 2);
  assert.equal(view.periods[0].semester, 'Fall 2026');
  assert.equal(view.periods[1].rows.length, 1);
  assert.equal(view.periods[1].rows[0].gpa, 0);
  assert.equal(view.periods[1].rows[0].score, 0);
});
test('CGPA stays synchronized without averaging exam awards; shared result corrections remain live', () => {
  const store = create(); save(store, { gpa: 4 });
  assert.equal(selectStudentGrades(store.getState()).cgpa, null);
  store.dispatch(studentUpdated({ id: 'student-demo-1', cgpa: 3.65 }));
  assert.equal(selectStudentGrades(store.getState()).cgpa, selectStudentDashboard(store.getState()).cgpa);
  save(store, { score: 92, grade: 'A+', gpa: 4, remarks: 'Recorded feedback' });
  assert.equal(selectStudentGrades(store.getState()).periods[0].rows[0].remarks, 'Recorded feedback');
  assert.equal(selectStudentGrades(store.getState()).cgpa, 3.65);
});
test('empty/unlinked accounts expose no awards; centralized persistence restores results', () => {
  const store = create(); assert.deepEqual(selectStudentGrades(store.getState()).periods, []);
  const data = new Map(); const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const unsubscribe = persistDemoState(store, storage); save(store);
  const restored = configureStore({ reducer, preloadedState: loadDemoState(storage) });
  assert.equal(selectStudentGrades(restored.getState()).periods[0].rows[0].score, 0);
  store.dispatch(demoLoggedIn({ role: 'student', email: 'unknown@example.com' }));
  assert.equal(selectStudentGrades(store.getState()).student, null);
  assert.deepEqual(selectStudentGrades(store.getState()).periods, []);
  unsubscribe();
});
