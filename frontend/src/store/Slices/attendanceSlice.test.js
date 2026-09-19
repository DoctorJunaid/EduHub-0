import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import attendance, { attendanceSaved, selectAttendanceSummary } from './attendanceSlice.js';
import faculty, { facultyAdded, facultyUpdated, facultyDeleted } from './facultySlice.js';
import { loadDemoState, persistDemoState, storageKeys } from '../persistence.js';
import { attendanceRows, weeklySummary, attendanceExport, validateAttendance } from '../../Admins/Campus Admin/Attendance/attendanceData.js';
import { toCsv } from '../../lib/csv.js';
import { dateKey, parseDate, validDate } from '../../lib/dates.js';
import { mondayOf, shiftDays } from '../../lib/schedule.js';

const storageFor = () => { const map = new Map(); return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }; };
const create = (storage = storageFor()) => { const store = configureStore({ reducer: { faculty, attendance }, preloadedState: loadDemoState(storage) }); persistDemoState(store, storage); return store; };
const sample = { facultyId: 'faculty-demo-1', date: '2026-09-07', checkInTime: '08:45', checkOutTime: '', status: 'Present' };

const sampleFaculty = {
  id: 'faculty-demo-1',
  name: 'Demo Teacher',
  email: 'demo@eduhub.com',
  designation: 'Lecturer',
  qualification: 'M.Sc',
  department: 'General',
  phone: '+923001234567',
  subjects: 'Math',
  campus: 'Main',
  status: 'Active',
  initials: 'DT'
};

test('attendance create, checkout and status survive refresh without duplicated identities', () => {
  const storage = storageFor(); let store = create(storage);
  store.dispatch(facultyAdded(sampleFaculty));
  store.dispatch(attendanceSaved(sample));
  store = create(storage);
  let record = store.getState().attendance.records[0];
  assert.equal(record.checkInTime, '08:45');
  assert.equal(record.checkOutTime, '');
  assert.equal(record.name, undefined);
  store.dispatch(attendanceSaved({ ...record, checkOutTime: '17:00', status: 'Late' }));
  store = create(storage);
  record = store.getState().attendance.records[0];
  assert.equal(record.checkOutTime, '17:00');
  assert.equal(record.status, 'Late');
  assert.deepEqual(selectAttendanceSummary(store.getState(), sample.date), { total: 1, Present: 0, Late: 1, Absent: 0, 'On Leave': 0 });
  store.dispatch(attendanceSaved({ ...sample, status: 'On Leave', checkInTime: '' }));
  assert.equal(store.getState().attendance.records.length, 1);
  assert.equal(store.getState().attendance.records[0].id, record.id);
});
test('faculty additions and edits flow into attendance; missing records are not absences', () => {
  const store = create();
  store.dispatch(facultyAdded({ ...sampleFaculty, name: 'Original Teacher', department: 'Original Department' }));
  const original = store.getState().faculty.records[0];
  store.dispatch(attendanceSaved(sample));
  store.dispatch(facultyUpdated({ ...original, name: 'Updated Teacher', department: 'Updated Department' }));
  store.dispatch(facultyAdded({ ...original, id: 'faculty-demo-2', name: 'New Teacher' }));
  let { faculty: people, attendance: log } = store.getState();
  const rows = attendanceRows(log.records, people.records, sample.date, 'daily', {});
  assert.equal(rows.length, 2);
  assert.equal(rows[0].person.name, 'Updated Teacher');
  assert.equal(rows[1].record, undefined);
  assert.equal(selectAttendanceSummary(store.getState(), sample.date).Absent, 0);
  store.dispatch(facultyDeleted(original.id));
  ({ faculty: people, attendance: log } = store.getState());
  assert.equal(log.records.length, 1); // Preserve historical source records without inventing a deletion policy.
  assert.equal(attendanceRows(log.records, people.records, sample.date, 'history', {}).length, 0);
});
test('daily, weekly and history derive one dataset and combine search/date/status filters', () => {
  const people = [{ id: 'a', name: 'Ada', email: 'ada@example.test', department: 'Science' }];
  const records = [
    { ...sample, id: '1', facultyId: 'a', date: '2026-09-07' },
    { ...sample, id: '2', facultyId: 'a', date: '2026-09-08', status: 'Late' },
    { ...sample, id: '3', facultyId: 'a', date: '2026-09-13', status: 'On Leave' },
    { ...sample, id: '4', facultyId: 'a', date: '2026-09-14', status: 'Absent' },
  ];
  const weekly = attendanceRows(records, people, sample.date, 'weekly', {});
  assert.equal(weekly.length, 3);
  assert.deepEqual(weeklySummary(weekly, people, '')[0].counts, { Present: 1, Late: 1, Absent: 0, 'On Leave': 1 });
  const report = attendanceExport(weeklySummary(weekly, people, ''), true, ['2026-09-07', '2026-09-13']);
  assert.deepEqual(report.rows[0].slice(3, 5), ['2026-09-07', '2026-09-13']);
  const filtered = attendanceRows(records, people, sample.date, 'history', { search: ' ADA@ ', department: 'Science', status: 'Late', facultyId: 'a', from: '2026-09-08', to: '2026-09-08' });
  assert.equal(filtered.length, 1);
  assert.equal(attendanceExport(filtered).rows[0].at(-1), 'Late');
  assert.equal(attendanceRows(records, people, sample.date, 'daily', { status: 'Late' }).length, 0);
  assert.equal(attendanceRows(records, people, sample.date, 'weekly', { department: 'Other' }).length, 0);
  assert.equal(weeklySummary([], people, '')[0].counts.Present, 0);
});
test('invalid persisted data falls back safely and empty attendance remains empty', () => {
  const invalidRecords = [{ ...sample, id: 'a', date: '2026-02-30' }, { ...sample, id: 'a', status: 'Automatic' }, { ...sample, id: 'a', checkInTime: '30:00' }, { ...sample, id: 'a', checkOutTime: '07:00' }];
  const valid = { ...sample, id: 'a' };
  for (const stored of ['broken', JSON.stringify({ version: 2, records: [valid] }), ...invalidRecords.map((record) => JSON.stringify({ version: 1, records: [record] })), JSON.stringify({ version: 1, records: [valid, { ...valid, id: 'b' }] })]) {
    const storage = storageFor(); storage.setItem(storageKeys.attendance, stored);
    assert.deepEqual(create(storage).getState().attendance.records, []);
  }
  const storage = storageFor(); create(storage);
  assert.deepEqual(create(storage).getState().attendance.records, []);
});
test('manual times/status validation does not infer lateness and cannot overwrite another day record', () => {
  assert.equal(validateAttendance({ ...sample, checkInTime: '15:00', status: 'Present' }), '');
  assert.equal(validateAttendance({ ...sample, checkInTime: '', status: 'Absent' }), '');
  assert.ok(validateAttendance({ ...sample, checkInTime: '', checkOutTime: '17:00' }));
  const store = create();
  store.dispatch(attendanceSaved(sample));
  store.dispatch(attendanceSaved({ ...sample, date: '2026-09-08' }));
  const before = store.getState().attendance.records;
  store.dispatch(attendanceSaved({ ...before[0], date: '2026-09-08' }));
  assert.deepEqual(store.getState().attendance.records, before);
});
test('local date boundaries and CSV escaping are correct', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(dateKey(shiftDays(parseDate('2026-12-31'), 1)), '2027-01-01');
  assert.equal(dateKey(mondayOf(parseDate('2027-01-01'))), '2026-12-28');
  assert.equal(toCsv(['Name'], [['Doe, "Jane"'], ['=1+1']]), '\uFEFF"Name"\r\n"Doe, ""Jane"""\r\n"\'=1+1"');
});
