import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import auth, { demoLoggedIn } from '../Slices/authSlice.js';
import students from '../Slices/studentsSlice.js';
import faculty from '../Slices/facultySlice.js';
import messages, { messageSent, participantMessageSent, selectConversations, validConversations } from '../Slices/messagesSlice.js';
import { selectStudentConversations, searchStudentConversations, replyToStudentConversation } from './studentMessages.js';
import { loadDemoState, persistDemoState } from '../persistence.js';
import { participantConversationId } from '../participantConversations.js';
const reducer = { auth, students, faculty, messages };
const thread = { id: 'thread:test', participantIds: ['student:student-demo-1', 'faculty:faculty-demo-1'], messages: [], updatedAt: '2026-09-10T00:00:00.000Z' };
const student = { id: 'student-demo-1', name: 'Ali Raza', roll: 'NUST-CS-2023-042', email: 'ali.raza@nust.edu.pk', studentPhone: '03001234567', program: 'BS Computer Science', section: 'CS-4A', semester: '4th Semester', subjects: 'Advanced Web Design', campus: 'Main Campus', status: 'Active', guardian: 'Raza Khan', guardianPhone: '03007654321', initials: 'AR' };
const facultyMember = { id: 'faculty-demo-1', name: 'Dr. Usman Khan', email: 'dr.usman@nu.edu.pk', designation: 'Associate Professor', qualification: 'Ph.D.', department: 'Computer Science', phone: '03000000000', subjects: 'Advanced Web Design', campus: 'Main Campus', status: 'Active', initials: 'UK' };
const create = (records = [thread]) => {
  const store = configureStore({
    reducer,
    preloadedState: {
      students: { records: [student] },
      faculty: { records: [facultyMember] },
      messages: { records },
    },
  });
  store.dispatch(demoLoggedIn({ role: 'student', email: student.email }));
  return store;
};
test('Student inbox excludes legacy anonymous messages and other participants, with no invented contacts', () => {
  const store = create([thread, { ...thread, id: 'thread:other', participantIds: ['student:student-demo-2', 'faculty:faculty-demo-1'] }]);
  store.dispatch(messageSent({ participantType: 'student', participantId: 'student-demo-1', body: 'Private legacy content' }));
  assert.deepEqual(selectStudentConversations(store.getState()).map((row) => row.id), ['thread:test']);
  assert.equal(store.dispatch(replyToStudentConversation({ conversationId: 'thread:other', body: 'No access' })), 'This conversation is no longer available.');
  assert.deepEqual(selectStudentConversations(create([]).getState()), []);
  store.dispatch(demoLoggedIn({ role: 'student', email: 'unknown@example.com' }));
  assert.deepEqual(selectStudentConversations(store.getState()), []);
});
test('replies trim, reject blanks, preserve identity and update search/preview without changing legacy views', () => {
  const store = create();
  assert.ok(store.dispatch(replyToStudentConversation({ conversationId: thread.id, body: '  ' })));
  assert.equal(store.dispatch(replyToStudentConversation({ conversationId: thread.id, body: '  My question  ' })), null);
  const rows = selectStudentConversations(store.getState());
  assert.equal(rows[0].lastMessage, 'My question');
  assert.equal(rows[0].messages[0].senderId, 'student:student-demo-1');
  assert.equal(searchStudentConversations(rows, 'FACULTY').length, 1);
  assert.equal(searchStudentConversations(rows, 'QUESTION').length, 1);
  assert.equal(searchStudentConversations(rows, 'no-match').length, 0);
  assert.ok(selectConversations(store.getState()).every((row) => !row.messages.length));
});
test('participant conversations persist alongside legacy records and reject forged senders', () => {
  const store = create(); const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const unsubscribe = persistDemoState(store, storage);
  store.dispatch(replyToStudentConversation({ conversationId: thread.id, body: 'Persist this' }));
  store.dispatch(messageSent({ participantType: 'faculty', participantId: 'faculty-demo-1', body: 'Legacy' }));
  const { demoLifecycle: _demoLifecycle, ...persistedState } = loadDemoState(storage);
  const restored = configureStore({ reducer, preloadedState: persistedState });
  assert.equal(selectStudentConversations(restored.getState())[0].lastMessage, 'Persist this');
  assert.equal(restored.getState().messages.records.length, 2);
  const saved = restored.getState().messages.records[0];
  assert.equal(validConversations([{ ...saved, messages: [{ ...saved.messages[0], senderId: 'student:unrelated' }] }]), false);
  assert.equal(validConversations([{ ...saved, participantIds: ['student:student-demo-1', 'student:student-demo-1'] }]), false);
  unsubscribe();
});

test("Teacher and Student messages share one persisted participant conversation", () => {
  const store = create([]);
  const conversationId = participantConversationId([
    "faculty:faculty-demo-1",
    "student:student-demo-1",
  ]);
  store.dispatch(participantMessageSent({
    conversationId,
    senderId: "faculty:faculty-demo-1",
    receiverId: "student:student-demo-1",
    body: "Assignment feedback is ready.",
  }));
  assert.equal(store.getState().messages.records.length, 1);
  let conversation = store.getState().messages.records[0];
  assert.equal(conversation.messages[0].receiverId, "student:student-demo-1");

  store.dispatch(participantMessageSent({
    conversationId,
    senderId: "student:student-demo-1",
    receiverId: "faculty:faculty-demo-1",
    body: "Thank you.",
  }));
  conversation = store.getState().messages.records[0];
  assert.equal(conversation.messages.length, 2);
  assert.equal(conversation.messages[1].senderId, "student:student-demo-1");
  assert.equal(conversation.messages[1].receiverId, "faculty:faculty-demo-1");
  assert.equal(validConversations([conversation]), true);

  store.dispatch(participantMessageSent({
    conversationId,
    senderId: "faculty:faculty-unrelated",
    receiverId: "student:student-demo-1",
    body: "Forged sender.",
  }));
  assert.equal(store.getState().messages.records[0].messages.length, 2);
});
