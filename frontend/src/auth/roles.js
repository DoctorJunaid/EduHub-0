export const ROLE_LABELS = {
  super_admin: "Super Admin",
  campus_admin: "Campus Admin",
  institute_admin: "Institute Admin",
  student: "Student",
};

export const ROLE_HOME_ROUTES = {
  super_admin: "/super-admin",
  campus_admin: "/dashboard",
  institute_admin: "/institute-admin",
  student: "/student/dashboard",
};

export const roleHome = (role) =>
  Object.hasOwn(ROLE_HOME_ROUTES, role) ? ROLE_HOME_ROUTES[role] : null;
