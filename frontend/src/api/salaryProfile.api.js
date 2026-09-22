import api from './axiosInstance';

export const listSalaryProfiles = (params) =>
  api.get('/campus/salary/profiles', { params });

export const getSalaryProfile = (teacherId) =>
  api.get(`/campus/salary/profiles/${teacherId}`);

export const saveSalaryProfile = (teacherId, payload) =>
  api.put(`/campus/salary/profiles/${teacherId}`, payload);

export const deactivateSalaryProfile = (teacherId) =>
  api.patch(`/campus/salary/profiles/${teacherId}/deactivate`);

export const activateSalaryProfile = (teacherId) =>
  api.patch(`/campus/salary/profiles/${teacherId}/activate`);

export const listTeachersWithoutSalaryProfile = () =>
  api.get('/campus/salary/profiles/teachers-without-profile');

export const getMySalaryProfile = () =>
  api.get('/campus/salary/profiles/my-profile');

export default {
  listSalaryProfiles,
  getSalaryProfile,
  saveSalaryProfile,
  deactivateSalaryProfile,
  activateSalaryProfile,
  listTeachersWithoutSalaryProfile,
  getMySalaryProfile,
};
