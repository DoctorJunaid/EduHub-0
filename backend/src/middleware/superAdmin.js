/**
 * Middleware: allow only users with role "super_admin"
 * Must be used after the `protect` middleware (req.user must be set).
 */
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "super_admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Super Admin privileges required.",
  });
};

export default isSuperAdmin;