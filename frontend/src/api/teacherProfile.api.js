import axiosInstance from "./axiosInstance";

export const getTeacherProfileApi = async (teacherId) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}`);
  return response.data;
};

export const getTeacherClassesApi = async (teacherId) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}/classes`);
  return response.data;
};

export const getTeacherTimetableApi = async (teacherId) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}/timetable`);
  return response.data;
};

export const getTeacherAttendanceApi = async (teacherId, days = 30) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}/attendance`, {
    params: { days },
  });
  return response.data;
};

export const getTeacherPayrollApi = async (teacherId) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}/payroll`);
  return response.data;
};

export const getTeacherSubstitutesApi = async (teacherId) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}/substitutes`);
  return response.data;
};

export const getTeacherActivityApi = async (teacherId) => {
  const response = await axiosInstance.get(`/campus/teachers/${teacherId}/activity`);
  return response.data;
};

export const assignTeacherClassApi = async (teacherId, data) => {
  const response = await axiosInstance.post(`/campus/teachers/${teacherId}/classes`, data);
  return response.data;
};

export const unassignTeacherClassApi = async (teacherId, assignmentId) => {
  const response = await axiosInstance.delete(`/campus/teachers/${teacherId}/classes/${assignmentId}`);
  return response.data;
};

export const getAcademicOptionsApi = async () => {
  const [gradesRes, sectionsRes, subjectsRes] = await Promise.allSettled([
    axiosInstance.get("/academic/grades"),
    axiosInstance.get("/academic/sections"),
    axiosInstance.get("/academic/subjects"),
  ]);

  return {
    grades: gradesRes.status === "fulfilled" ? (gradesRes.value.data?.data || gradesRes.value.data || []) : [],
    sections: sectionsRes.status === "fulfilled" ? (sectionsRes.value.data?.data || sectionsRes.value.data || []) : [],
    subjects: subjectsRes.status === "fulfilled" ? (subjectsRes.value.data?.data || subjectsRes.value.data || []) : [],
  };
};
