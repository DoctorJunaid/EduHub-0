/**
 * Institute Admin Controller
 * Thin controller layer delegating all tenant-scoped operations to instituteAdmin.service.
 * Reads verified tenant boundary from req.instituteId.
 */
import asyncHandler from "../utils/asyncHandler.js";
import instituteAdminService from "../services/instituteAdmin.service.js";

// --- Analytics ---
export const getStats = asyncHandler(async (req, res) => {
  const stats = await instituteAdminService.getInstituteStats(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Institute statistics retrieved successfully.",
    data: stats,
  });
});

// --- Institute Profile ---
export const getProfile = asyncHandler(async (req, res) => {
  const institute = await instituteAdminService.getInstituteProfile(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Institute profile retrieved successfully.",
    data: institute,
  });
});

// --- Campus Management ---
export const getCampuses = asyncHandler(async (req, res) => {
  const campuses = await instituteAdminService.getCampuses(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Campuses retrieved successfully.",
    count: campuses.length,
    data: campuses,
  });
});

export const createCampus = asyncHandler(async (req, res) => {
  const campus = await instituteAdminService.createCampus(req.instituteId, req.body);
  res.status(201).json({
    success: true,
    message: "Campus branch created successfully.",
    data: campus,
  });
});

export const getCampusById = asyncHandler(async (req, res) => {
  const campus = await instituteAdminService.getCampusById(req.instituteId, req.params.id);
  res.status(200).json({
    success: true,
    message: "Campus details retrieved successfully.",
    data: campus,
  });
});

export const updateCampus = asyncHandler(async (req, res) => {
  const campus = await instituteAdminService.updateCampus(
    req.instituteId,
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Campus updated successfully.",
    data: campus,
  });
});

export const deleteCampus = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.deleteCampus(req.instituteId, req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const assignCampusManager = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.assignCampusManager(
    req.instituteId,
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Campus Manager appointed successfully.",
    data: result,
  });
});

export const resendCampusManagerInvite = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.resendCampusManagerInvite(
    req.instituteId,
    req.params.id
  );
  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

export const updateCampusManager = asyncHandler(async (req, res) => {
  const updatedManager = await instituteAdminService.updateCampusManager(
    req.instituteId,
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Campus Manager details updated successfully.",
    data: updatedManager,
  });
});

export const unassignCampusManager = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.unassignCampusManager(
    req.instituteId,
    req.params.id
  );
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// --- Campus Managers Management ---
export const getManagers = asyncHandler(async (req, res) => {
  const managers = await instituteAdminService.getCampusManagers(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Campus Managers retrieved successfully.",
    count: managers.length,
    data: managers,
  });
});

export const createManager = asyncHandler(async (req, res) => {
  const manager = await instituteAdminService.createCampusManager(req.instituteId, req.body);
  res.status(201).json({
    success: true,
    message: "Campus Manager appointed successfully.",
    data: manager,
  });
});

// --- Staff Directory ---
export const getStaff = asyncHandler(async (req, res) => {
  const staff = await instituteAdminService.getStaff(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Staff directory retrieved successfully.",
    count: staff.length,
    data: staff,
  });
});

export const createStaff = asyncHandler(async (req, res) => {
  const staff = await instituteAdminService.createStaff(req.instituteId, req.body);
  res.status(201).json({
    success: true,
    message: "Staff member created successfully.",
    data: staff,
  });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.deleteStaff(req.instituteId, req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// --- Students Directory ---
export const getStudents = asyncHandler(async (req, res) => {
  const students = await instituteAdminService.getStudents(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Students directory retrieved successfully.",
    count: students.length,
    data: students,
  });
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await instituteAdminService.createStudent(req.instituteId, req.body);
  res.status(201).json({
    success: true,
    message: "Student enrolled successfully.",
    data: student,
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await instituteAdminService.updateStudent(
    req.instituteId,
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Student updated successfully.",
    data: student,
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.deleteStudent(req.instituteId, req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// --- Broadcast Alerts ---
export const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await instituteAdminService.getAlerts(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Broadcast alerts retrieved successfully.",
    count: alerts.length,
    data: alerts,
  });
});

export const createAlert = asyncHandler(async (req, res) => {
  const alert = await instituteAdminService.createAlert(
    req.instituteId,
    req.body,
    req.user?._id
  );
  res.status(201).json({
    success: true,
    message: "Broadcast alert dispatched successfully.",
    data: alert,
  });
});

export default {
  getStats,
  getProfile,
  getCampuses,
  createCampus,
  getCampusById,
  updateCampus,
  deleteCampus,
  assignCampusManager,
  getManagers,
  createManager,
  getStaff,
  createStaff,
  deleteStaff,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAlerts,
  createAlert,
};
