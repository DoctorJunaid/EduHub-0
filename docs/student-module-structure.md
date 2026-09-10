# Student Module Structure

## Parent Structure

`src/Users/` contains the Student and Teacher role folders. Academic administration remains in `src/Admins/`; no Admin pages were moved or rewritten.

## Student Folder

`src/Users/Student/` contains StudentLayout, its scoped stylesheet, navigation, an index export, the Dashboard and Courses pages, and the StudentCourseCard component. Generic UI remains in `src/components/`, and all Redux selectors/state remain centralized under `src/store/`.

## Teacher Placeholder

`src/Users/Teacher/.gitkeep` reserves the required folder. Teacher implementation was NOT started.

## Student Dashboard

`src/Users/Student/pages/Dashboard/StudentDashboard.jsx` uses the supplied screenshot's profile summary, four metrics, timetable, and two lower panels. It renders only outlet content. Actual shared records take precedence over illustrative screenshot values.

The signed-in Student is matched by exact student record ID or a unique case-insensitive email. Unknown/ambiguous emails never fall back to another student. An unlinked account receives an explanatory state and no academic records.

Enrolled Courses derives from the student's comma-separated subjects. Today's timetable uses the existing program/section relationship and the browser's local weekday, refreshing at midnight or when visibility changes. Attendance uses the existing helper for recorded Present/Absent sessions; no rate is assumed when Late/On Leave policy is undefined. Missing attendance displays a dash. Per-exam awarded GPA is not treated as CGPA: only an explicitly recorded student.cgpa is displayed, otherwise the card reports its absence.

No assignment or diary source exists. These sections intentionally display empty states, and Pending Tasks remains unavailable rather than a fabricated zero. No fake rows, CGPA formula, course credits, or academic APIs were added.

## Shared Components Reused

MainLayout, Sidebar, Header, Outlet, SummaryCard, Card, Button, Table, Badge, Avatar, Alert, DropdownMenu, theme helpers, and existing date/time formatting. MainLayout accepts an optional supplied profile and header configuration; defaults preserve existing Admin behavior. Header supports an optional profile menu and breadcrumb configuration.

## Shared State/Data Sources

- Auth: existing auth slice and login/session flow.
- Student identity, subjects, section/program, semester: students slice.
- Timetable: timetable slice; no independent Student schedules.
- Attendance: studentAttendance history joined to students and classes.
- Results: personal records in results slice; no cumulative calculation invented.
- Fees/messages: existing centralized slices remain available for later Student pages.
- Assignments/diary: no source exists; no duplicate or speculative store was created.
- `store/selectors/studentDashboard.js` is the common academic view used by Dashboard and Courses.

## Routes

Student login redirects to `/student/dashboard` through the existing roleHome mapping. Dashboard and `/student/courses` are both protected by the existing Student-only ProtectedRoute and render through StudentLayout → MainLayout → Outlet. No new authentication implementation was added.

## Persistence

The existing loadDemoState/persistDemoState helpers preserve sessions and academic records. No Student component writes directly to localStorage. Selectors contain no mutations. Tests confirm session restoration, academic updates, empty enrollment persistence, and logout behavior.

## Functionality

Overview and My Courses navigation work. Dashboard View All Courses links to `/student/courses`. Profile dropdown View Profile navigates/focuses the dashboard summary, including from Courses; Sign Out uses the existing auth action. Sidebar collapse and Dark Mode remain shared.

My Assignments, Fee Vouchers, View All Assignments, and All Notes are pending their Student destinations; their controls explain that state instead of pointing to Admin routes or fabricated pages. The existing global search and notifications have no implemented Student service. Unsupported menus/actions were not invented.

## Files Created

- `src/Users/Student/StudentLayout.jsx`, `Student.css`, `navigation.jsx`, `index.js`
- `src/Users/Student/pages/Dashboard/StudentDashboard.jsx` and `StudentDashboard.css`
- `src/Users/Teacher/.gitkeep`
- `src/store/selectors/studentDashboard.js` and `studentDashboard.test.js`
- This documentation. Course-specific additions are listed in `student-my-courses.md`.

## Files Modified

Shared integration: `src/App.jsx`, `src/auth/roles.js`, `src/layouts/MainLayout.jsx`, `src/components/common/Header.jsx`, `src/components/common/Sidebar.jsx`, and `src/store/Slices/authSlice.test.js`. Admin modules, backend, landing-ui, global CSS, store configuration, and persistence implementation were not modified for Student work.

## Verification

- Production build passed; lint passed with the existing three Fast Refresh export warnings in Button, Badge, and tabs.
- Dashboard selector tests cover identity isolation, ambiguous/unlinked email, shared student/timetable updates, attendance scoping/policy, and restored session/data.
- Browser login with the existing demo student's email displayed Ali Raza from shared state, 3 subjects, the matching CS-4A timetable, and unavailable values for missing academic data.
- Desktop and mobile visuals were inspected. No document/main horizontal overflow; the timetable uses controlled internal scrolling.
- Profile-menu focus restoration, Course navigation, Dark Mode, refresh persistence, logout, and unauthenticated route protection passed browser checks.
- Unlinked email displayed the account's own identity and empty academic states, never Ali Raza's records.

## Pending Student Pages

Assignments, Attendance Record, Daily Diary, Grades & CGPA, Fee Vouchers, and Messages are not implemented. My Courses is implemented and documented separately. Teacher remains unimplemented. Assignment/diary contracts, official CGPA rules, and any Late/Leave attendance weighting need defined shared academic sources/policy before those summaries can be populated.
