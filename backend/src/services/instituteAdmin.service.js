/**
 * Institute Admin Service
 * Encapsulates all tenant-scoped business logic for an Institute Administrator.
 * Guarantees that all queries and mutations are strictly bounded by instituteId.
 */
import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import Plan from "../models/plan.model.js";
import Alert from "../models/alert.model.js";
import AuditLog from "../models/auditLog.model.js";
import { FeeRecord } from "../models/profile.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import { sendMail } from "../utils/emailService.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import mongoose from "mongoose";

/**
 * Resolve frontend URL dynamically based on caller origin (e.g. localhost) with fallback to env
 */
const resolveFrontendUrl = (clientOrigin) => {
  if (clientOrigin) {
    try {
      const url = new URL(clientOrigin);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return `${url.protocol}//${url.host}`;
      }
    } catch {
      // Ignore URL parse error
    }
  }
  return (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
};

/**
 * Get Institute-wide KPIs & Statistics
 */
export const getInstituteStats = async (instituteId) => {
  const campuses = await Campus.find({ instituteId }).select("_id").lean();
  const campusIds = campuses.map((c) => c._id);

  const [
    totalCampuses,
    activeCampuses,
    totalManagers,
    totalTeachers,
    totalStudents,
    revenueAgg,
  ] = await Promise.all([
    Campus.countDocuments({ instituteId }),
    Campus.countDocuments({ instituteId, status: "Active" }),
    User.countDocuments({ instituteId, role: { $in: ["campus_manager", "campus_admin"] } }),
    User.countDocuments({ instituteId, role: "teacher" }),
    User.countDocuments({ instituteId, role: "student" }),
    FeeRecord.aggregate([
      { $match: { campusId: { $in: campusIds }, "omitted.isOmitted": { $ne: true } } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: { $ifNull: ["$totalPayable", "$amount"] } },
          totalCollected: { $sum: "$paidAmount" },
        },
      },
    ]),
  ]);

  const totalBilled = revenueAgg[0]?.totalBilled || 0;
  const totalCollected = revenueAgg[0]?.totalCollected || 0;
  const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

  return {
    instituteId,
    campuses: {
      total: totalCampuses,
      active: activeCampuses,
      pending: totalCampuses - activeCampuses,
    },
    staff: {
      managers: totalManagers,
      teachers: totalTeachers,
    },
    students: {
      total: totalStudents,
    },
    revenue: {
      totalBilled,
      totalCollected,
      totalOutstanding: Math.max(0, totalBilled - totalCollected),
      collectionRate,
    },
  };
};

/**
 * Get caller's own institute details
 */
export const getInstituteProfile = async (instituteId) => {
  const institute = await Institute.findById(instituteId).populate(
    "adminId",
    "name email phone avatar isActive"
  );

  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  const campusCount = await Campus.countDocuments({ instituteId });
  return { ...institute.toObject(), campusCount };
};

/**
 * List campuses belonging to this institute
 */
export const getCampuses = async (instituteId) => {
  const campuses = await Campus.find({ instituteId })
    .populate("managerId", "name email phone avatar isActive status createdAt")
    .sort({ createdAt: -1 });

  return campuses;
};

/**
 * Create a new campus under this institute
 */
export const createCampus = async (instituteId, campusData) => {
  if (!campusData.name) {
    const error = new Error("Campus name is required");
    error.statusCode = 400;
    throw error;
  }

  // Force instituteId from the verified scope
  const campus = await Campus.create({
    ...campusData,
    instituteId,
  });

  if (campusData.managerName && campusData.managerEmail) {
    try {
      await assignCampusManager(instituteId, campus._id, {
        name: campusData.managerName,
        email: campusData.managerEmail,
        phone: campusData.managerPhone || "",
        sendEmail: true,
      });
    } catch (err) {
      console.error("Manager inline appointment failed:", err.message);
    }
  }

  return await Campus.findById(campus._id).populate(
    "managerId",
    "name email phone avatar isActive status createdAt"
  );
};

/**
 * Get a specific campus under this institute
 */
export const getCampusById = async (instituteId, campusId) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId }).populate(
    "managerId",
    "name email phone avatar isActive status createdAt"
  );

  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  const [studentCount, teacherCount] = await Promise.all([
    User.countDocuments({ campusId, role: "student" }),
    User.countDocuments({ campusId, role: "teacher" }),
  ]);

  return {
    ...campus.toObject(),
    studentCount,
    teacherCount,
  };
};

/**
 * Update a specific campus under this institute
 */
export const updateCampus = async (instituteId, campusId, updateData) => {
  // Disallow modifying parent instituteId
  delete updateData.instituteId;

  const campus = await Campus.findOneAndUpdate(
    { _id: campusId, instituteId },
    updateData,
    { new: true, runValidators: true }
  ).populate("managerId", "name email phone avatar isActive status createdAt");

  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  return campus;
};

/**
 * Delete a specific campus under this institute
 */
export const deleteCampus = async (instituteId, campusId) => {
  const campus = await Campus.findOneAndDelete({ _id: campusId, instituteId });

  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  // Unlink students/teachers belonging to this campus
  await User.updateMany({ campusId }, { $set: { campusId: null } });

  return { message: "Campus deleted successfully" };
};

/**
 * Assign or reassign a Campus Manager
 */
export const assignCampusManager = async (
  instituteId,
  campusId,
  { userId, email, name, phone, sendEmail = true },
  clientOrigin = null
) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  let managerUser;
  if (userId) {
    managerUser = await User.findById(userId);
  } else if (email) {
    managerUser = await User.findOne({ email: email.toLowerCase().trim() });
  }

  if (!managerUser && email) {
    // Create new manager user
    const randomPassword = crypto.randomBytes(16).toString("hex");
    managerUser = await User.create({
      name: name ? name.trim() : "Campus Manager",
      email: email.toLowerCase().trim(),
      passwordHash: randomPassword,
      role: "campus_manager",
      status: "Pending",
      instituteId,
      campusId: campus._id,
      phone: phone ? phone.trim() : "",
    });
  } else if (managerUser) {
    // Prevent taking over super admins or admins from other institutes
    if (managerUser.role === "super_admin") {
      const err = new Error("Cannot reassign a Super Admin account.");
      err.statusCode = 403;
      throw err;
    }
    if (
      managerUser.instituteId &&
      managerUser.instituteId.toString() !== instituteId.toString()
    ) {
      const err = new Error("User belongs to a different institute.");
      err.statusCode = 403;
      throw err;
    }

    managerUser.role = "campus_manager";
    managerUser.instituteId = instituteId;
    managerUser.campusId = campus._id;
    if (name) managerUser.name = name.trim();
    if (phone) managerUser.phone = phone.trim();
    await managerUser.save();
  }

  if (!managerUser) {
    const error = new Error("Please provide email or userId of the manager to assign");
    error.statusCode = 400;
    throw error;
  }

  // Clear any existing campus manager reference if appointing a different user
  if (campus.managerId && campus.managerId.toString() !== managerUser._id.toString()) {
    await User.findByIdAndUpdate(campus.managerId, { campusId: null });
  }

  // Set manager on campus
  campus.managerId = managerUser._id;
  await campus.save();

  // Generate setup link and dispatch strictly via email
  const token = generateToken({ id: managerUser._id, role: managerUser.role, pv: managerUser.passwordVersion || 0, reset: true });
  const frontendUrl = resolveFrontendUrl(clientOrigin);
  const resetLink = `${frontendUrl}/set-password?token=${token}`;

  let emailSent = false;
  if (sendEmail !== false) {
    try {
      await sendMail(
        managerUser.email,
        "Set up your EduHub Campus Manager Account",
        "Welcome to EduHub! Please click the link to set up your password.",
        resetLink
      );
      emailSent = true;
    } catch (err) {
      console.warn("Failed to send setup email during campus manager assignment:", err.message);
    }
  }

  const userObj = managerUser.toObject();
  delete userObj.passwordHash;

  return { campus, manager: userObj, resetLink, emailSent, message: "Campus manager assigned successfully." };
};

/**
 * Resend setup invite email to Campus Manager with fail-safe SMTP handling
 */
export const resendCampusManagerInvite = async (instituteId, campusId, clientOrigin = null) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId }).populate(
    "managerId",
    "name email phone role status passwordVersion"
  );
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }
  if (!campus.managerId) {
    const error = new Error("No manager is currently appointed for this campus");
    error.statusCode = 400;
    throw error;
  }

  const manager = campus.managerId;
  const token = generateToken({ id: manager._id, role: manager.role || "campus_manager", pv: manager.passwordVersion || 0, reset: true });
  const frontendUrl = resolveFrontendUrl(clientOrigin);
  const resetLink = `${frontendUrl}/set-password?token=${token}`;

  let emailSent = false;
  let emailError = null;

  try {
    await sendMail(
      manager.email,
      "Set up your EduHub Campus Manager Account",
      "Welcome to EduHub! Please click the link to set up your password.",
      resetLink
    );
    emailSent = true;
  } catch (err) {
    console.warn(`[INSTITUTE_ADMIN] Setup email dispatch failed for ${manager.email}:`, err.message);
    emailError = err.message;
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `Setup email sent successfully to ${manager.email}`
      : `Setup link generated. (Email delivery skipped/failed: ${emailError || "SMTP unavailable"}. Please copy and share the link manually)`,
    resetLink,
    manager,
  };
};

/**
 * Update Campus Manager Details
 */
export const updateCampusManager = async (instituteId, campusId, updateData) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }
  if (!campus.managerId) {
    const error = new Error("No manager is assigned to this campus");
    error.statusCode = 400;
    throw error;
  }

  const allowedUpdates = {};
  if (updateData.name) allowedUpdates.name = updateData.name.trim();
  if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone.trim();
  if (updateData.status) allowedUpdates.status = updateData.status;
  if (updateData.isActive !== undefined) allowedUpdates.isActive = updateData.isActive;
  if (updateData.email) {
    const email = updateData.email.toLowerCase().trim();
    const existing = await User.findOne({ email, _id: { $ne: campus.managerId } });
    if (existing) {
      const error = new Error("Email is already registered by another user");
      error.statusCode = 409;
      throw error;
    }
    allowedUpdates.email = email;
  }

  const updatedManager = await User.findByIdAndUpdate(
    campus.managerId,
    allowedUpdates,
    { new: true, runValidators: true }
  ).select("-passwordHash");

  return updatedManager;
};

/**
 * Unassign Campus Manager from Campus
 */
export const unassignCampusManager = async (instituteId, campusId) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }
  if (campus.managerId) {
    await User.findByIdAndUpdate(campus.managerId, { campusId: null });
    campus.managerId = null;
    await campus.save();
  }
  return { message: "Manager unassigned successfully" };
};

/**
 * List all Campus Managers under this institute
 */
export const getCampusManagers = async (instituteId) => {
  const managers = await User.find({
    instituteId,
    role: { $in: ["campus_manager", "campus_admin"] },
  })
    .select("-passwordHash")
    .populate("campusId", "name phone status")
    .sort({ createdAt: -1 });

  return managers;
};

/**
 * Appoint / Create a new Campus Manager under this institute
 */
export const createCampusManager = async (
  instituteId,
  { name, email, campusId, phone },
  clientOrigin = null
) => {
  if (!name || !email || !campusId) {
    const error = new Error("Name, email, and campusId are required");
    error.statusCode = 400;
    throw error;
  }

  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Target campus does not exist under your institute");
    error.statusCode = 404;
    throw error;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const randomPassword = crypto.randomBytes(16).toString("hex");

  const manager = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: randomPassword,
    role: "campus_manager",
    instituteId,
    campusId: campus._id,
    phone: phone ? phone.trim() : "",
  });

  // Assign to campus if empty
  if (!campus.managerId) {
    campus.managerId = manager._id;
    await campus.save();
  }

  const token = generateToken({ id: manager._id, role: manager.role, pv: manager.passwordVersion || 0, reset: true });
  const frontendUrl = resolveFrontendUrl(clientOrigin);
  const resetLink = `${frontendUrl}/set-password?token=${token}`;
  
  try {
    await sendMail(
      manager.email,
      "Set up your EduHub Campus Manager Account",
      "Welcome to EduHub! Please click the link to set up your password.",
      resetLink
    );
  } catch (err) {
    console.error("Failed to send setup email:", err);
  }

  const managerObj = manager.toObject();
  delete managerObj.passwordHash;

  return managerObj;
};

/**
 * List all staff (teachers, campus managers, admins) under this institute
 */
export const getStaff = async (instituteId) => {
  const staff = await User.find({
    instituteId,
    role: { $in: ["teacher", "campus_manager", "campus_admin"] },
  })
    .select("-passwordHash")
    .populate("campusId", "name status address")
    .sort({ createdAt: -1 });

  return staff;
};

/**
 * Create a staff member under this institute
 */
export const createStaff = async (
  instituteId,
  { name, email, role = "teacher", campusId, phone }
) => {
  if (!name || !email || !campusId) {
    const error = new Error("Name, email, and campus are required");
    error.statusCode = 400;
    throw error;
  }

  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const validRole = ["teacher", "campus_manager", "campus_admin"].includes(role)
    ? role
    : "teacher";

  const randomPassword = crypto.randomBytes(16).toString("hex");

  const staff = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: randomPassword,
    role: validRole,
    instituteId,
    campusId: campus._id,
    phone: phone ? phone.trim() : "",
  });

  const token = generateToken({ id: staff._id, role: staff.role, pv: staff.passwordVersion || 0, reset: true });
  const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
  const resetLink = `${frontendUrl}/set-password?token=${token}`;
  
  try {
    await sendMail(
      staff.email,
      "Set up your EduHub Staff Account",
      "Welcome to EduHub! Please click the link to set up your password.",
      resetLink
    );
  } catch (err) {
    console.error("Failed to send setup email:", err);
  }

  const staffObj = staff.toObject();
  delete staffObj.passwordHash;
  return staffObj;
};

/**
 * Delete a staff member under this institute
 */
export const deleteStaff = async (instituteId, staffId) => {
  const staff = await User.findOneAndDelete({
    _id: staffId,
    instituteId,
    role: { $in: ["teacher", "campus_manager", "campus_admin"] },
  });

  if (!staff) {
    const error = new Error("Staff member not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Staff member deleted successfully" };
};

/**
 * List all students under this institute
 */
export const getStudents = async (instituteId) => {
  const students = await User.find({
    instituteId,
    role: "student",
  })
    .select("-passwordHash")
    .populate("campusId", "name status")
    .sort({ createdAt: -1 });

  return students;
};

/**
 * Create a student under this institute
 */
export const createStudent = async (
  instituteId,
  { name, email, campusId, phone }
) => {
  if (!name || !email || !campusId) {
    const error = new Error("Name, email, and campus are required");
    error.statusCode = 400;
    throw error;
  }

  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const randomPassword = crypto.randomBytes(16).toString("hex");

  const student = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: randomPassword,
    role: "student",
    instituteId,
    campusId: campus._id,
    phone: phone ? phone.trim() : "",
  });

  const token = generateToken({ id: student._id, role: student.role, pv: student.passwordVersion || 0, reset: true });
  const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
  const resetLink = `${frontendUrl}/set-password?token=${token}`;
  
  try {
    await sendMail(
      student.email,
      "Set up your EduHub Student Account",
      "Welcome to EduHub! Please click the link to set up your password.",
      resetLink
    );
  } catch (err) {
    console.error("Failed to send setup email:", err);
  }

  const studentObj = student.toObject();
  delete studentObj.passwordHash;
  return studentObj;
};

/**
 * Update student under this institute
 */
export const updateStudent = async (instituteId, studentId, updateData) => {
  delete updateData.passwordHash;
  delete updateData.instituteId;

  const student = await User.findOneAndUpdate(
    { _id: studentId, instituteId, role: "student" },
    updateData,
    { new: true, runValidators: true }
  )
    .select("-passwordHash")
    .populate("campusId", "name status");

  if (!student) {
    const error = new Error("Student not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  return student;
};

/**
 * Delete student under this institute
 */
export const deleteStudent = async (instituteId, studentId) => {
  const student = await User.findOneAndDelete({
    _id: studentId,
    instituteId,
    role: "student",
  });

  if (!student) {
    const error = new Error("Student not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Student deleted successfully" };
};

/**
 * List all alerts under this institute
 */
export const getAlerts = async (instituteId) => {
  const alerts = await Alert.find({ instituteId })
    .populate("createdBy", "name email")
    .populate("campusId", "name")
    .sort({ createdAt: -1 });

  return alerts;
};

/**
 * Create broadcast alert under this institute
 */
export const createAlert = async (
  instituteId,
  { audience, severity, title, message, campusId },
  userId
) => {
  if (!message || !message.trim()) {
    const error = new Error("Alert message is required");
    error.statusCode = 400;
    throw error;
  }

  const alert = await Alert.create({
    instituteId,
    campusId: campusId || null,
    audience: audience || "all",
    severity: severity || "Info",
    title: title ? title.trim() : "Broadcast Notice",
    message: message.trim(),
    createdBy: userId || null,
  });

  return alert;
};

/**
 * Get the institute's current SaaS subscription and quota consumption
 */
export const getInstituteSubscription = async (instituteId) => {
  const institute = await Institute.findById(instituteId).populate("planId");
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  let plan = institute.planId;
  if (!plan) {
    plan = (await Plan.findOne({ tier: institute.planTier || "free" })) || (await Plan.findOne());
  }

  const [campusCount, studentCount, staffCount] = await Promise.all([
    Campus.countDocuments({ instituteId }),
    User.countDocuments({ instituteId, role: "student" }),
    User.countDocuments({ instituteId, role: { $in: ["teacher", "staff", "campus_admin", "campus_manager"] } }),
  ]);

  const now = new Date();
  const endDate = institute.subscriptionEndDate ? new Date(institute.subscriptionEndDate) : null;
  const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))) : null;
  const isExpired = endDate ? endDate < now : false;

  const maxCampuses = plan?.maxCampuses ?? 1;
  const maxStudents = plan?.maxStudents ?? 50;
  const maxStaff = plan?.maxStaff ?? 10;

  return {
    instituteId: institute._id,
    instituteName: institute.name,
    plan: {
      id: plan?._id,
      name: plan?.name ?? (institute.planTier ? institute.planTier.toUpperCase() : "Free Community Tier"),
      tier: plan?.tier ?? institute.planTier ?? "free",
      description: plan?.description ?? "",
      priceMonthly: plan?.priceMonthly ?? 0,
      priceYearly: plan?.priceYearly ?? 0,
      currency: plan?.currency ?? "PKR",
      features: plan?.features ?? [],
      maxCampuses,
      maxStudents,
      maxStaff,
    },
    subscription: {
      status: institute.subscriptionStatus || "Active",
      billingCycle: institute.subscriptionBillingCycle || "yearly",
      startDate: institute.subscriptionStartDate || institute.createdAt,
      endDate: institute.subscriptionEndDate,
      daysRemaining,
      isExpired,
    },
    usage: {
      campuses: {
        current: campusCount,
        max: maxCampuses,
        percentage: Math.min(100, Math.round((campusCount / maxCampuses) * 100)),
      },
      students: {
        current: studentCount,
        max: maxStudents,
        percentage: Math.min(100, Math.round((studentCount / maxStudents) * 100)),
      },
      staff: {
        current: staffCount,
        max: maxStaff,
        percentage: Math.min(100, Math.round((staffCount / maxStaff) * 100)),
      },
    },
    features: plan?.features ?? [],
  };
};

/**
 * Get Institute-wide Audit Logs with Multi-Campus Filtering (Pure Real Data)
 */
export const getInstituteAuditLogs = async (instituteId, query = {}) => {
  // 1. Fetch all campuses of this institute for validation and dropdown
  const campuses = await Campus.find({ instituteId })
    .select("_id name code city status")
    .sort({ name: 1 })
    .lean();

  const campusIds = campuses.map((c) => c._id);

  // 2. Build multi-tenant filter query
  const andConditions = [];

  // Campus Scope Filter: Either specific campus or all institute campuses
  if (query.campusId && query.campusId !== "all" && query.campusId !== "") {
    andConditions.push({ campusId: query.campusId });
  } else {
    andConditions.push({
      $or: [
        { instituteId },
        { campusId: { $in: campusIds } },
      ],
    });
  }

  // Entity Type Filter
  if (query.entityType && query.entityType !== "all") {
    andConditions.push({ entityType: query.entityType });
  }

  // Action Filter
  if (query.action && query.action !== "all") {
    andConditions.push({ action: query.action });
  }

  // Date Range Filter
  if (query.startDate || query.endDate) {
    const timeFilter = {};
    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      timeFilter.$lte = end;
    }
    andConditions.push({ timestamp: timeFilter });
  }

  // Free text search
  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    andConditions.push({
      $or: [
        { "performedBy.name": { $regex: s, $options: "i" } },
        { "performedBy.email": { $regex: s, $options: "i" } },
        { "performedBy.role": { $regex: s, $options: "i" } },
        { reason: { $regex: s, $options: "i" } },
        { entityType: { $regex: s, $options: "i" } },
        { action: { $regex: s, $options: "i" } },
      ],
    });
  }

  const finalFilter = andConditions.length > 0 ? { $and: andConditions } : {};

  // 3. Pagination
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(finalFilter)
      .populate("campusId", "name code city")
      .populate("instituteId", "name")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(finalFilter),
  ]);

  // 4. Compute Aggregate Stats for the Institute
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayCount, criticalCount] = await Promise.all([
    AuditLog.countDocuments({
      $or: [{ instituteId }, { campusId: { $in: campusIds } }],
      timestamp: { $gte: startOfToday },
    }),
    AuditLog.countDocuments({
      $or: [{ instituteId }, { campusId: { $in: campusIds } }],
      action: { $in: ["deleted", "rejected", "waived", "deactivated", "cancelled"] },
    }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    campuses: campuses.map((c) => ({
      _id: c._id.toString(),
      id: c._id.toString(),
      name: c.name,
      code: c.code || "",
      city: c.city || "",
    })),
    stats: {
      totalLogs: total,
      todayLogs: todayCount,
      criticalEvents: criticalCount,
      totalCampuses: campuses.length,
    },
  };
};

/**
 * ============================================================================
 * MULTI-CAMPUS REVENUE & FEES COLLECTION SUITE (Institute Admin)
 * Consolidated overview across all campuses or drill-down per campus
 * ============================================================================
 */

/**
 * Comprehensive Revenue Analytics across all campuses or filtered by branch
 */
export const getInstituteRevenueAnalytics = async (instituteId, query = {}) => {
  const allCampuses = await Campus.find({ instituteId })
    .populate("managerId", "name email phone")
    .lean();
  const allCampusIds = allCampuses.map((c) => c._id);
  const campusMap = new Map(allCampuses.map((c) => [c._id.toString(), c]));

  let targetCampusIds = allCampusIds;
  let isFilteredCampus = false;
  if (query.campusId && query.campusId !== "all") {
    const valid = allCampusIds.some((id) => id.toString() === query.campusId.toString());
    if (valid) {
      targetCampusIds = [new mongoose.Types.ObjectId(query.campusId)];
      isFilteredCampus = true;
    }
  }

  // Base matches
  const feeMatch = {
    campusId: { $in: targetCampusIds },
    "omitted.isOmitted": { $ne: true },
  };
  if (query.month) {
    feeMatch.month = query.month;
  }
  if (query.academicSession) {
    feeMatch.academicSession = query.academicSession;
  }

  const paymentMatch = {
    campusId: { $in: targetCampusIds },
    status: "CONFIRMED",
  };
  if (query.month) {
    const [yearStr, monthStr] = query.month.split("-");
    if (yearStr && monthStr) {
      const start = new Date(Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1));
      const end = new Date(Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10), 1));
      paymentMatch.paymentDate = { $gte: start, $lt: end };
    }
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Parallel execution of financial aggregates
  const [
    feeStats,
    paymentStats,
    todayPayments,
    monthPayments,
    uniquePayingStudents,
    campusAgg,
    studentCounts,
    monthlyAgg,
    feeTypeAgg,
    paymentMethodAgg,
  ] = await Promise.all([
    FeeRecord.aggregate([
      { $match: feeMatch },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: { $ifNull: ["$totalPayable", "$amount"] } },
          totalCollected: { $sum: "$paidAmount" },
          totalWaivers: {
            $sum: {
              $add: [
                { $ifNull: ["$waiver.amount", 0] },
                { $ifNull: ["$discount.amount", 0] },
              ],
            },
          },
          count: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $in: ["$status", ["PAID", "paid"]] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $in: ["$status", ["PARTIALLY_PAID", "partially_paid"]] }, 1, 0] } },
          unpaidCount: { $sum: { $cond: [{ $in: ["$status", ["UNPAID", "unpaid", "GENERATED"]] }, 1, 0] } },
          overdueCount: { $sum: { $cond: [{ $in: ["$status", ["OVERDUE", "overdue"]] }, 1, 0] } },
        },
      },
    ]),
    PaymentTransaction.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: null,
          totalPaymentsVolume: { $sum: "$amount" },
          totalTransactionsCount: { $sum: 1 },
        },
      },
    ]),
    PaymentTransaction.aggregate([
      {
        $match: {
          campusId: { $in: targetCampusIds },
          status: "CONFIRMED",
          paymentDate: { $gte: startOfToday },
        },
      },
      { $group: { _id: null, todayTotal: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    PaymentTransaction.aggregate([
      {
        $match: {
          campusId: { $in: targetCampusIds },
          status: "CONFIRMED",
          paymentDate: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, monthTotal: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    FeeRecord.distinct("studentId", feeMatch),
    // Multi-campus comparison aggregation across all campuses
    FeeRecord.aggregate([
      { $match: { campusId: { $in: allCampusIds }, "omitted.isOmitted": { $ne: true } } },
      {
        $group: {
          _id: "$campusId",
          totalBilled: { $sum: { $ifNull: ["$totalPayable", "$amount"] } },
          totalCollected: { $sum: "$paidAmount" },
          totalWaivers: {
            $sum: {
              $add: [
                { $ifNull: ["$waiver.amount", 0] },
                { $ifNull: ["$discount.amount", 0] },
              ],
            },
          },
          vouchersCount: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $in: ["$status", ["PAID", "paid"]] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $in: ["$status", ["PARTIALLY_PAID", "partially_paid"]] }, 1, 0] } },
          unpaidCount: { $sum: { $cond: [{ $in: ["$status", ["UNPAID", "unpaid", "GENERATED"]] }, 1, 0] } },
          overdueCount: { $sum: { $cond: [{ $in: ["$status", ["OVERDUE", "overdue"]] }, 1, 0] } },
        },
      },
    ]),
    User.aggregate([
      { $match: { campusId: { $in: allCampusIds }, role: "student" } },
      { $group: { _id: "$campusId", count: { $sum: 1 } } },
    ]),
    // Monthly trend aggregation (last 12 months)
    FeeRecord.aggregate([
      {
        $match: {
          campusId: { $in: targetCampusIds },
          "omitted.isOmitted": { $ne: true },
          month: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$month",
          billed: { $sum: { $ifNull: ["$totalPayable", "$amount"] } },
          collected: { $sum: "$paidAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    // Fee Category breakdown
    FeeRecord.aggregate([
      { $match: feeMatch },
      {
        $group: {
          _id: "$feeType",
          totalCollected: { $sum: "$paidAmount" },
          totalBilled: { $sum: { $ifNull: ["$totalPayable", "$amount"] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalBilled: -1 } },
    ]),
    // Payment Methods breakdown
    PaymentTransaction.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);

  const totalBilled = feeStats[0]?.totalBilled || 0;
  const totalCollected = feeStats[0]?.totalCollected || paymentStats[0]?.totalPaymentsVolume || 0;
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;
  const totalWaived = feeStats[0]?.totalWaivers || 0;

  // Map student counts and campus breakdown
  const studentCountMap = new Map(studentCounts.map((s) => [s._id.toString(), s.count]));
  const campusAggMap = new Map(campusAgg.map((a) => [a._id.toString(), a]));

  const campusBreakdown = allCampuses.map((c) => {
    const cIdStr = c._id.toString();
    const aggData = campusAggMap.get(cIdStr) || {};
    const cBilled = aggData.totalBilled || 0;
    const cCollected = aggData.totalCollected || 0;
    const cOutstanding = Math.max(0, cBilled - cCollected);
    const cRate = cBilled > 0 ? Number(((cCollected / cBilled) * 100).toFixed(1)) : 0;

    return {
      id: cIdStr,
      _id: cIdStr,
      name: c.name,
      code: c.code || "",
      city: typeof c.address === "object" ? c.address?.city || "" : c.city || "",
      address: typeof c.address === "object" ? c.address?.street || c.address?.city || "" : c.address || "",
      manager: c.managerId
        ? {
            name: c.managerId.name,
            email: c.managerId.email,
            phone: c.managerId.phone || "",
          }
        : null,
      studentsCount: studentCountMap.get(cIdStr) || 0,
      totalBilled: cBilled,
      totalCollected: cCollected,
      totalOutstanding: cOutstanding,
      collectionRate: cRate,
      vouchersCount: aggData.vouchersCount || 0,
      paidCount: aggData.paidCount || 0,
      partialCount: aggData.partialCount || 0,
      unpaidCount: aggData.unpaidCount || 0,
      overdueCount: aggData.overdueCount || 0,
      totalWaivers: aggData.totalWaivers || 0,
    };
  });

  return {
    kpis: {
      totalBilled,
      totalRevenue: totalCollected,
      totalCollected,
      totalOutstanding,
      collectionRate,
      totalWaived,
      totalVouchers: feeStats[0]?.count || 0,
      paidVouchersCount: feeStats[0]?.paidCount || 0,
      partialVouchersCount: feeStats[0]?.partialCount || 0,
      unpaidVouchersCount: feeStats[0]?.unpaidCount || 0,
      overdueVouchersCount: feeStats[0]?.overdueCount || 0,
      todayRevenue: todayPayments[0]?.todayTotal || 0,
      thisMonthRevenue: monthPayments[0]?.monthTotal || 0,
      activePayingStudents: uniquePayingStudents.length,
      totalTransactionsCount: paymentStats[0]?.totalTransactionsCount || 0,
    },
    campusBreakdown,
    monthlyTrend: monthlyAgg.map((m) => {
      const b = m.billed || 0;
      const c = m.collected || 0;
      return {
        month: m._id,
        billed: b,
        collected: c,
        outstanding: Math.max(0, b - c),
        collectionRate: b > 0 ? Number(((c / b) * 100).toFixed(1)) : 0,
        vouchers: m.count || 0,
      };
    }),
    feeTypeBreakdown: feeTypeAgg.map((f) => ({
      name: f._id || "Tuition Fee",
      feeType: f._id || "Tuition Fee",
      billed: f.totalBilled || 0,
      collected: f.totalCollected || 0,
      percentage: totalBilled > 0 ? Number(((f.totalBilled / totalBilled) * 100).toFixed(1)) : 0,
      count: f.count || 0,
    })),
    paymentMethodBreakdown: paymentMethodAgg.map((p) => ({
      method: p._id || "Cash",
      totalAmount: p.totalAmount || 0,
      count: p.count || 0,
      percentage: totalCollected > 0 ? Number(((p.totalAmount / totalCollected) * 100).toFixed(1)) : 0,
    })),
    campuses: allCampuses.map((c) => ({
      id: c._id.toString(),
      _id: c._id.toString(),
      name: c.name,
      code: c.code || "",
      city: typeof c.address === "object" ? c.address?.city || "" : c.city || "",
    })),
    selectedCampusId: isFilteredCampus ? query.campusId : "all",
  };
};

/**
 * Paginated Payment Transactions Ledger across campuses
 */
export const getInstituteRevenueTransactions = async (instituteId, query = {}) => {
  const allCampuses = await Campus.find({ instituteId }).select("_id name code").lean();
  const allCampusIds = allCampuses.map((c) => c._id);

  let targetCampusIds = allCampusIds;
  if (query.campusId && query.campusId !== "all") {
    targetCampusIds = allCampusIds.filter((id) => id.toString() === query.campusId.toString());
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const matchFilter = {
    campusId: { $in: targetCampusIds },
  };

  if (query.status && query.status !== "all") {
    matchFilter.status = query.status.toUpperCase();
  }
  if (query.paymentMethod && query.paymentMethod !== "all") {
    matchFilter.paymentMethod = new RegExp(`^${query.paymentMethod}$`, "i");
  }
  if (query.startDate || query.endDate) {
    matchFilter.paymentDate = {};
    if (query.startDate) matchFilter.paymentDate.$gte = new Date(query.startDate);
    if (query.endDate) matchFilter.paymentDate.$lte = new Date(query.endDate);
  }

  // If search query is provided, find matching students first
  if (query.search && query.search.trim()) {
    const sTerm = query.search.trim();
    const matchingStudents = await User.find({
      campusId: { $in: targetCampusIds },
      role: "student",
      $or: [
        { name: { $regex: sTerm, $options: "i" } },
        { email: { $regex: sTerm, $options: "i" } },
        { roll: { $regex: sTerm, $options: "i" } },
        { rollNo: { $regex: sTerm, $options: "i" } },
      ],
    }).select("_id");

    const studentIds = matchingStudents.map((s) => s._id);

    matchFilter.$or = [
      { receiptNo: { $regex: sTerm, $options: "i" } },
      { referenceNo: { $regex: sTerm, $options: "i" } },
      { studentId: { $in: studentIds } },
    ];
  }

  const [transactions, total, summaryAgg] = await Promise.all([
    PaymentTransaction.find(matchFilter)
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "name email roll rollNo gradeOrClass avatar phone")
      .populate("campusId", "name code address")
      .populate("feeRecordId", "challanNo feeType month dueDate amount paidAmount totalPayable status breakdown discount waiver")
      .populate("confirmedBy", "name email")
      .lean(),
    PaymentTransaction.countDocuments(matchFilter),
    PaymentTransaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          confirmedAmount: { $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, "$amount", 0] } },
        },
      },
    ]),
  ]);

  return {
    transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    summary: {
      totalAmount: summaryAgg[0]?.totalAmount || 0,
      confirmedAmount: summaryAgg[0]?.confirmedAmount || 0,
      filteredCount: total,
    },
  };
};

/**
 * Paginated Student Fee Records / Invoices across campuses
 */
export const getInstituteFeeRecords = async (instituteId, query = {}) => {
  const allCampuses = await Campus.find({ instituteId }).select("_id name code").lean();
  const allCampusIds = allCampuses.map((c) => c._id);

  let targetCampusIds = allCampusIds;
  if (query.campusId && query.campusId !== "all") {
    targetCampusIds = allCampusIds.filter((id) => id.toString() === query.campusId.toString());
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const matchFilter = {
    campusId: { $in: targetCampusIds },
    "omitted.isOmitted": { $ne: true },
  };

  if (query.status && query.status !== "all") {
    matchFilter.status = new RegExp(`^${query.status}$`, "i");
  }
  if (query.feeType && query.feeType !== "all") {
    matchFilter.feeType = new RegExp(`^${query.feeType}$`, "i");
  }
  if (query.gradeOrClass && query.gradeOrClass !== "all") {
    matchFilter.gradeOrClass = query.gradeOrClass;
  }
  if (query.month) {
    matchFilter.month = query.month;
  }

  if (query.search && query.search.trim()) {
    const sTerm = query.search.trim();
    const matchingStudents = await User.find({
      campusId: { $in: targetCampusIds },
      role: "student",
      $or: [
        { name: { $regex: sTerm, $options: "i" } },
        { email: { $regex: sTerm, $options: "i" } },
        { roll: { $regex: sTerm, $options: "i" } },
        { rollNo: { $regex: sTerm, $options: "i" } },
      ],
    }).select("_id");

    const studentIds = matchingStudents.map((s) => s._id);

    matchFilter.$or = [
      { challanNo: { $regex: sTerm, $options: "i" } },
      { receiptNo: { $regex: sTerm, $options: "i" } },
      { studentId: { $in: studentIds } },
    ];
  }

  const [records, total, summaryAgg] = await Promise.all([
    FeeRecord.find(matchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "name email roll rollNo gradeOrClass avatar phone")
      .populate("campusId", "name code address")
      .lean(),
    FeeRecord.countDocuments(matchFilter),
    FeeRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: { $ifNull: ["$totalPayable", "$amount"] } },
          totalCollected: { $sum: "$paidAmount" },
        },
      },
    ]),
  ]);

  const billed = summaryAgg[0]?.totalBilled || 0;
  const collected = summaryAgg[0]?.totalCollected || 0;

  return {
    records,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    summary: {
      totalBilled: billed,
      totalCollected: collected,
      totalOutstanding: Math.max(0, billed - collected),
    },
  };
};

/**
 * Fee Structures oversight across all campuses
 */
export const getInstituteFeeStructures = async (instituteId, query = {}) => {
  const allCampuses = await Campus.find({ instituteId }).select("_id name code city").lean();
  const allCampusIds = allCampuses.map((c) => c._id);

  let targetCampusIds = allCampusIds;
  if (query.campusId && query.campusId !== "all") {
    targetCampusIds = allCampusIds.filter((id) => id.toString() === query.campusId.toString());
  }

  const structures = await FeeStructure.find({
    campusId: { $in: targetCampusIds },
  })
    .populate("campusId", "name code city")
    .sort({ campusId: 1, gradeOrClass: 1 })
    .lean();

  return structures;
};

/**
 * Export full revenue dataset for financial reporting
 */
export const exportInstituteRevenueData = async (instituteId, query = {}) => {
  const allCampuses = await Campus.find({ instituteId }).select("_id name code").lean();
  const allCampusIds = allCampuses.map((c) => c._id);

  let targetCampusIds = allCampusIds;
  if (query.campusId && query.campusId !== "all") {
    targetCampusIds = allCampusIds.filter((id) => id.toString() === query.campusId.toString());
  }

  const transactions = await PaymentTransaction.find({
    campusId: { $in: targetCampusIds },
    status: "CONFIRMED",
  })
    .sort({ paymentDate: -1 })
    .populate("studentId", "name email roll rollNo gradeOrClass")
    .populate("campusId", "name code")
    .populate("feeRecordId", "challanNo feeType month")
    .lean();

  return transactions.map((t) => ({
    receiptNo: t.receiptNo || "—",
    challanNo: t.feeRecordId?.challanNo || "—",
    date: t.paymentDate ? new Date(t.paymentDate).toISOString().split("T")[0] : "",
    studentName: t.studentId?.name || "Student",
    studentRoll: t.studentId?.roll || t.studentId?.rollNo || "—",
    gradeOrClass: t.studentId?.gradeOrClass || "—",
    campus: t.campusId?.name || "Main Campus",
    feeType: t.feeRecordId?.feeType || "Tuition Fee",
    month: t.feeRecordId?.month || "—",
    amountPaid: t.amount || 0,
    paymentMethod: t.paymentMethod || "Cash",
    referenceNo: t.referenceNo || "—",
    status: t.status,
  }));
};

export default {
  getInstituteStats,
  getInstituteProfile,
  getCampuses,
  createCampus,
  getCampusById,
  updateCampus,
  deleteCampus,
  assignCampusManager,
  resendCampusManagerInvite,
  updateCampusManager,
  unassignCampusManager,
  getCampusManagers,
  createCampusManager,
  getStaff,
  createStaff,
  deleteStaff,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAlerts,
  createAlert,
  getInstituteSubscription,
  getInstituteAuditLogs,
  // Multi-Campus Revenue & Fees Collection System
  getInstituteRevenueAnalytics,
  getInstituteRevenueTransactions,
  getInstituteFeeRecords,
  getInstituteFeeStructures,
  exportInstituteRevenueData,
};
