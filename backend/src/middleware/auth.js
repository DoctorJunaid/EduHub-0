import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * Middleware: verify JWT and attach the authenticated user to req.user.
 * The token payload carries `id` and `role` so downstream middleware
 * can make role decisions without an extra DB query.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // Fetch user from DB (excludes passwordHash by default)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    // Attach role AND campusId from token payload directly
    // Campus Admin routes use req.user.campusId to scope their queries
    req.user = {
      ...user.toObject(),
      role: decoded.role ?? user.role,
      campusId: decoded.campusId ?? user.campusId ?? null,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

export default protect;

