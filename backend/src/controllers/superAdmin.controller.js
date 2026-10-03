/**
 * Super Admin Controller
 * Thin controller layer delegating all global administrative logic to superAdmin.service.
 * Enforces real forensic platform audit logging across every administrative action.
 */
import asyncHandler from "../utils/asyncHandler.js";
import superAdminService from "../services/superAdmin.service.js";
import { logAuditEvent } from "../services/auditLog.service.js";

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
  if (typeof adminData === "string") {
    try {
      adminData = JSON.parse(adminData);
    } catch (e) {}
  }
  const instituteData = { ...req.body };
  const clientOrigin = req.headers.origin || req.headers.referer;
  const institute = await superAdminService.createInstitute(
    instituteData,
    adminData,
    req.file,
    clientOrigin
  );

  // Forensic Audit Log
  await logAuditEvent(req, {
    entityType: "Institute",
    entityId: institute._id,
    instituteId: institute._id,
    action: "created",
    changes: {
      after: {
        name: institute.name,
        code: institute.code,
        type: institute.type,
        city: institute.city,
      },
    },
    reason: `Registered new institution "${institute.name}"`,
  });

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
  const institute = await superAdminService.updateInstitute(
    req.params.id,
    req.body,
    req.file
  );

  await logAuditEvent(req, {
    entityType: "Institute",
    entityId: institute._id,
    instituteId: institute._id,
    action: "updated",
    changes: { after: req.body },
    reason: `Updated institution profile for "${institute.name}"`,
  });

  res.status(200).json({
    success: true,
    message: "Institute updated successfully.",
    data: institute,
  });
});

export const deleteInstitute = asyncHandler(async (req, res) => {
  const result = await superAdminService.deleteInstitute(req.params.id);

  await logAuditEvent(req, {
    entityType: "Institute",
    entityId: req.params.id,
    instituteId: req.params.id,
    action: "deleted",
    reason: `Permanently deleted institution ID ${req.params.id}`,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const assignInstituteAdmin = asyncHandler(async (req, res) => {
  const clientOrigin = req.headers.origin || req.headers.referer;
  const result = await superAdminService.assignInstituteAdmin(
    req.params.id,
    req.body,
    clientOrigin
  );

  await logAuditEvent(req, {
    entityType: "User",
    entityId: result.admin?._id || req.params.id,
    instituteId: req.params.id,
    action: "assigned",
    reason: `Assigned primary administrator for institution`,
    metadata: { instituteId: req.params.id },
  });

  res.status(200).json({
    success: true,
    message: "Institute Admin assigned successfully.",
    data: result,
  });
});

export const resendInstituteAdminInvite = asyncHandler(async (req, res) => {
  const clientOrigin = req.headers.origin || req.headers.referer;
  const result = await superAdminService.resendInstituteAdminInvite(
    req.params.id,
    clientOrigin
  );

  await logAuditEvent(req, {
    entityType: "User",
    entityId: req.params.id,
    instituteId: req.params.id,
    action: "updated",
    reason: `Resent admin invitation email`,
  });

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

  await logAuditEvent(req, {
    entityType: "User",
    entityId: updatedAdmin._id,
    instituteId: updatedAdmin.instituteId || req.params.id,
    action: "updated",
    changes: { after: req.body },
    reason: `Updated administrator profile for ${updatedAdmin.name}`,
  });

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

  await logAuditEvent(req, {
    entityType: "User",
    entityId: admin._id,
    instituteId: admin.instituteId,
    action: "created",
    changes: { after: { name: admin.name, email: admin.email, role: admin.role } },
    reason: `Created institute admin account for ${admin.name}`,
  });

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

  await logAuditEvent(req, {
    entityType: "Campus",
    entityId: campus._id,
    campusId: campus._id,
    instituteId: campus.instituteId,
    action: "created",
    changes: { after: { name: campus.name, code: campus.code, city: campus.city } },
    reason: `Created campus "${campus.name}"`,
  });

  res.status(201).json({
    success: true,
    message: "Campus created successfully.",
    data: campus,
  });
});

export const updateCampus = asyncHandler(async (req, res) => {
  const campus = await superAdminService.updateCampus(req.params.id, req.body);

  await logAuditEvent(req, {
    entityType: "Campus",
    entityId: campus._id,
    campusId: campus._id,
    instituteId: campus.instituteId,
    action: "updated",
    changes: { after: req.body },
    reason: `Updated campus "${campus.name}"`,
  });

  res.status(200).json({
    success: true,
    message: "Campus updated successfully.",
    data: campus,
  });
});

export const deleteCampus = asyncHandler(async (req, res) => {
  const result = await superAdminService.deleteCampus(req.params.id);

  await logAuditEvent(req, {
    entityType: "Campus",
    entityId: req.params.id,
    campusId: req.params.id,
    action: "deleted",
    reason: `Deleted campus ID ${req.params.id}`,
  });

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

  await logAuditEvent(req, {
    entityType: "User",
    entityId: user._id,
    instituteId: user.instituteId,
    campusId: user.campusId,
    action: user.isActive ? "activated" : "deactivated",
    reason: `Changed user status to ${user.isActive ? "active" : "inactive"} for ${user.name}`,
  });

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

  await logAuditEvent(req, {
    entityType: "GlobalBroadcast",
    entityId: broadcast._id,
    action: "broadcasted",
    changes: {
      after: {
        title: broadcast.title,
        priority: broadcast.priority,
        targetAudience: broadcast.targetAudience,
      },
    },
    reason: `Published platform broadcast alert: "${broadcast.title}"`,
  });

  res.status(201).json({
    success: true,
    message: "Broadcast published successfully.",
    data: broadcast,
  });
});

export const deleteBroadcast = asyncHandler(async (req, res) => {
  const result = await superAdminService.deleteBroadcast(req.params.id);

  await logAuditEvent(req, {
    entityType: "GlobalBroadcast",
    entityId: req.params.id,
    action: "deleted",
    reason: `Deleted platform broadcast ID ${req.params.id}`,
  });

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
  const inquiry = await superAdminService.updateInquiryStatus(
    req.params.id,
    req.body.status
  );

  await logAuditEvent(req, {
    entityType: "Inquiry",
    entityId: inquiry._id,
    action: "updated",
    changes: { after: { status: inquiry.status } },
    reason: `Updated prospective partner lead status to ${inquiry.status}`,
  });

  res.status(200).json({
    success: true,
    message: "Inquiry status updated successfully.",
    data: inquiry,
  });
});

export const convertInquiry = asyncHandler(async (req, res) => {
  const result = await superAdminService.convertInquiryToInstitute(req.params.id);

  await logAuditEvent(req, {
    entityType: "Inquiry",
    entityId: req.params.id,
    instituteId: result.institute?._id,
    action: "converted",
    reason: `Converted prospective lead to registered institution "${result.institute?.name}"`,
  });

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

// --- SaaS Plan Management ---
export const getPlans = asyncHandler(async (req, res) => {
  const plans = await superAdminService.getAllPlans();
  res.status(200).json({
    success: true,
    message: "Plans retrieved successfully.",
    count: plans.length,
    data: plans,
  });
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await superAdminService.createPlan(req.body);

  await logAuditEvent(req, {
    entityType: "Plan",
    entityId: plan._id,
    action: "created",
    changes: {
      after: {
        tier: plan.tier,
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        maxStudents: plan.maxStudents,
      },
    },
    reason: `Configured new SaaS subscription plan "${plan.name}" (${plan.tier})`,
  });

  res.status(201).json({
    success: true,
    message: "Plan created successfully.",
    data: plan,
  });
});

export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await superAdminService.getPlanById(req.params.id);
  res.status(200).json({
    success: true,
    message: "Plan retrieved successfully.",
    data: plan,
  });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await superAdminService.updatePlan(req.params.id, req.body);

  await logAuditEvent(req, {
    entityType: "Plan",
    entityId: plan._id,
    action: "updated",
    changes: { after: req.body },
    reason: `Updated configuration for subscription plan "${plan.name}"`,
  });

  res.status(200).json({
    success: true,
    message: "Plan updated successfully.",
    data: plan,
  });
});

export const togglePlanStatus = asyncHandler(async (req, res) => {
  const plan = await superAdminService.togglePlanStatus(req.params.id);

  await logAuditEvent(req, {
    entityType: "Plan",
    entityId: plan._id,
    action: plan.isActive ? "activated" : "deactivated",
    reason: `Changed plan "${plan.name}" status to ${plan.isActive ? "active" : "inactive"}`,
  });

  res.status(200).json({
    success: true,
    message: `Plan ${plan.isActive ? "activated" : "deactivated"} successfully.`,
    data: plan,
  });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const result = await superAdminService.deletePlan(req.params.id);

  await logAuditEvent(req, {
    entityType: "Plan",
    entityId: req.params.id,
    action: "deleted",
    reason: `Deleted SaaS subscription plan ID ${req.params.id}`,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// --- SaaS Subscription Governance (Manual Assignment) ---
export const getSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await superAdminService.getAllSubscriptions(req.query);
  res.status(200).json({
    success: true,
    message: "Subscriptions retrieved successfully.",
    count: subscriptions.length,
    data: subscriptions,
  });
});

export const assignSubscription = asyncHandler(async (req, res) => {
  const result = await superAdminService.assignSubscription(
    req.body.instituteId,
    req.body,
    req.user
  );

  await logAuditEvent(req, {
    entityType: "Subscription",
    entityId: result.institute?._id || req.body.instituteId,
    instituteId: req.body.instituteId,
    action: "assigned",
    changes: { after: req.body },
    reason: `Assigned subscription tier for institute`,
  });

  res.status(200).json({
    success: true,
    message: "Subscription successfully assigned to institution.",
    data: result,
  });
});

export const updateSubscriptionStatus = asyncHandler(async (req, res) => {
  const result = await superAdminService.updateSubscriptionStatus(
    req.params.instituteId,
    req.body,
    req.user
  );

  await logAuditEvent(req, {
    entityType: "Subscription",
    entityId: req.params.instituteId,
    instituteId: req.params.instituteId,
    action: "updated",
    changes: { after: req.body },
    reason: `Subscription status updated for institute`,
  });

  res.status(200).json({
    success: true,
    message: "Subscription status updated successfully.",
    data: result,
  });
});

export const extendSubscription = asyncHandler(async (req, res) => {
  const result = await superAdminService.extendSubscription(
    req.params.instituteId,
    req.body,
    req.user
  );

  await logAuditEvent(req, {
    entityType: "Subscription",
    entityId: req.params.instituteId,
    instituteId: req.params.instituteId,
    action: "updated",
    changes: { after: req.body },
    reason: `Extended subscription validity for institute`,
  });

  res.status(200).json({
    success: true,
    message: "Subscription extended successfully.",
    data: result,
  });
});

export const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const result = await superAdminService.getSubscriptionHistory(
    req.params.instituteId
  );
  res.status(200).json({
    success: true,
    message: "Subscription history retrieved successfully.",
    data: result,
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
  resendInstituteAdminInvite,
  updateInstituteAdmin,
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
  getPlans,
  createPlan,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  getSubscriptions,
  assignSubscription,
  updateSubscriptionStatus,
  extendSubscription,
  getSubscriptionHistory,
};
