/**
 * Super Admin Controller
 * Thin controller layer delegating all global administrative logic to superAdmin.service.
 */
import asyncHandler from "../utils/asyncHandler.js";
import superAdminService from "../services/superAdmin.service.js";

// --- Analytics ---
export const getStats = asyncHandler(async (req, res) => {
  const stats = await superAdminService.getGlobalStats();
  res.status(200).json({
    success: true,
    message: "Global statistics retrieved successfully.",
    data: stats,
  });
});

// --- Institute Management ---
export const getInstitutes = asyncHandler(async (req, res) => {
  const institutes = await superAdminService.getAllInstitutes(req.query);
  res.status(200).json({
    success: true,
    message: "Institutes retrieved successfully.",
    count: institutes.length,
    data: institutes,
  });
});

export const createInstitute = asyncHandler(async (req, res) => {
  const { admin, ...instituteData } = req.body;
  const institute = await superAdminService.createInstitute(instituteData, admin);
  res.status(201).json({
    success: true,
    message: "Institute registered successfully.",
    data: institute,
  });
});

export const getInstituteById = asyncHandler(async (req, res) => {
  const institute = await superAdminService.getInstituteById(req.params.id);
  res.status(200).json({
    success: true,
    message: "Institute retrieved successfully.",
    data: institute,
  });
});

export const updateInstitute = asyncHandler(async (req, res) => {
  const institute = await superAdminService.updateInstitute(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Institute updated successfully.",
    data: institute,
  });
});

export const deleteInstitute = asyncHandler(async (req, res) => {
  const result = await superAdminService.deleteInstitute(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const assignInstituteAdmin = asyncHandler(async (req, res) => {
  const result = await superAdminService.assignInstituteAdmin(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Institute Admin assigned successfully.",
    data: result,
  });
});

// --- Institute Admins Standalone ---
export const getInstituteAdmins = asyncHandler(async (req, res) => {
  const admins = await superAdminService.getAllInstituteAdmins();
  res.status(200).json({
    success: true,
    message: "Institute Admins retrieved successfully.",
    count: admins.length,
    data: admins,
  });
});

export const createInstituteAdmin = asyncHandler(async (req, res) => {
  const admin = await superAdminService.createInstituteAdmin(req.body);
  res.status(201).json({
    success: true,
    message: "Institute Admin created successfully.",
    data: admin,
  });
});

// --- Campus Management ---
export const getCampuses = asyncHandler(async (req, res) => {
  const campuses = await superAdminService.getAllCampuses(req.query);
  res.status(200).json({
    success: true,
    message: "Campuses retrieved successfully.",
    count: campuses.length,
    data: campuses,
  });
});

export const createCampus = asyncHandler(async (req, res) => {
  const campus = await superAdminService.createCampus(req.body);
  res.status(201).json({
    success: true,
    message: "Campus created successfully.",
    data: campus,
  });
});

export const updateCampus = asyncHandler(async (req, res) => {
  const campus = await superAdminService.updateCampus(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Campus updated successfully.",
    data: campus,
  });
});

export const deleteCampus = asyncHandler(async (req, res) => {
  const result = await superAdminService.deleteCampus(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// --- Global User Management ---
export const getUsers = asyncHandler(async (req, res) => {
  const users = await superAdminService.getAllUsers(req.query);
  res.status(200).json({
    success: true,
    message: "Users retrieved successfully.",
    count: users.length,
    data: users,
  });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await superAdminService.toggleUserStatus(req.params.id);
  res.status(200).json({
    success: true,
    message: `User status changed to ${user.isActive ? "active" : "inactive"}.`,
    data: user,
  });
});

export default {
  getStats,
  getInstitutes,
  createInstitute,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
  assignInstituteAdmin,
  getInstituteAdmins,
  createInstituteAdmin,
  getCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  getUsers,
  toggleUserStatus,
};
