import axiosInstance from "./axiosInstance";

/**
 * Result Compilation & Report Card API Client
 */

// 1. Get Class Results Grid (Full matrix for Class Teacher)
export const getClassResultsGrid = async (params = {}) => {
  const res = await axiosInstance.get("/campus/teachers/me/class/results", { params });
  return res.data;
};

// 2. Remind Subject Teacher to enter marks
export const remindSubjectTeacher = async (teacherId, payload) => {
  const res = await axiosInstance.post(
    `/campus/teachers/me/class/results/remind/${teacherId}`,
    payload
  );
  return res.data;
};

// 3. Compile Class Results
export const compileClassResults = async (payload) => {
  const res = await axiosInstance.post(
    "/campus/teachers/me/class/results/compile",
    payload
  );
  return res.data;
};

// 4. Save Student Remarks
export const saveStudentRemarks = async (studentId, payload) => {
  const res = await axiosInstance.post(
    `/campus/teachers/me/class/results/student/${studentId}/remarks`,
    payload
  );
  return res.data;
};

// 5. Submit Class Results to Admin for Approval
export const submitClassResultsForApproval = async (payload) => {
  const res = await axiosInstance.post(
    "/campus/teachers/me/class/results/submit",
    payload
  );
  return res.data;
};

// 6. Campus Admin: Get Pending Approvals
export const getPendingApprovals = async () => {
  const res = await axiosInstance.get("/campus/results/pending-approval");
  return res.data;
};

// 7. Campus Admin: Approve Class Results
export const approveClassResults = async (payload) => {
  const res = await axiosInstance.post("/campus/results/approve", payload);
  return res.data;
};

// 8. Campus Admin: Reject Class Results
export const rejectClassResults = async (payload) => {
  const res = await axiosInstance.post("/campus/results/reject", payload);
  return res.data;
};

// 9. Campus Admin: Publish Class Results & Report Cards
export const publishClassResults = async (classId, payload) => {
  const res = await axiosInstance.post(
    `/campus/results/${classId}/publish`,
    payload
  );
  return res.data;
};

// 10. Student / Parent / Admin: Get Published Report Cards
export const getMyReportCards = async (params = {}) => {
  const res = await axiosInstance.get("/student/results/my-report-cards", { params });
  return res.data;
};

export default {
  getClassResultsGrid,
  remindSubjectTeacher,
  compileClassResults,
  saveStudentRemarks,
  submitClassResultsForApproval,
  getPendingApprovals,
  approveClassResults,
  rejectClassResults,
  publishClassResults,
  getMyReportCards,
};
