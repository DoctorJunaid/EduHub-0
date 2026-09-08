import test from 'node:test';
import assert from 'node:assert/strict';
import reducer, { classScheduled, classUpdated, classDeleted } from './timetableSlice.js';
import { initialSchedules } from '../../Admins/Campus Admin/Timetable/timetableData.js';
import { mondayOf, shiftDays, filterSchedules, dayBlocks, gridRange, minutes } from '../../lib/schedule.js';

test('schedule/edit/delete update the shared records used by both views', () => {
  let state = reducer(undefined, { type: 'init' });
  state = reducer(state, classScheduled({ ...initialSchedules[0], days: [2], startTime: '08:30', endTime: '09:45' }));
  const added = state.records.at(-1);
  assert.equal(dayBlocks(state.records, 2).some((block) => block.record.id === added.id), true);
  state = reducer(state, classUpdated({ id: added.id, days: [5], room: 'Hall B' }));
  assert.equal(dayBlocks(state.records, 2).some((block) => block.record.id === added.id), false);
  assert.equal(dayBlocks(state.records, 5).find((block) => block.record.id === added.id).record.room, 'Hall B');
  state = reducer(state, classDeleted(added.id));
  assert.equal(state.records.length, 3);
});

test('week navigation uses local calendar dates across month/year boundaries', () => {
  const week = mondayOf(new Date(2026, 0, 1));
  assert.equal(week.getDay(), 1); assert.equal(week.getMonth(), 11); assert.equal(week.getDate(), 29);
  assert.equal(shiftDays(week, 7).getDate(), 5);
  assert.equal(shiftDays(shiftDays(week, 7), -7).getTime(), week.getTime());
  assert.equal(mondayOf(new Date(2026, 8, 6)).getDate(), 31);
});

test('all filters combine consistently for table and grid', () => {
  assert.equal(filterSchedules(initialSchedules, { program: 'BS Computer Science', section: 'CS-4A', instructor: 'Dr. Usman Khan', room: 'Lab 302' }).length, 1);
  for (const key of ['program', 'section', 'instructor', 'room']) assert.equal(filterSchedules(initialSchedules, { [key]: 'missing' }).length, 0);
});

test('grid positions derive from time; out-of-window and overlapping entries remain visible', () => {
  const early = { ...initialSchedules[0], id: 'early', startTime: '06:30', endTime: '08:15' };
  const overlap = { ...early, id: 'overlap', startTime: '07:00' };
  const late = { ...early, id: 'late', startTime: '20:00', endTime: '21:30' };
  const records = [early, overlap, late];
  assert.deepEqual(gridRange(records), { start: 360, end: 1320 });
  assert.equal((minutes(early.startTime) - gridRange(records).start) / 60 * 40, 20);
  const blocks = dayBlocks(records, 1);
  assert.notEqual(blocks[0].lane, blocks[1].lane);
  assert.equal(blocks[0].laneCount, 2);
  assert.deepEqual(gridRange([]), { start: 480, end: 1020 });
});
