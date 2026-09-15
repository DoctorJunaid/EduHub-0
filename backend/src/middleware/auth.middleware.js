/**
 * Authentication & Role Authorization Middleware
 * Verifies JWT access tokens and enforces role-based permissions.
 */
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware: Verify JWT and attach authenticated active user to req.user
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Authentication token required.",
      });
    }

    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? undefined : "default_jwt_secret_key");
    if (!secret) throw new Error("JWT_SECRET is missing in production");
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token payload.",
      });
    }

    const currentUser = await User.findById(decoded.id).select("-passwordHash");

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User account belonging to this token no longer exists.",
      });
    }

    if (currentUser.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }
};

/**
 * Middleware: Restrict access to specific roles
 * @param  {...string} roles - Allowed roles e.g. 'super_admin', 'institute_admin'
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to perform this action.",
      });
    }

    next();
  };
};

export default { protect, restrictTo };