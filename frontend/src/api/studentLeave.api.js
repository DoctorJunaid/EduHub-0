import axiosInstance from "./axiosInstance";

/**
 * Student Leave Requests API Service
 */
export const applyStudentLeaveApi = async (data) => {
  const response = await axiosInstance.post("/student/leave-requests", data);
  return response.data;
};

export const getStudentLeavesApi = async () => {
  const response = await axiosInstance.get("/student/leave-requests");
  return response.data;
};

export const getTeacherLeavesApi = async (params = {}) => {
  const response = await axiosInstance.get("/teacher/leave-requests", { params });
  return response.data;
};

export const reviewTeacherLeaveApi = async (id, data) => {
  const response = await axiosInstance.patch(`/teacher/leave-requests/${id}/review`, data);
  return response.data;
};

export const getCampusLeavesApi = async (params = {}) => {
  const response = await axiosInstance.get("/campus-admin/leave-requests", { params });
  return response.data;
};
