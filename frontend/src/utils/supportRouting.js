/**
 * Support Routing Utilities
 * Returns the appropriate support URL according to the current user's role.
 */

export const getSupportBasePath = (role) => {
  if (role === "student") return "/student/support";
  if (role === "teacher" || role === "faculty") return "/teacher/support";
  if (role === "institute_admin") return "/institute-admin/support";
  if (role === "super_admin") return "/super-admin/support";
  return "/support";
};

export const getSupportTicketPath = (role, ticketId) => {
  const base = getSupportBasePath(role);
  return ticketId ? `${base}/${ticketId}` : base;
};
