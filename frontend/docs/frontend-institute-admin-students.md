# Institute Admin Students Directory

## Requested Work
Implement the supplied Students Directory & Records page, with Add/View/Edit/Delete, search, campus integration and shared persistence. No unrelated page cleanup.

## Reference Screenshot
Matched the existing shell plus large heading, search/count card, six table columns, initials, green roll numbers, subject wrapping, status pills and three icon actions. Existing logo/theme/profile data remain in use.

## Feature Location
`src/Admins/Institute Admin/Students/` contains the page, scoped stylesheet and search helper. The route is `/institute-admin/students`, nested inside the existing Institute Admin guard and MainLayout. Students is the active sidebar item.

## Student Data Source
Existing `students.records` remains the sole source for this page, Overview and other student-dependent modules. No slice or student array is duplicated. The scoped joined selector excludes explicit foreign institute IDs and foreign campus assignments. It preserves this project's single-institute demo model rather than inventing real tenant authorization.

## Campus Integration
The form receives ID/label options from existing `campuses.records`. New Institute Admin saves record the selected campusId and existing demo instituteId alongside the existing campus display field. Known legacy reference names are resolved through existing campus seed IDs, so reference records follow later campus renames without recreating records. Current names are derived in the table and profile. Unknown/deleted campus assignments display Campus unavailable and can be reassigned through Edit; student records are not erased when a campus is deleted.

## Redux/State
Reused studentAdded, studentUpdated, studentDeleted and the campus selector. New memoized `store/selectors/instituteStudents.js` supplies the directory and Overview. Search and modal state are local. No extra Provider/store.

## Persistence
Existing versioned persistence retains student data and campus/institute references. Hydration validates optional reference fields. No UI localStorage calls. Legacy Campus Admin records remain readable and existing CRUD/persistence tests pass.

## Search
Case-insensitive matching across name, roll, program, section, subjects and live campus name. Clearing restores all scoped rows. The enrolled count represents the full scoped student list; search does not mutate it. Distinct no-student/no-match states are provided.

## Add/Edit Form
Reused the existing StudentForm at its original location. Minimal backwards-compatible extension: object-valued select options and opt-in editAllFields expose campus and guardian-phone fields for this page. Defaults preserve existing Campus Admin behavior and design. Existing native required/whitespace/email validation applies; guardian and phone fields remain optional. Saving requires an available institute campus. Adding is unavailable if there are no campuses.

## Student Profile
Reused StudentProfileDialog with the selected live joined record, including current campus name.

## Delete Confirmation
Reused ConfirmDialog. Cancel retains the student; confirm dispatches the existing delete action. No new cascade rules were introduced.

## Overview Synchronization
Only the Overview student data selector/import changed; no visual changes. Both count and registered rows now derive from the same joined student collection, including students assigned to newly created branches.

## Reusable Components Used
MainLayout, Sidebar, Header, Card, Input, Button, Table, Avatar, StudentStatusBadge, StudentForm, StudentProfileDialog and ConfirmDialog. No new form/profile/delete-modal system.

## Files Created
- `src/Admins/Institute Admin/Students/InstituteStudents.jsx`
- `src/Admins/Institute Admin/Students/InstituteStudents.css`
- `src/Admins/Institute Admin/Students/studentDirectoryData.js`
- `src/store/selectors/instituteStudents.js`
- `src/store/selectors/instituteStudents.test.js`
- `docs/frontend-institute-admin-students.md` (under frontend)

## Files Modified
- `src/App.jsx`
- `src/Admins/Institute Admin/navigation.jsx`
- `src/Admins/Institute Admin/InstituteDashboard.jsx` (data selector only)
- `src/Admins/Campus Admin/Students/StudentForm.jsx` (required reusable-form extension; no Campus Admin page redesign)
- `src/store/persistence.js`

## Verification
Build PASS. Lint exits successfully with pre-existing shared Fast Refresh warnings. Sixteen student/persistence/selector tests pass, covering CRUD, refresh, shared counts, search, campus rename/delete behavior and foreign institute exclusion.

Chrome: Students route and active navigation, Add (count 3), refresh (count remains 3), View selected profile, Edit campus prefill and saved subjects, Delete confirmation, Cancel preserving the record, confirmed deletion (count 2). Search for CS-4B selects Zainab; clearing restores rows. Dark mode toggles and a 390px viewport has no document horizontal overflow. Overview count matches the directory after deletion. Desktop screenshot was captured and compared with the supplied reference.

## Known Existing Issues Not Fixed
- Student deletion uses the existing non-cascading reducer; attendance/results/fees/messages may retain references to deleted IDs under their existing handling. No relationship cleanup was invented.
- Campus Admin displays legacy campus-name snapshots; live campus name resolution is added only to the requested Institute directory/Overview. Broader migration remains for a later audit.
- Legacy Zainab demo email is blank; opening Edit requires a valid email before saving under the approved required-field validation.
- Missing staff/broadcast/manage-campus destinations and production authentication are unchanged.
- Backend working-tree changes predated this task and were not edited. No Super Admin or landing-ui modifications; no unrelated visual cleanup.
