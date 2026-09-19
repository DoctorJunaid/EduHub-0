export const ROLE_LABELS = {
  super_admin: "Super Admin",
  campus_admin: "Campus Admin",
  campus_manager: "Campus Manager",
  institute_admin: "Institute Admin",
  student: "Student",
  teacher: "Teacher",
  faculty: "Faculty",
  accountant: "Accountant",
  principal: "Principal",
};

export const ROLE_HOME_ROUTES = {
  super_admin: "/super-admin",
  campus_admin: "/dashboard",
  campus_manager: "/dashboard",
  institute_admin: "/institute-admin",
  student: "/student/dashboard",
  teacher: "/my-payslips",
  faculty: "/my-payslips",
  accountant: "/salary-payroll",
  principal: "/salary-payroll",
};

export const roleHome = (role) =>
  Object.hasOwn(ROLE_HOME_ROUTES, role) ? ROLE_HOME_ROUTES[role] : null;
