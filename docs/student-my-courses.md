# Student My Courses

## Feature Location

`src/Users/Student/pages/Courses/StudentCourses.jsx`, with scoped `StudentCourses.css` and the reusable `src/Users/Student/components/StudentCourseCard.jsx`.

## Reference Screenshot

Preserved the title/subtitle, three-column card grouping, section badge, top-right credit information, compact title, neutral schedule/location/instructor panel, footer separator, and attendance placement. Existing theme tokens, shared shell, typography, and icons remain in use. Screenshot placeholders do not override actual academic records: descriptions and unsupported options are omitted, credits show “Credits not available,” and missing schedule data shows a clean fallback.

## Course Data Source

No separate courses catalog exists. `selectStudentCourses` creates read-only view models from the shared `selectStudentDashboard` enrollment list and timetable. Nothing is stored independently for the Courses page.

## Enrollment Data

The student's existing subjects string is the current enrollment source. Both Dashboard Enrolled Courses and the card grid use this same deduplicated list. The initial record contains Advanced Web Design, Data Structures, and AI. No unapproved aliases expand the latter two into the screenshot's longer names.

Section and semester come from the linked student record because no per-course enrollment section/semester structure exists. The footer displays the actual “4th Semester” rather than inventing an “Active Semester” enrollment state.

## Timetable Integration

Uses the same program/section-filtered timetable as the Dashboard. Course titles match timetable subjects after trimming and case normalization. Other sections and fuzzy aliases are excluded. Therefore, the existing CS-4A Advanced Web Design schedule resolves, while Data Structures and AI correctly show unavailable schedule/location/instructor fields until matching data exists.

Schedules validate weekday/time fields before calling existing dayLabel/timeLabel helpers. Valid example: `Mon & Wed · 10:00 AM – 12:00 PM`. Missing/invalid days or times produce “Schedule not available,” never malformed punctuation. Multiple matching sessions retain their own schedule, room, and instructor grouping.

## Faculty Integration

Timetable currently stores instructor names rather than faculty IDs. A unique normalized match resolves the display name from faculty state; otherwise the stored timetable name remains the authoritative display value. No teachers are duplicated. Automatic propagation of faculty renames across name-based references requires an explicit stable-ID relationship; this task does not guess or rewrite that contract.

## Attendance Integration

Per-course attendance uses the signed-in student's shared history and only the matched class IDs. Other students/classes are excluded. The Dashboard and Courses reuse the same summary helper. Present divided by marked sessions is shown when all statuses are Present/Absent. Late/Leave weighting remains unspecified and yields an unavailable rate. No records display a dash with an accessible explanation, never a hardcoded 95%.

## Reusable Components

MainLayout, Header, Sidebar, ProtectedRoute, Card, Badge, Button/Link, DropdownMenu, theme utilities, date/time helpers, and the existing academic attendance helper. No dependencies, generic copies, new stores, or backend services were added.

## StudentCourseCard

One component renders every card using a derived course view model. It is read-only and offers no edit, delete, section change, syllabus download, or instructor-contact action. The screenshot's options menu is omitted because no supported action exists. Course descriptions are omitted because no description source exists.

## Routing

`/student/courses` is nested under the existing Student-only guard and StudentLayout. My Courses is active in the shared sidebar. Dashboard View All Courses uses a React Router Link to this route. The shared breadcrumb reads Dashboard / Courses. View Profile returns to `/student/dashboard` and focuses its profile summary. Dark Mode and Sign Out reuse existing actions.

## Persistence

Existing centralized persistence is unchanged. Student subjects, timetable, faculty, attendance, and session data continue using their existing slices. Empty enrollments remain empty after hydration; selectors do not seed records. Browser refresh retained the linked Student session, three course cards, and dark theme.

## Responsive Behavior

Three columns above 1200px, two at tablet widths, one below 700px. Cards and info rows wrap naturally; long titles/locations cannot force page overflow. Desktop (1600×724), tablet (1024×768), and mobile (390×844) were inspected. No document or main horizontal overflow was observed. Dark surfaces, borders, semantic accents, and text were visually checked.

## Files Created

- `frontend/src/Users/Student/pages/Courses/StudentCourses.jsx`
- `frontend/src/Users/Student/pages/Courses/StudentCourses.css`
- `frontend/src/Users/Student/components/StudentCourseCard.jsx`
- `frontend/src/store/selectors/studentCourses.js`
- `frontend/src/store/selectors/studentCourses.test.js`
- `docs/student-my-courses.md`
- `docs/student-module-structure.md` completes the accompanying Dashboard/module documentation.

## Files Modified

- `frontend/src/App.jsx` — protected Courses route.
- `frontend/src/Users/Student/index.js` and `navigation.jsx` — export/navigation.
- `frontend/src/Users/Student/StudentLayout.jsx` — route-aware breadcrumb and profile navigation.
- `frontend/src/Users/Student/Student.css` — shared search input background scoped to Student.
- `frontend/src/Users/Student/pages/Dashboard/StudentDashboard.jsx` and its CSS — working View All Courses link.
- `frontend/src/store/selectors/studentDashboard.js` — shared attendance-summary helper.
- `frontend/src/components/common/Header.jsx` — optional breadcrumb label and correct profile-menu focus handling; Admin defaults retained.

No Admin module, Teacher implementation, backend, landing-ui, global theme, Redux store, or persistence implementation changes.

## Verification

- Production build: PASS.
- Lint: PASS with the same three pre-existing shared Fast Refresh export warnings.
- 12 combined Course, Dashboard, authentication, and validation tests passed; `git diff --check` passed.
- Course selector tests: card/count synchronization, no cross-section/alias guessing, timetable/faculty updates, per-course attendance isolation, invalid schedule fallbacks, and empty/unlinked/refresh behavior.
- Dashboard/auth tests: student identity, data synchronization, attendance policy, persistence, and session behavior.
- Browser: Student login, active My Courses navigation, Dashboard link, correct breadcrumb, View Profile navigation/focus, three/two/one-column layout, dark mode, reload, menu logout, unauthenticated access redirect, and unlinked-account empty state passed.
- No application runtime errors or unhandled rejections were observed in instrumented flows. The development server was restarted after its prior session ended; this was a test-environment interruption, not an application error.

## Pending Backend/Data Requirements

Course IDs/catalog, credit hours, descriptions, per-course enrollment sections, stable faculty references, attendance records, and attendance weighting rules must come from a defined shared academic source. Missing values remain explicit. No backend integration or new academic contracts were fabricated.
