import { createSlice } from '@reduxjs/toolkit';
import { roleHome } from '../../auth/roles.js';
export const loggedOutState = { isAuthenticated: false, user: null, selectedRole: null, isInitializing: false };
export function validSession(user) {
  return Boolean(user && typeof user.id === 'string' && user.id && typeof user.name === 'string' && user.name.trim() && typeof user.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) && roleHome(user.role));
}
export function sessionState(user) {
  if (!validSession(user)) return { ...loggedOutState };
  const { id, name, email, role } = user;
  return { isAuthenticated: true, user: { id, name, email, role }, selectedRole: role, isInitializing: false };
}
const slice = createSlice({ name: 'auth', initialState: loggedOutState, reducers: {
  demoLoggedIn: (state, { payload }) => {
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    return sessionState({ id: `demo:${payload.role}:${email}`, name: email.split('@')[0], email, role: payload.role });
  },
  loggedOut: () => ({ ...loggedOutState }),
} });
export const { demoLoggedIn, loggedOut } = slice.actions;
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentRole = (state) => state.auth.selectedRole;
export default slice.reducer;
