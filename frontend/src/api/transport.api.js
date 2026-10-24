import axiosInstance from "./axiosInstance";

/**
 * Transport & Driver Management API
 */

// Drivers
export const getDriversApi = async () => {
  const response = await axiosInstance.get("/transport/drivers");
  return response.data;
};

export const createDriverApi = async (data) => {
  const response = await axiosInstance.post("/transport/drivers", data);
  return response.data;
};

export const updateDriverApi = async (id, data) => {
  const response = await axiosInstance.put(`/transport/drivers/${id}`, data);
  return response.data;
};

export const deleteDriverApi = async (id) => {
  const response = await axiosInstance.delete(`/transport/drivers/${id}`);
  return response.data;
};

// Vehicles
export const getVehiclesApi = async () => {
  const response = await axiosInstance.get("/transport/vehicles");
  return response.data;
};

export const createVehicleApi = async (data) => {
  const response = await axiosInstance.post("/transport/vehicles", data);
  return response.data;
};

export const updateVehicleApi = async (id, data) => {
  const response = await axiosInstance.put(`/transport/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicleApi = async (id) => {
  const response = await axiosInstance.delete(`/transport/vehicles/${id}`);
  return response.data;
};

// Routes
export const getRoutesApi = async () => {
  const response = await axiosInstance.get("/transport/routes");
  return response.data;
};

export const createRouteApi = async (data) => {
  const response = await axiosInstance.post("/transport/routes", data);
  return response.data;
};

export const updateRouteApi = async (id, data) => {
  const response = await axiosInstance.put(`/transport/routes/${id}`, data);
  return response.data;
};

export const deleteRouteApi = async (id) => {
  const response = await axiosInstance.delete(`/transport/routes/${id}`);
  return response.data;
};

// Student Assignment
export const assignStudentToRouteApi = async (data) => {
  const response = await axiosInstance.post("/transport/assign-student", data);
  return response.data;
};

export const getTransportStudentsApi = async () => {
  const response = await axiosInstance.get("/transport/students");
  return response.data;
};

// Visibility (Students & Parents)
export const getMyTransportApi = async (studentId) => {
  const query = studentId ? `?studentId=${studentId}` : "";
  const response = await axiosInstance.get(`/transport/my-transport${query}`);
  return response.data;
};

// Statistics
export const getTransportStatsApi = async () => {
  const response = await axiosInstance.get("/transport/stats");
  return response.data;
};

// Preset Demo Seeder
export const seedTransportPresetApi = async () => {
  const response = await axiosInstance.post("/transport/seed-preset");
  return response.data;
};

// Update student transport details via dedicated endpoint
export const updateStudentTransportApi = async (studentId, data) => {
  const response = await axiosInstance.put(`/campus-admin/students/${studentId}/transport`, data);
  return response.data;
};

