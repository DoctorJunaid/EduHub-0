import { createSlice, nanoid } from '@reduxjs/toolkit';
import { studentRecords } from '../../Admins/Campus Admin/Students/studentData.js';
import { studentIdentityErrors } from '../studentIdentity.js';

const initialsFor = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const studentsSlice = createSlice({
  name: 'students',
  initialState: { records: studentRecords },
  reducers: {
    studentAdded: {
      prepare: (values) => ({ payload: { ...values, id: nanoid(), initials: initialsFor(values.name) } }),
      reducer: (state, { payload }) => { if (!Object.keys(studentIdentityErrors(payload, state.records)).length) state.records.push(payload); },
    },
    studentUpdated: (state, { payload }) => {
      const student = state.records.find((record) => record.id === payload.id);
      if (Object.keys(studentIdentityErrors({ ...student, ...payload }, state.records)).length) return;
      if (student) {
        Object.assign(student, payload);
        student.initials = initialsFor(student.name);
      }
    },
    studentDeleted: (state, { payload }) => {
      state.records = state.records.filter((student) => student.id !== payload);
    },
  },
});

export const { studentAdded, studentUpdated, studentDeleted } = studentsSlice.actions;
export const selectStudents = (state) => state.students.records;
export default studentsSlice.reducer;
