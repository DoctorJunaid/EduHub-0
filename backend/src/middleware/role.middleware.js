/**
 * Middleware: Authorize users based on their role.
 *
 * Usage:
 * authorize("super_admin")
 * authorize("campus_admin")
 * authorize("campus_admin", "institute_admin")
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

export const checkRole = (roles, ...rest) => {
  const roleList = Array.isArray(roles) ? roles : [roles, ...rest].filter(Boolean);
  const expanded = new Set(roleList);
  if (roleList.includes("admin")) {
    expanded.add("campus_admin");
    expanded.add("super_admin");
    expanded.add("campus_manager");
  }
  if (roleList.includes("campus_manager")) {
    expanded.add("campus_admin");
    expanded.add("super_admin");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!expanded.has(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Restricted role.",
      });
    }

    next();
  };
};

authorize.checkRole = checkRole;
authorize.authorize = authorize;

export default authorize;