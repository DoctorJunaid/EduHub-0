# Exam Results & Academic Performance

## Requested Work

### Demo data update

At the user's request, `Results/demoResults.js` now supplies up to 12 illustrative results across four Fall academic periods, using the current student and exam IDs. The existing store seeds them only when the results collection is empty (including a previously saved empty collection), then persists them normally. Existing nonempty results and edits are preserved. Example marks, grades, GPA values, and clearly labeled demo remarks are explicit sample values, not grading rules. Pass Rate and Honor Roll remain unavailable. With fewer available identities, duplicate student/exam/period combinations are omitted. No students or exams are fabricated.

Implemented `/results` inside the Campus Admin MainLayout/Outlet, with result entry/editing, linked analytics, filters, transcripts, CSV export, pagination, activity metadata, and persistence. Shared layout and existing routes remain unchanged. No backend, landing-ui, dependency, or unrelated feature changes were made.

## Reference Screenshot

The supplied screenshot guided the heading and header controls, four summary cards, two chart panels, results filter/table arrangement, transcript actions, pagination, and recent-activity strip. Existing theme tokens, typography, avatars, controls, and shared layout take precedence over differences in screenshot chrome. Real data replaces the screenshot's fixed values. Empty charts/tables and unavailable policy-driven values are explicitly shown; financial statuses and invented academic remarks are omitted.

## Feature Structure

Role-specific files are grouped in `src/Admins/Campus Admin/Results/`. Redux stays under `src/store/`. Generic SVG chart renderers and the browser print helper remain shared. There is one application store and Provider.

## Student Integration

Results reference Students Directory through `studentId`; name, roll number, and initials are joined from current student state. New students appear in the result/transcript selectors. Student edits immediately update the page and transcripts. Results also reference existing Exam Schedules via `examId`; subject and exam date come from that shared dataset. Exam Schedule already reuses timetable-derived subjects. No second student/course/exam database was created.

There is no course-ID/code registry or authoritative academic-year/semester registry. Course code is optional, explicitly entered result metadata. Academic year and semester are entered when recording a result, with suggestions from saved results; filters derive their options from actual records. The selectors always include All rather than hardcoding one example year/semester.

## Result Data Model

`{ id, studentId, examId, courseCode, academicYear, semester, score, totalMarks, grade, gpa, remarks, createdAt, updatedAt }`.

Grade, course code, and remarks may be blank; unknown GPA is null, distinct from numeric zero. Score/total must be finite, total positive, and score between zero and total. GPA is a manually entered finite non-negative number; no maximum or score mapping is invented. Percentage is derived as score/total × 100, with safe handling for missing/invalid totals.

The initial collection is empty because no result data existed. A reusable create/edit ResultForm records actual user-supplied awards. Total marks initially come from the selected exam and remain stored with the result so later exam edits do not silently change a saved score's denominator. Records are unique per student/exam/year/semester; upsert preserves IDs, and conflicting edits are rejected. No destructive result action was introduced.

## Redux Changes

Added `resultsSlice.js`: `resultSaved`, `selectResults`, and memoized `selectJoinedResults`. Filtering and analytics are derived from joined records with memoization in the page. UI state remains local. Unique evaluated students count distinct student IDs, not rows.

## Persistence

The existing helper saves version-1 records under `eduhub_results`. Existing keys/schemas are unchanged. Creation and updates preserve stable IDs and real creation/update timestamps. Invalid JSON, versions, records, duplicate IDs/composite keys, or malformed timestamps safely fall back to an empty result collection. Components never access localStorage directly. Existing unavailable/full-storage behavior is preserved.

Deleted student or exam references remain persisted but cannot be joined into the current display. An archival identity/course snapshot policy requires separate requirements; no cascading deletion was added.

## GPA Rules

There was no GPA scale or mapping. Awarded GPA is entered explicitly and never generated from score or grade. Average GPA is the unweighted arithmetic mean of valid recorded GPA values, including zero and excluding missing values. The UI/transcript labels this clearly; it is not presented as credit-weighted or official cumulative GPA. A fixed 4.00 maximum is not assumed.

## Grade Rules

There were no grade boundaries. Grades are stored as supplied text. Distribution and filter options use actual distinct values without forcing screenshot categories. Missing grades remain a dash and are excluded from the grade-distribution denominator. Grade badges reuse Badge with theme styling; badge colors do not imply an invented ranking or pass rule.

## Summary Cards

- Campus Average GPA: mean of valid GPA values in the current filtered dataset; dash when none exist.
- Students Evaluated: unique students in that same dataset.
- Pass Rate: unavailable (dash), because no pass threshold exists.
- Dean's Honor Roll: unavailable (dash), because no qualification rule exists.

The missing policies are explained below the cards. Comparison percentages and semester deltas are omitted, not fabricated.

## GPA Performance Chart

No chart library existed; the dashboard already used native SVG. Added a small reusable native SVG LineChart without installing dependencies. It plots actual average GPA grouped by academic year/semester, ordered by earliest referenced exam date in each group. It uses an adaptive numeric axis, handles a single period, and provides empty-state text, SVG titles, and screen-reader values. Horizontal scrolling preserves labels when many periods exist. The metric selector shows only the supported Average GPA metric and is disabled while no other metric exists.

## Grade Distribution

Shared native SVG DonutChart derives segments, percentages, counts, and total from graded result records. The center explicitly says Graded results, not students. Legend and SVG titles expose categories and values. A finite repeating theme palette represents categories without defining academic eligibility.

## Search & Filters

Header academic year and semester filters affect the cards, both charts, table, activity, and CSV through the same filtered dataset. The table's Semester selector shares the header's state. Search matches current student name, roll number, and exam subject. Course, grade, and exact recorded GPA filters derive values from actual results. Filters opens a student selector and Clear all filters action; a count on the button signals an active advanced filter. Pagination resets after filtering/page-size changes and clamps to current results.

## Results Table

Shows current student identity, subject/code, semester/year, score and derived percentage, recorded grade/GPA, and stored remarks. Uses Table, Avatar, Badge, Button, DropdownMenu, and Pagination. View Transcript opens the student's transcript; the action menu supports Edit result. Record Result opens the same reusable form in create mode. Empty results are shown explicitly. No result or remark is fabricated.

## Transcript

Both top Generate Transcript and row View Transcript use one TranscriptDialog. It supports selecting a current student and displays their actual results for the header academic year/semester context. Course/grade/search table filters do not silently omit courses from a transcript. It includes scores, grade/GPA values, course codes, and an explicitly unweighted mean GPA. No official transcript certification or CGPA calculation is invented.

The browser-native print helper copies only the transcript sheet into a temporary print frame with readable print CSS. User content stays DOM text rather than HTML interpolation. The frame is removed after print or timeout. CSV export is also available. No PDF dependency or backend API was added.

## Export

Reuses the existing UTF-8 CSV utility and native browser download. Exports all filtered results across pagination, with student name, roll, subject/code, year/semester, score, total, percentage, grade, GPA, and remarks. Existing quoting/formula-cell protection and object-URL cleanup are reused. The top Export menu is functional, not decorative.

## Recent Academic Activity

Shows the latest saved/updated result entries from the current selection, sorted by actual `updatedAt` metadata. Each displays current identity, subject, stored grade, percentage, and the real timestamp. View All expands beyond four entries; clicking an entry opens its edit form. This is latest-change metadata per result, not an immutable audit log. Paid/Pending/Overdue labels were not added.

## Reusable Components Used

MainLayout, Sidebar, Header, Button, Input, Label, Textarea, Card, SummaryCard, Table, Badge, Avatar, Dialog, DropdownMenu, Pagination, timetable dialog/table styles, existing pagination helper, and CSV utility.

## New Reusable Components

- `components/common/charts/LineChart.jsx`
- `components/common/charts/DonutChart.jsx`
- `components/common/charts/charts.css`
- `lib/print.js`: browser-native printing of a selected DOM element.

## Files Created

- `src/Admins/Campus Admin/Results/ExamResults.jsx`
- `src/Admins/Campus Admin/Results/ExamResults.css`
- `src/Admins/Campus Admin/Results/ResultsTable.jsx`
- `src/Admins/Campus Admin/Results/ResultForm.jsx`
- `src/Admins/Campus Admin/Results/TranscriptDialog.jsx`
- `src/Admins/Campus Admin/Results/resultsData.js`
- `src/store/Slices/resultsSlice.js`
- `src/store/Slices/resultsSlice.test.js`
- The shared chart files and print helper listed above.
- `docs/frontend-exam-results-academic-performance.md`

## Files Modified

- `src/App.jsx`: `/results` route.
- `src/constants/navigation.jsx`: Campus Admin Exam Results & GPA entry.
- `src/store/store.js`: results reducer registration.
- `src/store/persistence.js`: result validation and namespaced storage.
- `src/store/persistence.test.js`: results reducer in shared regression setup.

No files were moved or deleted in this task. Prior unrelated working-tree changes, including pending Student Attendance policy choices, were preserved.

## Verification

- Build: PASS (`npm.cmd run build`). Vite reports a main-chunk size warning (about 524 kB minified / 159 kB gzip); no unrelated bundling rewrite was made.
- Node regression suite: PASS, 46 tests. Includes results add/edit across store recreation, stable IDs/activity timestamps, shared student/exam identity edits, safe percentages, GPA averaging, unique evaluated students, period/grade aggregation, combined filters/CSV, duplicate prevention, malformed persistence, and existing feature regressions.
- Lint: successful exit; only the three pre-existing Fast Refresh export warnings in unchanged Button/Badge/Tabs files remain after fixing the new chart warning.
- Vite SSR: empty and populated results pages render with the real store, SVG charts, calculated values, result table, and activity. SVG title rendering was corrected following the runtime check.
- Browser interaction, actual downloads/print dialogs, screenshots, and mobile/dark-mode visual comparison remain unverified; no browser automation tool/package is available. Build/SSR/unit results are not a substitute for those browser checks.
- Backend and landing UI were not modified. No dependency was installed.

## Business Rules Requiring Confirmation

- Pass threshold: absent; no pass rate is calculated.
- GPA mapping/scale and credit-weighted or cumulative GPA: absent; only explicitly entered GPA values and their unweighted mean are displayed.
- Grade boundaries: absent; no grades are derived from scores.
- **Dean's Honor Roll qualification threshold requires business-rule confirmation.**
- Academic period registry/order, archival snapshots, repeated-assessment weighting, and transcript certification require authoritative requirements before expansion.
