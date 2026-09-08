# Admin Folder Reorganization

## Goal
Organize existing admin-owned frontend features by role without changing UI, routes, business logic, Redux behavior, or persistence. All changes for this task are inside frontend/. This report follows the existing frontend/docs convention.

## Previous Structure
Campus overview, faculty, students, timetable, and exams lived under src/components/. App.jsx also contained the Campus Admin fallback DashboardContent. Shared components, layouts, hooks, constants, and the store were already centralized.

## Ownership Analysis
App.jsx renders all implemented pages inside MainLayout, which supplies CAMPUS_ADMIN_NAV to the shared Sidebar. These are Campus Admin management features. Other role navigation arrays do not have implemented role dashboards or routing shells. No Super Admin or Institute Admin feature implementation was found. No role ownership was inferred from filenames alone.

## New Structure
~~~text
src/
  Admins/
    Super Admin/
      .gitkeep
    Institute Admin/
      .gitkeep
    Campus Admin/
      Dashboard/ (overview, data, campus tables, existing fallback)
      Faculty/ (directory, form, data, styles)
      Students/ (directory, form, profile, badge, data, styles)
      Timetable/ (page, grid, table, dialogs, feature data, styles)
      Exams/ (page, calendar, table, dialogs, data, styles)
  components/
    common/ (unchanged shared controls and shell components)
    ui/ (unchanged UI primitives)
    campus-overview/components/ (shared OverviewPanel, OverviewStatCard, OverviewStatusBadge)
  layouts/ (existing MainLayout)
  lib/ (existing utilities/theme plus shared schedule.js)
  hooks/ (existing theme hook)
  constants/ (existing multi-role navigation definitions)
  store/ (existing single Redux store, slices, tests, persistence)
~~~

## Super Admin Files
No implemented pages exist. Created only .gitkeep to retain the explicitly requested directory in Git. No routes or features invented.

## Institute Admin Files
No implemented pages exist. Created only .gitkeep to retain the explicitly requested directory in Git. No routes or features invented.

## Campus Admin Files
Moved 30 existing files into Dashboard, Faculty, Students, Timetable, and Exams. Extracted the existing DashboardContent fallback from App.jsx into Dashboard/DashboardContent.jsx with identical JSX.

## Shared Files Kept Outside Admins
Button, Input, Select, Badge, Dialog, ConfirmDialog, Table, Pagination, SummaryCard, and other shared controls remain in components/. Generic overview panels, stat cards, and status badges remain at their existing component paths because their props and rendering are reusable. MainLayout, Header, Sidebar, hooks, theme, and mixed-role navigation constants remain at their existing locations; no copies were introduced.

The former timetableData.js mixed feature seeds/statuses with reusable date, filtering, and grid functions. The reusable weekdays and utility functions were extracted verbatim to src/lib/schedule.js. Initial schedules and feature status options moved with Timetable. Consumers import directly from the appropriate module; no forwarding duplicate implementations were added. Existing feature styling remains unchanged, including styles used by the overview primitives.

## Redux Files
The centralized src/store/ architecture and single Provider/store are unchanged. Slices, selectors, persistence helper, and tests remain there. Only imports of relocated feature data and extracted schedule utilities changed. Redux actions, state shape, storage version, storage keys, and persistence validation are unchanged. Existing saved faculty, students, timetable, and exams remain compatible.

## Routes Updated
Only component import locations changed in App.jsx. Public URLs remain /, /dashboard, /faculty, /students, /timetable, /exams, and the existing wildcard fallback. No Super Admin or Institute Admin routes existed to migrate. Spaces in all three requested role directory names are supported by the production build and Vite development transforms.

## Files Moved
- src/components/campus-overview/CampusOverview.css ? src/Admins/Campus Admin/Dashboard/CampusOverview.css
- src/components/campus-overview/CampusOverview.jsx ? src/Admins/Campus Admin/Dashboard/CampusOverview.jsx
- src/components/campus-overview/campusOverviewData.js ? src/Admins/Campus Admin/Dashboard/campusOverviewData.js
- src/components/campus-overview/components/CampusStudentTable.jsx ? src/Admins/Campus Admin/Dashboard/components/CampusStudentTable.jsx
- src/components/campus-overview/components/CampusTimetable.jsx ? src/Admins/Campus Admin/Dashboard/components/CampusTimetable.jsx
- src/components/exams/ExamCalendar.jsx ? src/Admins/Campus Admin/Exams/ExamCalendar.jsx
- src/components/exams/examData.js ? src/Admins/Campus Admin/Exams/examData.js
- src/components/exams/ExamDetailsDialog.jsx ? src/Admins/Campus Admin/Exams/ExamDetailsDialog.jsx
- src/components/exams/ExamForm.jsx ? src/Admins/Campus Admin/Exams/ExamForm.jsx
- src/components/exams/ExamSchedules.css ? src/Admins/Campus Admin/Exams/ExamSchedules.css
- src/components/exams/ExamSchedules.jsx ? src/Admins/Campus Admin/Exams/ExamSchedules.jsx
- src/components/exams/ScheduledExams.jsx ? src/Admins/Campus Admin/Exams/ScheduledExams.jsx
- src/components/faculty/facultyData.js ? src/Admins/Campus Admin/Faculty/facultyData.js
- src/components/faculty/FacultyDirectory.css ? src/Admins/Campus Admin/Faculty/FacultyDirectory.css
- src/components/faculty/FacultyDirectory.jsx ? src/Admins/Campus Admin/Faculty/FacultyDirectory.jsx
- src/components/faculty/FacultyForm.css ? src/Admins/Campus Admin/Faculty/FacultyForm.css
- src/components/faculty/FacultyForm.jsx ? src/Admins/Campus Admin/Faculty/FacultyForm.jsx
- src/components/students/studentData.js ? src/Admins/Campus Admin/Students/studentData.js
- src/components/students/StudentForm.jsx ? src/Admins/Campus Admin/Students/StudentForm.jsx
- src/components/students/StudentProfileDialog.jsx ? src/Admins/Campus Admin/Students/StudentProfileDialog.jsx
- src/components/students/StudentsDirectory.css ? src/Admins/Campus Admin/Students/StudentsDirectory.css
- src/components/students/StudentsDirectory.jsx ? src/Admins/Campus Admin/Students/StudentsDirectory.jsx
- src/components/students/StudentStatusBadge.jsx ? src/Admins/Campus Admin/Students/StudentStatusBadge.jsx
- src/components/timetable/ClassDetailsDialog.jsx ? src/Admins/Campus Admin/Timetable/ClassDetailsDialog.jsx
- src/components/timetable/ClassTimetable.css ? src/Admins/Campus Admin/Timetable/ClassTimetable.css
- src/components/timetable/ClassTimetable.jsx ? src/Admins/Campus Admin/Timetable/ClassTimetable.jsx
- src/components/timetable/ScheduleClassForm.jsx ? src/Admins/Campus Admin/Timetable/ScheduleClassForm.jsx
- src/components/timetable/ScheduledClasses.jsx ? src/Admins/Campus Admin/Timetable/ScheduledClasses.jsx
- src/components/timetable/timetableData.js ? src/Admins/Campus Admin/Timetable/timetableData.js
- src/components/timetable/TimetableGrid.jsx ? src/Admins/Campus Admin/Timetable/TimetableGrid.jsx
- App.jsx inline DashboardContent ? src/Admins/Campus Admin/Dashboard/DashboardContent.jsx (unchanged component extraction).
- Shared portions of components/timetable/timetableData.js ? src/lib/schedule.js (unchanged declarations/functions).

## Files Created
- src/Admins/Super Admin/.gitkeep
- src/Admins/Institute Admin/.gitkeep
- src/Admins/Campus Admin/Dashboard/DashboardContent.jsx (existing component extraction)
- src/lib/schedule.js (existing utility extraction)
- docs/frontend-admin-folder-reorganization.md (this report)

## Files Deleted
No implementation was discarded. Old file paths of the 30 moved files were removed by moving them. Empty components/faculty, components/students, components/timetable, and components/exams directories were removed after checking they were empty. components/campus-overview remains because it contains reusable components.

## Import/Export Changes
Updated relative and alias imports to moved feature files and their CSS. Split named timetable imports between role-owned seed data and shared schedule utilities. Added the default export for the extracted DashboardContent. No barrel or dynamic imports required changes. Imports adjusted in:
- src/App.jsx
- src/Admins/Campus Admin/Dashboard/CampusOverview.jsx
- src/Admins/Campus Admin/Dashboard/components/CampusStudentTable.jsx
- src/Admins/Campus Admin/Dashboard/components/CampusTimetable.jsx
- src/Admins/Campus Admin/Exams/ExamCalendar.jsx
- src/Admins/Campus Admin/Exams/examData.js
- src/Admins/Campus Admin/Exams/ExamDetailsDialog.jsx
- src/Admins/Campus Admin/Exams/ExamSchedules.jsx
- src/Admins/Campus Admin/Exams/ScheduledExams.jsx
- src/Admins/Campus Admin/Students/studentData.js
- src/Admins/Campus Admin/Timetable/ClassDetailsDialog.jsx
- src/Admins/Campus Admin/Timetable/ClassTimetable.jsx
- src/Admins/Campus Admin/Timetable/ScheduleClassForm.jsx
- src/Admins/Campus Admin/Timetable/ScheduledClasses.jsx
- src/Admins/Campus Admin/Timetable/timetableData.js
- src/Admins/Campus Admin/Timetable/TimetableGrid.jsx
- src/store/persistence.js
- src/store/Slices/examsSlice.js
- src/store/Slices/examsSlice.test.js
- src/store/Slices/facultySlice.js
- src/store/Slices/facultySlice.test.js
- src/store/Slices/studentsSlice.js
- src/store/Slices/studentsSlice.test.js
- src/store/Slices/timetableSlice.js
- src/store/Slices/timetableSlice.test.js

## Verification Results
- Production build: PASS (npm.cmd run build).
- Lint: successful exit; three pre-existing Fast Refresh warnings in unchanged ui/tabs.jsx, ui/Button.jsx, and ui/Badge.jsx.
- Existing Redux/persistence regression tests: PASS, 27/27 (node --test src/store/persistence.test.js src/store/Slices/*.test.js).
- Content comparison against a snapshot immediately before this refactor: PASS for 77 JS/JSX/CSS source files after excluding imports and accounting for the two exact extractions. Component logic and CSS declarations are unchanged.
- Production CSS filename/hash remains index-DQiyocJK.css, identical to the pre-refactor build.
- Duplicate moved-file check: PASS; no originals remain at moved paths.
- Stale source import scan: PASS; no references to removed feature paths.
- Vite development server starts successfully. HTTP 200 for all six existing explicit page URLs and transformed App plus all five feature entry modules, including encoded spaces in directory names.
- Browser interaction and screenshot comparison were not performed; no browser automation tool/package is available. HTTP/module checks confirm serving and transformation, not full browser interaction. Existing CRUD/persistence behavior is covered by regression tests and unchanged-code comparison.
- No backend, landing-ui, or repository-root docs were modified by this refactor. Prior unrelated working-tree changes were preserved.

## Ambiguous Files Not Moved
No ambiguous implementation requires approval. The unused ADMIN_NAV constant is not explicitly assigned to Super Admin versus Institute Admin; it remains untouched in the existing shared multi-role navigation module. No ownership guess or configuration move was needed.
