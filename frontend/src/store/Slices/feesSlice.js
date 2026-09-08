import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { joinVouchers, validateVoucher } from '../../Admins/Campus Admin/Fees/feeData.js';
import { validDate } from '../../lib/dates.js';
import { selectStudents } from './studentsSlice.js';

const slice = createSlice({
  name: 'fees', initialState: { records: [] },
  reducers: {
    voucherSaved: {
      prepare: (values) => ({ payload: { ...values, id: values.id || nanoid(), updatedAt: new Date().toISOString() } }),
      reducer: (state, { payload }) => {
        if (validateVoucher(payload)) return;
        const record = state.records.find((item) => item.id === payload.id);
        if (record) Object.assign(record, payload, { createdAt: record.createdAt });
        else state.records.push({ ...payload, createdAt: payload.updatedAt });
      },
    },
    voucherMarkedPaid: {
      prepare: ({ id, paymentDate }) => ({ payload: { id, paymentDate, updatedAt: new Date().toISOString() } }),
      reducer: (state, { payload }) => {
        if (!validDate(payload.paymentDate)) return;
        const record = state.records.find((item) => item.id === payload.id);
        if (record && record.paymentStatus !== 'Paid') Object.assign(record, { paymentStatus: 'Paid', paymentDate: payload.paymentDate, updatedAt: payload.updatedAt });
      },
    },
  },
});
export const { voucherSaved, voucherMarkedPaid } = slice.actions;
export const selectFees = (state) => state.fees.records;
export const selectJoinedFees = createSelector([selectFees, selectStudents], joinVouchers);
export default slice.reducer;
