import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import broadcasts, { broadcastSaved } from '../../../store/Slices/broadcastsSlice.js';
import { loadDemoState, persistDemoState } from '../../../store/persistence.js';
import { audienceOptions, validateBroadcast } from './broadcastData.js';

test('broadcast validates current audiences and saves a trimmed demo record through persistence', () => {
  const options = audienceOptions([{ id: 'branch', name: 'Branch' }], [], []);
  const values = { audience: 'campus:branch', severity: 'Warning', message: '  Campus meeting  ', createdBy: 'demo-admin' };
  assert.equal(validateBroadcast(values, options), '');
  assert.ok(validateBroadcast({ ...values, audience: 'staff' }, options));
  assert.ok(validateBroadcast({ ...values, severity: 'Unknown' }, options));
  assert.ok(validateBroadcast({ ...values, message: '  ' }, options));
  const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
  const store = configureStore({ reducer: { broadcasts } });
  const unsubscribe = persistDemoState(store, storage);
  store.dispatch(broadcastSaved(values));
  assert.equal(store.getState().broadcasts.records[0].message, 'Campus meeting');
  assert.deepEqual(loadDemoState(storage).broadcasts, store.getState().broadcasts);
  unsubscribe();
});
