import axiosInstance from "./axiosInstance";

/**
 * Class Teacher Management & Attendance API Client
 */

// 1. Assign class teacher (Admin)
export const assignClassTeacher = async (classId, teacherProfileId, note = "") => {
  const res = await axiosInstance.post(`/campus/classes/${classId}/assign-class-teacher`, {
    teacherProfileId,
    note,
  });
  return res.data;
};

// 2. Remove class teacher (Admin)
export const removeClassTeacher = async (classId) => {
  const res = await axiosInstance.delete(`/campus/classes/${classId}/class-teacher`);
  return res.data;
};

// 3. Get class teacher details (Admin / Teacher)
export const getClassTeacher = async (classId) => {
  const res = await axiosInstance.get(`/campus/classes/${classId}/class-teacher`);
  return res.data;
};

// 4. Get all classes with class teacher assignments (Admin)
export const getAllClassTeachers = async () => {
  const res = await axiosInstance.get("/campus/classes/all-class-teachers");
  return res.data;
};

// 5. Get unmarked classes today (Admin)
export const getUnmarkedClassesToday = async () => {
  const res = await axiosInstance.get("/campus/classes/unmarked-today");
  return res.data;
};

// 6. Get logged-in teacher's class assignment
export const getMyClassAssignment = async () => {
  const res = await axiosInstance.get("/campus/teachers/me/class");
  return res.data;
};

// 7. Get students of own class
export const getMyClassStudents = async () => {
  const res = await axiosInstance.get("/campus/teachers/me/class/students");
  return res.data;
};

// 8. Get today's attendance for own class
export const getMyClassAttendance = async (date = null, classId = null) => {
  const params = {};
  if (date) params.date = date;
  if (classId) params.classId = classId;
  const res = await axiosInstance.get("/campus/teachers/me/class/attendance", { params });
  return res.data;
};

// 9. Mark / save attendance
export const markClassAttendance = async ({ date, records, classId }) => {
  const res = await axiosInstance.post("/campus/teachers/me/class/attendance", {
    date,
    records,
    classId,
  });
  return res.data;
};

// 10. Get monthly attendance
export const getMyClassAttendanceMonthly = async (params = {}) => {
  const res = await axiosInstance.get("/campus/teachers/me/class/attendance/monthly", {
    params,
  });
  return res.data;
};

// 11. Get class stats & KPIs
export const getMyClassStats = async () => {
  const res = await axiosInstance.get("/campus/teachers/me/class/stats");
  return res.data;
};

export default {
  assignClassTeacher,
  removeClassTeacher,
  getClassTeacher,
  getAllClassTeachers,
  getUnmarkedClassesToday,
  getMyClassAssignment,
  getMyClassStudents,
  getMyClassAttendance,
  markClassAttendance,
  getMyClassAttendanceMonthly,
  getMyClassStats,
};
