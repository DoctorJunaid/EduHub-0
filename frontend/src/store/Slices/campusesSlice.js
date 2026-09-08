import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { initialCampuses, validateCampus } from '../../Admins/Institute Admin/Campuses/campusData.js';
import { demoInstitute } from '../../Admins/Institute Admin/instituteData.js';
const slice = createSlice({ name: 'campuses', initialState: { records: initialCampuses }, reducers: {
  campusAdded: {
    prepare: (values) => ({ payload: { ...values, id: nanoid(), instituteId: demoInstitute.id } }),
    reducer: (state, { payload }) => {
      if (validateCampus(payload)) return;
      state.records.push({ id: payload.id, instituteId: payload.instituteId, name: payload.name.trim(), address: payload.address.trim(), status: payload.status });
    },
  },
  campusUpdated: (state, { payload }) => {
    const campus = state.records.find((record) => record.id === payload.id && record.instituteId === demoInstitute.id);
    if (campus && !validateCampus(payload)) Object.assign(campus, { name: payload.name.trim(), address: payload.address.trim(), status: payload.status });
  },
  campusDeleted: (state, { payload }) => { state.records = state.records.filter((record) => record.id !== payload || record.instituteId !== demoInstitute.id); },
} });
export const { campusAdded, campusUpdated, campusDeleted } = slice.actions;
export const selectInstituteCampuses = createSelector([(state) => state.campuses.records], (records) => records.filter((record) => record.instituteId === demoInstitute.id));
export default slice.reducer;
