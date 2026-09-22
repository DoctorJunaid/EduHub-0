# School Result Card Assessment Filter Requirements

## 1. Purpose

The School Result Card must clearly identify which assessment result is currently displayed. Students and parents must never have to guess whether the visible marks belong to a monthly test, homework assignment, quiz, mid-term examination, or final annual examination.

The module must provide one authoritative assessment filter, one visible active-selection indicator, and a transparent breakdown of internal assessment marks versus main written examination marks.

## 2. Functional Requirement: Assessment Type Filter

### FR-01: Assessment selector

The Result Card page shall display a prominent selector labeled:

**Select Assessment Type**

The selector shall appear in the page header near the `Download Result Card (PDF)` action. It must be visible without scrolling on desktop and must move below the page title on mobile.

### FR-02: Required assessment options

The selector shall support the following school assessment categories:

1. **Monthly Class Tests**
   - The option shall allow a month-specific child selection, such as:
     - Monthly Class Tests - August
     - Monthly Class Tests - September
     - Monthly Class Tests - October
2. **Home Assignments & Quizzes**
3. **Mid-Term Examination**
4. **Final Annual Examination**

The school may configure additional assessment labels, but the four required categories must remain supported. Labels must use school language and must not use CGPA, GPA, credits, semester, transcript, or university terminology.

### FR-03: Assessment option data contract

Each selectable assessment shall be represented by an authorized record containing:

```text
id
label
assessmentType
academicSession
month (optional)
examDate or dateRange (optional)
published
status
subjectResults
```

Allowed `assessmentType` values should include:

```text
monthly_test
assignment_quiz
mid_term
final_annual
```

The server must return only assessments published for the authenticated student or an explicitly linked parent/guardian account.

### FR-04: Default selection

When the page opens:

- Select the latest published assessment for the current academic session.
- If a final annual examination is published, it may be configured as the default.
- Otherwise select the most recent published assessment by publication date.
- If no assessment is published, show `No published assessment` and disable the result download action.

The frontend must not select an assessment by guessing from a legacy semester field.

### FR-05: Filter change behavior

When the user changes the selector, the page shall refresh all assessment-dependent content as one consistent view:

- Active assessment banner.
- Student result identity context.
- Total marks summary.
- Percentage summary.
- Overall grade summary.
- Class position summary, when published for that assessment.
- Subject rows.
- Internal assessment marks.
- Main written examination marks.
- Teacher remarks.
- Final result status.
- PDF download content.

The page must not mix rows or summary values from two different assessments. During loading, the previous result must either be cleared or visibly labeled as the previous selection.

### FR-06: Monthly test selection

When `Monthly Class Tests` is selected, the UI shall expose a secondary month selector or grouped month options. The user must be able to choose a specific published month, for example `August` or `September`.

The active selection must identify both the category and month:

`Monthly Class Tests - August`

A generic `Monthly Class Tests` label without the selected month is insufficient when more than one monthly test exists.

### FR-07: Unpublished and unavailable assessments

- Unpublished assessments must not appear in the selector.
- Withdrawn or archived assessments must not be selectable for new views.
- If an assessment becomes unavailable while open, show a clear notice and return to the latest valid published selection.
- If a selected assessment has no subject result rows, show an assessment-specific empty state rather than a generic academic-history message.

## 3. Functional Requirement: Active Assessment Indicator

### FR-08: Active assessment banner

Immediately below the page header and selector, the page shall display a clear banner or compact information card showing the active selection.

Required format:

**Currently Viewing: Mid-Term Examination (Session 2025-2026)**

Examples:

- `Currently Viewing: Monthly Class Tests - August (Session 2025-2026)`
- `Currently Viewing: Home Assignments & Quizzes (Session 2025-2026)`
- `Currently Viewing: Final Annual Examination (Session 2025-2026)`

### FR-09: Banner content

The active assessment banner shall show:

- Fixed prefix: `Currently Viewing:`.
- Assessment label.
- Academic session.
- Optional assessment date or date range.
- Optional publication status, such as `Published`.

The banner must not show legacy terms such as Semester, GPA, Grade Point, CGPA, or Credits.

### FR-10: Banner synchronization

The banner must update immediately after a successful assessment selection. It must not update before the selected assessment data has been loaded unless a loading state clearly indicates that the new assessment is being fetched.

The banner text must match the title and assessment metadata included in the downloaded PDF.

## 4. Functional Requirement: Marks Source Breakdown

### FR-11: Assessment components

Each subject result shall support separate marks for:

- Internal Assessment: assignments, class tests, quizzes, projects, and other school-configured continuous assessment.
- Main Written Examination: the written mid-term or final examination component.

A result record shall support the following structure:

```text
studentId
assessmentId
subjectId
subjectName
internalAssessment
  marksObtained
  totalMarks
  components (optional)
writtenExam
  marksObtained
  totalMarks
finalMarks
  marksObtained
  totalMarks
letterGrade
teacherRemarks
published
```

### FR-12: Internal assessment component details

When component details are available, the UI may show a compact breakdown such as:

```text
Internal Assessment: 35 / 40
  Class Tests: 20 / 20
  Assignments & Quizzes: 15 / 20
```

Component details must be read-only for students and parents. The school controls the component names and maximum marks.

### FR-13: Written examination component details

The UI shall show the main written examination component separately:

```text
Written Exam: 45 / 60
```

For a Monthly Class Test or Home Assignment assessment that has no written examination component, display:

`Written Exam: Not applicable`

Do not display a fabricated zero for a component that does not apply.

### FR-14: Five-column table compatibility

The Result Card shall retain exactly five visible top-level table columns:

1. Subject
2. Total Marks
3. Marks Obtained
4. Letter Grade
5. Teacher Remarks

The internal-versus-written breakdown shall appear inside the `Total Marks` and `Marks Obtained` cells as accessible sub-lines or an expandable row detail. It must not introduce GPA, credits, semester, or extra university columns.

Example row presentation:

| Subject     | Total Marks                           | Marks Obtained                       | Letter Grade | Teacher Remarks |
| ----------- | ------------------------------------- | ------------------------------------ | ------------ | --------------- |
| Mathematics | Internal: 40; Written: 60; Total: 100 | Internal: 35; Written: 45; Total: 80 | A            | Good progress   |

The visible cell labels must be short and consistent. On narrow screens, the breakdown may stack vertically:

```text
Internal 35 / 40
Written 45 / 60
Total 80 / 100
```

### FR-15: Total calculation

For each subject:

```text
Subject Total Obtained = Internal Marks Obtained + Written Marks Obtained
Subject Maximum Marks = Internal Maximum Marks + Written Maximum Marks
```

For the selected assessment:

```text
Assessment Total Obtained = sum(subject total obtained)
Assessment Maximum Marks = sum(subject maximum marks)
Percentage = Assessment Total Obtained / Assessment Maximum Marks * 100
```

The calculation must include only published components. If the school configures a partial-result policy, the UI must show `Partial Result` and apply that policy consistently to the summary, table, and PDF.

### FR-16: Missing component handling

- Missing internal marks: show `Internal: Not published`.
- Missing written marks: show `Written: Not published`.
- Non-applicable written exam: show `Written: Not applicable`.
- Missing total marks: show `Total: Not published`.
- Valid zero marks: show `0`, not `Not published`.
- If required component data prevents a reliable percentage, show `Percentage unavailable` rather than guessing.

## 5. Summary Cards for the Active Assessment

The summary strip shall represent only the currently selected assessment and shall show:

1. **Total Marks Obtained**
   - Example: `400 / 500`.
2. **Overall Percentage**
   - Example: `80%`.
3. **Overall Grade**
   - Example: `Grade A`.
4. **Class Position**
   - Example: `3rd Position`, only when published.

Changing the assessment type must replace all four values. A result from August must never remain visible after the banner changes to Mid-Term Examination.

## 6. PDF Requirements

The `Download Result Card (PDF)` action shall download the currently selected assessment only.

The PDF must include:

- Student name, class, section, and roll number.
- Academic session.
- Exact active assessment label.
- Active assessment date or month when available.
- Four summary metrics.
- The five-column subject table.
- Internal Assessment and Written Exam sub-breakdowns inside the marks cells.
- Teacher remarks.
- Final result status where published.

The PDF must not contain:

- CGPA.
- GPA or Grade Point.
- Credits.
- Semester.
- Official Transcript terminology.
- Data from another assessment type.
- Draft or unpublished remarks.

## 7. Loading, Empty, and Error States

### Loading

Show a loading state that names the selected assessment category, for example:

`Loading Mid-Term Examination results...`

### No published result

Show:

`No published results are available for this assessment.`

### No monthly result for selected month

Show:

`No published Monthly Class Test results are available for September.`

### Load failure

Show:

`We could not load this assessment result. Please try again.`

### Unauthorized or unavailable result

Do not reveal whether another student has results. Show:

`This assessment result is not available for your account.`

## 8. Authorization and Data Isolation

- Students may view only their own published assessment results.
- Parents/guardians may view only results for explicitly linked children.
- The assessment ID and student ID must be authorized server-side.
- Frontend dropdown filtering is not a security boundary.
- A changed selector must never permit access to an unpublished or unauthorized assessment.
- PDF authorization must use the same student, parent relationship, assessment, and publication checks as the web page.

## 9. Acceptance Criteria

The requirement is complete when:

1. The page has a prominent selector titled `Select Assessment Type`.
2. The selector supports Monthly Class Tests with month selection, Home Assignments & Quizzes, Mid-Term Examination, and Final Annual Examination.
3. The page displays `Currently Viewing: [Assessment] (Session [Year])` for the active selection.
4. Changing the selector refreshes the banner, four summary cards, subject rows, marks breakdown, remarks, final status, and PDF data together.
5. Each subject exposes Internal Assessment and Written Exam marks, or an explicit Not Applicable/Not Published state.
6. The visible table retains exactly five top-level columns: Subject, Total Marks, Marks Obtained, Letter Grade, and Teacher Remarks.
7. No university terminology or GPA/credit data appears in the page, table, empty states, or PDF.
8. Valid zero marks remain distinguishable from missing marks.
9. Unpublished or unauthorized assessments are not selectable or downloadable.
10. Desktop, tablet, mobile, keyboard, and screen-reader behavior remains usable without page-level horizontal overflow.
