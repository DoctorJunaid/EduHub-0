import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { attendanceSummary, validateAttendance } from '../../Admins/Campus Admin/Attendance/attendanceData.js';
import { selectFaculty } from './facultySlice.js';

const slice = createSlice({
  name: 'attendance', initialState: { records: [] },
  reducers: {
    attendanceSaved: {
      prepare: (values) => ({ payload: { ...values, id: values.id || nanoid() } }),
      reducer: (state, { payload }) => {
        if (validateAttendance(payload)) return;
        const record = state.records.find((item) => item.id === payload.id);
        const sameDay = state.records.find((item) => item.facultyId === payload.facultyId && item.date === payload.date);
        if (record && sameDay && record.id !== sameDay.id) return;
        if (record || sameDay) Object.assign(record || sameDay, { ...payload, id: (record || sameDay).id });
        else state.records.push(payload);
      },
    },
  },
});
export const { attendanceSaved } = slice.actions;
export const selectAttendance = (state) => state.attendance.records;
export const selectAttendanceSummary = createSelector([selectAttendance, selectFaculty, (_state, date) => date], attendanceSummary);
export default slice.reducer;
