import api from "./axiosInstance.js";

/**
 * Teacher Daily Diary API client
 * Base path: /api/v1/teacher/diary
 */

// GET /api/v1/teacher/diary/classes
export const getTeacherDiaryClasses = () =>
  api.get("/teacher/diary/classes");

// GET /api/v1/teacher/diary
export const getTeacherDiaryEntries = (params = {}) =>
  api.get("/teacher/diary", { params });

// GET /api/v1/teacher/diary/:id
export const getDiaryEntryById = (id) =>
  api.get(`/teacher/diary/${id}`);

// POST /api/v1/teacher/diary
export const createDiaryEntry = (payload) =>
  api.post("/teacher/diary", payload);

// PUT /api/v1/teacher/diary/:id
export const updateDiaryEntry = (id, payload) =>
  api.put(`/teacher/diary/${id}`, payload);

// DELETE /api/v1/teacher/diary/:id
export const deleteDiaryEntry = (id) =>
  api.delete(`/teacher/diary/${id}`);
