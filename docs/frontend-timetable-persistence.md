# Timetable & Frontend Persistence Update

## Requested Work
Implement the reference Class Timetable & Schedules page with data-driven week/list views, date navigation, filters, schedule CRUD, and generic delete confirmation. Persist students, faculty, and timetable demo collections through the existing Redux store using localStorage. Preserve the existing shell/theme and frontend-only scope.

## Timetable Implementation
The page is registered at `/timetable`, matching the existing sidebar destination. It includes the heading/subtitle, Schedule New Class button, Week/List tabs, previous/next week and Today, program/section/instructor/room filters, weekly grid, and Scheduled Classes table. List View shows the same table without the grid. Pagination uses the filtered records and supports 10/25/50 rows, resets on filter/page-size changes, and clamps after deletion.

The screenshot's grid and lower table contradict one another. The user explicitly approved using the lower table's three schedules as the single source for both views and repeating them weekly. Therefore the grid is consistent with the lower table rather than reproducing its conflicting decorative entries. The reference Break/Non-Scheduled legend is shown, but no break records or additional schedules were invented.

## Timetable Data Model
Records contain `id`, `subject`, `program`, `section`, `instructor`, `room`, `days`, `startTime`, `endTime`, and `status`. Days are weekday numbers 1–5; times use 24-hour HH:mm strings. Statuses are Active/Pending only. Existing sample subjects, rooms, sections, instructors, and frontend program values supply options. Live student/faculty values and current schedules extend those options without invented datasets.

Seed schedules follow the approved table: Advanced Web Design, Mon/Wed 10:00–12:00, CS-4A/Lab 302, Active; Data Structures & Algorithms, Tue/Thu 14:00–15:30, CS-3B/Hall B, Pending; Artificial Intelligence, Fri 09:00–12:00, CS-4B/AI Research Lab, Active. All use the existing BS Computer Science program and Dr. Usman Khan instructor.

## Week Grid
Week starts on the Monday containing the current local date. Previous/next move seven calendar days; Today recomputes the current Monday. Headers use the resulting weekday dates, and the range includes Monday–Sunday. Schedules repeat each week per approval; no unapproved date-range model was added.

Each day column filters records by weekday. Start/end times determine top position and height at 40 pixels per hour. The initial visible range is 08:00–17:00 and expands when records fall outside it. Overlapping records receive adjacent lanes instead of hiding each other; no conflict-rejection business rule was added. Grid blocks open the existing class-details view for their record. Filters apply identically to table and grid. The grid scrolls horizontally on small screens.

## CRUD
Schedule New Class and Edit share ScheduleClassForm with the nine approved fields, multiple weekday checkboxes, and existing UI primitives. Required values, at least one weekday, and an end time after the start time are enforced to create a renderable same-day schedule; no backend, conflict policy, enrollment rule, or permission logic exists. Save updates Redux, clears filters, selects the saved row's page, and updates both views.

View opens the selected class's available details in a dialog. Delete uses the existing generic ConfirmDialog. Cancel/dismiss changes nothing; confirmation deletes only that ID. Form drafts and modal state remain local.

## Reusable Components
Reused Button, Input, Label, Card, Badge, Table primitives, Tabs/TabsList/TabsTrigger/TabsContent, Dialog primitives, and the existing shared ConfirmDialog. No second confirmation component or modal library was created. Feature components: ClassTimetable (orchestration), TimetableGrid (weekday/time rendering), ScheduledClasses (table/pagination/actions), ScheduleClassForm (shared Add/Edit), ClassDetailsDialog (selected details).

## Redux Changes
Registered timetableReducer under `state.timetable.records` alongside the existing `faculty.records` and `students.records`. The existing Provider and store remain the only production state system. Student/faculty reducers and UI were not rewritten. Timetable actions add/update/delete by stable frontend IDs.

## Persistence
Centralized `store/persistence.js` implements localStorage -> Redux hydration and Redux -> localStorage synchronization. Store initialization loads valid version-1 record arrays as preloadedState; missing/corrupt data falls back independently to each reducer's seed state. The helper writes initial collections, then subscribes to record-reference changes and writes only changed collections.

Empty arrays are valid, so deleting all records does not resurrect seed data after refresh. JSON parsing, version/shape checks, duplicate IDs, statuses, and schedule day/time validation prevent malformed stored records from crashing collection consumers. Storage access/write failures are caught by the helper so Redux operations can continue; failed writes are retried on later changes. No temporary modal/filter/tab/week/page/loading state is persisted.

Storage availability/quota failures cannot guarantee persistence; normal localStorage must be available for changes to survive refresh. The prior unrelated theme utility was not refactored.

## Storage Keys
- `eduhub_students`
- `eduhub_faculty`
- `eduhub_timetable`

Each key stores `{ "version": 1, "records": [...] }`. No new dependency or redux-persist was installed. The existing theme storage is separate and unchanged.

## Files Created
- `frontend/src/components/timetable/ClassTimetable.jsx`
- `frontend/src/components/timetable/ClassTimetable.css`
- `frontend/src/components/timetable/TimetableGrid.jsx`
- `frontend/src/components/timetable/ScheduledClasses.jsx`
- `frontend/src/components/timetable/ScheduleClassForm.jsx`
- `frontend/src/components/timetable/ClassDetailsDialog.jsx`
- `frontend/src/components/timetable/timetableData.js`
- `frontend/src/store/Slices/timetableSlice.js`
- `frontend/src/store/Slices/timetableSlice.test.js`
- `frontend/src/store/persistence.js`
- `frontend/src/store/persistence.test.js`
- `docs/frontend-timetable-persistence.md`

## Files Modified
- `frontend/src/App.jsx`: import and register `/timetable`.
- `frontend/src/store/store.js`: register timetable and attach persistence/hydration.

## Files Deleted / Dependencies
None. No dependency changes.

## Feature Structure
```text
frontend/src/components/timetable/
|-- ClassTimetable.jsx
|-- ClassTimetable.css
|-- TimetableGrid.jsx
|-- ScheduledClasses.jsx
|-- ScheduleClassForm.jsx
|-- ClassDetailsDialog.jsx
`-- timetableData.js

frontend/src/store/
|-- store.js
|-- persistence.js
|-- persistence.test.js
`-- Slices/
    |-- timetableSlice.js
    `-- timetableSlice.test.js
```
Existing student/faculty slices stay in Slices. Pure date/filter/position helpers and schedule seed data remain with the timetable feature; Redux-specific persistence and state logic remain in store.

## Verification
- Production build passed, including a repeat after the final persistence validation adjustment.
- Lint completed with only three pre-existing Fast Refresh warnings in Button.jsx, Badge.jsx, and tabs.jsx.
- All 22 tests passed across student/faculty/timetable reducers and persistence. The seven persistence tests were rerun after the final validation adjustment and passed.
- Persistence tests use simulated localStorage and recreate the actual reducer store after adds/edits/deletes for all three collections; they also verify empty arrays, malformed JSON/records/versions, invalid days/times, storage access/quota errors, and change-only writes.
- Timetable tests cover CRUD across weekday blocks, month/year week navigation, all filters, grid expansion, and overlapping block lanes. Existing student/faculty tests remain passing.
- `git diff --check` passed with existing Windows line-ending notices.
- Browser manual/automation testing was not performed in this task. Prior Chrome startup timed out in this environment. The reported refresh tests simulate store recreation rather than claiming a browser reload test. Clicks, native validation prompts, focus handling, and pixel-level fidelity have not been browser-verified.

## Remaining Issues
The supplied screenshot's conflicting grid was reconciled using the user's approved lower-table schedules. The existing dashboard still uses its separate static schedule/statistic demonstrations; no unrelated dashboard refactor was requested. Storage failures mean in-memory changes cannot be retained. Three unrelated lint warnings remain. No detected build or test failures remain.

## Final Scope Check
Backend modified: NO. Landing UI modified: NO. Sidebar/header modified: NO. New APIs or backend persistence: NO. Theme redesign: NO. Unnecessary dependencies: NO. Duplicate Redux store or confirmation dialog: NO. Additional approval required: NO.
