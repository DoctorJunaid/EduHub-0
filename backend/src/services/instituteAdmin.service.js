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
import { sendMail } from "../utils/emailService.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";

/**
 * Get Institute-wide KPIs & Statistics
 */
export const getInstituteStats = async (instituteId) => {
  const [
    totalCampuses,
    activeCampuses,
    totalManagers,
    totalTeachers,
    totalStudents,
  ] = await Promise.all([
    Campus.countDocuments({ instituteId }),
    Campus.countDocuments({ instituteId, status: "Active" }),
    User.countDocuments({ instituteId, role: { $in: ["campus_manager", "campus_admin"] } }),
    User.countDocuments({ instituteId, role: "teacher" }),
    User.countDocuments({ instituteId, role: "student" }),
  ]);

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
  { userId, email, name, phone, sendEmail = true }
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
  { name, email, campusId, phone }
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
  const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
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

export default {
  getInstituteStats,
  getInstituteProfile,
  getCampuses,
  createCampus,
  getCampusById,
  updateCampus,
  deleteCampus,
  assignCampusManager,
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
};
