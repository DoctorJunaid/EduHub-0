import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';

export const fetchTimetable = createAsyncThunk('timetable/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/campus-admin/timetables");
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch timetable");
  }
});

export const scheduleClass = createAsyncThunk('timetable/add', async (scheduleData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/campus-admin/timetables", scheduleData);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to schedule class");
  }
});

export const updateScheduledClass = createAsyncThunk('timetable/update', async (scheduleData, { rejectWithValue }) => {
  try {
    const id = scheduleData.id || scheduleData._id;
    const data = { ...scheduleData };
    delete data.id;
    delete data._id;
    const response = await axiosInstance.put(`/campus-admin/timetables/${id}`, data);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update class schedule");
  }
});

export const deleteScheduledClass = createAsyncThunk('timetable/delete', async (scheduleId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/campus-admin/timetables/${scheduleId}`);
    return scheduleId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete class schedule");
  }
});

const slice = createSlice({
  name: 'timetable',
  initialState: {
    records: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimetable.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTimetable.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.records = payload.map(record => ({
          ...record,
          id: record._id || record.id
        }));
      })
      .addCase(fetchTimetable.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      .addCase(scheduleClass.fulfilled, (state, { payload }) => {
        state.records.push({ ...payload, id: payload._id || payload.id });
      })
      .addCase(updateScheduledClass.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex(r => r.id === id);
        if (index !== -1) {
          state.records[index] = { ...state.records[index], ...payload, id };
        }
      })
      .addCase(deleteScheduledClass.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(r => r.id !== payload && r._id !== payload);
      });
  }
});

export const selectTimetable = (state) => state.timetable.records;
export default slice.reducer;
