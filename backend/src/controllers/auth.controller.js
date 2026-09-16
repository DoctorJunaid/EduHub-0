/**
 * Authentication Controller
 * Thin controller layer delegating business logic to auth.service.
 * Enforces unified JSON response formatting.
 */
import asyncHandler from "../utils/asyncHandler.js";
import authService from "../services/auth.service.js";

/**
 * @desc    Public student self-registration
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "Registration successful. Welcome to EduHub!",
    data: result,
  });
});

/**
 * @desc    User login with email & password
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: result,
  });
});

/**
 * @desc    Set password from email link
 * @route   POST /api/v1/auth/set-password
 * @access  Public
 */
export const setPassword = asyncHandler(async (req, res) => {
  const result = await authService.setPassword(req.body);

  res.status(200).json({
    success: true,
    message: "Password set successfully.",
    data: result,
  });
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);

  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully.",
    data: user,
  });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: updatedUser,
  });
});

// @desc    Redirect to frontend set password page
// @route   GET /api/v1/auth/set-password
// @access  Public
export const getSetPasswordPage = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send("Token is required");
  }
  const frontendBaseUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
  res.redirect(`${frontendBaseUrl}/set-password?token=${token}`);
};

export default {
  register,
  login,
  getMe,
  updateProfile,
  setPassword,
  getSetPasswordPage,
};