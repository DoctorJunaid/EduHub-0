import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import exams, { examAdded as addExam, examUpdated as updateExam, examDeleted as deleteExam, selectExamStats } from './examsSlice.js';
import { initialExams, validateExam, filterExams, examsInWeek, dateKey, checkCohortDailyExamLimit } from '../../Admins/Campus Admin/Exams/examData.js';
import { mondayOf, shiftDays, minutes, dayBlocks } from '../../lib/schedule.js';
import { loadDemoState, storageKeys } from '../persistence.js';

test('summary reacts to CRUD and uses actual current week including Sunday', () => {
  const store = configureStore({ reducer: { exams }, preloadedState: { exams: { records: [] } } });
  const record = { ...initialExams[0], date: '2026-09-13', examType: 'Midterm' };
  store.dispatch(addExam(record));
  const saved = store.getState().exams.records[0];
  assert.deepEqual(selectExamStats(store.getState(), '2026-09-07'), { total: 1, midterms: 1, finals: 0, week: 1 });
  store.dispatch(updateExam({ ...saved, examType: 'Final', date: '2026-09-14' }));
  assert.deepEqual(selectExamStats(store.getState(), '2026-09-07'), { total: 1, midterms: 0, finals: 1, week: 0 });
  store.dispatch(deleteExam(saved.id));
  assert.equal(selectExamStats(store.getState(), '2026-09-07').total, 0);
});
test('search and all filters compose across actual exam values', () => {
  const record = initialExams[0];
  for (const search of [record.subject.toUpperCase(), record.room, record.invigilator]) assert.equal(filterExams([record], { search }).length, 1);
  assert.equal(filterExams([record], { search: '  ', examType: record.examType, room: record.room, department: record.department, invigilator: record.invigilator }).length, 1);
  for (const key of ['examType', 'department', 'room', 'invigilator']) assert.equal(filterExams([record], { [key]: 'missing' }).length, 0);
});
test('date navigation crosses year boundaries and limits weekly events', () => {
  const monday = mondayOf(new Date('2027-01-01T12:00:00'));
  assert.equal(dateKey(monday), '2026-12-28');
  assert.equal(dateKey(shiftDays(monday, 7)), '2027-01-04');
  assert.equal(dateKey(shiftDays(shiftDays(monday, 7), -7)), dateKey(monday));
  assert.deepEqual(examsInWeek([{ date: '2026-12-27' }, { date: '2026-12-28' }, { date: '2027-01-03' }, { date: '2027-01-04' }], monday), [{ date: '2026-12-28' }, { date: '2027-01-03' }]);
  const blocks = dayBlocks([{ ...initialExams[0], days: [3], startTime: '14:00', endTime: '17:00' }], 3);
  assert.equal(blocks.length, 1);
  assert.equal(minutes(blocks[0].record.startTime) - 8 * 60, 360);
  assert.equal(minutes(blocks[0].record.endTime) - minutes(blocks[0].record.startTime), 180);
});
test('validation and hydration reject invalid records, allow decimals and optional department', () => {
  assert.equal(validateExam({ ...initialExams[0], department: '', totalMarks: 0.5 }), '');
  for (const patch of [{ subject: ' ' }, { examType: 'UnsupportedExamType' }, { date: '2026-02-30' }, { startTime: '25:00' }, { endTime: initialExams[0].startTime }, { totalMarks: 0 }, { totalMarks: -2 }, { totalMarks: Infinity }]) {
    const record = { ...initialExams[0], ...patch };
    assert.ok(validateExam(record));
    const storage = { getItem: (key) => key === storageKeys.exams ? JSON.stringify({ version: 1, records: [record] }) : null };
    assert.equal(loadDemoState(storage).exams, undefined);
  }
});

test('checkCohortDailyExamLimit enforces 1 exam standard, allows rare 2nd exam with gap, and blocks 3rd exam', () => {
  const existingExams = [
    {
      id: 'exam-1',
      program: 'Grade 10',
      section: 'A',
      subject: 'Physics',
      date: '2026-10-15',
      startTime: '09:00',
      endTime: '12:00',
    },
  ];

  // 1. Date with 0 exams -> standard single exam permitted
  const resEmpty = checkCohortDailyExamLimit(existingExams, {
    program: 'Grade 10',
    section: 'A',
    date: '2026-10-16',
    startTime: '09:00',
    endTime: '12:00',
  });
  assert.equal(resEmpty.allowed, true);
  assert.equal(resEmpty.count, 0);
  assert.equal(resEmpty.isRareCase, false);
  assert.equal(resEmpty.isBlocked, false);

  // 2. Date with 1 existing exam -> rare 2nd exam allowed if non-overlapping and >= 30-min gap
  const resDualValid = checkCohortDailyExamLimit(existingExams, {
    program: 'Grade 10',
    section: 'A',
    date: '2026-10-15',
    startTime: '13:00',
    endTime: '16:00',
  });
  assert.equal(resDualValid.allowed, true);
  assert.equal(resDualValid.count, 1);
  assert.equal(resDualValid.isRareCase, true);
  assert.equal(resDualValid.isBlocked, false);

  // 3. Date with 1 existing exam -> rejected if times overlap
  const resDualOverlap = checkCohortDailyExamLimit(existingExams, {
    program: 'Grade 10',
    section: 'A',
    date: '2026-10-15',
    startTime: '11:00',
    endTime: '14:00',
  });
  assert.equal(resDualOverlap.allowed, false);
  assert.equal(resDualOverlap.isBlocked, true);
  assert.ok(resDualOverlap.reason.includes('Overlaps'));

  // 4. Date with 1 existing exam -> rejected if gap < 30 minutes
  const resDualSmallGap = checkCohortDailyExamLimit(existingExams, {
    program: 'Grade 10',
    section: 'A',
    date: '2026-10-15',
    startTime: '12:15',
    endTime: '14:15',
  });
  assert.equal(resDualSmallGap.allowed, false);
  assert.equal(resDualSmallGap.isBlocked, true);
  assert.ok(resDualSmallGap.reason.includes('30-minute rest interval'));

  // 5. Date with 2 existing exams -> strictly blocked from adding a 3rd exam
  const twoExams = [
    ...existingExams,
    {
      id: 'exam-2',
      program: 'Grade 10',
      section: 'A',
      subject: 'Chemistry',
      date: '2026-10-15',
      startTime: '13:00',
      endTime: '16:00',
    },
  ];
  const resTripleBlocked = checkCohortDailyExamLimit(twoExams, {
    program: 'Grade 10',
    section: 'A',
    date: '2026-10-15',
    startTime: '16:45',
    endTime: '18:45',
  });
  assert.equal(resTripleBlocked.allowed, false);
  assert.equal(resTripleBlocked.count, 2);
  assert.equal(resTripleBlocked.isBlocked, true);
  assert.ok(resTripleBlocked.reason.includes('Maximum daily limit reached'));
});

