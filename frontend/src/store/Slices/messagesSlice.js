import { createSelector, createSlice, nanoid } from "@reduxjs/toolkit";
import { validParticipantConversation } from "../participantConversations.js";

// A local sender marker, not an invented authenticated account.
export const LOCAL_SENDER_ID = "local-demo-sender";
export const conversationIdFor = (type, id) => `${type}:${id}`;
const slice = createSlice({
  name: "messages",
  initialState: { records: [] },
  reducers: {
    conversationsLoaded: (state, { payload }) => {
      state.records = Array.isArray(payload) ? payload : [];
    },
    participantMessageSent: {
      prepare: ({ conversationId, senderId, body }) => ({
        payload: {
          conversationId,
          senderId,
          body: typeof body === "string" ? body.trim() : "",
          id: nanoid(),
          createdAt: new Date().toISOString(),
        },
      }),
      reducer: (state, { payload }) => {
        const conversation = state.records.find(
          (record) => record.id === payload.conversationId,
        );
        if (
          !payload.body ||
          !validParticipantConversation(conversation) ||
          !conversation.participantIds.includes(payload.senderId)
        )
          return;
        const receiverId = conversation.participantIds.find(
          (id) => id !== payload.senderId,
        );
        const createdAt = new Date(
          Math.max(
            Date.parse(payload.createdAt),
            Date.parse(conversation.updatedAt),
          ),
        ).toISOString();
        conversation.messages.push({
          id: payload.id,
          conversationId: conversation.id,
          senderId: payload.senderId,
          receiverId,
          body: payload.body,
          createdAt,
        });
        conversation.updatedAt = createdAt;
      },
    },
    messageSent: {
      prepare: ({ participantId, participantType, body }) => ({
        payload: {
          participantId,
          participantType,
          body: typeof body === "string" ? body.trim() : "",
          id: nanoid(),
          createdAt: new Date().toISOString(),
        },
      }),
      reducer: (state, { payload }) => {
        if (
          !payload.body ||
          !payload.participantId ||
          !["student", "faculty"].includes(payload.participantType)
        )
          return;
        const conversationId = conversationIdFor(
          payload.participantType,
          payload.participantId,
        );
        let conversation = state.records.find(
          (record) => record.id === conversationId,
        );
        if (!conversation) {
          conversation = {
            id: conversationId,
            participantId: payload.participantId,
            participantType: payload.participantType,
            messages: [],
            updatedAt: payload.createdAt,
          };
          state.records.push(conversation);
          conversation = state.records.at(-1);
        }
        conversation.messages.push({
          id: payload.id,
          conversationId,
          senderId: LOCAL_SENDER_ID,
          receiverId: payload.participantId,
          body: payload.body,
          createdAt: payload.createdAt,
        });
        conversation.updatedAt = payload.createdAt;
      },
    },
  },
});
export const { conversationsLoaded, messageSent, participantMessageSent } =
  slice.actions;
export default slice.reducer;

export const selectConversations = createSelector(
  [
    (state) => state.students.records,
    (state) => state.faculty.records,
    (state) => state.messages.records,
  ],
  (students, faculty, records) =>
    [
      ...faculty.map((participant) => ({
        participant,
        participantType: "faculty",
      })),
      ...students.map((participant) => ({
        participant,
        participantType: "student",
      })),
    ]
      .map(({ participant, participantType }) => {
        const id = conversationIdFor(participantType, participant.id);
        const saved = records.find((record) => record.id === id);
        const messages = saved?.messages ?? [];
        return {
          id,
          participantId: participant.id,
          participantType,
          participant,
          messages,
          lastMessage: messages.at(-1)?.body ?? "",
          updatedAt: saved?.updatedAt ?? null,
        };
      })
      .sort(
        (a, b) =>
          (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
      ),
);

export function filterConversations(conversations, search) {
  const query = search.trim().toLowerCase();
  return conversations.filter(({ participant, lastMessage }) =>
    `${participant.name} ${participant.email} ${lastMessage}`
      .toLowerCase()
      .includes(query),
  );
}

export function validConversations(records) {
  if (!Array.isArray(records)) return false;
  const ids = new Set(),
    messageIds = new Set();
  return records.every((record) => {
    if (record?.participantIds !== undefined) {
      if (
        !validParticipantConversation(record) ||
        ids.has(record.id) ||
        record.messages.some((message) => messageIds.has(message.id))
      )
        return false;
      ids.add(record.id);
      record.messages.forEach((message) => messageIds.add(message.id));
      return true;
    }
    if (
      !record ||
      !["student", "faculty"].includes(record.participantType) ||
      typeof record.participantId !== "string" ||
      !record.participantId ||
      record.id !==
        conversationIdFor(record.participantType, record.participantId) ||
      ids.has(record.id) ||
      !Array.isArray(record.messages) ||
      !Number.isFinite(Date.parse(record.updatedAt))
    )
      return false;
    ids.add(record.id);
    let previousTime = -Infinity;
    return record.messages.every((message) => {
      if (
        !message ||
        typeof message.id !== "string" ||
        !message.id ||
        messageIds.has(message.id) ||
        message.conversationId !== record.id ||
        typeof message.body !== "string" ||
        !message.body.trim() ||
        typeof message.createdAt !== "string" ||
        !Number.isFinite(Date.parse(message.createdAt))
      )
        return false;
      if (
        !(
          (message.senderId === LOCAL_SENDER_ID &&
            message.receiverId === record.participantId) ||
          (message.senderId === record.participantId &&
            message.receiverId === LOCAL_SENDER_ID)
        )
      )
        return false;
      const time = Date.parse(message.createdAt);
      if (time < previousTime || time > Date.parse(record.updatedAt))
        return false;
      previousTime = time;
      messageIds.add(message.id);
      return true;
    });
  });
}
