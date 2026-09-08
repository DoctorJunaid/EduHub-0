# Login Role Selection Update

## Reference Screenshot
Login now uses SCHOOL ACCESS, Welcome back, the requested subtitle, role cards, demo notice, dynamic submit button, Google option and footer actions. Existing shared AuthLayout, branding and 100vh sizing remain.

## Roles Added
Super Admin (default), Campus Admin, Institute Admin and Student. Native radio inputs support keyboard selection with one active card. Four columns are used where space permits; narrower screens use two columns.

## Reusable Components
Extracted Signup's existing radio-card markup into `RoleSelector`, reused by both pages. Signup still exposes only Institute Admin and Student. Existing Alert/AlertDescription, PasswordInput, Input, Label, Button, AuthLayout and icons are reused.

## Role State
Login's local values include role alongside email/password. The selected role is available on submission and named in the existing frontend-only valid-form notice. No Redux auth state or credentials are created/persisted.

## Dynamic Button Label
One submit button displays Continue as followed by the selected role label.

## Auth Integration
No auth service, auth slice, ProtectedRoute or real session flow exists. Validation remains functional, with no requests or fake authentication. The demo banner accurately describes current local-only behavior.

## Role Destinations
Campus Admin has the existing `/dashboard` page. Super Admin, Institute Admin and Student dashboards are absent. No role is redirected as though authenticated: actual login/session integration is still pending. No destination routes were invented.

## Google Login Status
Disabled; OAuth is not configured.

## Forgot Password Status
Styled unavailable text; no reset route exists. Create account uses React Router Link to `/signup`.

## Files Created
- `frontend/src/auth/components/RoleSelector.jsx`
- `frontend/docs/frontend-login-role-selection.md`

## Files Modified
- `frontend/src/auth/Login.jsx`
- `frontend/src/auth/Signup.jsx`
- `frontend/src/auth/Signup.css`

## Verification
Build passes (existing bundle-size warning). Lint passes with existing Fast Refresh warnings in shared Button, Badge and tabs. Both auth validation unit tests pass.

Headless Chrome: four role options render; switching each keeps exactly one checked input and updates the button text. Required-field errors and password visibility were exercised, and Create account navigation was checked. Desktop measurements at 1280×720 and 1024×768 show page height equals viewport and both panels' content fits without nested scrolling. At 390×844 normal document scrolling keeps content reachable. Signup retains its two roles through the extracted selector.

## Pending Role Routes
Super Admin, Institute Admin and Student destinations, plus backend authentication for every role. Google OAuth and password reset remain pending. No backend, landing-ui or unrelated modules were modified.
