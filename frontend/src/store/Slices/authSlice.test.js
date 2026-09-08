import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import auth, { demoLoggedIn, loggedOut, sessionState } from './authSlice.js';
import { loadDemoState, persistDemoState, authStorageKey } from '../persistence.js';
test('demo session refresh, credential exclusion and logout preserve other data', () => {
  const data = new Map([['eduhub_students', 'unchanged']]);
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const create = () => { const preloaded = loadDemoState(storage); const store = configureStore({ reducer: { auth }, preloadedState: preloaded.auth ? { auth: preloaded.auth } : undefined }); persistDemoState(store, storage); return store; };
  let store = create();
  store.dispatch(demoLoggedIn({ email: ' demo@example.com ', role: 'campus-admin', password: 'never-store-this' }));
  assert.equal(store.getState().auth.isAuthenticated, true);
  assert.ok(!data.get(authStorageKey).includes('password'));
  assert.ok(!data.get(authStorageKey).includes('never-store-this'));
  store = create();
  assert.equal(store.getState().auth.user.email, 'demo@example.com');
  store.dispatch(loggedOut());
  assert.equal(data.has(authStorageKey), false);
  assert.equal(create().getState().auth.isAuthenticated, false);
  assert.equal(data.get('eduhub_students'), 'unchanged');
  for (const bad of ['bad json', JSON.stringify({ version: 1, user: { id: 'x', name: 'X', email: 'x@y.z', role: 'invalid' } }), JSON.stringify({ version: 9, user: {} })]) {
    data.set(authStorageKey, bad);
    assert.equal(create().getState().auth.isAuthenticated, false);
  }
});
test('missing destinations and malformed users cannot create an active session', () => {
  for (const role of ['super-admin', 'institute-admin', 'student', 'bad']) assert.equal(sessionState({ id: '1', name: 'X', email: 'x@y.z', role }).isAuthenticated, false);
});
