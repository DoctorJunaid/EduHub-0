import { createSelector } from "@reduxjs/toolkit";
import { selectCurrentStudent } from "./studentDashboard.js";
import {
  participantKey,
  validParticipantConversation,
} from "../participantConversations.js";
import { participantMessageSent } from "../Slices/messagesSlice.js";
import axiosInstance from "../../api/axiosInstance.js";

export const selectStudentConversations = createSelector(
  [
    selectCurrentStudent,
    (state) => state.students.records,
    (state) => state.faculty.records,
    (state) => state.messages.records,
  ],
  (student, students, faculty, records) => {
    if (!student) return [];
    const self = participantKey("student", student.id);
    return records
      .filter(
        (record) =>
          validParticipantConversation(record) &&
          record.participantIds.includes(self),
      )
      .map((record) => {
        const peer = record.participantIds.find((id) => id !== self);
        const type = peer.slice(0, peer.indexOf(":"));
        const id = peer.slice(peer.indexOf(":") + 1);
        const participant = (type === "faculty" ? faculty : students).find(
          (person) => person.id === id,
        );
        return {
          ...record,
          self,
          participant,
          name: participant?.name || "Participant unavailable",
          role: type === "faculty" ? "Faculty" : "Student",
          lastMessage: record.messages.at(-1)?.body || "No previous messages",
        };
      })
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  },
);
export const searchStudentConversations = (rows, search) =>
  rows.filter((row) =>
    `${row.name} ${row.role} ${row.lastMessage}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
export const replyToStudentConversation =
  ({ conversationId, body }) =>
  (dispatch, getState) => {
    const state = getState();
    const conversation = selectStudentConversations(state).find(
      (row) => row.id === conversationId,
    );
    if (!state.auth.isAuthenticated || !conversation?.participant)
      return "This conversation is no longer available.";
    if (typeof body !== "string" || !body.trim()) return "Enter a message.";
    dispatch(
      participantMessageSent({
        conversationId,
        senderId: conversation.self,
        receiverId: participantKey(
          conversation.role === "Faculty" ? "faculty" : "student",
          conversation.participant.id,
        ),
        body,
      }),
    );
    return null;
    const message = {
      conversationId,
      senderId: conversation.self,
      body,
    };
    if (!localStorage.getItem("eduHubToken")) {
      dispatch(participantMessageSent(message));
      return null;
    }
    const conversationIdValue = conversationId.replace(/^thread:/, "");
    return axiosInstance
      .post(`/student/conversations/${conversationIdValue}/messages`, {
        body: body.trim(),
      })
      .then(({ data }) => {
        dispatch(
          participantMessageSent({
            ...message,
            id: data.data?.id,
            createdAt: data.data?.createdAt,
          }),
        );
        return null;
      })
      .catch(
        (error) => error.response?.data?.message || "Unable to send message.",
      );
  };
