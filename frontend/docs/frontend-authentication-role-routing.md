# Authentication & Role-Based Routing

## Goal
Login is the frontend entry point. This is explicitly demo session/UI routing, not server authentication or a production security boundary.

## Public Routes
`/login` and `/signup` remain outside MainLayout. Authenticated sessions are redirected to their role home on either page.

## Protected Routes
One ProtectedRoute wraps the existing MainLayout tree: dashboard, students, faculty, timetable, exams, faculty attendance, student attendance, fees, messages, results and the existing wildcard fallback. Current pages belong to Campus Admin, so this tree permits that role only. There are no public copies.

## Root Route Behavior
`/` uses AuthEntry: logged out goes to `/login`; a valid session goes to its mapped role home.

## Auth State
The existing centralized store now includes auth: `{ isAuthenticated, user, selectedRole, isInitializing }`. Demo user fields are whitelisted to id/name/email/role; name is derived from the submitted email local part because Login supplies no name. Temporary credentials remain local to Login.

## Session Persistence
Existing persistence.js synchronously hydrates versioned `eduhub_auth` data before the store renders. Only whitelisted user fields are saved. Passwords are NOT persisted or dispatched. Invalid JSON, malformed users and unsupported/unavailable roles fall back to logged out. Storage errors retain in-memory functionality; persistence requires available browser storage.

## Roles / Role Destination Mapping
- Campus Admin: existing `/dashboard`.
- Super Admin: pending; no existing dashboard page/route.
- Institute Admin: pending; no existing dashboard page/route.
- Student: pending; no existing dashboard page/route.

`auth/roles.js` centralizes labels and actual destinations. Missing destinations remain null. They cannot create a session that has nowhere valid to navigate. Login displays a pending notice for these roles.

## ProtectedRoute
Checks initialization, current Redux authentication and allowedRoles. Logged-out users go to Login; disallowed roles go to their mapped home or Login. No permissions are granted merely by hiding navigation.

## Login Flow
Validate role, email and password. If the role has a destination, dispatch only email/role, construct the demo session, persist and replace navigation with its home. No network request or password verification is claimed. Signup keeps its previous frontend-only behavior.

## Logout Flow
Sidebar Sign Out dispatches loggedOut, removes only eduhub_auth and navigates to Login. Operational/demo collections remain intact.

## Auth Initialization
Hydration is synchronous before configureStore returns, so isInitializing is false after startup and there is no hydration redirect flicker. Route guards retain a loading branch for an initializing state.

## Sidebar/Header Integration
MainLayout passes current name, derived initials and role label to the existing profile UI. Existing CAMPUS_ADMIN_NAV is reused because this layout owns the Campus Admin pages; missing roles do not receive that layout or navigation.

## Files Created
`auth/roles.js`, `auth/ProtectedRoute.jsx`, `store/Slices/authSlice.js`, `store/Slices/authSlice.test.js`, and this report under frontend/docs.

## Files Modified
`App.jsx`, `auth/Login.jsx`, `auth/signupValidation.js`, `auth/signupValidation.test.js`, `store/store.js`, `store/persistence.js`, `store/persistence.test.js`, `layouts/MainLayout.jsx`, `components/common/Header.jsx` (all under frontend/src).

## Routes Changed
Root becomes conditional redirect. Public auth pages gain authenticated-user redirects. MainLayout and its unchanged fallback gain one role guard. No destination pages are created.

## Verification
Build and lint pass (existing Fast Refresh warnings). 59 unit/regression tests pass, including persistence, password exclusion, malformed sessions, logout preserving demo data and existing operational slices. Chrome verified root to Login, Campus Admin login to dashboard, profile data, refresh persistence, authenticated Login redirect, logout clearing session, and a logged-out direct Students URL redirect. Auth CSS is unchanged.

## Pending Backend Authentication
Real identity/password verification, server authorization and sessions remain pending. Local storage and frontend state are user-editable and provide demo UI gating only.

## Missing Role Destinations
Approval requested for minimal `/super-admin`, `/institute-admin` and `/student` workspace pages. Those paths are recommendations, not implemented routes. All three redirect flows remain pending approval. Backend and landing-ui unchanged.
