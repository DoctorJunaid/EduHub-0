import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { resultKey, validateResult, joinResults } from '../../Admins/Campus Admin/Results/resultsData.js';
import { selectStudents } from './studentsSlice.js';
import { selectExams } from './examsSlice.js';

const slice = createSlice({
  name: 'results', initialState: { records: [] },
  reducers: {
    resultSaved: {
      prepare: (values) => ({ payload: { ...values, id: values.id || nanoid(), updatedAt: new Date().toISOString() } }),
      reducer: (state, { payload }) => {
        if (validateResult(payload)) return;
        const existing = state.records.find((record) => record.id === payload.id);
        const duplicate = state.records.find((record) => resultKey(record) === resultKey(payload));
        if (existing && duplicate && existing.id !== duplicate.id) return;
        const record = existing || duplicate;
        if (record) Object.assign(record, payload, { id: record.id, createdAt: record.createdAt });
        else state.records.push({ ...payload, createdAt: payload.updatedAt });
      },
    },
  },
});
export const { resultSaved } = slice.actions;
export const selectResults = (state) => state.results.records;
export const selectJoinedResults = createSelector([selectResults, selectStudents, selectExams], joinResults);
export default slice.reducer;
