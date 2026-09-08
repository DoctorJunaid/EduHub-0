import { createSlice, nanoid } from '@reduxjs/toolkit';
import { demoInstitute } from '../../Admins/Institute Admin/instituteData.js';
import { validBroadcasts } from '../../Admins/Institute Admin/Alerts/broadcastData.js';

const slice = createSlice({
  name: 'broadcasts', initialState: { records: [] },
  reducers: {
    broadcastSaved: {
      prepare({ audience, severity, message, createdBy }) {
        return { payload: { id: nanoid(), instituteId: demoInstitute.id, audience, severity, message: typeof message === 'string' ? message.trim() : '', createdBy, createdAt: new Date().toISOString() } };
      },
      reducer(state, { payload }) {
        if (payload.instituteId === demoInstitute.id && validBroadcasts([payload])) state.records.push(payload);
      },
    },
  },
});
export const { broadcastSaved } = slice.actions;
export default slice.reducer;
