import api from "./axiosInstance.js";

/**
 * Teacher Class Session & Credit API client
 * Base path: /api/v1/campus/class-sessions
 */

// Teacher Portal Endpoints
export const getTodayClasses = () =>
  api.get("/campus/class-sessions/today-classes");

export const getMySessions = (params = {}) =>
  api.get("/campus/class-sessions/my-sessions", { params });

export const getMySummary = (params = {}) =>
  api.get("/campus/class-sessions/my-summary", { params });

export const markSessionStatus = (id, payload) =>
  api.patch(`/campus/class-sessions/${id}/status`, payload);

export const requestDispute = (id, payload) =>
  api.post(`/campus/class-sessions/${id}/dispute`, payload);

// Campus Manager Portal Endpoints
export const generateSessions = (payload = {}) =>
  api.post("/campus/class-sessions/generate", payload);

export const getCampusPerformance = (params = {}) =>
  api.get("/campus/class-sessions/performance", { params });

export const getSalaryReviewCenter = (params = {}) =>
  api.get("/campus/class-sessions/review-center", { params });

export const resolveDispute = (id, payload) =>
  api.post(`/campus/class-sessions/${id}/resolve-dispute`, payload);

export const reviewAdjustment = (id, payload) =>
  api.post(`/campus/class-sessions/${id}/review-adjustment`, payload);

export const assignSubstituteToSession = (id, payload) =>
  api.post(`/campus/class-sessions/${id}/substitute`, payload);

export const getTeacherTimeline = (teacherId, params = {}) =>
  api.get(`/campus/class-sessions/timeline/${teacherId}`, { params });

export const getTeachingConfig = () =>
  api.get("/campus/class-sessions/config");

export const updateTeachingConfig = (payload) =>
  api.put("/campus/class-sessions/config", payload);
