import { createSelector } from '@reduxjs/toolkit';
import { selectCurrentUser } from '../Slices/authSlice.js';
import { selectStudents } from '../Slices/studentsSlice.js';
import { selectTimetable } from '../Slices/timetableSlice.js';
import { selectStudentAttendanceHistory } from '../Slices/studentAttendanceSlice.js';
import { selectResults } from '../Slices/resultsSlice.js';
import { studentAttendanceSummary } from '../../Admins/Campus Admin/Attendance/Students/studentAttendanceData.js';

export function matchCurrentStudent(user, students) {
  if (user?.role !== 'student') return null;
  const byId = students.find((student) => student.id === user.id);
  if (byId) return byId;
  const email = user.email?.trim().toLowerCase();
  if (!email) return null;
  const matches = students.filter((student) => student.email?.trim().toLowerCase() === email);
  return matches.length === 1 ? matches[0] : null;
}

export const selectCurrentStudent = createSelector([selectCurrentUser, selectStudents], matchCurrentStudent);
export const selectStudentProfile = createSelector([selectCurrentUser, selectCurrentStudent], (user, student) => {
  if (!user || user.role !== 'student') return null;
  const name = student?.name || user.name;
  return { ...user, name, initials: name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), role: 'Student', roleLabel: student?.status ? `${student.status} Student` : 'Student' };
});

export const selectStudentDashboard = createSelector(
  [selectCurrentStudent, selectTimetable, selectStudentAttendanceHistory, selectResults],
  (student, timetable, attendanceHistory, results) => {
    if (!student) return { student: null, courses: [], timetable: [], attendance: null, cgpa: null, results: [] };
    const courses = [...new Set((student.subjects || '').split(',').map((subject) => subject.trim()).filter(Boolean))];
    // Match the existing program/section relationship; never include other sections to fill the reference.
    const classes = student.program && student.section ? timetable.filter((session) => session.program === student.program && session.section === student.section).sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];
    const rows = attendanceHistory.filter((row) => row.student.id === student.id);
    // Present/Absent is unambiguous. Late/leave weighting has not been configured in this project.
    const hasUnspecifiedPolicy = rows.some(({ record }) => !['Present', 'Absent'].includes(record.status));
    const summary = studentAttendanceSummary(rows, hasUnspecifiedPolicy ? undefined : 'present-only');
    return {
      student, courses, timetable: classes,
      attendance: { present: summary.Present, marked: summary.marked, rate: summary.rate, policyPending: hasUnspecifiedPolicy },
      // Awarded exam GPAs are not an official cumulative GPA; do not average them here.
      cgpa: Number.isFinite(student.cgpa) && student.cgpa >= 0 ? student.cgpa : null,
      results: results.filter((record) => record.studentId === student.id),
    };
  },
);
