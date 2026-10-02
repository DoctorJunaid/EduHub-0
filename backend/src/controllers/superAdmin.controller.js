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
  let adminData = req.body.admin;
  if (typeof adminData === 'string') {
    try { adminData = JSON.parse(adminData); } catch (e) {}
  }
  const instituteData = { ...req.body };
  delete instituteData.admin;

  const institute = await superAdminService.createInstitute(instituteData, adminData, req.file);
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
  const institute = await superAdminService.updateInstitute(req.params.id, req.body, req.file);
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

export const resendInstituteAdminInvite = asyncHandler(async (req, res) => {
  const clientOrigin = req.headers.origin || req.headers.referer;
  const result = await superAdminService.resendInstituteAdminInvite(req.params.id, clientOrigin);
  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

export const updateInstituteAdmin = asyncHandler(async (req, res) => {
  const updatedAdmin = await superAdminService.updateInstituteAdmin(
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Institute Admin details updated successfully.",
    data: updatedAdmin,
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
  const result = await superAdminService.getAllUsers(req.query);
  if (result && result.users) {
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: result.users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
  res.status(200).json({
    success: true,
    message: "Users retrieved successfully.",
    count: result.length,
    data: result,
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

// --- Platform Broadcasts ---
export const getBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await superAdminService.getAllBroadcasts();
  res.status(200).json({
    success: true,
    message: "Broadcast alerts retrieved successfully.",
    data: broadcasts,
  });
});

export const createBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await superAdminService.createBroadcast(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: "Broadcast published successfully.",
    data: broadcast,
  });
});

export const deleteBroadcast = asyncHandler(async (req, res) => {
  const result = await superAdminService.deleteBroadcast(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// --- Inquiries & Leads ---
export const getInquiries = asyncHandler(async (req, res) => {
  const inquiries = await superAdminService.getAllInquiries(req.query);
  res.status(200).json({
    success: true,
    message: "Inquiries retrieved successfully.",
    count: inquiries.length,
    data: inquiries,
  });
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const inquiry = await superAdminService.updateInquiryStatus(req.params.id, req.body.status);
  res.status(200).json({
    success: true,
    message: "Inquiry status updated successfully.",
    data: inquiry,
  });
});

export const convertInquiry = asyncHandler(async (req, res) => {
  const result = await superAdminService.convertInquiryToInstitute(req.params.id);
  res.status(201).json({
    success: true,
    message: "Inquiry converted to registered institute successfully!",
    data: result,
  });
});

// --- Platform Audit Logs ---
export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await superAdminService.getPlatformAuditLogs(req.query);
  res.status(200).json({
    success: true,
    message: "Platform audit logs retrieved successfully.",
    data: result.logs,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
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
  getBroadcasts,
  createBroadcast,
  deleteBroadcast,
  getInquiries,
  updateInquiryStatus,
  convertInquiry,
  getAuditLogs,
};
