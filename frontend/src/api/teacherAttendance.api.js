import api from "./axiosInstance.js";

/**
 * Teacher & Staff Attendance API client
 * Base path: /api/v1/campus/attendance/teachers
 */

// GET /api/v1/campus/attendance/teachers/stats?date=YYYY-MM-DD
export const getStats = (date) =>
  api.get("/campus/attendance/teachers/stats", { params: { date } });

// GET /api/v1/campus/attendance/teachers?date=&status=&department=&search=
export const listAttendance = (params = {}) =>
  api.get("/campus/attendance/teachers", { params });

// GET /api/v1/campus/attendance/teachers/weekly?date=
export const getWeekly = (date) =>
  api.get("/campus/attendance/teachers/weekly", { params: { date } });

// GET /api/v1/campus/attendance/teachers/history?page=&limit=
export const getHistory = (params = {}) =>
  api.get("/campus/attendance/teachers/history", { params });

// POST /api/v1/campus/attendance/teachers
export const markAttendance = (payload) =>
  api.post("/campus/attendance/teachers", payload);

// POST /api/v1/campus/attendance/teachers/checkin
export const checkIn = (teacherProfileId) =>
  api.post("/campus/attendance/teachers/checkin", { teacherProfileId });

// POST /api/v1/campus/attendance/teachers/checkout
export const checkOut = (teacherProfileId) =>
  api.post("/campus/attendance/teachers/checkout", { teacherProfileId });

// PUT /api/v1/campus/attendance/teachers/:id
export const updateAttendance = (id, payload) =>
  api.put(`/campus/attendance/teachers/${id}`, payload);

// DELETE /api/v1/campus/attendance/teachers/:id
export const deleteAttendance = (id) =>
  api.delete(`/campus/attendance/teachers/${id}`);