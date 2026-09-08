import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import faculty, { facultyAdded, facultyUpdated, facultyDeleted } from './Slices/facultySlice.js';
import students, { studentAdded, studentUpdated, studentDeleted } from './Slices/studentsSlice.js';
import timetable, { classScheduled, classUpdated, classDeleted } from './Slices/timetableSlice.js';
import exams, { addExam, updateExam, deleteExam } from './Slices/examsSlice.js';
import attendance from './Slices/attendanceSlice.js';
import studentAttendance from './Slices/studentAttendanceSlice.js';
import results from './Slices/resultsSlice.js';
import fees from './Slices/feesSlice.js';
import messages from './Slices/messagesSlice.js';
import { loadDemoState, persistDemoState, storageKeys } from './persistence.js';

const memory = () => { const data = new Map(); return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data }; };
const create = (storage) => { const store = configureStore({ reducer: { faculty, students, timetable, exams, attendance, studentAttendance, results, fees, messages }, preloadedState: loadDemoState(storage) }); persistDemoState(store, storage); return store; };

for (const [key, add, update, remove, edit] of [
  ['exams', addExam, updateExam, deleteExam, { subject: 'Changed Exam', examType: 'Final', date: '2026-09-10', totalMarks: 75 }],
  ['faculty', facultyAdded, facultyUpdated, facultyDeleted, { name: 'Changed Teacher' }],
  ['students', studentAdded, studentUpdated, studentDeleted, { name: 'Changed Student' }],
  ['timetable', classScheduled, classUpdated, classDeleted, { subject: 'Changed Class', days: [1, 5], startTime: '08:30', endTime: '09:30' }],
]) {
  test(`${key}: add, edit, delete survive store recreation (refresh)`, () => {
    const storage = memory(); let store = create(storage);
    const original = store.getState()[key].records[0];
    store.dispatch(add({ ...original }));
    const created = store.getState()[key].records.at(-1);
    store = create(storage);
    assert.deepEqual(store.getState()[key].records.at(-1), created);
    store.dispatch(update({ ...created, ...edit }));
    store = create(storage);
    for (const [field, value] of Object.entries(edit)) assert.deepEqual(store.getState()[key].records.find((record) => record.id === created.id)[field], value);
    store.dispatch(remove(created.id));
    store = create(storage);
    assert.equal(store.getState()[key].records.some((record) => record.id === created.id), false);
    assert.equal(store.getState()[key].records.some((record) => record.id === original.id), true);
  });
}

test('empty collections stay empty after refresh; seed records are not resurrected', () => {
  const storage = memory(); const store = create(storage);
  for (const [key, action] of [['faculty', facultyDeleted], ['students', studentDeleted], ['timetable', classDeleted], ['exams', deleteExam]]) {
    for (const record of store.getState()[key].records) store.dispatch(action(record.id));
  }
  const refreshed = create(storage);
  for (const key of Object.keys(storageKeys)) assert.deepEqual(refreshed.getState()[key].records, []);
});

test('invalid JSON, wrong versions, invalid records, and duplicate IDs safely fall back', () => {
  const seed = create(memory()).getState().students.records[0];
  for (const invalid of ['not-json', 'null', '[]', JSON.stringify({ version: 2, records: [] }), JSON.stringify({ version: 1, records: [{}] }), JSON.stringify({ version: 1, records: [seed, seed] }), JSON.stringify({ version: 1, records: [{ ...seed, status: 'Unknown' }] })]) {
    const storage = memory(); storage.setItem(storageKeys.students, invalid);
    storage.setItem(storageKeys.faculty, JSON.stringify({ version: 1, records: [] }));
    const store = create(storage);
    assert.equal(store.getState().students.records.length, 2);
    assert.equal(store.getState().faculty.records.length, 0);
  }
});

test('invalid schedule timing or weekdays cannot crash grid hydration', () => {
  const seed = create(memory()).getState().timetable.records[0];
  for (const patch of [{ days: [8] }, { days: [] }, { startTime: 'broken' }, { startTime: '12:00', endTime: '10:00' }]) {
    const storage = memory(); storage.setItem(storageKeys.timetable, JSON.stringify({ version: 1, records: [{ ...seed, ...patch }] }));
    assert.equal(create(storage).getState().timetable.records.length, 3);
  }
});

test('storage access/quota failures do not stop Redux; only changed collections are written', () => {
  const broken = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  const store = create(broken);
  assert.doesNotThrow(() => store.dispatch(studentDeleted(store.getState().students.records[0].id)));
  const storage = memory(); const writes = []; const write = storage.setItem;
  storage.setItem = (key, value) => { writes.push(key); write(key, value); };
  const healthy = create(storage); writes.length = 0;
  healthy.dispatch({ type: 'unrelated-ui-event' }); assert.deepEqual(writes, []);
  healthy.dispatch(studentDeleted(healthy.getState().students.records[0].id)); assert.deepEqual(writes, [storageKeys.students]);
  for (const value of storage.data.values()) assert.deepEqual(Object.keys(JSON.parse(value)), ['version', 'records']);
});
