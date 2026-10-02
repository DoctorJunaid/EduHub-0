import { createSlice, createAsyncThunk, createSelector, nanoid } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';
import { demoInstitute } from '../../Admins/Institute Admin/instituteData.js';

const normalizeCampus = (c) => ({
  ...c,
  id: c._id || c.id,
  instituteId: c.instituteId || demoInstitute.id,
  name: c.name || '',
  address: c.address || '',
  status: c.status || 'Active',
});

// Async thunks for real API interaction
export const fetchCampuses = createAsyncThunk(
  'campuses/fetchCampuses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/institute-admin/campuses');
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data.map(normalizeCampus) : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch campuses'
      );
    }
  }
);

export const createCampus = createAsyncThunk(
  'campuses/createCampus',
  async (campusData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/institute-admin/campuses', campusData);
      const data = response.data?.data || response.data;
      return normalizeCampus(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create campus'
      );
    }
  }
);

export const updateCampus = createAsyncThunk(
  'campuses/updateCampus',
  async ({ id, ...campusData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/institute-admin/campuses/${id}`, campusData);
      const data = response.data?.data || response.data;
      return normalizeCampus(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update campus'
      );
    }
  }
);

export const deleteCampus = createAsyncThunk(
  'campuses/deleteCampus',
  async (campusId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/institute-admin/campuses/${campusId}`);
      return campusId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete campus'
      );
    }
  }
);

const slice = createSlice({
  name: 'campuses',
  initialState: {
    records: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    campusAdded: {
      prepare: (values) => ({ payload: { ...values, id: values.id || nanoid() } }),
      reducer: (state, { payload }) => {
        state.records.push(normalizeCampus(payload));
      },
    },
    campusUpdated: (state, { payload }) => {
      const index = state.records.findIndex((r) => r.id === payload.id);
      if (index !== -1) {
        state.records[index] = normalizeCampus({ ...state.records[index], ...payload });
      }
    },
    campusDeleted: (state, { payload }) => {
      state.records = state.records.filter((r) => r.id !== payload);
      if (state.activeCampusId === payload) {
        state.activeCampusId = null;
        if (typeof localStorage !== 'undefined') localStorage.removeItem('eduHubActiveCampusId');
      }
    },
    activeCampusChanged: (state, { payload }) => {
      state.activeCampusId = payload;
      if (typeof localStorage !== 'undefined') {
        if (payload) {
          localStorage.setItem('eduHubActiveCampusId', payload);
        } else {
          localStorage.removeItem('eduHubActiveCampusId');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCampuses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCampuses.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.records = payload;
        // If no active campus is selected yet and campuses exist, auto-select first one
        if (!state.activeCampusId && payload.length > 0) {
          const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('eduHubActiveCampusId') : null;
          const match = payload.find(c => c.id === stored);
          state.activeCampusId = match ? match.id : payload[0].id;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('eduHubActiveCampusId', state.activeCampusId);
          }
        }
      })
      .addCase(fetchCampuses.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      // Create
      .addCase(createCampus.fulfilled, (state, { payload }) => {
        state.records.unshift(payload);
      })
      // Update
      .addCase(updateCampus.fulfilled, (state, { payload }) => {
        const index = state.records.findIndex((r) => r.id === payload.id);
        if (index !== -1) {
          state.records[index] = payload;
        }
      })
      // Delete
      .addCase(deleteCampus.fulfilled, (state, { payload }) => {
        state.records = state.records.filter((r) => r.id !== payload);
      });
  },
});

export const { campusAdded, campusUpdated, campusDeleted, activeCampusChanged } = slice.actions;
export const selectInstituteCampuses = (state) => state.campuses.records;
export const selectCampusesStatus = (state) => state.campuses.status;
export const selectCampusesError = (state) => state.campuses.error;
export const selectActiveCampusId = (state) =>
  state.campuses.activeCampusId ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem('eduHubActiveCampusId') : null);

export default slice.reducer;
