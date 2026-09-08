import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { studentAttendanceKey, validStudentAttendance } from '../../Admins/Campus Admin/Attendance/Students/studentAttendanceData.js';
import { recordedStudentRows } from '../../Admins/Campus Admin/Attendance/Students/studentAttendanceData.js';
import { selectStudents } from './studentsSlice.js';
import { selectTimetable } from './timetableSlice.js';

const slice = createSlice({
  name: 'studentAttendance', initialState: { records: [] },
  reducers: {
    studentAttendanceMarked: {
      prepare: ({ studentId, classId, date, status }) => ({ payload: { id: nanoid(), studentId, classId, date, status } }),
      reducer: (state, { payload }) => {
        if (!validStudentAttendance(payload)) return;
        const key = studentAttendanceKey(payload);
        const existing = state.records.find((record) => studentAttendanceKey(record) === key);
        if (existing) existing.status = payload.status;
        else state.records.push(payload);
      },
    },
  },
});
export const { studentAttendanceMarked } = slice.actions;
export const selectStudentAttendance = (state) => state.studentAttendance.records;
export const selectStudentAttendanceHistory = createSelector([selectStudentAttendance, selectStudents, selectTimetable], recordedStudentRows);
export default slice.reducer;
