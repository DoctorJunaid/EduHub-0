import api from "./axiosInstance.js";

/**
 * Teacher Gradebook & Marks API Client
 * Base path: /api/v1/teacher/gradebook
 */

// GET /api/v1/teacher/gradebook/classes
export const getTeacherGradebookClasses = () =>
  api.get("/teacher/gradebook/classes");

// GET /api/v1/teacher/gradebook/students?classId=&className=&section=
export const getGradebookStudents = (params = {}) =>
  api.get("/teacher/gradebook/students", { params });

// GET /api/v1/teacher/gradebook/exams?className=&section=&subject=
export const getGradebookExams = (params = {}) =>
  api.get("/teacher/gradebook/exams", { params });

// GET /api/v1/teacher/gradebook/results
export const getGradebookResults = (params = {}) =>
  api.get("/teacher/gradebook/results", { params });

// POST /api/v1/teacher/gradebook/results
export const saveGradebookResult = (payload) =>
  api.post("/teacher/gradebook/results", payload);

// DELETE /api/v1/teacher/gradebook/results/:id
export const deleteGradebookResult = (id) =>
  api.delete(`/teacher/gradebook/results/${id}`);
