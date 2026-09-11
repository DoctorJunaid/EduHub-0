/**
 * Multi-Tenancy Scope Middleware
 * Enforces strict boundary isolation between institutes and campuses.
 */
import Campus from "../models/campus.model.js";

/**
 * Middleware: Enforces Institute-level tenancy isolation.
 * Verifies the user has an assigned instituteId and attaches it to req.instituteId.
 */
export const instituteAdminScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Super Admin can optionally bypass or pass instituteId in headers/params
  if (req.user.role === "super_admin") {
    req.instituteId = req.params.instituteId || req.headers["x-institute-id"] || req.user.instituteId;
    return next();
  }

  if (req.user.role !== "institute_admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Institute Admin role required.",
    });
  }

  if (!req.user.instituteId) {
    return res.status(403).json({
      success: false,
      message: "Forbidden. You are not assigned to any institute.",
    });
  }

  // Attach verified instituteId for all downstream queries
  req.instituteId = req.user.instituteId;
  next();
};

/**
 * Middleware: Enforces Campus-level tenancy isolation.
 * Verifies campusId on the user, or allows the Institute Admin overseeing this campus to pass.
 */
export const campusAdminScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const targetCampusId = req.params.campusId || req.params.id || req.body.campusId;

  // 1. Super Admin bypass
  if (req.user.role === "super_admin") {
    req.campusId = targetCampusId || req.user.campusId;
    return next();
  }

  // 2. Institute Admin access — allowed if the target campus belongs to their institute
  if (req.user.role === "institute_admin") {
    if (!req.user.instituteId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You are not assigned to an institute.",
      });
    }

    if (targetCampusId) {
      const campus = await Campus.findById(targetCampusId);
      if (!campus) {
        return res.status(404).json({
          success: false,
          message: "Campus not found.",
        });
      }

      if (campus.instituteId.toString() !== req.user.instituteId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. This campus belongs to a different institute.",
        });
      }
    }

    req.instituteId = req.user.instituteId;
    req.campusId = targetCampusId;
    return next();
  }

  // 3. Campus Manager / Campus Admin access
  if (req.user.role === "campus_manager" || req.user.role === "campus_admin") {
    if (!req.user.campusId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You are not assigned to any campus.",
      });
    }

    if (targetCampusId && targetCampusId.toString() !== req.user.campusId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You cannot access data outside your assigned campus.",
      });
    }

    req.campusId = req.user.campusId;
    req.instituteId = req.user.instituteId;
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Insufficient administrative privileges.",
  });
};

export default { instituteAdminScope, campusAdminScope };
