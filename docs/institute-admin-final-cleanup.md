# Institute Admin Final Cleanup

## Scope

Targeted refinement of Overview, Campuses, Staff Directory, Students, and Broadcast Alerts. The existing MainLayout, Sidebar, Header, Outlet, Redux store, theme, and protected routes remain in use. No dependencies were added. Backend, landing-ui, authentication source, and other role modules were not modified by this cleanup. The pre-existing backend middleware edit was preserved.

## Issues Found

- Page headings ranged from 30–36px, subtitles were 18px, directory rows reached 100px, and action buttons ranged from 36–60px.
- Overview Staff and Broadcast shortcuts were disabled despite valid destinations.
- Broadcast's side-by-side heading, large gaps, 54–56px controls, and textarea added avoidable height. Critical severity used green.
- CampusForm had ungrouped fields, an unstyled modal, and a read-only status input.
- Faculty Directory used all faculty records while Overview and Broadcast used a separate institute filter. New campus assignments and campus renames could produce inconsistent teacher counts/names.
- The shared header search's minimum width crowded small screens. Some dark semantic text and dialog styling needed local corrections.

## Overview Fixes

Preserved the existing content and card/table arrangement. Reduced metric icons, card padding, quick-action heights, table density, and secondary typography. Wired all three shortcuts to existing Institute routes. View Profile continues to open the shared StudentProfileDialog. Metrics use live campus, student, and faculty selectors.

## Campus Form Fixes

CampusForm now groups each label with its control and uses the shared Dialog, Input, Label, Select, and Button components. The centered dialog has a 520px maximum width, consistent padding, 42px controls, and an aligned footer. Required name/address validation rejects whitespace; submitted strings are trimmed. Inline errors use role="alert", invalid input attributes, and a form error association.

## Campus Edit Fixes

Add and Edit still use the same CampusForm. Passing a campus prefills the same fields and changes the primary action to Save Changes. Existing IDs and validation are preserved. The status list is centralized in campusData and retains the only supported campus status, Active. Faculty/Student Inactive conventions do not imply that campus reducers support it.

## Typography Adjustments

Institute-only styles standardize desktop page titles to 30px, small-screen titles to 28px, section/dialog titles to 20px, body descriptions to 15px, primary table text and controls to 14px, secondary table text to 13px, and sidebar navigation to 14px. Global typography is unchanged.

## Scroll/Overflow Fixes

Reduced the actual sources of excess height: page/card gaps, heading arrangement, oversized stat icons, form gaps, controls, and table rows. The shared main area uses 100dvh only under the Institute class. No overflow hiding was added. Table scrolling remains within the existing Table container; main content can scroll naturally. Dialogs are capped at the viewport minus 32px and scroll internally only when their fields require it.

## Broadcast Alert Icon Changes

Retained the already appropriate Lucide Info, TriangleAlert, and CircleAlert icons, with consistent 22px dimensions and stroke weight. Removed green critical semantics. Info, Warning, and Critical use the existing blue, amber, and red tokens, with readable local dark-mode mixes.

## Broadcast Alert UX Fixes

Stacked title/subtitle, 20px form gaps, 42px select/button, 58px severity cards, and a 112px resizable textarea. Native radios retain keyboard selection and visible focus. Default/reset severity is Info. Submission validates current audience, severity, and message; saves through the existing broadcasts slice; resets the form; and shows an accessible six-second success toast. Errors use an alert icon instead of a success icon. Copy accurately describes demo saving and does not claim notifications were delivered.

## Minor Functionalities Added

- Enabled Overview → Staff Directory and Overview → Broadcast Message.
- Retained and verified Overview → Add Campus, including opening its form through the existing query parameter.
- Made Staff use the same institute faculty selector as Overview and Broadcast; assignments use the current campus registry and retain stable campus/institute IDs.
- Preserved search, Add/Edit, and generic confirmed Delete across all directories; verified Students View and Overview View Profile behavior.
- Add Teacher is disabled when no campus is available, matching the existing Student behavior.
- Campus Manage stays disabled with its existing explanation because no valid management destination exists.

## Shared Components Reused

MainLayout, Sidebar, Header, Outlet, SummaryCard, Card, Button, Input, Label, Select, Textarea, Table, Badge, Avatar, Dialog, Alert, ConfirmDialog, FacultyForm, StudentForm, StudentProfileDialog, and StudentStatusBadge. The existing faculty matcher is reused with the directory's email search extension.

## Components Refactored

CampusForm received field grouping and a shared status selector, without separate add/edit markup. MainLayout gained an optional className for safe role-specific styling. Broadcast retained its current form/state architecture. InstituteAdmin.css provides module density rules and scopes portal styling using body:has(.institute-admin-shell), so shared forms retain their defaults outside Institute routes.

## Files Created

- `frontend/src/Admins/Institute Admin/InstituteAdmin.css`
- `frontend/src/Admins/Institute Admin/Staff/staffData.js`
- `frontend/src/Admins/Institute Admin/Staff/staffData.test.js`
- `frontend/src/Admins/Institute Admin/Alerts/broadcastData.test.js`
- `docs/institute-admin-final-cleanup.md`

## Files Modified

- `frontend/src/Admins/Institute Admin/InstituteDashboard.jsx`
- `frontend/src/Admins/Institute Admin/Campuses/CampusForm.jsx`
- `frontend/src/Admins/Institute Admin/Campuses/campusData.js`
- `frontend/src/Admins/Institute Admin/Staff/InstituteStaff.jsx`
- `frontend/src/Admins/Institute Admin/Alerts/BroadcastAlerts.jsx`
- `frontend/src/Admins/Institute Admin/Alerts/BroadcastAlerts.css`
- `frontend/src/App.jsx` — Institute stylesheet and layout class integration.
- `frontend/src/layouts/MainLayout.jsx` — optional className only.

Staff/InstituteStaff.jsx, its CSS, the Staff route, and its sidebar link were already created in the preceding task; their uncommitted status is not a new duplicate implementation. Students and other existing page CSS files were not rewritten: Institute-only shared rules refine their appearance.

## Data Synchronization

The faculty selector resolves legacy campus names to known IDs, follows campus renames, scopes records to the demo institute, and retains owned teachers with “Campus unavailable” after campus deletion. Faculty create/edit stores campusId and instituteId in the existing Redux record. Overview Active Teachers and Broadcast staff audience availability read the same selector. Student/campus selectors remain unchanged. Campus deletion does not fabricate reassignment or remove associated people.

## Persistence

Existing centralized loadDemoState/persistDemoState remains unchanged. New faculty metadata survives its existing serialization. Regression tests cover faculty edits, campus rename/delete, institute scoping, refresh, broadcast saving, and empty collections. No application localStorage calls or additional stores were introduced. Browser checks used a separate temporary Chrome profile, not the user's normal browser data.

## Dark Mode

Used the existing theme toggle and semantic surfaces. Checked all five page surfaces and borders in dark mode, visually inspected Students/Broadcast and the faculty dialog, and corrected a bright inherited card border. Added scoped readable semantic text for status/action accents and profile details. No separate dark-mode system was created.

## Responsive Fixes

All five pages were checked at 1440×900, 1366×768, and 390×844. With the current demo records, desktop/laptop pages have no unnecessary vertical scroll. No document/main horizontal overflow was observed. Mobile Overview scrolls naturally for its longer content; directory tables scroll within their table containers. The redundant topbar search is hidden at small widths to preserve breadcrumbs/profile access. Sidebar auto-collapse remains unchanged.

## Accessibility Fixes

Campus labels resolve to their controls; required/error state is exposed; all shared dialogs remain named. Directory icon buttons retain descriptive names, destructive confirmation uses the shared alertdialog, and buttons retain focus states. Native severity ArrowRight selection and visible focus were verified in Chrome. Campus dialog focuses its first field and closes with Escape. Mobile dialogs remain 16px inside the viewport on each side; larger faculty/student forms have usable internal scrolling.

## Issues Requiring Future Approval

No approval is needed for the completed changes. Separate product work is required for Campus Manage, global topbar search, profile-menu features, notifications, and actual broadcast delivery. No valid Institute campus-management route or delivery backend exists. Faculty designation/department choices continue to use the existing form's available options; a catalog-management system was not invented. Multi-institute tenancy remains the existing single-institute demo model.

## Verification

- `npm.cmd run build`: PASS.
- `npm.cmd run lint`: PASS with three pre-existing Fast Refresh export warnings in Button.jsx, Badge.jsx, and tabs.jsx.
- 28 relevant Node tests: PASS (Institute scoping, campus/faculty/student CRUD, student joins, auth sessions, persistence, and new faculty/broadcast regressions).
- `git diff --check`: PASS; Git reports existing line-ending conversion notices.
- Browser: all five routes, active sidebar entries, shared breadcrumbs, desktop/laptop/mobile overflow, dark surfaces, campus required validation, trimmed creation, edit prefill, search, cancel/confirm deletion, teacher email search and CRUD, student search/View/CRUD, live Overview counts, Broadcast validation/save/reset, and saved session/broadcast after reload passed.
- All Overview shortcuts navigated to the intended existing routes, and View Profile opened the selected student. Logout removed the demo session and returned to `/login`; unauthenticated Staff navigation returned to login. A Campus Admin session redirected from Institute Staff to `/dashboard`, with the Institute styling class absent.
- No application runtime errors or unhandled rejections were observed during the instrumented browser flows. A temporary automation timing error was corrected in the browser harness; it was not an application exception.
- The development server logged one Redux serializability-middleware timing warning (109ms versus its 32ms threshold) during browser checks. It was not a serialization error; the existing middleware configuration was left unchanged.
- No backend, landing-ui, Super Admin, Campus Admin, or auth source files were changed by this cleanup.
