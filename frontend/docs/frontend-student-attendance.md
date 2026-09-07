# Student Attendance Implementation

## Requested Work

Student Attendance Register is implemented at `/student-attendance` within the existing Campus Admin MainLayout/Outlet. Backend, landing UI, layout visuals, and existing route URLs are unchanged. **Two business choices remain pending user confirmation:** automatic program/section/weekday roster matching, and the Attendance Rate formula. The page currently supports explicit manual recording and shows a dash for rate, rather than selecting an unapproved policy.

## Screenshot Reference

The screenshot guides the heading, four compact summary cards, green Daily/History tabs, date navigator, four filters, full-width search, student/session table, status pills, action dropdowns, export button, and pagination. Current student and timetable data replace screenshot identities and numbers. No status, attendance time, comparison statistic, or duplicate directory dataset is fabricated. Shared theme tokens and existing typography/layout are preserved.

## Feature Structure

Student-specific files are grouped in `src/Admins/Campus Admin/Attendance/Students/`. Faculty Attendance remains in the existing parent feature. Shared controls stay in `components/common/`; state stays in `store/`.

## Student Integration

Uses `students.records` and stable `studentId`. Name, roll number, program, section, and avatar initials are read from the current directory. New students are immediately available to record attendance; directory edits immediately appear in the register/history/export. Attendance contains no copied identity object.

## Timetable/Class Integration

Uses `timetable.records` and stable `classId` for subject, room, section, start/end time, and recurring weekdays. Manual Record Attendance explicitly selects an existing student, timetable class, date, and status; it can create historical entries and update existing ones.

The optional matching implementation is ready and tested: it derives unmarked rows for students whose program and section match a timetable class scheduled on the selected weekday. It is **not enabled pending confirmation**. Free-text subject lists are not fuzzy-matched to invent enrollment. Saved records always remain visible on their recorded date even if the timetable weekday or student's section later changes. Deleted student/class references remain persisted but cannot be displayed through the current-identity join; archival snapshots/retention policy are not invented.

## Attendance Data Model

`{ id, studentId, classId, date, status }`. Date is local YYYY-MM-DD. Status is Present, Absent, Late, or On Leave. There is one record per student/class/date. Upserts preserve IDs and update status without duplicate records. The initial collection is empty. Unrecorded is displayed as a dash, not stored as a fifth status.

## Redux Changes

Added `studentAttendanceSlice.js` with `studentAttendanceMarked`, `selectStudentAttendance`, and memoized `selectStudentAttendanceHistory`. Registered it in the existing application store. No additional store, Provider, role store, or alternative state architecture was introduced.

## Selectors

Recorded history joins the current student and timetable maps through IDs. Local memoized calculations apply view/date, search, filters, and summary calculations. Filter, dialog, pagination, and selected-date state remain local. No redundant totals are stored in Redux.

## Summary Cards

Total Students is the number of distinct students in the filtered view. Present/Absent count student-class attendance entries, since a student may attend multiple classes on a date. This distinction is explained under the table. The rate calculation supports both requested choices for confirmation:

- Present / all marked sessions; or
- (Present + Late) / marked sessions excluding On Leave.

Unmarked sessions are excluded in both; a zero denominator displays a dash. Neither formula is activated until confirmed. Comparison percentages are omitted because no trustworthy historical population baseline exists.

## Daily View

Uses the selected local date and labels the heading Today's Attendance only on the actual current date. Previous/Next shift one day; Today resets to the actual date. The existing DatePicker supports selecting any date. Manual recording is available from the table heading. The optional inferred roster remains disabled pending confirmation; recorded entries appear immediately.

## History View

Shows recorded entries across dates, newest first, using the same table and records. A student selector supports individual history, alongside program, section, subject, status, and inclusive From/To controls using the existing Input pattern. History-only filters clear when returning to Daily. The shared date control selects Daily's context; History uses its own range.

## Search & Filters

Case-insensitive trimmed search matches student name, roll number, and program. Program/section options come from Students Directory; subjects come from Class Timetable; statuses come from shared attendance constants. All filters combine. Existing Pagination and the existing `paginateStudents` helper reset/clamp results after searches, filters, date changes, page-size changes, and status changes. Exports include all filtered rows rather than only the current page.

## Status Actions

Each row uses the shared DropdownMenu to choose any approved status. The current status is disabled in the menu. Selection immediately upserts Redux and updates the badge, summaries, history, and persistence. No attendance status is inferred from time or missing records. The form visibly notes when saving will update an existing student/class/date entry.

## Persistence

The existing centralized helper stores version-1 records at `eduhub_student_attendance`. All previous keys and schemas remain unchanged. Hydration rejects invalid dates/statuses/IDs, malformed JSON, bad versions, and duplicate student/class/date keys. Empty state stays empty. The existing storage-access failure behavior is preserved; storage unavailability cannot guarantee durable saving. Components never directly access localStorage.

## Export Report

Reuses `downloadCsv` for browser-native CSV. Includes student name, roll, program, section, subject, room, date, start/end time, and status. Respects Daily date or History range and all active filters. Unknown status remains blank. Shared quoting, UTF-8 BOM, formula-cell protection, and URL cleanup are reused. No new dependencies were installed.

## Reusable Components Used

MainLayout, Sidebar, Header, SummaryCard, Button, Input, Label, Card, Tabs, Table, Avatar, Pagination, DropdownMenu, Dialog, DatePicker, and existing timetable dialog/table styles. Reuses date/schedule helpers, CSV helpers, and the existing pagination helper.

## Components Shared With Faculty Attendance

- Moved the existing AttendanceStatusBadge into `components/common/`, extracting its CSS unchanged. Updated both Faculty Attendance consumers.
- Extracted the existing date-control markup into shared AttendanceDateNavigator, backed by the same DatePicker/date utilities. Faculty and Student Attendance both use it.
- Extracted the approved attendance status constants into `lib/attendance.js`; faculty's existing export is retained for compatibility.
- Reused SummaryCard, Pagination, and CSV utilities directly. Student table/session actions differ from faculty check-in/out behavior, so their feature-specific tables/forms remain separate.

## Files Created

- `src/Admins/Campus Admin/Attendance/Students/StudentAttendance.jsx`
- `src/Admins/Campus Admin/Attendance/Students/StudentAttendance.css`
- `src/Admins/Campus Admin/Attendance/Students/StudentAttendanceTable.jsx`
- `src/Admins/Campus Admin/Attendance/Students/StudentAttendanceForm.jsx`
- `src/Admins/Campus Admin/Attendance/Students/studentAttendanceData.js`
- `src/store/Slices/studentAttendanceSlice.js`
- `src/store/Slices/studentAttendanceSlice.test.js`
- `src/components/common/AttendanceDateNavigator.jsx`
- `src/components/common/AttendanceDateNavigator.css`
- `src/components/common/AttendanceStatusBadge.css` (extracted styles)
- `src/lib/attendance.js`
- `docs/frontend-student-attendance.md`

## Files Modified

- `src/App.jsx`, `src/constants/navigation.jsx`: route and campus navigation entry.
- `src/store/store.js`, `src/store/persistence.js`, `src/store/persistence.test.js`: state, storage, regression setup.
- Faculty Attendance `FacultyAttendance.jsx`, `FacultyAttendance.css`, `AttendanceTable.jsx`, `AttendanceDetails.jsx`, and `attendanceData.js`: shared-component extraction/imports only.
- `src/components/common/AttendanceStatusBadge.jsx`: relocated from the faculty feature; imports extracted stylesheet.

## Verification

- Production build: PASS (`npm.cmd run build`).
- Lint: successful exit, three pre-existing Fast Refresh warnings in unchanged UI Button/Badge/Tabs files.
- Node regression suite: PASS, 40 tests. Student tests cover Absent→refresh→Present→refresh, historical saves, stable composite IDs, normalized records, optional timetable matching, identity edits/new identities, combined filters, both candidate rate calculations, CSV data selection, malformed persistence, and pagination clamping. Existing student, faculty, faculty attendance, timetable, exams, and persistence tests pass.
- Vite SSR: both Student Attendance and Faculty Attendance render using the real Redux store, including a manually recorded student entry.
- Browser interaction, download, actual browser refresh, screenshots, and responsive/dark-mode appearance remain unverified; no browser automation tool/package is available here. Build/SSR/unit checks do not substitute for those checks.
- Roster matching and rate formula still require user confirmation before the feature can be reported complete.

## Business Rules Not Invented

No automated Present/Absent/Late rules, late thresholds, holidays, inferred elective enrollment, biometric behavior, attendance APIs, or server sync. No fabricated comparison percentages. Historical data uses current identity/class fields; a snapshot/archival policy and multiple sessions for one class ID/date would require further requirements.
