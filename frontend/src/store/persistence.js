import { validBroadcasts } from '../Admins/Institute Admin/Alerts/broadcastData.js';
import { validCampuses } from '../Admins/Institute Admin/Campuses/campusData.js';
import { validateExam } from '../Admins/Campus Admin/Exams/examData.js';
import { validateAttendance } from '../Admins/Campus Admin/Attendance/attendanceData.js';
import { studentAttendanceKey, validStudentAttendance } from '../Admins/Campus Admin/Attendance/Students/studentAttendanceData.js';
import { resultKey, validateResult } from '../Admins/Campus Admin/Results/resultsData.js';
import { validateVoucher } from '../Admins/Campus Admin/Fees/feeData.js';
import { validConversations } from './Slices/messagesSlice.js';
import { sessionState } from './Slices/authSlice.js';
export const authStorageKey = 'eduhub_auth';
const fields = {
  fees: ['studentId', 'voucherNo', 'feeCategory', 'semester', 'dueDate', 'paymentStatus', 'paymentDate', 'createdAt', 'updatedAt'],
  results: ['studentId', 'examId', 'academicYear', 'semester', 'grade', 'courseCode', 'remarks', 'createdAt', 'updatedAt'],
  studentAttendance: ['studentId', 'classId', 'date', 'status'],
  attendance: ['facultyId', 'date', 'checkInTime', 'checkOutTime', 'status'],
  exams: ['subject', 'examType', 'department', 'section', 'date', 'startTime', 'endTime', 'room', 'invigilator'],
  faculty: ['name', 'email', 'designation', 'qualification', 'department', 'phone', 'subjects', 'campus', 'status', 'initials'],
  students: ['name', 'roll', 'email', 'studentPhone', 'program', 'section', 'semester', 'subjects', 'campus', 'status', 'guardian', 'guardianPhone', 'initials'],
  timetable: ['subject', 'program', 'section', 'instructor', 'room', 'startTime', 'endTime', 'status'],
};
export const storageKeys = { broadcasts: 'eduhub_broadcasts', campuses: 'eduhub_campuses', messages: 'eduhub_messages', faculty: 'eduhub_faculty', students: 'eduhub_students', timetable: 'eduhub_timetable', exams: 'eduhub_exams', attendance: 'eduhub_attendance', studentAttendance: 'eduhub_student_attendance', results: 'eduhub_results', fees: 'eduhub_fees' };
const statuses = { faculty: ['Active', 'Pending', 'Inactive'], students: ['Active', 'Pending', 'Graduated', 'Suspended'], timetable: ['Active', 'Pending'] };

function validRecords(collection, records) {
  if (collection === 'broadcasts') return validBroadcasts(records);
  if (collection === 'campuses') return validCampuses(records);
  if (collection === 'messages') return validConversations(records);
  if (!Array.isArray(records)) return false;
  const ids = new Set();
  const attendanceDays = new Set();
  return records.every((record) => {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id || ids.has(record.id)) return false;
    ids.add(record.id);
    if (!fields[collection].every((field) => typeof record[field] === 'string')) return false;
    if (collection === 'students' && ['campusId', 'instituteId'].some((field) => record[field] !== undefined && (typeof record[field] !== 'string' || !record[field]))) return false;
    if (collection === 'fees') return !validateVoucher(record) && [record.createdAt, record.updatedAt].every((value) => Number.isFinite(Date.parse(value)));
    if (collection === 'results') {
      const key = resultKey(record);
      if (attendanceDays.has(key) || validateResult(record) || ![record.createdAt, record.updatedAt].every((value) => Number.isFinite(Date.parse(value)))) return false;
      attendanceDays.add(key);
      return true;
    }
    if (collection === 'studentAttendance') {
      const key = studentAttendanceKey(record);
      if (attendanceDays.has(key) || !validStudentAttendance(record)) return false;
      attendanceDays.add(key);
      return true;
    }
    if (collection === 'attendance') {
      const key = JSON.stringify([record.facultyId, record.date]);
      if (attendanceDays.has(key) || validateAttendance(record)) return false;
      attendanceDays.add(key);
      return true;
    }
    if (collection === 'exams') return typeof record.totalMarks === 'number' && !validateExam(record);
    if (!statuses[collection].includes(record.status)) return false;
    if (collection === 'timetable') {
      const time = /^([01]\d|2[0-3]):[0-5]\d$/;
      return Array.isArray(record.days) && record.days.length > 0 && record.days.every((day) => Number.isInteger(day) && day >= 1 && day <= 5) && time.test(record.startTime) && time.test(record.endTime) && record.endTime > record.startTime;
    }
    return true;
  });
}

function browserStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : undefined; } catch { return undefined; }
}

export function loadDemoState(storage = browserStorage()) {
  const state = {};
  try {
    const saved = JSON.parse(storage?.getItem(authStorageKey) ?? 'null');
    if (saved !== null) state.auth = sessionState(saved?.version === 1 ? saved.user : null);
  } catch { state.auth = sessionState(null); }
  for (const [collection, key] of Object.entries(storageKeys)) {
    try {
      const stored = JSON.parse(storage?.getItem(key) ?? 'null');
      if (stored?.version === 1 && validRecords(collection, stored.records)) state[collection] = { records: stored.records };
    } catch { /* Invalid or inaccessible storage falls back to the reducer's seed state. */ }
  }
  return state;
}

export function persistDemoState(store, storage = browserStorage()) {
  const previous = {};
  const sync = () => {
    const state = store.getState();
    if (state.auth && previous.auth !== state.auth) {
      try {
        if (state.auth.isAuthenticated) storage?.setItem(authStorageKey, JSON.stringify({ version: 1, user: sessionState(state.auth.user).user }));
        else storage?.removeItem(authStorageKey);
        previous.auth = state.auth;
      } catch { /* Keep in-memory auth usable if browser storage is unavailable. */ }
    }
    for (const [collection, key] of Object.entries(storageKeys)) {
      const records = state[collection]?.records;
      if (!records || records === previous[collection]) continue;
      try { storage?.setItem(key, JSON.stringify({ version: 1, records })); previous[collection] = records; }
      catch { /* Keep Redux usable when storage is full or unavailable; retry on a later change. */ }
    }
  };
  sync();
  return store.subscribe(sync);
}

