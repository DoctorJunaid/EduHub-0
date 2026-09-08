# Create Account Page

## Requested Work
Implement the supplied signup design and the subsequently requested matching login page. All changes for this task are inside frontend.

## Reference Screenshot
The reference guides the green promotional panel, branding, benefits, feature strip, decorative footer, right-hand form, role cards, acknowledgement, buttons and spacing. Existing EduHub logo and theme tokens are used; CSS and Lucide icons supply decoration without image dependencies.

## Layout Structure
`src/auth/Signup.jsx` and `src/auth/Login.jsx` use `src/auth/components/AuthLayout.jsx` for the shared two-column promotional/form layout. `/signup` and `/login` are public sibling routes outside MainLayout, so they do not render the dashboard sidebar/header. Signup links to `/login`; Login links to `/signup` through React Router Link. Existing dashboard routes are unchanged.

## Reusable Components Used
Existing Input, Label, Button, logo asset and Lucide icons. New global `components/common/PasswordInput.jsx` wraps shared Input/Button and owns reusable visibility behavior. AuthLayout shares the promotional markup and page heading. No new dependencies, store, Provider, context or duplicated user state.

## Role Selection
Native mutually exclusive radio cards offer Institute Admin (default) and Student only, with selected styling and keyboard focus indicators. No additional role fields or roles were introduced.

## Form Fields
Signup: full name, email, password, confirmation and role. Login: email and password. Inputs use labels and autocomplete attributes. Form data and errors remain local and are not persisted or logged.

## Validation
Names and emails are trimmed on submission. Signup requires a nonblank name, basic valid email, password, matching confirmation and allowed role. No prior password policy exists: a minimal eight-character signup rule is documented and displayed, with no character-class requirements. Passwords are preserved verbatim. Login requires valid email and a nonempty password without imposing signup length rules on existing credentials. Invalid submissions focus the first invalid input and display associated inline errors.

## Password Visibility
Independent show/hide controls for each password input use accessible labels, pressed state and non-submit buttons. Both auth pages reuse PasswordInput.

## Auth Integration
No frontend auth slice, service, hook or API was found. Valid submissions explicitly report that integration is pending and no account/session has been created. There are no invented requests, tokens, local credential databases or fake successful redirects. Centralized Redux is unchanged.

## Google Sign-In Status
Disabled, visually present on Signup. No OAuth configuration or authentication SDK was found or added.

## Terms/Privacy Links
No existing frontend destinations exist. Styled acknowledgement text is retained with unavailable labels/titles, without fabricated routes or policy documents.

## Responsive Behavior
Shared desktop columns stack below 760px. Promotional content and forms remain available on smaller screens. Form controls are full width, role cards retain two columns, and the feature strip stacks at narrower desktop widths. Reduced-motion preferences are respected.

## Files Created
- `frontend/src/auth/Signup.jsx`
- `frontend/src/auth/Login.jsx`
- `frontend/src/auth/Signup.css`
- `frontend/src/auth/components/AuthLayout.jsx`
- `frontend/src/auth/signupValidation.js`
- `frontend/src/auth/signupValidation.test.js`
- `frontend/src/components/common/PasswordInput.jsx`
- `frontend/docs/frontend-signup-create-account.md`

## Files Modified
- `frontend/src/App.jsx`: register both public auth routes.

## Verification
- `npm.cmd run build`: PASS; existing large-chunk warning remains.
- `npm.cmd run lint`: exit 0 with pre-existing Fast Refresh warnings in Button.jsx, Badge.jsx and tabs.jsx.
- `node --test src/auth/signupValidation.test.js`: two tests pass, covering required fields, whitespace, malformed email, password length, confirmation mismatch, allowed roles and login validation.
- Source review confirms reciprocal route links, shared password visibility controls and unchanged dashboard route declarations.
- Browser automation is unavailable. Rendered screenshot fidelity, keyboard interactions, responsive layout and actual browser refresh have not been browser-tested. Production deep-link refresh requires the host's usual SPA fallback to index.html; no deployment configuration was changed.

## Pending Backend/Auth Requirements
Actual registration/login services, session handling, approved production password policy, Google OAuth configuration and real Terms/Privacy destinations. Backend and landing-ui are untouched. Unrequested changes: None.
