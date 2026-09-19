import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';

export const fetchActivityLogs = createAsyncThunk(
  'activityLogs/fetchAll',
  async ({ category, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const params = { limit };
      if (category && category !== 'all') params.category = category;
      const response = await axiosInstance.get('/campus-admin/activity-logs', { params });
      return response.data.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity logs');
    }
  }
);

const activityLogSlice = createSlice({
  name: 'activityLogs',
  initialState: {
    logs: [],
    status: 'idle',
    error: null,
    total: 0,
  },
  reducers: {
    // Optimistic push: lets the frontend add a log immediately without waiting for refetch
    pushLog(state, action) {
      state.logs.unshift(action.payload);
      state.total += 1;
    },
    clearLogs(state) {
      state.logs = [];
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.logs = Array.isArray(action.payload) ? action.payload : [];
        state.total = state.logs.length;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { pushLog, clearLogs } = activityLogSlice.actions;

export const selectActivityLogs = (state) => state.activityLogs?.logs || [];
export const selectActivityLogsStatus = (state) => state.activityLogs?.status || 'idle';

export default activityLogSlice.reducer;
