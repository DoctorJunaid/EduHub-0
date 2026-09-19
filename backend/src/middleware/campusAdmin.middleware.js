/**
 * Middleware: allow only users with role "campus_admin"
 * Must be used after the `protect` middleware (req.user must be set).
 *
 * Usage in routes:
 *   router.get("/my-route", protect, isCampusAdmin, myController);
 *
 * After this middleware passes, downstream controllers can use:
 *   req.user.campusId  →  filter data to this admin's campus only
 */
export const isCampusAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "campus_admin" || req.user.role === "campus_manager")
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Campus Manager/Admin privileges required.",
  });
};

export default isCampusAdmin;
