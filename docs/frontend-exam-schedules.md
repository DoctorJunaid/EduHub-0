# Frontend Exam Schedules

## Requested work and reference

Implemented `/exams` inside the existing MainLayout/Outlet. The supplied screenshot guided the page heading, four compact summary cards, search and filters, week/list controls, Monday–Friday calendar, exam colors, and lower scheduled-exams table. Shared Sidebar and Header source and styling are unchanged; an Exam Schedules navigation entry was added.

The existing theme, fonts, buttons, and layout take precedence over screenshot differences in shared chrome. Counts and dates are real derived values, not the screenshot's static numbers. Three small demonstration exams reuse existing timetable subjects, sections, rooms, and faculty; their initial dates fall in the current week. They are persisted on initialization, so refresh does not move them to another week or resurrect deleted records.

## Files created

- `frontend/src/components/exams/ExamSchedules.jsx`
- `frontend/src/components/exams/ExamSchedules.css`
- `frontend/src/components/exams/ExamCalendar.jsx`
- `frontend/src/components/exams/ExamForm.jsx`
- `frontend/src/components/exams/ExamDetailsDialog.jsx`
- `frontend/src/components/exams/ScheduledExams.jsx`
- `frontend/src/components/exams/examData.js`
- `frontend/src/components/common/Pagination.jsx`
- `frontend/src/components/common/SummaryCard.jsx`
- `frontend/src/store/Slices/examsSlice.js`
- `frontend/src/store/Slices/examsSlice.test.js`
- `docs/frontend-exam-schedules.md`

## Files modified

- `frontend/src/App.jsx`: exam route.
- `frontend/src/constants/navigation.jsx`: campus navigation entry.
- `frontend/src/store/store.js`: register exams in the existing store.
- `frontend/src/store/persistence.js`: namespaced exam storage and hydration validation.
- `frontend/src/store/persistence.test.js`: exam refresh tests and empty-collection coverage.

## Reuse

Uses existing Button, Input, Label, Card, Badge, Table, Tabs, Dialog and ConfirmDialog, plus timetable modal/table styles. Reuses `mondayOf`, `shiftDays`, `minutes`, `timeLabel`, `gridRange`, `dayBlocks`, and weekdays from Class Timetable without modifying that feature. A separate compact exam grid renderer supports exam-specific card content without duplicating overlap/date algorithms.

No standalone Pagination or suitable compact SummaryCard existed. Added reusable components; the existing overview card requires trends and comparison data absent from this page. No second store, Provider, generic dialog copy, or duplicated add/edit form was created.

## Redux, model and persistence

`exams.records` is the single exam dataset. Actions: `addExam`, `updateExam`, `deleteExam`; selectors: `selectExams`, `selectExamStats`. Each record contains `id`, `subject`, `examType` (Midterm/Final/Test), `department`, `section`, `date` (local YYYY-MM-DD), `startTime`, `endTime` (24-hour HH:mm), `room`, `invigilator`, and numeric `totalMarks`.

The existing load/subscription helper stores `{ version: 1, records }` under `eduhub_exams`. Components never directly access localStorage. Invalid storage falls back to initial data; empty saved collections remain empty. Existing helper behavior keeps Redux usable if storage is unavailable or full; durability cannot be guaranteed in those cases.

## Search, filters, calendar and pagination

Case-insensitive trimmed search matches subject, room, or invigilator. Exact type, department, hall, and invigilator filters combine with search. Option lists use current Redux faculty, timetable, students, and exams. There is no independent hall or department registry; typed form inputs with existing-data suggestions allow missing values without fabricating registries.

Week View selects exams by local dates, positions them under Monday–Friday, and uses start/end minutes for top and duration. The range expands for early/late exams; overlap lanes use existing timetable utilities. Previous/next use seven-day shifts, Today returns to the actual current week. The This Week summary includes Monday–Sunday regardless of the displayed week or filters. Weekend exams remain in List View and the table, while the requested calendar shows weekdays only.

List View hides the calendar and exposes the same filtered all-date table. The lower Scheduled Exams table always shows all filtered dates, sorted by date/time. Pagination clamps after deletion, resets for filters/page size, and selects the saved record's page after add/edit. Add/edit clears filters and navigates the calendar to the saved exam's week.

## CRUD and validation

Schedule opens an empty/default form. Edit uses that same component with selected values. View resolves the selected record from Redux. Delete always uses the shared confirmation dialog and supports cancellation. Successful changes update Redux and persistence immediately, close the dialog, and update all derived views.

All approved fields except department are required. Whitespace-only values are rejected; dates/times must be valid; end must follow start; marks must be finite and positive (decimal values allowed). Only the three approved types are accepted. No hall, invigilator, or section conflict constraints were invented.

## Verification

- `npm.cmd run build`: PASS, production bundle generated successfully.
- `node --test src/store/persistence.test.js src/store/Slices/*.test.js`: PASS, 27 tests. Covers exam CRUD summaries, combined filters, week/year boundaries, time utilities, validation, malformed hydration, add/edit/delete across store recreation, and empty collections. Existing faculty, student, timetable, and storage regression tests pass.
- `npm.cmd run lint`: exits successfully with three pre-existing Fast Refresh warnings in unchanged `ui/tabs.jsx`, `ui/Button.jsx`, and `ui/Badge.jsx`.
- The Windows `npm.ps1` launcher is blocked by local execution policy; the equivalent `npm.cmd` launcher was used.
- Browser interaction, actual browser reload, screenshot comparison, and mobile/dark-mode visual checks have not been performed: no browser automation tool/package is available in this environment. Responsive styles provide wrapping controls, scrollable calendar/table, and existing mobile dialog behavior; these still need visual review.

## Remaining limitations and future rules

- Frontend localStorage persistence only; no backend integration.
- Only the existing small faculty/timetable datasets are available; no authoritative hall or department registry exists.
- Hall collisions, simultaneous invigilator assignments, and section exam overlaps: **Requires future business-rule confirmation.** Overlaps are displayed, not blocked.
- Existing shared header appearance remains as implemented in EduHub.
- Backend and landing UI were not modified. Existing unrelated working-tree changes were preserved.
