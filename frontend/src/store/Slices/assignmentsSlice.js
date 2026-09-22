import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/campus-admin/assignments', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignments/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/campus-admin/assignments', data);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create assignment');
    }
  }
);

export const updateAssignment = createAsyncThunk(
  'assignments/update',
  async (data, { rejectWithValue }) => {
    try {
      const id = data._id || data.id;
      const payload = { ...data };
      delete payload._id;
      delete payload.id;
      const response = await axiosInstance.put(`/campus-admin/assignments/${id}`, payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update assignment');
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/campus-admin/assignments/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete assignment');
    }
  }
);

export const submitAssignment = createAsyncThunk(
  'assignments/submit',
  async ({ assignmentId, studentId, notes }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/campus-admin/assignments/${assignmentId}/submit`, {
        studentId,
        notes,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit assignment');
    }
  }
);

export const gradeAssignment = createAsyncThunk(
  'assignments/grade',
  async ({ assignmentId, studentId, score, feedback }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/campus-admin/assignments/${assignmentId}/grade`, {
        studentId,
        score,
        feedback,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to grade submission');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState: {
    records: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    // Legacy local action — kept for backward compatibility
    assignmentSaved(state, { payload }) {
      const existing = state.records.find((r) => r.id === payload.id || r._id === payload._id);
      if (existing) Object.assign(existing, payload);
      else state.records.push(payload);
    },
    assignmentDeleted(state, { payload }) {
      state.records = state.records.filter(
        (r) => r.id !== payload && r._id !== payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAssignments.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAssignments.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        const list = Array.isArray(payload) ? payload : (payload?.data || []);
        state.records = list.map((r) => ({ ...r, id: r._id || r.id }));
      })
      .addCase(fetchAssignments.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      // Create
      .addCase(createAssignment.fulfilled, (state, { payload }) => {
        state.records.unshift({ ...payload, id: payload._id || payload.id });
      })
      // Update
      .addCase(updateAssignment.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex((r) => r._id === id || r.id === id);
        if (index !== -1) state.records[index] = { ...payload, id };
      })
      // Delete
      .addCase(deleteAssignment.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(
          (r) => r._id !== payload && r.id !== payload
        );
      })
      // Submit / Grade — update the record in place
      .addCase(submitAssignment.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex((r) => r._id === id || r.id === id);
        if (index !== -1) state.records[index] = { ...payload, id };
      })
      .addCase(gradeAssignment.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex((r) => r._id === id || r.id === id);
        if (index !== -1) state.records[index] = { ...payload, id };
      });
  },
});

// Submissions slice (kept for backward compat with existing student views)
const submissions = {
  name: 'submissions',
  initialState: { records: [] },
  reducer: (state = { records: [] }, action) => state,
};

export const { assignmentSaved, assignmentDeleted } = assignmentsSlice.actions;
export const selectAssignments = (state) => state.assignments.records;
export const selectAssignmentsStatus = (state) => state.assignments.status;
export default assignmentsSlice.reducer;
export const submissionsReducer = submissions.reducer;

// Legacy exports for backward compatibility with existing student components
export const submissionSaved = () => ({ type: 'submissions/submissionSaved' });
export const submissionGraded = () => ({ type: 'submissions/submissionGraded' });
