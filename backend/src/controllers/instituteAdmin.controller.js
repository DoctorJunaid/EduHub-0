/**
 * Institute Admin Controller
 * Thin controller layer delegating all tenant-scoped operations to instituteAdmin.service.
 * Reads verified tenant boundary from req.instituteId.
 */
import asyncHandler from "../utils/asyncHandler.js";
import instituteAdminService from "../services/instituteAdmin.service.js";
import { logAuditEvent } from "../services/auditLog.service.js";

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

  await logAuditEvent(req, {
    entityType: "Campus",
    entityId: campus._id,
    instituteId: req.instituteId,
    campusId: campus._id,
    action: "created",
    changes: { after: { name: campus.name, code: campus.code, city: campus.city } },
    reason: `Created branch campus "${campus.name}"`,
  });

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

  await logAuditEvent(req, {
    entityType: "Campus",
    entityId: campus._id,
    instituteId: req.instituteId,
    campusId: campus._id,
    action: "updated",
    changes: { after: req.body },
    reason: `Updated branch campus "${campus.name}"`,
  });

  res.status(200).json({
    success: true,
    message: "Campus updated successfully.",
    data: campus,
  });
});

export const deleteCampus = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.deleteCampus(req.instituteId, req.params.id);

  await logAuditEvent(req, {
    entityType: "Campus",
    entityId: req.params.id,
    instituteId: req.instituteId,
    action: "deleted",
    reason: `Deleted branch campus ID ${req.params.id}`,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const assignCampusManager = asyncHandler(async (req, res) => {
  const clientOrigin = req.headers.origin || req.headers.referer;
  const result = await instituteAdminService.assignCampusManager(
    req.instituteId,
    req.params.id,
    req.body,
    clientOrigin
  );

  await logAuditEvent(req, {
    entityType: "User",
    entityId: result.manager?._id || req.params.id,
    instituteId: req.instituteId,
    action: "assigned",
    reason: `Appointed campus manager for campus ID ${req.params.id}`,
  });

  res.status(200).json({
    success: true,
    message: "Campus Manager appointed successfully.",
    data: result,
  });
});

export const resendCampusManagerInvite = asyncHandler(async (req, res) => {
  const clientOrigin = req.headers.origin || req.headers.referer;
  const result = await instituteAdminService.resendCampusManagerInvite(
    req.instituteId,
    req.params.id,
    clientOrigin
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
  const clientOrigin = req.headers.origin || req.headers.referer;
  const manager = await instituteAdminService.createCampusManager(req.instituteId, req.body, clientOrigin);
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

  await logAuditEvent(req, {
    entityType: "User",
    entityId: staff._id,
    instituteId: req.instituteId,
    campusId: staff.campusId,
    action: "created",
    changes: { after: { name: staff.name, email: staff.email, role: staff.role } },
    reason: `Added staff member ${staff.name} (${staff.role})`,
  });

  res.status(201).json({
    success: true,
    message: "Staff member created successfully.",
    data: staff,
  });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.deleteStaff(req.instituteId, req.params.id);

  await logAuditEvent(req, {
    entityType: "User",
    entityId: req.params.id,
    instituteId: req.instituteId,
    action: "deleted",
    reason: `Removed staff member ID ${req.params.id}`,
  });

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

  await logAuditEvent(req, {
    entityType: "User",
    entityId: student._id,
    instituteId: req.instituteId,
    campusId: student.campusId,
    action: "created",
    changes: { after: { name: student.name, email: student.email, role: "student" } },
    reason: `Enrolled new student "${student.name}"`,
  });

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

  await logAuditEvent(req, {
    entityType: "User",
    entityId: student._id,
    instituteId: req.instituteId,
    campusId: student.campusId,
    action: "updated",
    changes: { after: req.body },
    reason: `Updated student record for "${student.name}"`,
  });

  res.status(200).json({
    success: true,
    message: "Student updated successfully.",
    data: student,
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.deleteStudent(req.instituteId, req.params.id);

  await logAuditEvent(req, {
    entityType: "User",
    entityId: req.params.id,
    instituteId: req.instituteId,
    action: "deleted",
    reason: `Removed student record ID ${req.params.id}`,
  });

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

  await logAuditEvent(req, {
    entityType: "GlobalBroadcast",
    entityId: alert._id,
    instituteId: req.instituteId,
    campusId: alert.campusId || null,
    action: "broadcasted",
    changes: { after: { title: alert.title, message: alert.message, severity: alert.severity } },
    reason: `Dispatched broadcast notice "${alert.title}"`,
  });

  res.status(201).json({
    success: true,
    message: "Broadcast alert dispatched successfully.",
    data: alert,
  });
});

// --- SaaS Subscription View ---
export const getSubscription = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.getInstituteSubscription(req.instituteId);
  res.status(200).json({
    success: true,
    message: "Institute subscription and quota usage retrieved successfully.",
    data: result,
  });
});

// --- Institute Audit Logs (All Campuses & Per-Campus) ---
export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.getInstituteAuditLogs(
    req.instituteId,
    req.query
  );
  res.status(200).json({
    success: true,
    message: "Institute audit logs retrieved successfully.",
    data: result.logs,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    campuses: result.campuses,
    stats: result.stats,
  });
});

// --- Multi-Campus Revenue & Fees Collection Controllers ---
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const analytics = await instituteAdminService.getInstituteRevenueAnalytics(
    req.instituteId,
    req.query
  );
  res.status(200).json({
    success: true,
    message: "Revenue analytics retrieved successfully.",
    data: analytics,
  });
});

export const getRevenueTransactions = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.getInstituteRevenueTransactions(
    req.instituteId,
    req.query
  );
  res.status(200).json({
    success: true,
    message: "Revenue transactions retrieved successfully.",
    data: result.transactions,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    summary: result.summary,
  });
});

export const getFeeRecords = asyncHandler(async (req, res) => {
  const result = await instituteAdminService.getInstituteFeeRecords(
    req.instituteId,
    req.query
  );
  res.status(200).json({
    success: true,
    message: "Fee records retrieved successfully.",
    data: result.records,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    summary: result.summary,
  });
});

export const getFeeStructures = asyncHandler(async (req, res) => {
  const structures = await instituteAdminService.getInstituteFeeStructures(
    req.instituteId,
    req.query
  );
  res.status(200).json({
    success: true,
    message: "Campus fee structures retrieved successfully.",
    count: structures.length,
    data: structures,
  });
});

export const exportRevenueData = asyncHandler(async (req, res) => {
  const records = await instituteAdminService.exportInstituteRevenueData(
    req.instituteId,
    req.query
  );
  res.status(200).json({
    success: true,
    message: "Revenue export generated successfully.",
    count: records.length,
    data: records,
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
  resendCampusManagerInvite,
  updateCampusManager,
  unassignCampusManager,
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
  getSubscription,
  getAuditLogs,
  getRevenueAnalytics,
  getRevenueTransactions,
  getFeeRecords,
  getFeeStructures,
  exportRevenueData,
};
