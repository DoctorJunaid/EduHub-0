import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import fees, { voucherSaved, voucherMarkedPaid, selectJoinedFees } from './feesSlice.js';
import students, { studentAdded, studentUpdated, studentDeleted } from './studentsSlice.js';
import { loadDemoState, persistDemoState, storageKeys } from '../persistence.js';
import { collectionSummary, filterVouchers, feeExport, validateVoucher } from '../../Admins/Campus Admin/Fees/feeData.js';
import { formatPKR } from '../../lib/currency.js';
import { paginateStudents } from '../../Admins/Campus Admin/Students/studentData.js';

const memory = () => { const map = new Map(); return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }; };
const create = (storage = memory()) => { const store = configureStore({ reducer: { fees, students }, preloadedState: loadDemoState(storage) }); persistDemoState(store, storage); return store; };
const sample = { studentId: 'student-demo-1', voucherNo: 'VCH-001', feeCategory: 'Tuition', semester: 'Fall 2026', amount: 85000, dueDate: '2026-09-15', paymentStatus: 'Pending', paymentDate: '' };

test('voucher add/edit/mark paid and payment-date changes survive refresh', () => {
  const storage = memory(); let store = create(storage);
  store.dispatch(voucherSaved(sample)); store = create(storage);
  const original = store.getState().fees.records[0];
  assert.equal(original.amount, 85000);
  store.dispatch(voucherSaved({ ...original, amount: 90000, feeCategory: 'Updated Fee' })); store = create(storage);
  assert.equal(store.getState().fees.records[0].amount, 90000);
  store.dispatch(voucherMarkedPaid({ id: original.id, paymentDate: '2026-09-10' })); store = create(storage);
  const paid = store.getState().fees.records[0];
  assert.equal(paid.paymentStatus, 'Paid'); assert.equal(paid.paymentDate, '2026-09-10');
  assert.equal(paid.createdAt, original.createdAt);
  store.dispatch(voucherSaved({ ...paid, paymentDate: '2026-09-11' })); store = create(storage);
  assert.equal(store.getState().fees.records[0].paymentDate, '2026-09-11');
  assert.equal(store.getState().fees.records.length, 1);
});
test('mark paid requires an explicit valid date and never changes overdue automatically', () => {
  const store = create(); store.dispatch(voucherSaved({ ...sample, dueDate: '2020-01-01' }));
  const record = store.getState().fees.records[0];
  assert.equal(record.paymentStatus, 'Pending');
  for (const paymentDate of ['', undefined, '2026-02-30']) store.dispatch(voucherMarkedPaid({ id: record.id, paymentDate }));
  assert.equal(store.getState().fees.records[0].paymentStatus, 'Pending');
  store.dispatch(voucherMarkedPaid({ id: record.id, paymentDate: '2026-09-09' }));
  store.dispatch(voucherMarkedPaid({ id: record.id, paymentDate: '2026-09-12' }));
  assert.equal(store.getState().fees.records[0].paymentDate, '2026-09-09');
});
test('collection totals separate Pending and Overdue and guard zero totals', () => {
  const rows = [{ amount: 100000, paymentStatus: 'Paid' }, { amount: 85000, paymentStatus: 'Pending' }, { amount: 15000, paymentStatus: 'Overdue' }];
  assert.deepEqual(collectionSummary(rows), { Paid: 100000, Pending: 85000, Overdue: 15000, total: 200000, rate: 50 });
  assert.equal(collectionSummary([]).rate, 0);
  assert.match(formatPKR(85000), /85,000/);
  assert.match(formatPKR(100.5), /100\.5/);
});
test('student changes are joined and missing students never erase outstanding balances', () => {
  const store = create();
  store.dispatch(studentAdded({ id: 'student-demo-1', name: 'Original Student', roll: '101', program: 'CS' }));
  store.dispatch(voucherSaved(sample));
  const person = store.getState().students.records[0];
  store.dispatch(studentUpdated({ ...person, name: 'Updated Student' }));
  assert.equal(selectJoinedFees(store.getState())[0].student.name, 'Updated Student');
  store.dispatch(studentAdded({ ...person, name: 'New Student' }));
  const added = store.getState().students.records.at(-1);
  store.dispatch(voucherSaved({ ...sample, studentId: added.id, voucherNo: 'VCH-002' }));
  assert.equal(selectJoinedFees(store.getState())[1].student.name, 'New Student');
  store.dispatch(studentDeleted(person.id));
  assert.equal(selectJoinedFees(store.getState())[0].student.name, 'Student unavailable');
  assert.equal(collectionSummary(selectJoinedFees(store.getState())).Pending, 170000);
  assert.equal(store.getState().fees.records[0].student, undefined);
});
test('combined applied filters determine export and pagination results', () => {
  const store = create(); store.dispatch(voucherSaved(sample));
  const rows = selectJoinedFees(store.getState());
  for (const search of [rows[0].student.name.toUpperCase(), 'vch-001', 'tuition']) assert.equal(filterVouchers(rows, { search }).length, 1);
  const filtered = filterVouchers(rows, { search: ' VCH ', feeCategory: 'Tuition', semester: 'Fall 2026', dueDate: '2026-09-15', paymentStatus: 'Pending' });
  assert.equal(filtered.length, 1);
  for (const key of ['feeCategory', 'semester', 'paymentStatus', 'dueDate']) assert.equal(filterVouchers(rows, { [key]: 'missing' }).length, 0);
  assert.deepEqual(feeExport(filtered).rows[0].slice(-2), ['Pending', '']);
  assert.equal(paginateStudents(filtered, 8, 10).currentPage, 1);
  assert.equal(filterVouchers(rows, {}).length, rows.length);
});
test('malformed saved vouchers fall back safely and empty collection remains empty', () => {
  for (const patch of [{ amount: 0 }, { amount: -1 }, { amount: Infinity }, { voucherNo: ' ' }, { dueDate: '2026-02-30' }, { paymentStatus: 'Paid', paymentDate: '' }, { paymentStatus: 'Partial' }]) assert.ok(validateVoucher({ ...sample, ...patch }));
  assert.equal(validateVoucher({ ...sample, semester: '' }), '');
  const valid = { ...sample, id: 'one', createdAt: '2026-09-07T10:00:00Z', updatedAt: '2026-09-07T10:00:00Z' };
  for (const text of ['bad-json', JSON.stringify({ version: 2, records: [valid] }), JSON.stringify({ version: 1, records: [{ ...valid, amount: -1 }] }), JSON.stringify({ version: 1, records: [valid, valid] }), JSON.stringify({ version: 1, records: [{ ...valid, updatedAt: 'bad' }] })]) {
    const storage = memory(); storage.setItem(storageKeys.fees, text); assert.deepEqual(create(storage).getState().fees.records, []);
  }
  const storage = memory(); create(storage); assert.deepEqual(create(storage).getState().fees.records, []);
});
