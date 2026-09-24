import axiosInstance from './axiosInstance';

export const seedApi = {
  getStats: async (campusId) => {
    const params = campusId ? { campusId } : {};
    const res = await axiosInstance.get('/admin/seed/stats', { params });
    return res.data;
  },

  seedFullStructure: async ({ campusId, teachers = 60, studentsPerClass = 30 }) => {
    const res = await axiosInstance.post('/admin/seed/full-structure', {
      campusId,
      teachers,
      studentsPerClass,
    });
    return res.data;
  },

  seedTeachers: async ({ campusId, count = 60, clearFirst = false }) => {
    const res = await axiosInstance.post('/admin/seed/teachers', {
      campusId,
      count,
      clearFirst,
    });
    return res.data;
  },

  seedStudents: async ({ campusId, studentsPerClass = 30, clearFirst = false }) => {
    const res = await axiosInstance.post('/admin/seed/students', {
      campusId,
      studentsPerClass,
      clearFirst,
    });
    return res.data;
  },

  seedAttendance: async ({ campusId, days = 30 }) => {
    const res = await axiosInstance.post('/admin/seed/attendance', {
      campusId,
      days,
    });
    return res.data;
  },

  seedSubstitutes: async ({ campusId, days = 7 }) => {
    const res = await axiosInstance.post('/admin/seed/substitutes', {
      campusId,
      days,
    });
    return res.data;
  },

  clearTeachers: async (campusId) => {
    const res = await axiosInstance.post('/admin/seed/clear-teachers', { campusId });
    return res.data;
  },

  clearStudents: async (campusId) => {
    const res = await axiosInstance.post('/admin/seed/clear-students', { campusId });
    return res.data;
  },

  clearAll: async (campusId) => {
    const res = await axiosInstance.post('/admin/seed/clear-all', { campusId });
    return res.data;
  },

  resetAll: async ({ campusId, teachers = 60, studentsPerClass = 30 }) => {
    const res = await axiosInstance.post('/admin/seed/reset', {
      campusId,
      teachers,
      studentsPerClass,
    });
    return res.data;
  },
};

export default seedApi;
