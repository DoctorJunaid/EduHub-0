# Students Directory Functionality

## Requested Work
Implement the Students Directory and supplied Add, Edit, and Profile modal references with frontend demo CRUD, the existing Redux store, approved fields/statuses/validation, local search/filter/pagination, and shared delete confirmation. No backend, landing-ui, shell redesign, or separate profile route.

## Files Created
- `frontend/src/components/students/StudentsDirectory.jsx`
- `frontend/src/components/students/StudentsDirectory.css`
- `frontend/src/components/students/StudentForm.jsx`
- `frontend/src/components/students/StudentProfileDialog.jsx`
- `frontend/src/components/students/StudentStatusBadge.jsx`
- `frontend/src/components/students/studentData.js`
- `frontend/src/store/Slices/studentsSlice.js`
- `frontend/src/store/Slices/studentsSlice.test.js`
- `docs/frontend-students-directory.md`

## Files Modified
- `frontend/src/App.jsx`: register the Students Directory at the existing sidebar destination `/students`.
- `frontend/src/store/store.js`: register studentsReducer alongside the unchanged faculty reducer.

## Files Deleted
None. Temporary headless-browser profile data created solely for verification was removed after the browser failed to start its debugging endpoint.

## Components Reused
Existing Dialog/DialogContent/DialogTitle/DialogClose, Button, Input, Label, Avatar/AvatarFallback, Badge, Card, Table/TableHeader/TableBody/TableRow/TableHead/TableCell, and the generic ConfirmDialog. Existing React Router and Redux Provider are reused. Native selects follow the existing faculty filter/form pattern. No duplicate confirmation or generic modal implementation was created. There was no shared pagination component, so the existing Button/select pagination pattern was followed.

## Feature Structure
```text
frontend/src/
|-- components/students/
|   |-- StudentsDirectory.jsx
|   |-- StudentsDirectory.css
|   |-- StudentForm.jsx
|   |-- StudentProfileDialog.jsx
|   |-- StudentStatusBadge.jsx
|   `-- studentData.js
`-- store/
    |-- store.js
    `-- Slices/
        |-- studentsSlice.js
        `-- studentsSlice.test.js
```

StudentsDirectory orchestrates local filters, pagination, selected IDs, and modal modes. StudentForm shares approved input logic between Add/Edit while matching their different field layouts. StudentProfileDialog renders the passed selected Redux record. StudentStatusBadge is reused by the directory/profile for all four statuses. studentData.js contains verified demo records/options and pure filter/pagination helpers. The slice owns collection mutations and selectors; its tests exercise those mutations and helpers. All styling is scoped to the student UI, including portalled dialogs.

## Redux Changes / Student State
Added one students slice to the existing store under `state.students.records`. The faculty reducer/key and Provider are unchanged. No second store, Context, service, API, or thunk was created. Each record has a stable frontend-only ID plus name, initials, roll, email, studentPhone, program, section, semester, subjects, campus, status, guardian, and guardianPhone. Seed records preserve existing demo properties such as tone and the legacy guardian phone field. Updates merge into the selected record rather than replacing it, preserving additional properties.

Only collection state is centralized. Form drafts, modal mode/selected ID, filters, page, and page size are local UI state. Profile/Edit/Delete resolve the selected ID against the current Redux collection. Changes persist across route navigation in the running app and reset on refresh.

## Demo Data / Options
The directory starts with the two students visible in its reference, Ali Raza and Zainab Bilal, reusing their existing dashboard identity/guardian values. Semester, campus, and subjects come from the screenshots. Ali's email and student phone come from the Edit screenshot. Zainab's unavailable email and student phone remain blank, not invented. Existing program values come from frontend student data; campus values come from existing faculty data. Section/semester/subjects use user-entered text, with screenshot placeholders instead of invented option lists.

The dashboard's separate existing demo table and statistics were not modified; this task is scoped to the Students Directory.

## Add Functionality
Add New Student opens the shared StudentForm in Add mode. All twelve approved fields are present in the screenshot arrangement: two columns, three academic fields in one row, full-width subjects, campus/status, and a separated guardian row. Save dispatches studentAdded, clears filters, and selects the page containing the new record so it is immediately visible. Cancel, close, Escape, or dismissal discard the draft without dispatching.

## View Functionality
Eye opens a StudentProfileDialog for the selected ID, displaying the initials/name/roll, program, section/semester, campus/status, subjects, guardian, and contact. No extra email/phone panels or separate details route were added. Missing optional values display a dash. Close Profile and the close icon dismiss it.

## Edit Functionality
Edit uses the same StudentForm with the selected student's current values. Its reference-visible fields are editable. Campus Branch and Guardian Phone are not displayed in Edit; they are preserved exactly when saving. Other properties remain intact through the merge reducer. A stable ID, rather than roll or email, identifies the edited record. Save clears filters and selects the saved record's page.

## Delete Functionality
Delete opens the existing shared ConfirmDialog with student-specific text. Opening or cancelling does not dispatch a delete action. Confirm removes only the selected ID from Redux; the directory updates and clamps pagination. No student-specific delete popup or backend deletion was introduced.

## Search / Filters / Pagination
Search is trimmed and case-insensitive across name, roll number, and program. Program/status filters combine with search. Status choices are exactly All statuses, Active, Pending, Graduated, Suspended. Default All statuses reflects both Active/Pending reference rows honestly.

The reference's Department filter remains visible but disabled with an explanatory title/accessible label: the existing student model has no department property. Department is omitted from the search placeholder and predicate. No department data was fabricated.

Pagination uses the current filtered collection and supports 10, 25, or 50 rows per page. Search/filter/page-size changes reset to page 1; additions/edits reveal the saved row; deletion clamps the current page. Previous/next buttons disable at boundaries. Empty matches show an empty-state row and a zero result count.

## Validation Implemented
Required: Full Name, Roll Number / ID, Email, Program, Section, Semester, Subjects, Campus, Status. Student Phone, Guardian Name, and Guardian Phone are optional. Native email format validation is used. Required typed fields reject whitespace-only input via constraint validation. No uniqueness, phone patterns, semester ranges, role checks, or other business validation was invented. An existing demo record with a missing email must receive a valid email before Edit can save.

## Styling Changes
The directory and three modal layouts follow the supplied references using existing EduHub font, surface, text, green, status, border, radius, and shadow tokens. Add/Edit dialogs have an 800px maximum width; profile uses 675px. Modal content scrolls within the viewport and multi-column fields stack on small screens. Tables scroll horizontally on narrow screens. Sidebar, Header, MainLayout, and global CSS were not modified.

## Verification Results
- `npm.cmd run build`: passed.
- `npm.cmd run lint`: completed with only three pre-existing Fast Refresh warnings in Button.jsx, Badge.jsx, and tabs.jsx.
- `node --test src/store/Slices/studentsSlice.test.js src/store/Slices/facultySlice.test.js`: all 11 tests passed. Student tests cover IDs/add, optional blanks, hidden-field preservation during edit, targeted/empty deletion, all approved status filters and text search, pagination clamping/page-size changes, and unknown IDs. Existing faculty tests also passed.
- Direct store import asserted the existing faculty and new students registrations with their expected initial record counts.
- Source inspection verified selected-ID modal binding, required/type=email attributes, Add/Edit prefill, confirm-only deletion, Cancel handlers, routes, and import paths.
- `git diff --check`: passed, with pre-existing Windows line-ending notices.
- A dependency-free headless Chrome interaction test was attempted, but Chrome timed out before exposing its debugging endpoint. No browser interaction assertions ran. The test server/launcher were stopped and temporary profile data removed. Modal clicks, focus behavior, native validation prompts, responsive rendering, and pixel accuracy therefore remain unverified in a browser.

## Known Issues / Intentionally Pending
- Department filtering is unavailable because no student department data exists; adding such a model field requires approval.
- Zainab's email/student phone are unknown; they remain blank rather than guessed.
- Browser verification could not complete due to the startup timeout described above.
- Demo mutations reset on refresh. No backend persistence was requested or added.
- The three unrelated existing lint warnings remain.

## Final Scope Check
Backend modified: NO. Landing UI modified: NO. Shared sidebar/header modified: NO. New APIs/business rules invented: NO. Theme redesign: NO. Duplicate confirmation/store: NO. Unrelated implementation changes: NONE.
