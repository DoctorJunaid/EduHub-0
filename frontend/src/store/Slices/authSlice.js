import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';

export const loggedOutState = {
  isAuthenticated: false,
  user: null,
  selectedRole: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

import { roleHome } from '../../auth/roles.js';

export function validSession(user) {
  return Boolean(user && typeof user.id === 'string' && user.id && typeof user.name === 'string' && user.name.trim() && typeof user.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) && roleHome(user.role));
}

export function sessionState(user) {
  if (!validSession(user)) return { ...loggedOutState };
  const { id, name, email, role } = user;
  return { isAuthenticated: true, user: { id, name, email, role }, selectedRole: role, isInitializing: false };
}

// Async thunk for login
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    // Backend returns { success: true, message: "...", data: { token, user } }
    const { token, user } = response.data.data;
    localStorage.setItem('eduHubToken', token);
    return user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Async thunk for validating session on app load
export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data.data;
  } catch {
    return rejectWithValue('Session expired or invalid');
  }
});

// Helper to read cached user
const getCachedUser = () => {
  try {
    const raw = localStorage.getItem('eduHubUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialCachedUser = getCachedUser();

const slice = createSlice({
  name: 'auth',
  initialState: {
    ...loggedOutState,
    isAuthenticated: !!localStorage.getItem('eduHubToken'),
    user: initialCachedUser,
    selectedRole: initialCachedUser?.role || null,
    status: 'idle',
  },
  reducers: {
    demoLoggedIn: (state, { payload }) => {
      const email = typeof payload.email === 'string' ? payload.email.trim() : '';
      state.isAuthenticated = true;
      state.user = { id: `demo:${payload.role}:${email}`, name: email.split('@')[0], email, role: payload.role };
      state.selectedRole = payload.role;
      try {
        localStorage.setItem('eduHubUser', JSON.stringify(state.user));
      } catch {}
    },
    loggedOut: () => {
      localStorage.removeItem('eduHubToken');
      localStorage.removeItem('eduHubUser');
      return { ...loggedOutState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = payload;
        state.selectedRole = payload.role;
        try { localStorage.setItem('eduHubUser', JSON.stringify(payload)); } catch {}
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        // Do not block UI if user is already cached
        if (!state.user) {
          state.status = 'loading';
        }
      })
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = payload;
        state.selectedRole = payload.role;
        try { localStorage.setItem('eduHubUser', JSON.stringify(payload)); } catch {}
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.selectedRole = null;
        localStorage.removeItem('eduHubToken');
        localStorage.removeItem('eduHubUser');
      });
  },
});

export const { demoLoggedIn, loggedOut } = slice.actions;
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentRole = (state) => state.auth.selectedRole;
export default slice.reducer;
