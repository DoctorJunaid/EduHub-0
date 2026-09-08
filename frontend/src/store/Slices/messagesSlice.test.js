import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import messages, { filterConversations, messageSent, selectConversations } from './messagesSlice.js';
import students, { studentUpdated, studentDeleted } from './studentsSlice.js';
import faculty from './facultySlice.js';
import { loadDemoState, persistDemoState, storageKeys } from '../persistence.js';

const setup = () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const create = () => {
    const store = configureStore({ reducer: { messages, students, faculty }, preloadedState: loadDemoState(storage) });
    persistDemoState(store, storage);
    return store;
  };
  return { storage, create };
};
test('send trims, isolates histories, sorts, searches and survives refresh', () => {
  const { create } = setup();
  let store = create();
  const contacts = selectConversations(store.getState());
  const target = contacts.at(-1);
  const send = (body) => messageSent({ ...target, body });
  store.dispatch(send('  \n '));
  assert.equal(store.getState().messages.records.length, 0);
  store.dispatch(send('  Hello\nthere  '));
  store = create();
  const conversations = selectConversations(store.getState());
  assert.equal(conversations[0].id, target.id);
  assert.equal(conversations[0].lastMessage, 'Hello\nthere');
  assert.equal(conversations[0].messages.length, 1);
  assert.ok(conversations.slice(1).every((row) => row.messages.length === 0));
  assert.equal(filterConversations(conversations, ' HELLO ').length, 1);
  assert.ok(filterConversations(conversations, target.participant.name).some((row) => row.id === target.id));
  assert.equal(filterConversations(conversations, 'no-such-contact').length, 0);
});
test('directory edits propagate; deleted participants do not leave sendable contacts', () => {
  const { create } = setup(); const store = create();
  const student = store.getState().students.records[0];
  store.dispatch(studentUpdated({ ...student, name: 'Updated Name', email: 'updated@example.test' }));
  assert.equal(filterConversations(selectConversations(store.getState()), 'updated@example.test')[0].participant.name, 'Updated Name');
  store.dispatch(studentDeleted(student.id));
  assert.ok(selectConversations(store.getState()).every((row) => row.participantId !== student.id));
});
test('malformed persisted conversations and messages fall back safely', () => {
  const { create, storage } = setup(); const store = create();
  store.dispatch(messageSent({ ...selectConversations(store.getState())[0], body: 'Hello' }));
  const record = store.getState().messages.records[0];
  for (const invalid of ['broken json', JSON.stringify({ version: 1, records: [{}] }), JSON.stringify({ version: 1, records: [record, record] }), JSON.stringify({ version: 1, records: [{ ...record, messages: [{ ...record.messages[0], createdAt: 'invalid' }] }] }), JSON.stringify({ version: 1, records: [{ ...record, messages: [{ ...record.messages[0], receiverId: 'wrong' }] }] })]) {
    storage.setItem(storageKeys.messages, invalid);
    assert.deepEqual(create().getState().messages.records, []);
  }
});
