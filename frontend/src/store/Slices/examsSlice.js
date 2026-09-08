import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { initialExams, examsInWeek } from '../../Admins/Campus Admin/Exams/examData.js';
import { mondayOf } from '../../lib/schedule.js';
const slice = createSlice({
  name: 'exams', initialState: { records: initialExams },
  reducers: {
    addExam: { prepare: (values) => ({ payload: { ...values, id: nanoid() } }), reducer: (state, { payload }) => { state.records.push(payload); } },
    updateExam: (state, { payload }) => { const record = state.records.find((item) => item.id === payload.id); if (record) Object.assign(record, payload); },
    deleteExam: (state, { payload }) => { state.records = state.records.filter((item) => item.id !== payload); },
  },
});
export const { addExam, updateExam, deleteExam } = slice.actions;
export const selectExams = (state) => state.exams.records;
export const selectExamStats = createSelector([selectExams, (_state, today) => today], (records, today) => ({
  total: records.length, midterms: records.filter((item) => item.examType === 'Midterm').length,
  finals: records.filter((item) => item.examType === 'Final').length, week: examsInWeek(records, mondayOf(new Date(`${today}T12:00:00`))).length,
}));
export default slice.reducer;
