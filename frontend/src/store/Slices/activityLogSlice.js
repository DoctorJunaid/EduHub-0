import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';

export const fetchActivityLogs = createAsyncThunk(
  'activityLogs/fetchAll',
  async ({ category, page = 1, limit = 8, append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (category && category !== 'all') params.category = category;
      const response = await axiosInstance.get('/campus-admin/activity-logs', { params });
      const payload = response.data;
      return {
        data: payload.data || payload || [],
        page: payload.page || page,
        hasMore: payload.hasMore ?? false,
        total: payload.total || 0,
        append,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity logs');
    }
  }
);

const activityLogSlice = createSlice({
  name: 'activityLogs',
  initialState: {
    logs: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    isFetchingMore: false,
    error: null,
    total: 0,
    page: 1,
    hasMore: true,
  },
  reducers: {
    pushLog(state, action) {
      // Optimistic prepend for live events
      const exists = state.logs.some((l) => (l._id || l.id) === (action.payload._id || action.payload.id));
      if (!exists) {
        state.logs.unshift(action.payload);
        state.total += 1;
      }
    },
    clearLogs(state) {
      state.logs = [];
      state.total = 0;
      state.page = 1;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state, action) => {
        const isAppend = action.meta.arg?.append;
        if (isAppend) {
          state.isFetchingMore = true;
        } else {
          state.status = 'loading';
        }
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isFetchingMore = false;
        const { data, page, hasMore, total, append } = action.payload;

        state.page = page;
        state.hasMore = hasMore;
        state.total = total;

        if (append) {
          // Filter out any duplicates
          const existingIds = new Set(state.logs.map((l) => l._id || l.id));
          const newEntries = data.filter((l) => !existingIds.has(l._id || l.id));
          state.logs = [...state.logs, ...newEntries];
          if (newEntries.length === 0 || data.length < (action.meta.arg?.limit || 8)) {
            state.hasMore = false;
          }
        } else {
          state.logs = data;
          if (data.length === 0 || data.length < (action.meta.arg?.limit || 8)) {
            state.hasMore = false;
          }
        }
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.status = 'failed';
        state.isFetchingMore = false;
        state.error = action.payload;
      });
  },
});

export const { pushLog, clearLogs } = activityLogSlice.actions;

export const selectActivityLogs = (state) => state.activityLogs?.logs || [];
export const selectActivityLogsStatus = (state) => state.activityLogs?.status || 'idle';
export const selectActivityLogsHasMore = (state) => state.activityLogs?.hasMore ?? false;
export const selectActivityLogsIsFetchingMore = (state) => state.activityLogs?.isFetchingMore ?? false;
export const selectActivityLogsPage = (state) => state.activityLogs?.page || 1;

export default activityLogSlice.reducer;
