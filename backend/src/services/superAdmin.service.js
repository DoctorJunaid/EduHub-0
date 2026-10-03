/**
 * Super Admin Service
 * Encapsulates all platform-level governance logic for managing institutes,
 * institute admins, campuses, global users, and analytical statistics.
 */
import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import Plan from "../models/plan.model.js";
import Alert from "../models/alert.model.js";
import Inquiry from "../models/inqueries.model.js";
import AuditLog from "../models/auditLog.model.js";
import { sendMail } from "../utils/emailService.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { uploadToCloudinary } from "../utils/cloudinary.js";

/**
 * Global Platform Statistics
 */
export const getGlobalStats = async () => {
  const [
    totalInstitutes,
    activeInstitutes,
    totalCampuses,
    activeCampuses,
    totalUsers,
    totalStudents,
    totalTeachers,
    totalInstituteAdmins,
    totalCampusManagers,
  ] = await Promise.all([
    Institute.countDocuments(),
    Institute.countDocuments({ status: "Active" }),
    Campus.countDocuments(),
    Campus.countDocuments({ status: "Active" }),
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "institute_admin" }),
    User.countDocuments({ role: { $in: ["campus_manager", "campus_admin"] } }),
  ]);

  return {
    institutes: {
      total: totalInstitutes,
      active: activeInstitutes,
      pending: totalInstitutes - activeInstitutes,
    },
    campuses: {
      total: totalCampuses,
      active: activeCampuses,
    },
    users: {
      total: totalUsers,
      students: totalStudents,
      teachers: totalTeachers,
      instituteAdmins: totalInstituteAdmins,
      campusManagers: totalCampusManagers,
    },
  };
};

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
 * List all institutes with optional search & filter and real-time campusCount
 */
export const getAllInstitutes = async (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.board) filter.board = query.board;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  const institutes = await Institute.find(filter)
    .populate("adminId", "name email phone avatar isActive")
    .sort({ createdAt: -1 });

  // Bulk compute child campus and student counts for all returned institutes
  const instituteIds = institutes.map((inst) => inst._id);
  const [campusCounts, studentCounts] = await Promise.all([
    Campus.aggregate([
      { $match: { instituteId: { $in: instituteIds } } },
      { $group: { _id: "$instituteId", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { instituteId: { $in: instituteIds }, role: "student" } },
      { $group: { _id: "$instituteId", count: { $sum: 1 } } },
    ]),
  ]);

  const campusCountMap = new Map(
    campusCounts.map((c) => [c._id.toString(), c.count])
  );
  const studentCountMap = new Map(
    studentCounts.map((s) => [s._id.toString(), s.count])
  );

  const enriched = institutes.map((inst) => {
    const instObj = inst.toObject ? inst.toObject() : { ...inst };
    return {
      ...instObj,
      campusCount: campusCountMap.get(inst._id.toString()) || 0,
      studentCount: studentCountMap.get(inst._id.toString()) || 0,
    };
  });

  return enriched;
};

/**
 * Create a new Institute with optional inline Institute Admin
 */
export const createInstitute = async (
  instituteData,
  adminData = null,
  file = null,
  clientOrigin = null
) => {
  const existingInstitute = await Institute.findOne({ name: instituteData.name.trim() });
  if (existingInstitute) {
    const error = new Error("An institute with this name already exists");
    error.statusCode = 409;
    throw error;
  }

  if (file) {
    try {
      instituteData.image = await uploadToCloudinary(file.buffer);
    } catch (err) {
      console.warn("Cloudinary upload rejected, using default image. Error:", err.message);
    }
  }

  if (!instituteData.planId) {
    const defaultPlan = (await Plan.findOne({ tier: "free" })) || (await Plan.findOne());
    if (defaultPlan) {
      instituteData.planId = defaultPlan._id;
      instituteData.planTier = defaultPlan.tier || "free";
    }
  }

  // Create Institute FIRST so we have an ID for the Admin
  const institute = await Institute.create({
    ...instituteData,
    adminId: instituteData.adminId || null,
  });

  let createdAdmin = null;
  let resetLink = null;
  let emailSent = false;

  // If admin credentials are provided inline, create the admin and link to the institute
  if (adminData && adminData.email) {
    const existingUser = await User.findOne({ email: adminData.email.toLowerCase().trim() });
    if (existingUser) {
      // If user exists, rollback institute creation
      await Institute.findByIdAndDelete(institute._id);
      const error = new Error("The specified admin email is already registered");
      error.statusCode = 409;
      throw error;
    }

    const randomPassword = crypto.randomBytes(16).toString("hex");

    createdAdmin = await User.create({
      name: adminData.name || `${instituteData.name} Admin`,
      email: adminData.email.toLowerCase().trim(),
      passwordHash: randomPassword,
      role: "institute_admin",
      phone: adminData.phone || "",
      instituteId: institute._id, // Assign Institute ID to Admin
    });

    // Link Admin back to Institute
    institute.adminId = createdAdmin._id;
    await institute.save();

    const token = generateToken({
      id: createdAdmin._id,
      role: createdAdmin.role,
      pv: createdAdmin.passwordVersion || 0,
      reset: true,
    });
    
    const frontendUrl = resolveFrontendUrl(clientOrigin);
    resetLink = `${frontendUrl}/set-password?token=${token}`;
    
    try {
      await sendMail(
        createdAdmin.email,
        "Set up your EduHub Institute Admin Account",
        "Welcome to EduHub! Please click the link to set up your password.",
        resetLink
      );
      emailSent = true;
    } catch (err) {
      console.warn("[SUPER_ADMIN] Setup email dispatch failed during institute creation:", err.message);
    }
  }

  const result = await Institute.findById(institute._id).populate(
    "adminId",
    "name email phone avatar"
  );
  const resultObj = result.toObject ? result.toObject() : { ...result };
  return {
    ...resultObj,
    campusCount: 0,
    resetLink,
    emailSent,
  };
};

/**
 * Get single institute by ID
 */
export const getInstituteById = async (id) => {
  const institute = await Institute.findById(id).populate(
    "adminId",
    "name email phone avatar isActive"
  );

  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  // Count campuses, students, and faculty under this institute in real time
  const [campusCount, studentCount, facultyCount] = await Promise.all([
    Campus.countDocuments({ instituteId: id }),
    User.countDocuments({ instituteId: id, role: "student" }),
    User.countDocuments({ instituteId: id, role: { $in: ["teacher", "faculty"] } }),
  ]);

  return {
    ...institute.toObject(),
    campusCount,
    studentCount,
    facultyCount,
  };
};

/**
 * Update institute by ID
 */
export const updateInstitute = async (id, updateData, file = null) => {
  const sanitizedData = { ...updateData };
  delete sanitizedData._id;
  delete sanitizedData.id;

  if (file) {
    try {
      sanitizedData.image = await uploadToCloudinary(file.buffer);
    } catch (err) {
      console.warn("Cloudinary upload rejected, preserving image or using default. Error:", err.message);
    }
  }

  const institute = await Institute.findByIdAndUpdate(id, sanitizedData, {
    new: true,
    runValidators: true,
  }).populate("adminId", "name email phone avatar");

  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  // Centralized Cascade: Automatically synchronize child campuses and users
  if (sanitizedData.status) {
    if (sanitizedData.status === "Suspended" || sanitizedData.status === "Inactive") {
      await Campus.updateMany({ instituteId: id }, { status: "Inactive" });
      await User.updateMany({ instituteId: id, role: { $ne: "super_admin" } }, { isActive: false });
    } else if (sanitizedData.status === "Active") {
      await Campus.updateMany({ instituteId: id }, { status: "Active" });
      await User.updateMany({ instituteId: id, role: { $ne: "super_admin" } }, { isActive: true });
    }
  }

  return institute;
};

/**
 * Delete institute by ID
 */
export const deleteInstitute = async (id) => {
  const institute = await Institute.findByIdAndDelete(id);

  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  // Centralized Cascade cleanup: remove campuses and users under this institute
  await Campus.deleteMany({ instituteId: id });
  await User.deleteMany({ instituteId: id, role: { $ne: "super_admin" } });

  return { message: "Institute, campuses, and associated users deleted successfully" };
};

/**
 * Assign or reassign Institute Admin
 */
export const assignInstituteAdmin = async (instituteId, { userId, email, newAdminData }, clientOrigin = null) => {
  const institute = await Institute.findById(instituteId);
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  let adminUser;

  if (userId) {
    adminUser = await User.findById(userId);
  } else if (email) {
    adminUser = await User.findOne({ email: email.toLowerCase().trim() });
  } else if (newAdminData && newAdminData.email) {
    const existing = await User.findOne({ email: newAdminData.email.toLowerCase().trim() });
    if (existing) {
      adminUser = existing;
      if (newAdminData.name) adminUser.name = newAdminData.name.trim();
      if (newAdminData.phone) adminUser.phone = newAdminData.phone.trim();
    } else {
      adminUser = await User.create({
        name: newAdminData.name ? newAdminData.name.trim() : "Institute Admin",
        email: newAdminData.email.toLowerCase().trim(),
        passwordHash: newAdminData.password || crypto.randomBytes(16).toString("hex"),
        role: "institute_admin",
        status: "Pending",
        instituteId: institute._id,
        phone: newAdminData.phone || "",
      });
    }
  }

  if (!adminUser) {
    const error = new Error("User to assign as Institute Admin not found");
    error.statusCode = 404;
    throw error;
  }

  // If replacing existing admin, safely retire previous admin privileges
  if (institute.adminId && institute.adminId.toString() !== adminUser._id.toString()) {
    try {
      await User.findByIdAndUpdate(institute.adminId, {
        status: "Inactive",
        isActive: false,
      });
    } catch (err) {
      console.warn("Could not deactivate previous admin:", err.message);
    }
  }

  // Update user role and assign institute
  adminUser.role = "institute_admin";
  adminUser.instituteId = institute._id;
  await adminUser.save();

  // Link admin to institute
  institute.adminId = adminUser._id;
  await institute.save();

  // Generate setup link and send email
  const token = generateToken({
    id: adminUser._id,
    role: adminUser.role,
    pv: adminUser.passwordVersion || 0,
    reset: true,
  });
  const frontendUrl = resolveFrontendUrl(clientOrigin);
  const resetLink = `${frontendUrl}/set-password?token=${token}`;

  try {
    await sendMail(
      adminUser.email,
      "Set up your EduHub Institute Admin Account",
      "Welcome to EduHub! Please click the link to set up your password.",
      resetLink
    );
  } catch (err) {
    console.error("Failed to send setup email during institute admin assignment:", err);
  }

  const userObj = adminUser.toObject();
  delete userObj.passwordHash;

  return { institute, admin: userObj, resetLink };
};

/**
 * Resend setup invite email to Institute Admin with fail-safe SMTP handling
 */
export const resendInstituteAdminInvite = async (instituteId, clientOrigin = null) => {
  const institute = await Institute.findById(instituteId).populate(
    "adminId",
    "name email phone role status passwordVersion"
  );
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }
  if (!institute.adminId) {
    const error = new Error("No admin is currently assigned to this institute");
    error.statusCode = 400;
    throw error;
  }

  const admin = institute.adminId;
  const token = generateToken({ id: admin._id, role: admin.role || "institute_admin", pv: admin.passwordVersion || 0, reset: true });
  const frontendUrl = resolveFrontendUrl(clientOrigin);
  const resetLink = `${frontendUrl}/set-password?token=${token}`;

  let emailSent = false;
  let emailError = null;

  try {
    await sendMail(
      admin.email,
      "Set up your EduHub Institute Admin Account",
      "Welcome to EduHub! Please click the link to set up your password.",
      resetLink
    );
    emailSent = true;
  } catch (err) {
    console.warn(`[SUPER_ADMIN] Setup email dispatch failed for ${admin.email}:`, err.message);
    emailError = err.message;
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `Setup email sent successfully to ${admin.email}`
      : `Setup link generated. (Email delivery skipped/failed: ${emailError || "SMTP unavailable"}. Please copy and share the link manually)`,
    resetLink,
    admin,
  };
};

/**
 * Update Institute Admin Details
 */
export const updateInstituteAdmin = async (instituteId, updateData) => {
  const institute = await Institute.findById(instituteId);
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }
  if (!institute.adminId) {
    const error = new Error("No admin is assigned to this institute");
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
    const existing = await User.findOne({ email, _id: { $ne: institute.adminId } });
    if (existing) {
      const error = new Error("Email is already taken by another user");
      error.statusCode = 409;
      throw error;
    }
    allowedUpdates.email = email;
  }

  const updatedAdmin = await User.findByIdAndUpdate(
    institute.adminId,
    allowedUpdates,
    { new: true, runValidators: true }
  ).select("-passwordHash");

  return updatedAdmin;
};

/**
 * List all Institute Admins platform-wide
 */
export const getAllInstituteAdmins = async () => {
  const admins = await User.find({ role: "institute_admin" })
    .select("-passwordHash")
    .populate("instituteId", "name type board status")
    .sort({ createdAt: -1 });

  return admins;
};

/**
 * Create a new Institute Admin standalone
 */
export const createInstituteAdmin = async ({ name, email, password, instituteId, phone }) => {
  if (!name || !email || !password || !instituteId) {
    const error = new Error("Name, email, password, and instituteId are required");
    error.statusCode = 400;
    throw error;
  }

  const institute = await Institute.findById(instituteId);
  if (!institute) {
    const error = new Error("Target institute does not exist");
    error.statusCode = 404;
    throw error;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const admin = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
    role: "institute_admin",
    instituteId: institute._id,
    phone: phone ? phone.trim() : "",
  });

  // Assign this admin as primary admin on the institute if none exists
  if (!institute.adminId) {
    institute.adminId = admin._id;
    await institute.save();
  }

  const adminObj = admin.toObject();
  delete adminObj.passwordHash;

  return adminObj;
};

/**
 * List all campuses platform-wide
 */
export const getAllCampuses = async (query = {}) => {
  const filter = {};
  if (query.instituteId) filter.instituteId = query.instituteId;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  const campuses = await Campus.find(filter)
    .populate("instituteId", "name type board")
    .populate("managerId", "name email phone avatar")
    .sort({ createdAt: -1 });

  return campuses;
};

/**
 * Create a new Campus platform-wide
 */
export const createCampus = async (campusData) => {
  if (!campusData.instituteId || !campusData.name) {
    const error = new Error("instituteId and campus name are required");
    error.statusCode = 400;
    throw error;
  }

  const institute = await Institute.findById(campusData.instituteId);
  if (!institute) {
    const error = new Error("Referenced institute does not exist");
    error.statusCode = 404;
    throw error;
  }

  const campus = await Campus.create(campusData);
  return await Campus.findById(campus._id)
    .populate("instituteId", "name type board")
    .populate("managerId", "name email phone");
};

/**
 * Update a campus by ID
 */
export const updateCampus = async (id, updateData) => {
  const campus = await Campus.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("instituteId", "name type board")
    .populate("managerId", "name email phone");

  if (!campus) {
    const error = new Error("Campus not found");
    error.statusCode = 404;
    throw error;
  }

  return campus;
};

/**
 * Delete a campus by ID
 */
export const deleteCampus = async (id) => {
  const campus = await Campus.findByIdAndDelete(id);
  if (!campus) {
    const error = new Error("Campus not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Campus deleted successfully" };
};

/**
 * Global users list with optional server-side pagination
 */
export const getAllUsers = async (query = {}) => {
  const filter = {};
  if (query.role && query.role !== "all") filter.role = query.role;
  if (query.isActive !== undefined && query.isActive !== "all") filter.isActive = query.isActive === "true";
  if (query.instituteId) filter.instituteId = query.instituteId;
  if (query.campusId) filter.campusId = query.campusId;

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  // If page is specified, return paginated structure
  if (query.page || query.limit) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .populate("instituteId", "name type")
        .populate("campusId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Otherwise return full array for backwards compatibility
  const users = await User.find(filter)
    .select("-passwordHash")
    .populate("instituteId", "name type")
    .populate("campusId", "name")
    .sort({ createdAt: -1 });

  return users;
};

/**
 * Toggle user account status (active/inactive)
 */
export const toggleUserStatus = async (id) => {
  const user = await User.findById(id).select("-passwordHash");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "super_admin") {
    const error = new Error("Super Admin accounts cannot be deactivated");
    error.statusCode = 403;
    throw error;
  }

  user.isActive = !user.isActive;
  await user.save();

  return user;
};

// --- Platform Broadcasts ---
export const createBroadcast = async ({ title, message, severity, audience, instituteId }, userId) => {
  if (!title || !message) {
    const error = new Error("Title and message are required");
    error.statusCode = 400;
    throw error;
  }
  const broadcast = await Alert.create({
    title: title.trim(),
    message: message.trim(),
    severity: severity || "Info",
    audience: audience || "all",
    instituteId: instituteId || null,
    createdBy: userId || null,
  });
  return broadcast;
};

export const getAllBroadcasts = async () => {
  return await Alert.find()
    .populate("instituteId", "name type")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
};

export const deleteBroadcast = async (id) => {
  const alert = await Alert.findByIdAndDelete(id);
  if (!alert) {
    const error = new Error("Broadcast not found");
    error.statusCode = 404;
    throw error;
  }
  return { message: "Broadcast alert deleted successfully" };
};

// --- Public Inquiries & Leads ---
export const getAllInquiries = async (query = {}) => {
  const filter = {};
  if (query.status && query.status !== "all") filter.status = query.status;
  if (query.instituteType && query.instituteType !== "all") filter.instituteType = query.instituteType;
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { instituteName: { $regex: query.search, $options: "i" } },
    ];
  }
  return await Inquiry.find(filter).sort({ createdAt: -1 });
};

export const updateInquiryStatus = async (id, status) => {
  const inquiry = await Inquiry.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!inquiry) {
    const error = new Error("Inquiry not found");
    error.statusCode = 404;
    throw error;
  }
  return inquiry;
};

export const convertInquiryToInstitute = async (inquiryId) => {
  const inquiry = await Inquiry.findById(inquiryId);
  if (!inquiry) {
    const error = new Error("Inquiry not found");
    error.statusCode = 404;
    throw error;
  }

  // Pre-fill institute creation with inquiry details
  const institute = await createInstitute(
    {
      name: inquiry.instituteName,
      type: ["School", "College", "University"].includes(inquiry.instituteType) ? inquiry.instituteType : "School",
      email: inquiry.email,
      phone: inquiry.phone,
      board: "Federal",
      status: "Active",
    },
    {
      name: inquiry.fullName,
      email: inquiry.email,
      phone: inquiry.phone,
    }
  );

  inquiry.status = "Converted";
  await inquiry.save();

  return { institute, inquiry };
};

// --- Platform Audit Logs ---
export const getPlatformAuditLogs = async (query = {}) => {
  const filter = {};
  if (query.entityType && query.entityType !== "all") filter.entityType = query.entityType;
  if (query.action && query.action !== "all") filter.action = query.action;
  if (query.instituteId) filter.instituteId = query.instituteId;

  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 30));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("campusId", "name")
      .populate("instituteId", "name")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};

// --- SaaS Plan Management ---

export const getAllPlans = async () => {
  const plans = await Plan.find().sort({ priceMonthly: 1 });
  const enriched = await Promise.all(
    plans.map(async (plan) => {
      const instituteCount = await Institute.countDocuments({ planId: plan._id });
      return {
        ...plan.toObject(),
        instituteCount,
      };
    })
  );
  return enriched;
};

export const createPlan = async (planData) => {
  if (!planData.tier || !planData.name) {
    const error = new Error("Plan tier identifier and name are required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await Plan.findOne({ tier: planData.tier.toLowerCase().trim() });
  if (existing) {
    const error = new Error(`A plan with tier identifier '${planData.tier}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const plan = await Plan.create({
    ...planData,
    tier: planData.tier.toLowerCase().trim(),
  });

  return plan;
};

export const getPlanById = async (id) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  const institutes = await Institute.find({ planId: id })
    .select("name type email phone status subscriptionStatus subscriptionEndDate")
    .sort({ name: 1 });

  return {
    ...plan.toObject(),
    institutes,
  };
};

export const updatePlan = async (id, updateData) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  if (updateData.tier && updateData.tier.toLowerCase().trim() !== plan.tier) {
    const existing = await Plan.findOne({ tier: updateData.tier.toLowerCase().trim() });
    if (existing) {
      const error = new Error(`A plan with tier '${updateData.tier}' already exists`);
      error.statusCode = 409;
      throw error;
    }
    plan.tier = updateData.tier.toLowerCase().trim();
  }

  if (updateData.name !== undefined) plan.name = updateData.name;
  if (updateData.description !== undefined) plan.description = updateData.description;
  if (updateData.priceMonthly !== undefined) plan.priceMonthly = Number(updateData.priceMonthly);
  if (updateData.priceYearly !== undefined) plan.priceYearly = Number(updateData.priceYearly);
  if (updateData.currency !== undefined) plan.currency = updateData.currency;
  if (updateData.maxCampuses !== undefined) plan.maxCampuses = Number(updateData.maxCampuses);
  if (updateData.maxStudents !== undefined) plan.maxStudents = Number(updateData.maxStudents);
  if (updateData.maxStaff !== undefined) plan.maxStaff = Number(updateData.maxStaff);
  if (updateData.trialDays !== undefined) plan.trialDays = Number(updateData.trialDays);
  if (updateData.isPopular !== undefined) plan.isPopular = Boolean(updateData.isPopular);
  if (updateData.isActive !== undefined) plan.isActive = Boolean(updateData.isActive);

  await plan.save();

  // Keep planTier synced on all institutes using this plan
  await Institute.updateMany(
    { planId: plan._id },
    { $set: { planTier: plan.tier } }
  );

  return plan;
};

export const togglePlanStatus = async (id) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  plan.isActive = !plan.isActive;
  await plan.save();
  return plan;
};

export const deletePlan = async (id) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  const assignedCount = await Institute.countDocuments({ planId: id });
  if (assignedCount > 0) {
    const error = new Error(`Cannot delete plan: ${assignedCount} institution(s) are currently assigned to it. Reassign them first.`);
    error.statusCode = 400;
    throw error;
  }

  await Plan.findByIdAndDelete(id);
  return { message: "Plan deleted successfully" };
};

// --- SaaS Subscription Governance (Manual Assignment) ---

export const getAllSubscriptions = async (query = {}) => {
  const filter = {};
  if (query.status) filter.subscriptionStatus = query.status;
  if (query.planTier) filter.planTier = query.planTier;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  const institutes = await Institute.find(filter)
    .populate("planId")
    .populate("adminId", "name email phone avatar")
    .sort({ createdAt: -1 });

  const subscriptions = await Promise.all(
    institutes.map(async (inst) => {
      const plan = inst.planId;
      const [campusCount, studentCount, staffCount] = await Promise.all([
        Campus.countDocuments({ instituteId: inst._id }),
        User.countDocuments({ instituteId: inst._id, role: "student" }),
        User.countDocuments({ instituteId: inst._id, role: { $in: ["teacher", "staff", "campus_admin", "campus_manager"] } }),
      ]);

      const now = new Date();
      const endDate = inst.subscriptionEndDate ? new Date(inst.subscriptionEndDate) : null;
      const daysRemaining = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;
      const isExpired = endDate ? endDate < now : false;

      return {
        instituteId: inst._id,
        instituteName: inst.name,
        instituteType: inst.type,
        instituteEmail: inst.email,
        instituteStatus: inst.status,
        admin: inst.adminId ? {
          id: inst.adminId._id,
          name: inst.adminId.name,
          email: inst.adminId.email,
          phone: inst.adminId.phone,
        } : null,
        plan: plan ? {
          id: plan._id,
          name: plan.name,
          tier: plan.tier,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          currency: plan.currency,
          maxCampuses: plan.maxCampuses,
          maxStudents: plan.maxStudents,
          maxStaff: plan.maxStaff,
          features: plan.features,
        } : {
          name: inst.planTier ? inst.planTier.toUpperCase() : "Free",
          tier: inst.planTier || "free",
          maxCampuses: 1,
          maxStudents: 50,
          maxStaff: 10,
          features: [],
        },
        subscriptionStatus: inst.subscriptionStatus || "Active",
        billingCycle: inst.subscriptionBillingCycle || "yearly",
        startDate: inst.subscriptionStartDate || inst.createdAt,
        endDate: inst.subscriptionEndDate,
        daysRemaining,
        isExpired,
        usage: {
          campuses: {
            current: campusCount,
            max: plan?.maxCampuses ?? 1,
            percent: Math.min(100, Math.round((campusCount / (plan?.maxCampuses || 1)) * 100)),
          },
          students: {
            current: studentCount,
            max: plan?.maxStudents ?? 50,
            percent: Math.min(100, Math.round((studentCount / (plan?.maxStudents || 50)) * 100)),
          },
          staff: {
            current: staffCount,
            max: plan?.maxStaff ?? 10,
            percent: Math.min(100, Math.round((staffCount / (plan?.maxStaff || 10)) * 100)),
          },
        },
      };
    })
  );

  return subscriptions;
};

export const assignSubscription = async (instituteId, data, superAdminUser) => {
  const institute = await Institute.findById(instituteId);
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  const plan = await Plan.findById(data.planId);
  if (!plan) {
    const error = new Error("Selected plan not found");
    error.statusCode = 404;
    throw error;
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  let endDate;

  if (data.endDate) {
    endDate = new Date(data.endDate);
  } else {
    const cycle = data.billingCycle || "yearly";
    endDate = new Date(startDate);
    if (cycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (cycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (cycle === "lifetime") {
      endDate.setFullYear(endDate.getFullYear() + 100);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
  }

  const status = data.status || "Active";
  const isPlanChange = institute.planId?.toString() !== plan._id.toString();

  institute.planId = plan._id;
  institute.planTier = plan.tier;
  institute.subscriptionBillingCycle = data.billingCycle || "yearly";
  institute.subscriptionStartDate = startDate;
  institute.subscriptionEndDate = endDate;
  institute.subscriptionStatus = status;

  if (!institute.subscriptionHistory) institute.subscriptionHistory = [];

  institute.subscriptionHistory.unshift({
    planId: plan._id,
    planName: plan.name,
    planTier: plan.tier,
    billingCycle: data.billingCycle || "yearly",
    startDate,
    endDate,
    status,
    action: isPlanChange ? "Changed Plan" : "Assigned Subscription",
    note: data.note || `Subscription manually assigned by ${superAdminUser?.name || "Super Admin"}`,
    changedBy: superAdminUser?._id,
    changedAt: new Date(),
  });

  await institute.save();

  return {
    instituteId: institute._id,
    plan: { id: plan._id, name: plan.name, tier: plan.tier },
    status: institute.subscriptionStatus,
    startDate: institute.subscriptionStartDate,
    endDate: institute.subscriptionEndDate,
    billingCycle: institute.subscriptionBillingCycle,
  };
};

export const updateSubscriptionStatus = async (instituteId, { status, note }, superAdminUser) => {
  const institute = await Institute.findById(instituteId).populate("planId");
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  const oldStatus = institute.subscriptionStatus;
  institute.subscriptionStatus = status;

  if (!institute.subscriptionHistory) institute.subscriptionHistory = [];

  institute.subscriptionHistory.unshift({
    planId: institute.planId?._id,
    planName: institute.planId?.name || institute.planTier,
    planTier: institute.planTier,
    billingCycle: institute.subscriptionBillingCycle,
    startDate: institute.subscriptionStartDate,
    endDate: institute.subscriptionEndDate,
    status,
    action: `Status: ${oldStatus} -> ${status}`,
    note: note || `Subscription status updated to ${status} by ${superAdminUser?.name || "Super Admin"}`,
    changedBy: superAdminUser?._id,
    changedAt: new Date(),
  });

  await institute.save();
  return {
    instituteId: institute._id,
    subscriptionStatus: institute.subscriptionStatus,
  };
};

export const extendSubscription = async (instituteId, { extendDays, extendMonths, newEndDate, note }, superAdminUser) => {
  const institute = await Institute.findById(instituteId).populate("planId");
  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  const currentEndDate = institute.subscriptionEndDate ? new Date(institute.subscriptionEndDate) : new Date();
  let updatedEndDate;

  if (newEndDate) {
    updatedEndDate = new Date(newEndDate);
  } else if (extendDays) {
    updatedEndDate = new Date(currentEndDate);
    updatedEndDate.setDate(updatedEndDate.getDate() + Number(extendDays));
  } else if (extendMonths) {
    updatedEndDate = new Date(currentEndDate);
    updatedEndDate.setMonth(updatedEndDate.getMonth() + Number(extendMonths));
  } else {
    updatedEndDate = new Date(currentEndDate);
    updatedEndDate.setDate(updatedEndDate.getDate() + 30);
  }

  const previousDate = institute.subscriptionEndDate;
  institute.subscriptionEndDate = updatedEndDate;
  if (institute.subscriptionStatus === "Expired") {
    institute.subscriptionStatus = "Active";
  }

  if (!institute.subscriptionHistory) institute.subscriptionHistory = [];

  institute.subscriptionHistory.unshift({
    planId: institute.planId?._id,
    planName: institute.planId?.name || institute.planTier,
    planTier: institute.planTier,
    billingCycle: institute.subscriptionBillingCycle,
    startDate: institute.subscriptionStartDate,
    endDate: updatedEndDate,
    status: institute.subscriptionStatus,
    action: "Extended",
    note: note || `Subscription extended to ${updatedEndDate.toISOString().split("T")[0]} by ${superAdminUser?.name || "Super Admin"}`,
    changedBy: superAdminUser?._id,
    changedAt: new Date(),
  });

  await institute.save();

  return {
    instituteId: institute._id,
    subscriptionEndDate: institute.subscriptionEndDate,
    subscriptionStatus: institute.subscriptionStatus,
    previousEndDate: previousDate,
  };
};

export const getSubscriptionHistory = async (instituteId) => {
  const institute = await Institute.findById(instituteId)
    .populate("subscriptionHistory.changedBy", "name email role")
    .select("name subscriptionHistory subscriptionStatus subscriptionStartDate subscriptionEndDate planTier planId");

  if (!institute) {
    const error = new Error("Institute not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    instituteId: institute._id,
    instituteName: institute.name,
    currentStatus: institute.subscriptionStatus,
    currentEndDate: institute.subscriptionEndDate,
    history: institute.subscriptionHistory || [],
  };
};

export default {
  getGlobalStats,
  getAllInstitutes,
  createInstitute,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
  assignInstituteAdmin,
  resendInstituteAdminInvite,
  updateInstituteAdmin,
  getAllInstituteAdmins,
  createInstituteAdmin,
  getAllCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  getAllUsers,
  toggleUserStatus,
  createBroadcast,
  getAllBroadcasts,
  deleteBroadcast,
  getAllInquiries,
  updateInquiryStatus,
  convertInquiryToInstitute,
  getPlatformAuditLogs,
  getAllPlans,
  createPlan,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  getAllSubscriptions,
  assignSubscription,
  updateSubscriptionStatus,
  extendSubscription,
  getSubscriptionHistory,
};
