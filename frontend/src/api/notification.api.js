/**
 * Notification API Client
 * Wraps all endpoints for in-app and push notifications.
 */
import axiosInstance from "./axiosInstance";

export const getNotificationsApi = async (params = {}) => {
  const res = await axiosInstance.get("/notifications", { params });
  return res.data;
};

export const markNotificationReadApi = async (id) => {
  const res = await axiosInstance.put(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsReadApi = async () => {
  const res = await axiosInstance.put("/notifications/read-all");
  return res.data;
};

export const deleteNotificationApi = async (id) => {
  const res = await axiosInstance.delete(`/notifications/${id}`);
  return res.data;
};

export const sendTestNotificationApi = async (payload = {}) => {
  const res = await axiosInstance.post("/notifications/test", payload);
  return res.data;
};

export default {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  sendTestNotificationApi,
};
