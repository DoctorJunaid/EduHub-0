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
};
