import { createSelector } from '@reduxjs/toolkit';
import { selectStudentDashboard } from './studentDashboard.js';
import { selectStudentCourses } from './studentCourses.js';
import { selectStudentAttendanceHistory } from '../Slices/studentAttendanceSlice.js';

export const selectStudentAttendancePage = createSelector(
  [selectStudentDashboard, selectStudentCourses, selectStudentAttendanceHistory],
  (dashboard, courses, history) => {
    const rows = dashboard.student ? history.filter(({ student }) => student.id === dashboard.student.id)
      .sort((a, b) => b.date.localeCompare(a.date) || a.session.subject.localeCompare(b.session.subject)) : [];
    return {
      student: dashboard.student,
      attendance: dashboard.attendance,
      courses,
      rows,
      absent: rows.filter(({ record }) => record.status === 'Absent').length,
      late: rows.filter(({ record }) => record.status === 'Late').length,
      leave: rows.filter(({ record }) => record.status === 'On Leave').length,
    };
  },
);
