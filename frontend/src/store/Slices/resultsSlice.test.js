import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import students, { studentUpdated } from './studentsSlice.js';
import exams, { updateExam } from './examsSlice.js';
import results, { resultSaved, selectJoinedResults } from './resultsSlice.js';
import { loadDemoState, persistDemoState, storageKeys } from '../persistence.js';
import { averageGpa, percentage, filterResults, resultsAnalytics, resultsExport, validateResult } from '../../Admins/Campus Admin/Results/resultsData.js';

const storageFor = () => { const map = new Map(); return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }; };
const create = (storage = storageFor()) => { const store = configureStore({ reducer: { students, exams, results }, preloadedState: loadDemoState(storage) }); persistDemoState(store, storage); return store; };
const sample = { studentId: 'student-demo-1', examId: 'exam-1', academicYear: '2025–2026', semester: 'Fall 2025', score: 46, totalMarks: 50, grade: 'Recorded Grade', gpa: 3.7, remarks: 'Instructor supplied remark', courseCode: 'CS-444' };

test('results add/edit persist across store recreation with stable IDs and real activity metadata', () => {
  const storage = storageFor(); let store = create(storage);
  const before = Date.now(); store.dispatch(resultSaved(sample));
  store = create(storage);
  const record = store.getState().results.records[0];
  assert.equal(record.score, 46);
  assert.ok(Date.parse(record.createdAt) >= before);
  store.dispatch(resultSaved({ ...record, score: 40, grade: 'Revised', gpa: 2.9, remarks: 'Updated remark' }));
  store = create(storage);
  const updated = store.getState().results.records[0];
  assert.equal(updated.id, record.id);
  assert.equal(updated.createdAt, record.createdAt);
  assert.equal(updated.gpa, 2.9);
  assert.equal(updated.remarks, 'Updated remark');
  store.dispatch(resultSaved({ ...sample, score: 41 }));
  assert.equal(store.getState().results.records.length, 1);
  assert.equal(store.getState().results.records[0].id, record.id);
});
test('student and exam identity are derived from current shared Redux records', () => {
  const store = create(); store.dispatch(resultSaved(sample));
  store.dispatch(studentUpdated({ ...store.getState().students.records[0], name: 'Updated Student' }));
  store.dispatch(updateExam({ ...store.getState().exams.records[0], subject: 'Updated Subject' }));
  const row = selectJoinedResults(store.getState())[0];
  assert.equal(row.student.name, 'Updated Student');
  assert.equal(row.exam.subject, 'Updated Subject');
  assert.equal(store.getState().results.records[0].student, undefined);
  assert.equal(store.getState().results.records[0].exam, undefined);
});
test('percentages respect total marks; numeric GPA averaging never maps score to grade', () => {
  assert.equal(percentage(sample), 92);
  assert.equal(percentage({ score: 10, totalMarks: 0 }), null);
  assert.equal(percentage({ score: 10, totalMarks: null }), null);
  assert.equal(averageGpa([{ gpa: 0 }, { gpa: 4 }, { gpa: null }, { gpa: NaN }]), 2);
  assert.equal(averageGpa([{ gpa: null }]), null);
  const store = create(); store.dispatch(resultSaved({ ...sample, grade: '', gpa: null }));
  assert.equal(store.getState().results.records[0].grade, '');
  assert.equal(store.getState().results.records[0].gpa, null);
});
test('academic filters consistently drive distinct students, trends, distribution and export', () => {
  const store = create();
  store.dispatch(resultSaved(sample));
  store.dispatch(resultSaved({ ...sample, examId: 'exam-2', gpa: 3.3 }));
  store.dispatch(resultSaved({ ...sample, studentId: 'student-demo-2', semester: 'Spring 2026', grade: 'Another Grade', gpa: 2 }));
  const rows = selectJoinedResults(store.getState());
  const analytics = resultsAnalytics(rows);
  assert.equal(analytics.students, 2);
  assert.equal(analytics.trend.length, 2);
  assert.equal(analytics.grades.reduce((total, grade) => total + grade.value, 0), 3);
  assert.equal(analytics.passRate, undefined);
  assert.equal(analytics.honorRoll, undefined);
  const filtered = filterResults(rows, { academicYear: sample.academicYear, semester: 'Fall 2025', grade: 'Recorded Grade', gpa: '3.7', course: rows[0].exam.subject, studentId: sample.studentId, search: rows[0].student.roll.toUpperCase() });
  assert.equal(filtered.length, 1);
  assert.equal(resultsAnalytics(filtered).average, 3.7);
  assert.equal(resultsExport(filtered).rows[0][8], '92.00');
  assert.equal(filterResults(rows, { semester: 'Missing' }).length, 0);
  assert.equal(resultsAnalytics([]).average, null);
  assert.deepEqual(resultsAnalytics([]).grades, []);
});
test('validation and persistence reject malformed data, duplicate IDs/keys and preserve empty state', () => {
  for (const patch of [{ totalMarks: 0 }, { score: -1 }, { score: 51 }, { gpa: -1 }, { gpa: Infinity }, { academicYear: ' ' }, { studentId: '' }]) assert.ok(validateResult({ ...sample, ...patch }));
  assert.equal(validateResult({ ...sample, grade: '', gpa: null }), '');
  const seed = { ...sample, id: 'a', createdAt: '2026-09-07T12:00:00.000Z', updatedAt: '2026-09-07T12:00:00.000Z' };
  for (const text of ['bad-json', JSON.stringify({ version: 2, records: [] }), JSON.stringify({ version: 1, records: [{ ...seed, updatedAt: 'bad-date' }] }), JSON.stringify({ version: 1, records: [seed, { ...seed, id: 'b' }] }), JSON.stringify({ version: 1, records: [seed, seed] })]) {
    const storage = storageFor(); storage.setItem(storageKeys.results, text);
    assert.deepEqual(create(storage).getState().results.records, []);
  }
  const storage = storageFor(); create(storage);
  assert.deepEqual(create(storage).getState().results.records, []);
});
test('editing cannot replace a different result with the same identity and academic period', () => {
  const store = create(); store.dispatch(resultSaved(sample)); store.dispatch(resultSaved({ ...sample, examId: 'exam-2' }));
  const before = store.getState().results.records;
  store.dispatch(resultSaved({ ...before[0], examId: 'exam-2' }));
  assert.deepEqual(store.getState().results.records, before);
});
