import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import reducer, { studentAdded, studentUpdated, studentDeleted, selectStudents } from './studentsSlice.js';
import { filterStudents, paginateStudents, studentStatuses } from '../../components/students/studentData.js';

const makeStore = () => configureStore({ reducer: { students: reducer } });
const values = { name: 'Test Student', roll: 'TEST-1', email: 'test@example.com', studentPhone: '', program: 'BS Computer Science', section: 'CS-4A', semester: '4th Semester', subjects: 'Data Structures', campus: 'NUST Main Campus (H-12)', status: 'Active', guardian: '', guardianPhone: '' };

test('add creates stable IDs and keeps optional fields blank', () => {
  const store = makeStore();
  store.dispatch(studentAdded(values));
  store.dispatch(studentAdded(values));
  const records = selectStudents(store.getState());
  assert.equal(records.length, 4);
  assert.notEqual(records[2].id, records[3].id);
  assert.equal(records[2].initials, 'TS');
  assert.equal(records[2].guardianPhone, '');
});

test('edit preserves hidden campus, guardian contact, and other existing properties', () => {
  const store = makeStore();
  const [original, other] = selectStudents(store.getState());
  store.dispatch(studentUpdated({ id: original.id, name: 'Changed Name', roll: 'NEW-ROLL', email: 'changed@example.com', status: 'Graduated' }));
  const [updated, untouched] = selectStudents(store.getState());
  assert.equal(updated.campus, original.campus);
  assert.equal(updated.guardianPhone, original.guardianPhone);
  assert.equal(updated.studentPhone, original.studentPhone);
  assert.equal(updated.id, original.id);
  assert.equal(updated.initials, 'CN');
  assert.equal(updated.roll, 'NEW-ROLL');
  assert.deepEqual(untouched, other);
});

test('delete affects only selected ID and supports empty collections', () => {
  const store = makeStore();
  const [first, second] = selectStudents(store.getState());
  store.dispatch(studentDeleted(first.id));
  assert.deepEqual(selectStudents(store.getState()), [second]);
  store.dispatch(studentDeleted(second.id));
  assert.deepEqual(selectStudents(store.getState()), []);
});

test('search and all approved statuses operate on current CRUD state', () => {
  const store = makeStore();
  for (const status of studentStatuses) store.dispatch(studentAdded({ ...values, name: `Sample ${status}`, status }));
  for (const status of studentStatuses) {
    const filtered = filterStudents(selectStudents(store.getState()), { search: ' SAMPLE ', program: 'BS Computer Science', status });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].status, status);
  }
  assert.equal(filterStudents(selectStudents(store.getState()), { search: 'NUST-CS-2023-042', program: '', status: '' }).length, 1);
  assert.equal(filterStudents(selectStudents(store.getState()), { search: 'computer science', program: '', status: '' }).length, 6);
  assert.equal(filterStudents(selectStudents(store.getState()), { search: 'missing', program: '', status: '' }).length, 0);
});

test('pagination clamps after deletion/filtering and reacts to page size', () => {
  const rows = Array.from({ length: 26 }, (_, id) => ({ id }));
  assert.equal(paginateStudents(rows, 3, 10).records.length, 6);
  assert.equal(paginateStudents(rows, 3, 25).currentPage, 2);
  assert.equal(paginateStudents(rows, 3, 25).records.length, 1);
  assert.equal(paginateStudents(rows.slice(0, 10), 3, 10).currentPage, 1);
  assert.deepEqual(paginateStudents([], 3, 10), { pageCount: 1, currentPage: 1, start: 0, records: [] });
});

test('unknown IDs leave state unchanged', () => {
  const store = makeStore();
  const before = selectStudents(store.getState());
  store.dispatch(studentUpdated({ id: 'missing', name: 'Missing' }));
  store.dispatch(studentDeleted('missing'));
  assert.deepEqual(selectStudents(store.getState()), before);
});
