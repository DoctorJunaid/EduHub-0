# Student Assignments & Submissions

## Feature Location

`frontend/src/Users/Student/pages/Assignments/` at `/student/assignments`, inside the existing protected Student layout.

## Assignment Data Source

No assignment service or dataset existed. The shared Redux `assignments.records` collection starts empty; no screenshot records are seeded. Each record contains `id`, `classId` (existing timetable ID), `title`, `dueDate` (valid date or empty), and `totalMarks` (positive number or null). Publication and grading remain future Teacher/backend work.

## Course Integration

The selector reuses the dashboard's student identity, enrolled subjects, and program/section timetable relationship. A task must reference a timetable class in that section and its subject must match an enrolled subject, ignoring case/outer whitespace. Subject and section labels come from the timetable, not copied assignment fields. No subject aliases are guessed. Missing or unrelated class references are excluded.

## Submission Data

Shared Redux `submissions.records`: `id`, `assignmentId`, `studentId`, `notes`, `status`, `score`, `feedback`. There is at most one submission per student/assignment pair. The authenticated student's linked record supplies identity; the form cannot select another student. This frontend demo is not a server authorization boundary.

## Status Model

No personal submission means Pending Submission. Saving notes creates Submitted, with null score and empty feedback. Supplied Graded records display their recorded score (including zero) and feedback. No late penalties, deadline locks, auto-grades, or additional workflow statuses are invented. Missing marks, dates, scores, and feedback have explicit fallbacks.

## Submit/Edit Flow

One `AssignmentSubmissionForm` handles create and edit. Notes must contain non-whitespace text. Editing pre-fills existing notes and updates the same record. The submit thunk rechecks authentication, current enrollment, and grading status at save time. Graded work cannot be edited; the reducer also preserves graded records. Cancel/Escape do not save. Files are pending; there is no upload or fake upload metadata.

## Feedback Flow

`AssignmentFeedbackDialog` shows score, teacher feedback, and submission notes read-only. One shared action resolver chooses Submit Now, Edit Submission, or View Feedback. Extra menus and Teacher/Admin actions are omitted.

## Dashboard Synchronization

Dashboard and Assignments use `selectStudentAssignments`. Pending Tasks counts all assignments awaiting submission, including overdue or undated tasks; its description states this scope. Upcoming Assignments shows up to three tasks due today or later in due-date order, with the same status badges. Submission updates both immediately. My Assignments and View All navigate to the page. Assignment count is derived from the filtered collection.

## Reusable Components

Existing MainLayout, Sidebar, Header, protected routes, Card, Table, Badge, Button, Dialog, and Textarea are reused. Student-specific components are AssignmentStatusBadge, AssignmentSubmissionForm, and AssignmentFeedbackDialog. Radix retains focus trapping, Escape handling, and trigger focus restoration. Theme tokens and scoped CSS support light/dark mode and a scrolling mobile table.

## Persistence

Existing `loadDemoState` / `persistDemoState` handle version-1 `eduhub_assignments` and `eduhub_submissions` records. Validation rejects malformed records, duplicate IDs, and duplicate student/assignment submissions. Components never access localStorage. Refresh restores submissions; storage failures retain the existing helper's in-memory behavior. This is browser-local demo persistence, not backend delivery.

## Files Created

- `frontend/src/Users/Student/pages/Assignments/StudentAssignments.jsx`
- `frontend/src/Users/Student/pages/Assignments/StudentAssignments.css`
- `frontend/src/Users/Student/components/AssignmentStatusBadge.jsx`
- `frontend/src/Users/Student/components/AssignmentSubmissionForm.jsx`
- `frontend/src/Users/Student/components/AssignmentFeedbackDialog.jsx`
- `frontend/src/store/assignmentData.js`
- `frontend/src/store/Slices/assignmentsSlice.js`
- `frontend/src/store/selectors/studentAssignments.js`
- `frontend/src/store/selectors/studentAssignments.test.js`
- `frontend/src/store/submitStudentAssignment.js`
- `docs/student-assignments.md`

## Files Modified

- `frontend/src/App.jsx`
- `frontend/src/Users/Student/index.js`
- `frontend/src/Users/Student/navigation.jsx`
- `frontend/src/Users/Student/StudentLayout.jsx`
- `frontend/src/Users/Student/Student.css`
- `frontend/src/Users/Student/pages/Dashboard/StudentDashboard.jsx`
- `frontend/src/store/store.js`
- `frontend/src/store/persistence.js`

Other pre-existing workspace edits are preserved. No Admin, Teacher, backend, or landing-ui files were changed for this task.

## Verification

- Build passes. Lint has only three existing Fast Refresh warnings in shared Button, Badge, and tabs components.
- Twelve Student selector tests cover identity/enrollment isolation, empty state, submit/edit validation, unique personal submissions, zero scores, graded protection, malformed persistence, refresh restoration, and existing Dashboard/Courses behavior.
- Isolated headless Chrome checked linked/unlinked empty states, three populated fixture states, submit validation, save, prefilled edit, feedback, persistence through navigation/reload, dashboard count/status synchronization, profile focus, and mobile overflow/dialog bounds.
- Desktop light/dark and 390px mobile views inspected. Fixtures exist only in tests/isolated browser storage; application collections remain empty by default.

## Pending Backend Requirements

Teacher publication and grading UI, authoritative assignment/submission APIs, authenticated server authorization, durable multi-device storage, upload infrastructure, and any deadline/late-submission policy remain pending. No APIs or Teacher workflows were implemented. Future integration should populate these shared collections, not introduce Student-only copies.
