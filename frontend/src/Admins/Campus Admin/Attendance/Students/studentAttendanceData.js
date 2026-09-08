import { attendanceStatuses } from '../../../../lib/attendance.js';
import { parseDate, validDate } from '../../../../lib/dates.js';

export const studentAttendanceKey = ({ studentId, classId, date }) => JSON.stringify([studentId, classId, date]);
export function validStudentAttendance(record) {
  return Boolean(record && typeof record.studentId === 'string' && record.studentId.trim() && typeof record.classId === 'string' && record.classId.trim() && validDate(record.date) && attendanceStatuses.includes(record.status));
}
export function filterStudentAttendance(rows, filters) {
  const query = (filters.search ?? '').trim().toLowerCase();
  return rows.filter(({ student, session, record, date }) =>
    (!query || [student.name, student.roll, student.program].some((value) => value.toLowerCase().includes(query))) &&
    (!filters.program || student.program === filters.program) && (!filters.section || student.section === filters.section) &&
    (!filters.subject || session.subject === filters.subject) && (!filters.status || record?.status === filters.status) &&
    (!filters.studentId || student.id === filters.studentId) && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to));
}
export function recordedStudentRows(records, students, classes) {
  const people = new Map(students.map((student) => [student.id, student]));
  const sessions = new Map(classes.map((session) => [session.id, session]));
  return records.filter((record) => people.has(record.studentId) && sessions.has(record.classId)).map((record) => ({ student: people.get(record.studentId), session: sessions.get(record.classId), record, date: record.date }));
}
export function dailyStudentRows(records, students, classes, date, matchTimetable) {
  const rows = recordedStudentRows(records, students, classes).filter((row) => row.date === date);
  const keys = new Set(rows.map(({ student, session }) => studentAttendanceKey({ studentId: student.id, classId: session.id, date })));
  if (matchTimetable) {
    const weekday = parseDate(date).getDay();
    for (const session of classes.filter((item) => item.days.includes(weekday))) {
      for (const student of students.filter((item) => item.program === session.program && item.section === session.section)) {
        const key = studentAttendanceKey({ studentId: student.id, classId: session.id, date });
        if (!keys.has(key)) rows.push({ student, session, date });
      }
    }
  }
  return rows.sort((a, b) => a.session.startTime.localeCompare(b.session.startTime) || a.student.name.localeCompare(b.student.name) || a.session.id.localeCompare(b.session.id));
}
export function studentAttendanceSummary(rows, rateMode) {
  const counts = Object.fromEntries(attendanceStatuses.map((status) => [status, 0]));
  for (const { record } of rows) if (record) counts[record.status]++;
  const marked = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const denominator = rateMode === 'include-late-exclude-leave' ? marked - counts['On Leave'] : marked;
  const numerator = counts.Present + (rateMode === 'include-late-exclude-leave' ? counts.Late : 0);
  return { total: new Set(rows.map(({ student }) => student.id)).size, ...counts, marked, rate: rateMode && denominator ? numerator / denominator * 100 : null };
}
export function studentAttendanceExport(rows) {
  return {
    headers: ['Student Name', 'Roll Number', 'Program', 'Section', 'Subject', 'Room / Lab', 'Date', 'Start Time', 'End Time', 'Status'],
    rows: rows.map(({ student, session, record, date }) => [student.name, student.roll, student.program, student.section, session.subject, session.room, date, session.startTime, session.endTime, record?.status ?? '']),
  };
}
