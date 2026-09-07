import { createSlice, nanoid } from '@reduxjs/toolkit';
import { initialSchedules } from '../../components/timetable/timetableData.js';
const slice = createSlice({
  name: 'timetable', initialState: { records: initialSchedules },
  reducers: {
    classScheduled: { prepare: (values) => ({ payload: { ...values, id: nanoid() } }), reducer: (state, { payload }) => { state.records.push(payload); } },
    classUpdated: (state, { payload }) => { const record = state.records.find((item) => item.id === payload.id); if (record) Object.assign(record, payload); },
    classDeleted: (state, { payload }) => { state.records = state.records.filter((item) => item.id !== payload); },
  },
});
export const { classScheduled, classUpdated, classDeleted } = slice.actions;
export const selectTimetable = (state) => state.timetable.records;
export default slice.reducer;
