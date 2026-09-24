import { attendanceStatuses } from '../../../../lib/attendance.js';
import { parseDate, validDate } from '../../../../lib/dates.js';

export const studentAttendanceKey = ({ studentId, classId, date }) =>
  JSON.stringify([String(studentId || ''), String(classId || 'default'), String(date || '')]);

export function validStudentAttendance(record) {
  return Boolean(
    record &&
    typeof record.studentId === 'string' &&
    record.studentId.trim() &&
    validDate(record.date) &&
    attendanceStatuses.includes(record.status)
  );
}

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
  const recordMap = new Map();
  for (const r of records || []) {
    const sId = String(r.studentId?._id || r.studentId || '');
    if (sId) {
      recordMap.set(sId, r);
    }
  }

  const people = (students && students.length > 0)
    ? students
    : (records || []).map(r => r.studentId).filter(s => s && typeof s === 'object');

  const rows = [];
  const processedStudentIds = new Set();

  for (const student of people) {
    const sId = String(student._id || student.id || '');
    if (!sId || processedStudentIds.has(sId)) continue;
    processedStudentIds.add(sId);

    const record = recordMap.get(sId) || null;
    const recDate = record?.dateStr || (record?.date ? new Date(record.date).toISOString().split('T')[0] : '');

    const session = {
      id: record?.classId || 'default',
      subject: student.gradeOrClass || student.program || 'General Academic',
      room: 'Classroom',
      startTime: '08:00',
      endTime: '14:00',
    };

    rows.push({
      student: {
        ...student,
        id: sId,
        _id: sId,
        name: student.name || 'Unknown Student',
        roll: student.roll || student.rollNumber || student.admissionNo || 'STD-001',
        program: student.gradeOrClass || student.program || 'Grade 10',
        section: student.section || 'A',
      },
      session,
      record: record ? { ...record, status: record.status || 'Present' } : null,
      status: record?.status || 'Not Marked',
      date: recDate,
    });
  }

  return rows;
}

export function dailyStudentRows(records, students, classes, date, matchTimetable) {
  const normalizedDate = String(date || '').slice(0, 10);

  // Map existing records for target date
  const recordMap = new Map();
  for (const r of records || []) {
    const recDateStr = r.dateStr || (r.date ? new Date(r.date).toISOString().split('T')[0] : '');
    const sId = String(r.studentId?._id || r.studentId || '');
    if (sId) {
      recordMap.set(sId, r);
    }
  }

  // All student profiles
  const people = (students && students.length > 0)
    ? students
    : (records || []).map(r => r.studentId).filter(s => s && typeof s === 'object');

  const rows = [];
  const processedStudentIds = new Set();

  for (const student of people) {
    const sId = String(student._id || student.id || '');
    if (!sId || processedStudentIds.has(sId)) continue;
    processedStudentIds.add(sId);

    const record = recordMap.get(sId) || null;
    const session = {
      id: record?.classId || 'default',
      subject: student.gradeOrClass || student.program || 'General Academic',
      room: 'Classroom',
      startTime: '08:00',
      endTime: '14:00',
    };

    rows.push({
      student: {
        ...student,
        id: sId,
        _id: sId,
        name: student.name || 'Unknown Student',
        roll: student.roll || student.rollNumber || student.admissionNo || 'STD-001',
        program: student.gradeOrClass || student.program || 'Grade 10',
        section: student.section || 'A',
      },
      session,
      record: record ? { ...record, status: record.status || 'Present' } : null,
      status: record?.status || 'Not Marked',
      date: normalizedDate,
    });
  }

  // Fallback if records had students not found in students list
  for (const r of records || []) {
    const sId = String(r.studentId?._id || r.studentId || '');
    if (sId && !processedStudentIds.has(sId)) {
      processedStudentIds.add(sId);
      const studentObj = typeof r.studentId === 'object' ? r.studentId : { name: 'Student', _id: sId, id: sId };
      rows.push({
        student: {
          ...studentObj,
          id: sId,
          _id: sId,
          name: studentObj.name || 'Student',
          roll: studentObj.roll || r.roll || 'STD',
          program: studentObj.gradeOrClass || r.gradeOrClass || r.className || 'Grade 10',
          section: studentObj.section || r.section || 'A',
        },
        session: {
          id: r.classId || 'default',
          subject: r.gradeOrClass || r.className || 'General Academic',
          room: 'Classroom',
          startTime: '08:00',
          endTime: '14:00',
        },
        record: r,
        status: r.status || 'Present',
        date: normalizedDate,
      });
    }
  }

  return rows.sort((a, b) => (a.student.name || '').localeCompare(b.student.name || ''));
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
