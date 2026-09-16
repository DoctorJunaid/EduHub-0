/**
 * Super Admin Service
 * Encapsulates all platform-level governance logic for managing institutes,
 * institute admins, campuses, global users, and analytical statistics.
 */
import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
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
 * List all institutes with optional search & filter
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

  return institutes;
};

/**
 * Create a new Institute with optional inline Institute Admin
 */
export const createInstitute = async (instituteData, adminData = null, file = null) => {
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

  // Create Institute FIRST so we have an ID for the Admin
  const institute = await Institute.create({
    ...instituteData,
    adminId: instituteData.adminId || null,
  });

  let createdAdmin = null;

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
      reset: true,
    });
    
    const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
    const resetLink = `${frontendUrl}/set-password?token=${token}`;
    
    try {
      await sendMail(
        createdAdmin.email,
        "Set up your EduHub Institute Admin Account",
        "Welcome to EduHub! Please click the link to set up your password.",
        resetLink
      );
    } catch (err) {
      console.error("Failed to send setup email:", err);
    }
  }

  const result = await Institute.findById(institute._id).populate(
    "adminId",
    "name email phone avatar"
  );
  return result;
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

  // Count campuses under this institute
  const campusCount = await Campus.countDocuments({ instituteId: id });

  return { ...institute.toObject(), campusCount };
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

  // Cascade cleanup: remove campuses under this institute
  await Campus.deleteMany({ instituteId: id });

  return { message: "Institute and associated campuses deleted successfully" };
};

/**
 * Assign or reassign Institute Admin
 */
export const assignInstituteAdmin = async (instituteId, { userId, email, newAdminData }) => {
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
    reset: true,
  });
  const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
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
 * Resend setup invite email to Institute Admin
 */
export const resendInstituteAdminInvite = async (instituteId) => {
  const institute = await Institute.findById(instituteId).populate(
    "adminId",
    "name email phone role status"
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
  const token = generateToken({ id: admin._id, role: admin.role || "institute_admin", reset: true });
  const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
  const resetLink = `${frontendUrl}/set-password?token=${token}`;

  await sendMail(
    admin.email,
    "Set up your EduHub Institute Admin Account",
    "Welcome to EduHub! Please click the link to set up your password.",
    resetLink
  );

  return {
    success: true,
    message: `Setup email sent successfully to ${admin.email}`,
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
 * Global users list
 */
export const getAllUsers = async (query = {}) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  if (query.instituteId) filter.instituteId = query.instituteId;
  if (query.campusId) filter.campusId = query.campusId;

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

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

export default {
  getGlobalStats,
  getAllInstitutes,
  createInstitute,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
  assignInstituteAdmin,
  getAllInstituteAdmins,
  createInstituteAdmin,
  getAllCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  getAllUsers,
  toggleUserStatus,
};
