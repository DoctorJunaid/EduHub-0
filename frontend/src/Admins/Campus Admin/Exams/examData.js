import { mondayOf, shiftDays, minutes } from '../../../lib/schedule.js';
import { facultyRecords } from '../Faculty/facultyData.js';

export const examTypes = ['Midterm', 'Final', 'Test', 'Quiz', 'Practical', 'Assessment'];
export const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = (date) => new Date(`${date}T12:00:00`);
export const examFields = [
  ['subject', 'Subject'], ['examType', 'Exam Type'], ['department', 'Department'],
  ['section', 'Section / Class'], ['date', 'Date', 'date'], ['startTime', 'Start Time', 'time'],
  ['endTime', 'End Time', 'time'], ['room', 'Exam Hall / Room'], ['invigilator', 'Invigilator'], ['totalMarks', 'Total Marks', 'number'],
];
export const initialExams = [
  {
    id: "exam-template-1",
    subject: "Mathematics",
    examType: "Midterm",
    department: "Computer Science",
    className: "Grade 10",
    section: "A",
    date: "2026-09-13",
    startTime: "09:00",
    endTime: "12:00",
    room: "Hall A",
    invigilator: "Dr. Usman Khan",
    totalMarks: 100,
    status: "Scheduled",
  },
];
export function validateExam(values) {
  if (examFields.some(([key]) => key !== 'department' && !String(values[key] ?? '').trim())) return 'Please complete all required fields.';
  if (!examTypes.includes(values.examType)) return 'Select an approved exam type.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(parseDate(values.date).getTime()) || dateKey(parseDate(values.date)) !== values.date) return 'Enter a valid date.';
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(values.startTime) || !time.test(values.endTime)) return 'Enter valid start and end times.';
  if (values.endTime <= values.startTime) return 'End Time must be after Start Time.';
  if (!Number.isFinite(Number(values.totalMarks)) || Number(values.totalMarks) <= 0) return 'Total Marks must be a positive number.';
  return '';
}

/**
 * Check whether scheduling an exam adheres to the daily load rules:
 * - 0 existing exams: Standard single exam day.
 * - 1 existing exam: Rare case (permitted with >= 30-min break and no time collision).
 * - 2 existing exams: Hard blocked (maximum 2 exams per day per cohort).
 */
export function checkCohortDailyExamLimit(records, payload = {}) {
  if (!Array.isArray(records) || !payload) {
    return {
      allowed: true,
      count: 0,
      existingExams: [],
      isRareCase: false,
      isBlocked: false,
      reason: '',
      suggestedSlot: null,
    };
  }

  const pDate = payload.date
    ? String(payload.date).slice(0, 10)
    : payload.examDate
    ? new Date(payload.examDate).toISOString().split('T')[0]
    : '';

  const pClass = (
    payload.program ||
    payload.className ||
    payload.gradeOrClass ||
    payload.department ||
    ''
  ).trim().toLowerCase();

  const pSec = (payload.section || '').trim().toLowerCase();
  const excludeId = payload._id || payload.id || null;

  if (!pDate || !pClass) {
    return {
      allowed: true,
      count: 0,
      existingExams: [],
      isRareCase: false,
      isBlocked: false,
      reason: '',
      suggestedSlot: null,
    };
  }

  const cohortExams = records.filter((r) => {
    if (!r) return false;
    const rId = r._id || r.id;
    if (excludeId && rId === excludeId) return false;

    const rDate = r.date
      ? String(r.date).slice(0, 10)
      : r.examDate
      ? new Date(r.examDate).toISOString().split('T')[0]
      : '';
    if (rDate !== pDate) return false;

    const rClass = (
      r.program ||
      r.className ||
      r.gradeOrClass ||
      r.department ||
      ''
    ).trim().toLowerCase();
    const rSec = (r.section || '').trim().toLowerCase();

    if (pClass !== 'all' && rClass !== 'all') {
      if (rClass !== pClass) return false;
    }
    if (pSec && pSec !== 'all' && rSec && rSec !== 'all') {
      if (rSec !== pSec) return false;
    }
    return true;
  });

  const count = cohortExams.length;

  if (count >= 2) {
    const names = cohortExams.map((e) => e.subject).filter(Boolean).join(' and ');
    return {
      allowed: false,
      count,
      existingExams: cohortExams,
      isRareCase: false,
      isBlocked: true,
      reason: `Maximum daily limit reached: 2 exams already scheduled on ${pDate} (${names}).`,
      suggestedSlot: null,
    };
  }

  if (count === 1) {
    const existing = cohortExams[0];
    const exStart = minutes(existing.startTime);
    const exEnd = minutes(existing.endTime);
    const newStart = minutes(payload.startTime);
    const newEnd = minutes(payload.endTime);

    const suggested =
      !isNaN(exEnd) && exEnd <= 12 * 60
        ? { start: '13:30', end: '16:30' }
        : { start: '09:00', end: '12:00' };

    if (!isNaN(newStart) && !isNaN(newEnd) && !isNaN(exStart) && !isNaN(exEnd)) {
      const overlaps = Math.max(newStart, exStart) < Math.min(newEnd, exEnd);
      if (overlaps) {
        return {
          allowed: false,
          count,
          existingExams: cohortExams,
          isRareCase: true,
          isBlocked: true,
          reason: `Overlaps with existing paper '${existing.subject}' (${existing.startTime} - ${existing.endTime}).`,
          suggestedSlot: suggested,
        };
      }

      const gap = newStart >= exEnd ? newStart - exEnd : exStart - newEnd;
      if (gap < 30) {
        return {
          allowed: false,
          count,
          existingExams: cohortExams,
          isRareCase: true,
          isBlocked: true,
          reason: `Dual-exam day requires at least a 30-minute rest interval. Existing paper ends at ${existing.endTime} (Gap: ${gap} mins).`,
          suggestedSlot: suggested,
        };
      }
    }

    return {
      allowed: true,
      count,
      existingExams: cohortExams,
      isRareCase: true,
      isBlocked: false,
      reason: `Dual-exam day (Rare Case): '${existing.subject}' is scheduled at ${existing.startTime} - ${existing.endTime}.`,
      suggestedSlot: suggested,
    };
  }

  return {
    allowed: true,
    count: 0,
    existingExams: [],
    isRareCase: false,
    isBlocked: false,
    reason: 'Standard single-exam day.',
    suggestedSlot: { start: '09:00', end: '12:00' },
  };
}

export function filterExams(records, { search = '', dailyLoad = 'all', ...filters }) {
  if (!Array.isArray(records)) return [];
  const query = search.trim().toLowerCase();
  return records.filter((record) => {
    if (!record) return false;
    const matchesSearch =
      !query ||
      [record.subject, record.room, record.invigilator, record.department, record.section]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    if (dailyLoad === 'single' && record.isDualExamDay) return false;
    if (dailyLoad === 'dual' && !record.isDualExamDay) return false;

    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value || key === 'dailyLoad') return true;
      return record[key] === value;
    });

    return matchesSearch && matchesFilters;
  });
}
export const examsInWeek = (records, week) => records.filter((record) => record.date >= dateKey(week) && record.date <= dateKey(shiftDays(week, 6)));
