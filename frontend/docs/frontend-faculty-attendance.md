# Faculty & Staff Attendance Implementation

## Requested Work

Implemented the frontend attendance-management page at `/faculty-attendance`, under Campus Admin, using the existing MainLayout/Outlet and Redux store. Added its campus navigation entry. No backend or landing-ui changes were made.

## Reference Screenshot

The supplied screenshot guides the title/subtitle, export action, four compact summary cards, date controls, green active tabs, filters, check-in table, avatar rows, semantic badges, and pagination. Shared Header/Sidebar/theme remain unchanged. Actual faculty counts replace screenshot numbers. There is no fabricated 42-person roster, attendance history, check-in times, or comparison percentage. The calendar opens from the selected-date control instead of remaining permanently open.

## Feature Structure

Role-specific files live together in `src/Admins/Campus Admin/Attendance/`. Generic DatePicker, date helpers, and CSV helpers remain shared. Redux files remain under `src/store/`.

## Faculty Integration

`faculty.records` remains the identity source. Attendance stores only `facultyId`, not a second name/email/department database. Daily rows include all current faculty, so newly added people appear immediately. Name/department edits are reflected through the current faculty record.

There is no separate staff registry or reliable faculty-to-section relationship in the current frontend. All Sections is disabled with visible explanatory text. Timetable instructor names are not used to invent identity relationships. Attendance referencing a deleted faculty member remains stored but is excluded from current-roster views/counts/exports; no historical identity snapshot or automatic record-deletion policy was invented.

## Attendance Data Model

Each record contains `id`, `facultyId`, `date` (local YYYY-MM-DD), `checkInTime`, `checkOutTime` (HH:mm or empty string), and `status` (Present, Late, Absent, On Leave). The log starts empty. Missing attendance displays a dash; it is not treated as Absent or as an additional attendance status.

The daily model keeps one record per faculty/date. The form prevents changing a record onto an already recorded faculty/date. The reducer can upsert by faculty/date while preserving stable IDs, and refuses edits that would collide with another existing record. No destructive attendance actions were added.

## Redux Changes

Added `attendanceSlice.js` with `attendanceSaved`, `selectAttendance`, and memoized `selectAttendanceSummary`. Registered it in the existing store and existing persistence helper. There is still one store and one Provider. UI state (date, view, filters, page, dialogs, form) remains local.

## Selectors / Derived Data

Summary counts derive from current faculty and the selected date, independent of table filters. Present counts only Present, not Late. Weekly and History use the same underlying records. Comparison indicators are omitted because no trustworthy baseline data exists; percentages are never fabricated.

## Daily View

Shows the selected date's roster and recorded check-in/out/status. The heading says Today's Check-in Log only for the actual current date. Unrecorded rows offer Record; existing rows offer View and an action menu containing Update attendance.

## Weekly View

Shows Monday–Sunday counts of Present, Late, Absent and On Leave per current faculty member. Missing days contribute zero rather than assumed absence. Search/department filters apply to people; a status filter restricts the underlying records and includes only people with matching records. The heading identifies the week.

## History View

Shows recorded attendance across dates, newest first, with teacher, department, status, and inclusive From/To filters. It includes an explicit Date column. The date control still determines summary-card values; history rows use their independent range. History-only filters clear when leaving History so hidden filters cannot restrict Daily/Weekly.

## Search & Filters

Trimmed case-insensitive search matches current faculty name, email, or department. Department options derive from faculty state. Status uses only approved values. Section filtering is unavailable until a reliable relationship exists. Pagination uses the existing Pagination component, resets on date/filter/view/page-size changes, clamps if the result shrinks, and selects the saved person's page after a save.

## Date Navigation

Previous/Next move one local calendar day; Today uses the actual current date. The same selected date drives the date picker, daily rows, weekly period, and summaries. Existing `mondayOf` and `shiftDays` utilities are reused. Dates use local noon for calendar arithmetic rather than converting local dates through UTC.

## Calendar

No Calendar/Popover component was previously configured. Added a generic DatePicker using the already-installed Radix Popover primitive, shared Button, and date utilities, without a new dependency. Supports month navigation, date selection, outside-month dates, recorded-date dots, selected/today indicators, Escape/outside dismissal via Radix, focus return, and arrow/Home/End keyboard navigation with a roving tab stop. Scoped styles keep it within narrow viewports.

## Attendance Actions

One AttendanceForm handles create and update. The page-level Record Attendance button allows choosing any current faculty member. Details render the selected actual attendance and faculty records. Status is chosen manually. Times may be blank; a provided check-out requires check-in and must be later within the same date. Valid dates, approved statuses, and HH:mm times are checked. There are no automatic timestamps, biometric actions, late thresholds, or implied status changes.

## Persistence

The existing helper stores `{ version: 1, records }` under `eduhub_attendance`. Existing collection keys are unchanged. Hydration rejects malformed JSON, invalid versions, bad records, duplicate IDs, duplicate faculty/date entries, invalid times, and unsupported statuses. Empty attendance stays empty after refresh. Components do not read/write localStorage directly. As with the existing helper, blocked/full localStorage leaves Redux usable but cannot guarantee durable storage.

## Export Report

Exports all filtered rows, not just the current pagination page. Daily exports the selected roster/date with blanks for unrecorded values. History exports the filtered date range. Weekly exports filtered status counts plus Week Start/Week End. Columns include current faculty name, email, and department. Browser-native Blob/download is used; the shared CSV helper quotes commas/quotes/newlines, includes a UTF-8 BOM, and protects spreadsheet-formula-like cell values. No Excel/PDF library was added.

## Reusable Components Used

MainLayout, Sidebar, Header, Button, Input, Label, Card, SummaryCard, Table, Avatar, Badge, Tabs, Dialog, DropdownMenu, and Pagination. Existing timetable modal/table styles and shared schedule utilities are reused without changing their implementation.

## Reusable Components Created

- `components/common/DatePicker.jsx` and scoped stylesheet.
- `lib/dates.js`: local date parsing/formatting/validation.
- `lib/csv.js`: CSV encoding and browser download.
- AttendanceStatusBadge is feature-specific and reused in table/details.

## Files Created

- `src/Admins/Campus Admin/Attendance/FacultyAttendance.jsx`
- `src/Admins/Campus Admin/Attendance/FacultyAttendance.css`
- `src/Admins/Campus Admin/Attendance/AttendanceTable.jsx`
- `src/Admins/Campus Admin/Attendance/AttendanceForm.jsx`
- `src/Admins/Campus Admin/Attendance/AttendanceDetails.jsx`
- `src/Admins/Campus Admin/Attendance/AttendanceStatusBadge.jsx`
- `src/Admins/Campus Admin/Attendance/attendanceData.js`
- `src/components/common/DatePicker.jsx`
- `src/components/common/DatePicker.css`
- `src/lib/dates.js`
- `src/lib/csv.js`
- `src/store/Slices/attendanceSlice.js`
- `src/store/Slices/attendanceSlice.test.js`
- `docs/frontend-faculty-attendance.md`

## Files Modified

- `src/App.jsx`: attendance route.
- `src/constants/navigation.jsx`: campus navigation entry.
- `src/store/store.js`: attendance reducer registration.
- `src/store/persistence.js`: attendance hydration/storage integration.
- `src/store/persistence.test.js`: include attendance reducer in shared regression setup.

## Files Moved

None for this task.

## Files Deleted

None for this task.

## Verification

- Production build: PASS (`npm.cmd run build`).
- Lint: successful exit with three unchanged pre-existing warnings.
- Node regression suite: PASS, 33 tests. Covers attendance creation, check-out/status updates across store recreation, identity integration, no assumed absences, summaries, daily/weekly/history filtering, weekly export dates, validation, malformed persistence, CSV escaping, and local date boundaries. Existing faculty, students, timetable, exams, and persistence tests also pass.
- Vite SSR smoke check: attendance page renders successfully with the real store and shared components, including title, faculty identity, and recording action.
- `git diff --check -- frontend`: PASS.
- Browser interaction, actual browser reload/download, calendar keyboard behavior, screenshots, and mobile/dark-mode appearance have not been visually verified. No browser automation tool/package is available in this environment. Store recreation tests verify persistence mechanics; SSR and build do not replace browser testing.

## Pre-existing Issues

Lint warns about Fast Refresh exports in unchanged `components/ui/tabs.jsx`, `Button.jsx`, and `Badge.jsx`. The Windows PowerShell npm launcher is blocked by execution policy, so equivalent `npm.cmd` commands were used. Existing unrelated working-tree changes were preserved.

## Business Rules Requiring Future Confirmation

- An automatic Late threshold was **not invented**. Requires business-rule confirmation.
- Overnight/multi-shift attendance requires a richer date/time model; current entries represent one calendar date.
- Working-day calendars, required check-in times per status, absence inference, and leave approval were not invented.
- Faculty-to-section assignments require an authoritative identity-based relationship before section filtering can work.
- Deleted-faculty historical display/retention and separate staff identity management require confirmation before expansion.
