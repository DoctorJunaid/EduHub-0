# Student Attendance Record & History

## Feature Location

`frontend/src/Users/Student/pages/Attendance/StudentAttendance.jsx`, routed at `/student/attendance` through the existing protected Student layout. Attendance Record is active in the sidebar; the breadcrumb is Dashboard / Attendance.

## Attendance Data Source

Existing `studentAttendance.records` and `selectStudentAttendanceHistory` join student IDs and timetable class IDs. No new records, slice, store, API, or demo seed was added. The page is read-only and exposes no marking, editing, deletion, or invented menu actions.

## Course Integration

`selectStudentCourses` supplies the same enrolled subjects, section-matched timetable sessions, and attendance summaries as My Courses. Names are not copied into another dataset or guessed from aliases.

## Summary Calculations

The page reuses `selectStudentDashboard().attendance` and its existing `summarizeStudentAttendance` helper. For Present/Absent-only records, rate is Present divided by marked records times 100. Empty data produces an unavailable rate, not 0% or 100%. Late or On Leave records preserve the existing pending-policy behavior: counts remain visible while the percentage is unavailable. Present, Absent, Late, and On Leave are the existing statuses. Lectures Attended counts Present; Late / Leave combines those two recorded counts and shows their breakdown. No approval or excused-absence claims are inferred.

## Eligibility Threshold

No configured eligibility threshold was found. The screenshot's 75% appears explicitly as `Reference threshold: 75% (demo)`, as authorized by the task. It is display-only: no eligibility decision, enforcement, color cutoff, or backend rule uses it.

## Course-Wise Attendance

Each enrolled course displays its actual Present/marked count and percentage using the existing My Courses summary. Shared accessible Progress renders only known percentages, including a genuine 0%. Missing data and pending policy display text instead of a misleading zero-filled bar. Values are displayed to at most one decimal place.

## Daily Attendance History

Personal recorded history is sorted newest first, then by subject. Orphan records and other students' records are excluded by the shared join and identity filter. Existing personal historical records remain visible even if their subject is no longer a current enrollment; current course summaries only use current matched enrollments. Remarks are shown when supplied as text, otherwise `No remarks`; no instructor comments are invented. Current marking actions do not collect remarks.

## Dashboard Synchronization

Overall Attendance directly reuses the dashboard summary object. Shared record corrections update both immediately without a second formula or manually maintained percentage.

## My Courses Synchronization

The Attendance page directly reuses the My Courses selector result. Both display identical per-course calculations. Personal overall history and current course-specific summaries deliberately have their existing distinct scopes.

## Future Teacher Integration

Future Teacher marking should write the same centralized attendance collection/service. No Teacher implementation was started and no Student write action is exposed.

## Reusable Components

MainLayout, Sidebar, Header, protected routes, SummaryCard, Card, Progress, AttendanceStatusBadge (shared Badge), and Table are reused. Styling is scoped to the new Student page; no generic component or Admin CSS was modified.

## Persistence

Existing `eduhub_student_attendance` version-1 persistence remains unchanged. The existing centralized helper restores validated records across refresh. The page has no localStorage calls. Browser-local frontend demo storage is not server persistence.

## Files Created

- `frontend/src/Users/Student/pages/Attendance/StudentAttendance.jsx`
- `frontend/src/Users/Student/pages/Attendance/StudentAttendance.css`
- `frontend/src/store/selectors/studentAttendance.js`
- `frontend/src/store/selectors/studentAttendance.test.js`
- `docs/student-attendance.md`

## Files Modified

- `frontend/src/App.jsx` — Student attendance route and import.
- `frontend/src/Users/Student/index.js` — page export.
- `frontend/src/Users/Student/navigation.jsx` — sidebar destination.
- `frontend/src/Users/Student/StudentLayout.jsx` — attendance breadcrumb and existing profile navigation.

Prior workspace changes are preserved. No Admin, Teacher, backend, or landing-ui files were modified for this task.

## Verification

- Build passes; lint reports only the three pre-existing Fast Refresh warnings in Button, Badge, and tabs.
- All 16 Student selector tests pass, including four new attendance tests covering empty/unlinked accounts, student/orphan isolation, shared corrections, rate/count synchronization, Late/On Leave policy handling, and persistence of a genuine 0% result.
- Isolated browser fixtures verified empty state, Present/Absent counts, 50% progress, fallback remarks, refresh persistence, matching Dashboard rate, profile focus, and absence of page write controls.
- Desktop light/dark screenshots and 390px mobile screenshot inspected. At 900px, summary cards form two columns; at 390px they stack. No document overflow; table scroll stays within its container.
- Fixtures were used only in the isolated browser profile and tests; production attendance remains unseeded.

## Pending Backend Requirements

Authoritative attendance APIs, server authorization, Teacher marking integration, durable cross-device persistence, configured Late/Leave rate policy, and institutional eligibility thresholds remain pending. No endpoints, QR/biometric/geolocation attendance, or new business rules were introduced.
