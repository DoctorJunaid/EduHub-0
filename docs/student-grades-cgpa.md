# Student Academic Results & CGPA

## Feature Location

`frontend/src/Users/Student/pages/Grades/`, at `/student/grades`, through the existing protected Student layout. Grades & CGPA is active; breadcrumb is Dashboard / Results.

## Results Data Source

Existing `results.records` and `selectJoinedResults` supply records joined to students and exams. The Student selector filters by the resolved current student ID and groups by academic year plus semester. Other students and orphan exam references are excluded. Existing application demo results remain labeled by their stored remarks; no new awards were seeded. The current model has no publication or certification state, so the page describes records as recorded exam awards.

## Course/Credit Integration

Subjects and assessment types come from the shared exam relationship; course codes come from result records. Historical results are not restricted to today's enrollments. No course-credit or completion model exists, so credit hours and Completed Credits are unavailable rather than fabricated or summed from exam attempts.

## CGPA Source

The selector directly reuses `selectStudentDashboard().cgpa`, which reads a valid recorded `student.cgpa`. It does not average exam GPAs, convert assignment scores, or invent a credit-weighted formula. With the existing student data this value is unavailable.

## Current Semester

The summary uses the current student's semester and program. The grade sheet initially selects a matching result semester where available, otherwise the latest academic year and semester label. Multiple recorded periods enable the existing native select pattern; selection does not modify results. Academic year is included so equal semester labels cannot mix different years.

## Academic Standing

Standing and percentile data/rules are absent. The summary shows unavailable standing; no Dean's Honor or top-5% claim is assigned to the student. Institutional rules and data remain pending.

## Grade Sheet

The selected period shows subject, assessment type, course code where recorded, score, total marks, stored letter grade, stored GPA, and remarks. Zero scores/GPAs are preserved. No grade mapping, aggregate semester mark, or assignment-to-result conversion is introduced. The screen badge reads `Official Transcript · Demo`, with a visible statement that the report is not institutionally certified.

## Faculty Remarks

Stored remarks are displayed verbatim as React text. Empty remarks show `No remarks`. Existing demo-record remarks are preserved.

## Dashboard CGPA Synchronization

Both views use the same CGPA source. Shared result corrections update the sheet immediately; a result correction alone does not manufacture a new official CGPA. An explicit recorded CGPA update appears in both views.

## Transcript Print Behavior

The existing `lib/print.js` utility prints the selected grade-sheet element into its isolated iframe. The sheet includes student name, roll number, program, academic period, grades, remarks, recorded CGPA, unavailable credits, and the certification limitation. Sidebar, Header, period controls, print button, and decorative icon/badge are excluded. The iframe uses the utility's independent light print styling, unaffected by screen dark mode. Empty/unlinked records disable printing. No PDF dependency, certificate, digital signature, or registrar service was added.

The existing Admin TranscriptDialog was inspected but not reused because it includes student selection and an unweighted average, unlike this current-student CGPA view. Its generic print utility is reused unchanged.

## Future Teacher Integration

Future result entry/publication should update the existing shared Results/Grades model. Students have no write controls. Teacher management and a publication policy are not implemented here.

## Reusable Components

MainLayout, Sidebar, Header, protected routes, SummaryCard, Card, Table, Badge, Button, and printElement are reused. All page styling is scoped; no Admin components or global theme styles changed.

## Persistence

Existing centralized results/student persistence remains unchanged. No component accesses localStorage and no new data collection is created. This is frontend browser-local demo persistence, not server storage.

## Files Created

- `frontend/src/Users/Student/pages/Grades/StudentGrades.jsx`
- `frontend/src/Users/Student/pages/Grades/StudentGrades.css`
- `frontend/src/store/selectors/studentGrades.js`
- `frontend/src/store/selectors/studentGrades.test.js`
- `docs/student-grades-cgpa.md`

## Files Modified

- `frontend/src/App.jsx`
- `frontend/src/Users/Student/index.js`
- `frontend/src/Users/Student/navigation.jsx`
- `frontend/src/Users/Student/StudentLayout.jsx`

Earlier Diary changes are preserved. No Admin, Teacher, backend, or landing-ui files changed for this task.

## Verification

- Build passes. Lint has only the three pre-existing Fast Refresh warnings in Button, Badge, and tabs.
- Seven Grades/Dashboard tests pass: student isolation, orphan exclusion, academic-period grouping, zero values, shared result corrections, CGPA synchronization without averaging, empty/unlinked behavior, and persistence restoration.
- Isolated browser verified existing demo results, period switching, unavailable CGPA/credits/standing, unlinked empty state and disabled printing.
- Print-button test intercepted the browser print call and inspected the generated iframe: correct selected period and identity, no shell, readable independent print colors. No physical printer output was claimed.
- Desktop light/dark and 390px mobile views checked; no document overflow, one-column mobile summaries, table scrolling confined to its container.

## Pending Backend/Data Requirements

Official published-result status, course credits/completion records, approved cumulative-GPA rules or recorded values, academic standing, and certified transcripts remain pending. No result APIs, registrar endpoints, or academic policies were invented.
