# Institute Admin Dashboard

## Implementation
Created the overview in the previously empty `src/Admins/Institute Admin/` folder. `/institute-admin` renders through the existing ProtectedRoute and MainLayout, using one shared Sidebar/Header. The role home map now enables Institute Admin demo login and persisted session hydration.

## Data and Scoping
Students and faculty come from the existing centralized Redux directories and existing persistence helper. No student copies, API requests or new store were added. Screenshot metadata supplies the demo institute name, University type and Federal board because no institute registry exists. Explicit institute IDs, if present, must match; legacy records are included only for the known demo campus. This remains a single-institute demo, not server tenant authorization or an authenticated institute-assignment system.

Totals update with directory records. Campus Branches counts distinct locations represented by scoped student/faculty records, because there is no campus registry or campus CRUD. Current values are 2 students, 1 active teacher and 1 represented campus. The screenshot's second branch is not fabricated. Missing email remains a dash. Teacher text says Active faculty records instead of claiming verified class assignments.

## Reuse
SummaryCard gained an optional description presentation, retaining the default for existing callers. Reused Card, Button, Table, Input, Avatar, StudentStatusBadge, StudentProfileDialog and student filtering. Imported the existing student stylesheet for the reused dialog. No Campus Admin source files were modified.

## Functionality
Registered Students filter toggle exposes existing name/roll/program search and status filtering. View Profile opens the existing dialog. Profile identity comes from the demo session. Dark mode and logout use MainLayout's existing actions. Institute navigation is supplied as configuration; Overview has actual router active state.

Campuses, Staff Directory, Students and Broadcast Alerts do not have Institute Admin routes and are shown unavailable. All three quick actions are disabled because their Institute Admin destination/creation flows are missing. Existing Campus Admin pages have not been granted to this role. Header global search remains its existing display-only input; notifications are unavailable.

## Files Created
- `src/Admins/Institute Admin/InstituteDashboard.jsx`
- `src/Admins/Institute Admin/InstituteDashboard.css`
- `src/Admins/Institute Admin/instituteData.js`
- `src/Admins/Institute Admin/instituteData.test.js`
- `src/Admins/Institute Admin/navigation.jsx`
- `docs/frontend-institute-admin-dashboard.md` (inside frontend)

## Files Modified
`src/App.jsx`, `src/auth/roles.js`, `src/layouts/MainLayout.jsx`, shared Sidebar/Header/SummaryCard, and `src/store/Slices/authSlice.test.js`.

## Verification
Build passes. Lint has only pre-existing Fast Refresh warnings in Button, Badge and tabs. Auth tests pass with Institute Admin now accepted. A scoping test checks explicit foreign institute IDs and legacy campus matching.

Chrome verified Institute Admin session entry, two rendered student rows and live directory counts; student profile dialog; filter controls; dark mode toggle; refresh at `/institute-admin`; disallowed `/students` redirect back to the Institute overview; and logout to `/login`. Desktop screenshot was inspected against the reference and used to correct inherited stat and border styling. At 390×844 document width equals viewport width; the table scrolls within its container. Responsive statistics use four/two/one columns and actions stack on mobile.

## Limitations
Campus registry/creation, Institute staff/student management destinations, broadcasts, notifications, global search behavior and real institute assignment/backend authorization remain pending. Other unimplemented role dashboards remain pending. No backend or landing-ui files were edited by this task; unrelated working-tree changes were preserved.
