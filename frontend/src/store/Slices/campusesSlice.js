import { createSlice, createAsyncThunk, createSelector, nanoid } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';
import { demoInstitute } from '../../Admins/Institute Admin/instituteData.js';

const normalizeCampus = (c) => {
  const instId =
    typeof c.instituteId === 'object' && c.instituteId !== null
      ? c.instituteId._id || c.instituteId.id
      : c.instituteId || demoInstitute.id;

  const instName =
    typeof c.instituteId === 'object' && c.instituteId !== null
      ? c.instituteId.name
      : c.instituteName || '';

  const loc =
    typeof c.address === 'object' && c.address !== null
      ? [c.address.street, c.address.city, c.address.province].filter(Boolean).join(', ') || c.address.city || ''
      : c.address || c.location || '';

  return {
    ...c,
    id: c._id || c.id,
    instituteId: instId,
    instituteName: instName,
    name: c.name || '',
    address: loc,
    location: loc || c.location || '',
    status: c.status || 'Active',
  };
};

// Async thunks for real API interaction (role-aware: super_admin queries /super-admin/campuses)
export const fetchCampuses = createAsyncThunk(
  'campuses/fetchCampuses',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const role = state.auth?.user?.role;
      const endpoint = role === 'super_admin' ? '/super-admin/campuses' : '/institute-admin/campuses';
      const response = await axiosInstance.get(endpoint, { params });
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
  async (campusData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const role = state.auth?.user?.role;
      const endpoint = role === 'super_admin' ? '/super-admin/campuses' : '/institute-admin/campuses';
      const response = await axiosInstance.post(endpoint, campusData);
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
  async ({ id, ...campusData }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const role = state.auth?.user?.role;
      const endpoint = role === 'super_admin' ? `/super-admin/campuses/${id}` : `/institute-admin/campuses/${id}`;
      const response = await axiosInstance.put(endpoint, campusData);
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
  async (campusId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const role = state.auth?.user?.role;
      const endpoint = role === 'super_admin' ? `/super-admin/campuses/${campusId}` : `/institute-admin/campuses/${campusId}`;
      await axiosInstance.delete(endpoint);
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
        // If no active campus is selected yet or stored active campus is not in payload, select first available
        if (payload.length > 0) {
          const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('eduHubActiveCampusId') : null;
          const currentId = state.activeCampusId || stored;
          const match = payload.find((c) => (c._id || c.id) === currentId);
          state.activeCampusId = match ? (match._id || match.id) : (payload[0]._id || payload[0].id);
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
