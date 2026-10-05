import api from "./axiosInstance.js";

/**
 * Teacher Assignments & Grading API Client
 * Base path: /api/v1/teacher/assignments
 */

export const getTeacherClasses = () =>
  api.get("/teacher/assignments/classes");

export const getTeacherAssignments = (params = {}) =>
  api.get("/teacher/assignments", { params });

export const createAssignment = (payload) =>
  api.post("/teacher/assignments", payload);

export const updateAssignment = (id, payload) =>
  api.put(`/teacher/assignments/${id}`, payload);

export const deleteAssignment = (id) =>
  api.delete(`/teacher/assignments/${id}`);

export const getAssignmentSubmissions = (id) =>
  api.get(`/teacher/assignments/${id}/submissions`);

export const gradeSubmission = (id, payload) =>
  api.post(`/teacher/assignments/${id}/grade`, payload);

export const submitAssignment = (id, payload) =>
  api.post(`/teacher/assignments/${id}/submit`, payload);
