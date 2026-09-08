export const ROLE_LABELS = { 'super-admin': 'Super Admin', 'campus-admin': 'Campus Admin', 'institute-admin': 'Institute Admin', student: 'Student' };
export const ROLE_HOME_ROUTES = { 'super-admin': null, 'campus-admin': '/dashboard', 'institute-admin': null, student: null };
export const roleHome = (role) => Object.hasOwn(ROLE_HOME_ROUTES, role) ? ROLE_HOME_ROUTES[role] : null;
