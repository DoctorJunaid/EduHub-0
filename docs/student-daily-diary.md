# Student Daily Lecture Diary

## Feature Location

`frontend/src/Users/Student/pages/Diary/`, routed at `/student/diary` inside the existing protected Student layout. The sidebar and Dashboard / Diary breadcrumb reuse the shared shell.

## Diary Data Source

No diary service or collection existed. `store/Slices/diarySlice.js` adds a shared, initially empty `diary.records` collection. Records require `id`, `classId`, `title`, and a valid `date`; optional text fields are `recap`, `homework`, `resources`, and `assignmentId`. No screenshot content is seeded. The reducer exposes no Student write actions. Records can be supplied through the existing persistence boundary until Teacher/backend integration is implemented.

## Course Integration

`selectStudentDiary` joins entry class IDs to the routines returned by `selectStudentCourses`. This reuses current Student identity, enrolled subjects, program/section timetable matching, and excludes unrelated classes, orphan references, and unlinked accounts. Course and section names are derived, not duplicated in diary records.

## Instructor Integration

The existing My Courses instructor resolver supplies the name from the shared timetable/faculty relationship. No teacher copies or guessed ID mappings are introduced. Missing instructors retain the existing fallback.

## Homework / Assignment Integration

Informal homework remains diary text. An optional `assignmentId` resolves against `selectStudentAssignments`, requiring the same class ID. A valid reference displays the current assignment title and links to Student Assignments, without creating a second task. An unavailable reference has an explicit fallback instead of exposing an unrelated assignment or duplicating stale homework. No records are linked by guessing titles. The current resources field is plain teacher-provided text; absent resources are omitted. No external URLs, downloads, or resource records are invented.

## Subject Filtering

The shared Select defaults to All Subjects. Options come from the same enrolled courses as My Courses. Filtering does not mutate records; reset restores all relevant entries. If an enrollment removes the selected subject, the visible selection falls back to All Subjects. Empty collections and empty subject results have distinct messages. Entries sort newest first, with title as a stable secondary order.

## Verification Status

Verified Entry is omitted because no verified/published/approved state or workflow exists. Students cannot create, edit, delete, verify, or publish entries. No three-dot menu is rendered because no additional valid read-only actions exist.

## Dashboard Synchronization

Today's Class Diary consumes the same `selectStudentDiary` result and renders up to two entries matching the dashboard's local date. Older entries stay on the Diary page and are not relabeled as today's content. All Notes navigates to the diary. Both views reuse StudentDiaryEntry, with a compact dashboard variant. The dashboard's existing midnight/visibility date refresh remains in use.

## Future Teacher Integration

Teacher publication should populate this shared collection or its eventual service, preserving class references and shared assignment IDs. No Teacher UI or publication workflow was implemented. A future publication/verification model must be explicitly integrated rather than inferred from display content.

## Reusable Components

MainLayout, Sidebar, Header, protected routes, Card, Badge, Select, and Button are reused. StudentDiaryEntry is the only new Student-specific card component and serves the page and dashboard. Missing recap/homework uses honest fallback text. Styles are scoped to the diary components and its Select portal; light/dark theme tokens remain unchanged.

## Persistence

The existing `loadDemoState` / `persistDemoState` helpers handle `eduhub_diary` version-1 records. Validation checks required text, valid dates, optional text types, and unique IDs. Invalid persisted collections fall back to empty reducer state. No component accesses localStorage. Persistence is browser-local frontend demo behavior, not an API or server delivery claim.

## Files Created

- `frontend/src/Users/Student/pages/Diary/StudentDiary.jsx`
- `frontend/src/Users/Student/pages/Diary/StudentDiary.css`
- `frontend/src/Users/Student/components/StudentDiaryEntry.jsx`
- `frontend/src/Users/Student/components/StudentDiaryEntry.css`
- `frontend/src/store/Slices/diarySlice.js`
- `frontend/src/store/selectors/studentDiary.js`
- `frontend/src/store/selectors/studentDiary.test.js`
- `docs/student-daily-diary.md`

## Files Modified

- `frontend/src/App.jsx`
- `frontend/src/Users/Student/index.js`
- `frontend/src/Users/Student/navigation.jsx`
- `frontend/src/Users/Student/StudentLayout.jsx`
- `frontend/src/Users/Student/pages/Dashboard/StudentDashboard.jsx`
- `frontend/src/store/store.js`
- `frontend/src/store/persistence.js`

No Admin, Teacher, backend, or landing-ui files changed for this task.

## Verification

- Build passes. Lint reports only the three existing shared-component Fast Refresh warnings (Button, Badge, tabs).
- All 20 Student selector tests pass, including four diary tests covering enrollment isolation, empty state, subject filtering/reset, date ordering/today matching, live instructor resolution, formal assignment references, and persistence validation/restoration.
- Isolated browser checks verified the genuine empty default, two populated fixtures, enrolled-subject options, subject empty state, reset to All Subjects, reload restoration, and today's single matching dashboard entry.
- Desktop light/dark and 390px mobile screenshots inspected. Recap/homework panels stack on small screens and the document has no horizontal overflow.
- Test fixtures were confined to tests and the isolated browser profile, then removed; application state starts empty.

## Pending Backend/Data Requirements

Teacher diary creation, authenticated server authorization, publication/verification policy, persistent cross-device storage, and any structured resource-link model remain pending. No diary, homework, resource, or publication endpoint was invented.
