import { attendanceStatuses } from '../../../../lib/attendance.js';
import { parseDate, validDate } from '../../../../lib/dates.js';

export const studentAttendanceKey = ({ studentId, classId, date }) =>
  JSON.stringify([String(studentId || ''), String(classId || 'default'), String(date || '')]);

export function validStudentAttendance(record) {
  return Boolean(
    record &&
    typeof record.studentId === 'string' &&
    record.studentId.trim() &&
    typeof record.classId === 'string' &&
    record.classId.trim() &&
    validDate(record.date) &&
    attendanceStatuses.includes(record.status)
  );
}

const recordId = (value) => String(value?._id || value?.id || value || '');
const classFor = (classes, classId) =>
  (classes || []).find((item) => recordId(item) === String(classId || ''));
const studentFor = (students, studentId) =>
  (students || []).find((item) => recordId(item) === String(studentId || ''));
const dateFor = (record) =>
  String(record?.dateStr || record?.date || '').slice(0, 10);
const sessionFor = (item) => ({
  ...item,
  id: recordId(item),
  subject: item.subject || item.title || item.periodName || 'General Academic',
  room: item.room || item.roomNumber || 'Classroom',
  startTime: item.startTime || '08:00',
  endTime: item.endTime || '14:00',
});
const studentMatchesSession = (student, session) => {
  const program = session.className || session.gradeOrClass || session.program || '';
  const section = session.section || '';
  return (
    (!program || (student.gradeOrClass || student.program) === program) &&
    (!section || student.section === section)
  );
};
const rowFor = (student, session, record, date) => ({
  student: {
    ...student,
    id: recordId(student),
    _id: recordId(student),
    name: student.name || 'Unknown Student',
    roll: student.roll || student.rollNumber || student.admissionNo || 'STD-001',
    program: student.gradeOrClass || student.program || 'Grade 10',
    section: student.section || 'A',
  },
  session: sessionFor(session),
  record: record ? { ...record, status: record.status || 'Present' } : null,
  status: record?.status || 'Not Marked',
  date,
});

export function filterStudentAttendance(rows, filters) {
  const query = (filters.search ?? '').trim().toLowerCase();
  return rows.filter(({ student, session, record, date }) => {
    const studentName = String(student?.name || '').toLowerCase();
    const studentRoll = String(student?.roll || student?.rollNumber || student?.admissionNo || '').toLowerCase();
    const studentProgram = String(student?.program || student?.gradeOrClass || '').toLowerCase();

    const matchesSearch =
      !query ||
      studentName.includes(query) ||
      studentRoll.includes(query) ||
      studentProgram.includes(query);

    const matchesProgram =
      !filters.program ||
      student?.program === filters.program ||
      student?.gradeOrClass === filters.program;

    const matchesSection = !filters.section || student?.section === filters.section;
    const matchesSubject = !filters.subject || session?.subject === filters.subject;
    const matchesStatus =
      !filters.status ||
      String(record?.status || '').toLowerCase() === String(filters.status).toLowerCase();

    const matchesStudentId =
      !filters.studentId ||
      student?.id === filters.studentId ||
      student?._id === filters.studentId;

    const matchesFrom = !filters.from || date >= filters.from;
    const matchesTo = !filters.to || date <= filters.to;

    return (
      matchesSearch &&
      matchesProgram &&
      matchesSection &&
      matchesSubject &&
      matchesStatus &&
      matchesStudentId &&
      matchesFrom &&
      matchesTo
    );
  });
}

export function recordedStudentRows(records, students, classes) {
  return (records || [])
    .map((record) => {
      const student = studentFor(students, recordId(record.studentId));
      const session = classFor(classes, recordId(record.classId));
      if (!student || !session) return null;
      return rowFor(student, session, record, dateFor(record));
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function dailyStudentRows(records, students, classes, date, matchTimetable) {
  const normalizedDate = String(date || '').slice(0, 10);
  const recordsForDate = (records || []).filter(
    (record) => dateFor(record) === normalizedDate,
  );
  if (!matchTimetable)
    return recordedStudentRows(recordsForDate, students, classes).sort((a, b) =>
      a.student.name.localeCompare(b.student.name),
    );

  const day = new Date(`${normalizedDate}T12:00:00`).getDay() || 7;
  const recordMap = new Map(
    recordsForDate.map((record) => [
      studentAttendanceKey({
        studentId: recordId(record.studentId),
        classId: recordId(record.classId),
        date: normalizedDate,
      }),
      record,
    ]),
  );
  const rows = [];
  const included = new Set();
  for (const record of recordsForDate) {
    const student = studentFor(students, recordId(record.studentId));
    const session = classFor(classes, recordId(record.classId));
    if (!student || !session) continue;
    const key = studentAttendanceKey({
      studentId: recordId(student),
      classId: recordId(session),
      date: normalizedDate,
    });
    included.add(key);
    rows.push(rowFor(student, session, record, normalizedDate));
  }
  for (const session of classes || []) {
    if (!Array.isArray(session.days) || !session.days.includes(day)) continue;
    for (const student of students || []) {
      if (!studentMatchesSession(student, session)) continue;
      const record = recordMap.get(
        studentAttendanceKey({
          studentId: recordId(student),
          classId: recordId(session),
          date: normalizedDate,
        }),
      );
      if (
        included.has(
          studentAttendanceKey({
            studentId: recordId(student),
            classId: recordId(session),
            date: normalizedDate,
          }),
        )
      )
        continue;
      rows.push(rowFor(student, session, record, normalizedDate));
    }
  }
  return rows.sort((a, b) => a.student.name.localeCompare(b.student.name));
}

export function studentAttendanceSummary(rows, rateMode) {
  const counts = Object.fromEntries(attendanceStatuses.map((status) => [status, 0]));
  for (const { record } of rows || []) {
    if (record && record.status && counts[record.status] !== undefined) {
      counts[record.status]++;
    }
  }
  const marked = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const denominator = rateMode === 'include-late-exclude-leave' ? marked - counts['On Leave'] : marked;
  const numerator = counts.Present + (rateMode === 'include-late-exclude-leave' ? counts.Late : 0);
  return {
    total: new Set((rows || []).map(({ student }) => student?.id || student?._id)).size,
    ...counts,
    marked,
    rate: rateMode && denominator ? ((numerator / denominator) * 100) : null,
  };
}

export function studentAttendanceExport(rows) {
  return {
    headers: [
      'Student Name',
      'Roll Number',
      'Program',
      'Section',
      'Subject',
      'Room / Lab',
      'Date',
      'Start Time',
      'End Time',
      'Status',
    ],
    rows: (rows || []).map(({ student, session, record, date }) => [
      student?.name || '',
      student?.roll || student?.rollNumber || '',
      student?.program || student?.gradeOrClass || '',
      student?.section || '',
      session?.subject || 'General',
      session?.room || 'Classroom',
      date || '',
      session?.startTime || '08:00',
      session?.endTime || '14:00',
      record?.status ?? 'Not Marked',
    ]),
  };
}
