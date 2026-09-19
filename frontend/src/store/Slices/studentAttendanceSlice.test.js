import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import students, { studentAdded, studentUpdated } from './studentsSlice.js';
import timetable, { classScheduled, classUpdated } from './timetableSlice.js';
import studentAttendance, { studentAttendanceMarked } from './studentAttendanceSlice.js';
import { loadDemoState, persistDemoState, storageKeys } from '../persistence.js';
import { dailyStudentRows, recordedStudentRows, filterStudentAttendance, studentAttendanceSummary, studentAttendanceExport } from '../../Admins/Campus Admin/Attendance/Students/studentAttendanceData.js';
import { paginateStudents } from '../../Admins/Campus Admin/Students/studentData.js';

const memory = () => { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
const defaultStudent = { id: 'student-demo-1', name: 'Demo Student', roll: 'CS-001', program: 'BS Computer Science', section: 'CS-4A' };
const defaultSchedule = { id: 'schedule-1', program: 'BS Computer Science', section: 'CS-4A', days: [1], startTime: '08:30', endTime: '10:00', room: 'Lab 302', instructor: 'Dr. Usman Khan', subject: 'Data Structures' };
const create = (storage = memory()) => {
  const store = configureStore({
    reducer: { students, timetable, studentAttendance },
    preloadedState: {
      students: { records: [defaultStudent] },
      timetable: { records: [defaultSchedule] },
      ...loadDemoState(storage),
    },
  });
  persistDemoState(store, storage);
  return store;
};
const record = { studentId: 'student-demo-1', classId: 'schedule-1', date: '2026-09-07', status: 'Absent' };

test('student attendance absent/present/history survives refresh and updates by session key', () => {
  const storage = memory(); let store = create(storage);
  store.dispatch(studentAttendanceMarked(record));
  store = create(storage);
  const id = store.getState().studentAttendance.records[0].id;
  assert.equal(store.getState().studentAttendance.records[0].status, 'Absent');
  store.dispatch(studentAttendanceMarked({ ...record, status: 'Present' }));
  store = create(storage);
  assert.equal(store.getState().studentAttendance.records.length, 1);
  assert.equal(store.getState().studentAttendance.records[0].id, id);
  assert.equal(store.getState().studentAttendance.records[0].status, 'Present');
  store.dispatch(studentAttendanceMarked({ ...record, date: '2026-08-03', status: 'On Leave' }));
  store = create(storage);
  assert.equal(store.getState().studentAttendance.records.length, 2);
  assert.equal(store.getState().studentAttendance.records[1].status, 'On Leave');
  assert.deepEqual(Object.keys(store.getState().studentAttendance.records[0]).sort(), ['classId', 'date', 'id', 'status', 'studentId']);
});
test('optional timetable matching adds only unmarked program/section/weekday rows', () => {
  const store = create();
  const people = store.getState().students.records, classes = store.getState().timetable.records;
  const matched = dailyStudentRows([], people, classes, '2026-09-07', true);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].student.id, 'student-demo-1');
  assert.equal(matched[0].record, undefined);
  assert.equal(dailyStudentRows([], people, classes, '2026-09-08', true).length, 0);
  assert.equal(dailyStudentRows([], people, classes, '2026-09-07', false).length, 0);
  const saved = dailyStudentRows([{ ...record, id: 'a' }], people, classes, '2026-09-07', true);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].record.status, 'Absent');
});
test('student and class identity edits are reflected without duplicating objects', () => {
  const store = create();
  store.dispatch(studentAttendanceMarked(record));
  store.dispatch(studentUpdated({ ...store.getState().students.records[0], name: 'Updated Student', section: 'CS-NEW' }));
  store.dispatch(classUpdated({ ...store.getState().timetable.records[0], subject: 'Updated Subject', room: 'Updated Room', days: [5] }));
  const { students: people, timetable: classes, studentAttendance: log } = store.getState();
  const rows = recordedStudentRows(log.records, people.records, classes.records);
  assert.equal(rows[0].student.name, 'Updated Student');
  assert.equal(rows[0].session.room, 'Updated Room');
  assert.equal(dailyStudentRows(log.records, people.records, classes.records, record.date, true).length, 1);
  store.dispatch(studentAdded({ ...people.records[0], name: 'New Student' }));
  store.dispatch(classScheduled({ ...classes.records[0], section: 'CS-NEW', days: [1] }));
  assert.ok(dailyStudentRows([], store.getState().students.records, store.getState().timetable.records, record.date, true).some((row) => row.student.name === 'New Student'));
});
test('filters and CSV reflect actual student/session/date/status values across history', () => {
  const store = create();
  const rows = recordedStudentRows([{ ...record, id: 'a' }, { ...record, id: 'b', date: '2026-09-09', status: 'Present' }], store.getState().students.records, store.getState().timetable.records);
  const student = rows[0].student;
  for (const search of [student.name.toUpperCase(), student.roll, student.program]) assert.equal(filterStudentAttendance(rows, { search }).length, 2);
  const filtered = filterStudentAttendance(rows, { program: student.program, section: student.section, subject: rows[0].session.subject, status: 'Present', studentId: student.id, from: '2026-09-09', to: '2026-09-09' });
  assert.equal(filtered.length, 1);
  assert.equal(studentAttendanceExport(filtered).rows[0].at(-1), 'Present');
  assert.equal(studentAttendanceExport(filtered).rows[0][6], '2026-09-09');
  for (const field of ['program', 'section', 'subject', 'status', 'studentId']) assert.equal(filterStudentAttendance(rows, { [field]: 'missing' }).length, 0);
});
test('summary formulas exclude unmarked sessions and distinct students are counted once', () => {
  const student = { id: 'a' };
  const rows = ['Present', 'Absent', 'Late', 'On Leave'].map((status) => ({ student, record: { status } }));
  rows.push({ student });
  assert.equal(studentAttendanceSummary(rows, 'present-only').rate, 25);
  assert.equal(studentAttendanceSummary(rows, 'include-late-exclude-leave').rate, (2 / 3) * 100);
  assert.equal(studentAttendanceSummary(rows, 'present-only').total, 1);
  assert.equal(studentAttendanceSummary([{ student }], 'present-only').rate, null);
  assert.equal(studentAttendanceSummary([], 'present-only').total, 0);
});
test('malformed saved records and duplicate composite keys fall back safely', () => {
  for (const records of [[{ ...record, id: 'a', date: '2026-02-30' }], [{ ...record, id: 'a', status: 'Unknown' }], [{ ...record, id: 'a', classId: '' }], [{ ...record, id: 'a' }, { ...record, id: 'b' }]]) {
    const storage = memory(); storage.setItem(storageKeys.studentAttendance, JSON.stringify({ version: 1, records }));
    assert.deepEqual(create(storage).getState().studentAttendance.records, []);
  }
  const storage = memory(); storage.setItem(storageKeys.studentAttendance, 'invalid json');
  assert.deepEqual(create(storage).getState().studentAttendance.records, []);
});
test('pagination clamps after status filtering and supports page-size changes', () => {
  const rows = Array.from({ length: 21 }, (_, i) => i);
  assert.equal(paginateStudents(rows, 3, 10).records.length, 1);
  assert.equal(paginateStudents(rows.slice(0, 1), 3, 10).currentPage, 1);
  assert.equal(paginateStudents(rows, 1, 25).records.length, 21);
});
