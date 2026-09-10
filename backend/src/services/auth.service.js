/**
 * Authentication Service
 * Implements business logic for public user registration, credential verification,
 * profile retrieval, and profile modifications.
 */
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

/**
 * Register a new public student user
 */
export const registerUser = async ({ name, email, password, phone, avatar }) => {
  if (!name || !email || !password) {
    const error = new Error("Name, email, and password are required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  // Public self-registration is strictly locked to student role
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
    role: "student",
    phone: phone ? phone.trim() : "",
    avatar: avatar || "",
    isActive: true,
  });

  const token = generateToken({
    id: user._id,
    role: user.role,
    instituteId: user.instituteId,
    campusId: user.campusId,
  });

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return { token, user: userObj };
};

/**
 * Log in an existing user with email and password
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.isActive === false) {
    const error = new Error("Account has been deactivated. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
    instituteId: user.instituteId,
    campusId: user.campusId,
  });

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return { token, user: userObj };
};

/**
 * Retrieve current user profile by userId
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select("-passwordHash")
    .populate("instituteId", "name type board status")
    .populate("campusId", "name phone status");

  if (!user) {
    const error = new Error("User account not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Update authenticated user's own profile fields
 */
export const updateProfile = async (userId, { name, phone, avatar }) => {
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone.trim();
  if (avatar !== undefined) updateData.avatar = avatar.trim();

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-passwordHash")
    .populate("instituteId", "name type board")
    .populate("campusId", "name");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export default {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
