import axiosInstance from "./axiosInstance";

/**
 * Student Portal API Service
 */
export const getStudentPortalApi = async () => {
  const response = await axiosInstance.get("/student/portal");
  return response.data;
};

export const getStudentSubjectsApi = async () => {
  const response = await axiosInstance.get("/student/subjects");
  return response.data;
};

export const getStudentFeesApi = async () => {
  const response = await axiosInstance.get("/student/fees");
  return response.data;
};

export const submitStudentAssignmentApi = async (assignmentId, data) => {
  const response = await axiosInstance.post(
    `/student/assignments/${assignmentId}/submission`,
    data
  );
  return response.data;
};

export const submitStudentFeePaymentApi = async (voucherId, data) => {
  const response = await axiosInstance.post(
    `/student/fees/${voucherId}/submit-payment`,
    data
  );
  return response.data;
};

export const sendStudentMessageApi = async (conversationId, data) => {
  const response = await axiosInstance.post(
    `/student/conversations/${conversationId}/messages`,
    data
  );
  return response.data;
};
