import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware: Verify JWT and attach authenticated user to req.user.
 *
 * Responsibilities:
 * 1. Read JWT from Authorization header
 * 2. Verify JWT
 * 3. Find the current user from database
 * 4. Check account status
 * 5. Attach current database user to req.user
 */
export const protect = async (req, res, next) => {
  try {
    // --------------------------------------------------
    // 1. Get token from Authorization header
    // --------------------------------------------------
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Authentication token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid authentication token.",
      });
    }

    // --------------------------------------------------
    // 2. Verify JWT
    // --------------------------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token payload.",
      });
    }

    // --------------------------------------------------
    // 3. Get CURRENT user from database
    // --------------------------------------------------
    const user = await User.findById(decoded.id).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // --------------------------------------------------
    // 4. Check account status
    // --------------------------------------------------
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    // --------------------------------------------------
    // 5. Attach CURRENT database information
    // --------------------------------------------------
    req.user = user;

    next();
  } catch (error) {
    // JWT expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired.",
      });
    }

    // JWT invalid
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    console.error("Authentication Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }
};

export default protect;