/**
 * Institute Admin Service
 * Encapsulates all tenant-scoped business logic for an Institute Administrator.
 * Guarantees that all queries and mutations are strictly bounded by instituteId.
 */
import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import Alert from "../models/alert.model.js";

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
    .populate("managerId", "name email phone avatar isActive")
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

  return await Campus.findById(campus._id).populate(
    "managerId",
    "name email phone avatar"
  );
};

/**
 * Get a specific campus under this institute
 */
export const getCampusById = async (instituteId, campusId) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId }).populate(
    "managerId",
    "name email phone avatar isActive"
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
  ).populate("managerId", "name email phone avatar");

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
export const assignCampusManager = async (instituteId, campusId, { userId, email }) => {
  const campus = await Campus.findOne({ _id: campusId, instituteId });
  if (!campus) {
    const error = new Error("Campus not found under your institute");
    error.statusCode = 404;
    throw error;
  }

  const query = userId ? { _id: userId } : { email: email?.toLowerCase().trim() };
  if (!userId && !email) {
    const error = new Error("Please provide userId or email of the manager to assign");
    error.statusCode = 400;
    throw error;
  }

  const managerUser = await User.findOne(query);
  if (!managerUser) {
    const error = new Error("User to assign not found");
    error.statusCode = 404;
    throw error;
  }

  // Update user with campus_manager role, linked to this institute and campus
  managerUser.role = "campus_manager";
  managerUser.instituteId = instituteId;
  managerUser.campusId = campus._id;
  await managerUser.save();

  // Set manager on campus
  campus.managerId = managerUser._id;
  await campus.save();

  const userObj = managerUser.toObject();
  delete userObj.passwordHash;

  return { campus, manager: userObj };
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
  { name, email, password, campusId, phone }
) => {
  if (!name || !email || !password || !campusId) {
    const error = new Error("Name, email, password, and campusId are required");
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

  const manager = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
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
  { name, email, password, role = "teacher", campusId, phone }
) => {
  if (!name || !email || !password || !campusId) {
    const error = new Error("Name, email, password, and campus are required");
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

  const staff = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
    role: validRole,
    instituteId,
    campusId: campus._id,
    phone: phone ? phone.trim() : "",
  });

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
  { name, email, password, campusId, phone }
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

  const defaultPassword = password || "Student@123";

  const student = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: defaultPassword,
    role: "student",
    instituteId,
    campusId: campus._id,
    phone: phone ? phone.trim() : "",
  });

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
};
