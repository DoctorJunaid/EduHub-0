import api from "./axios.js"; // your axios instance with baseURL + auth header

export const getStats = (date) =>
  api.get("/campus/attendance/teachers/stats", { params: { date } });

export const listAttendance = (params) =>
  api.get("/campus/attendance/teachers", { params });

export const getWeekly = (date) =>
  api.get("/campus/attendance/teachers/weekly", { params: { date } });

export const getHistory = (page = 1, limit = 20) =>
  api.get("/campus/attendance/teachers/history", {
    params: { page, limit },
  });

export const markAttendance = (payload) =>
  api.post("/campus/attendance/teachers", payload);

export const updateAttendance = (id, payload) =>
  api.put(`/campus/attendance/teachers/${id}`, payload);

export const deleteAttendance = (id) =>
  api.delete(`/campus/attendance/teachers/${id}`);