# School Result Card: Assessment Category UI Specification

## 1. Objective

Redesign the Student Result Card so a student or parent can immediately identify which assessment is being viewed. The selected assessment category must control the page title context, active badge, marks breakdown, summary values, teacher remarks, and downloaded result card.

The interface is for Class 1 to Class 10 school learners. It must use school assessment language and must not expose university academic concepts.

## 2. Strict Exclusions

The following items must be completely removed from the page, table, empty states, badges, PDF, and accessible labels:

- CGPA
- Completed Credits
- Semester
- Grade Point
- GPA
- Credit hours
- Transcript terminology
- University-style course terminology

The result page must use `Subject`, `Assessment Category`, `Academic Session`, `Marks`, `Grade`, and `Teacher Remarks`.

## 3. Step-by-Step UI Specification

### Step 1: Page header

Display:

- Page title: `Student Terminal Progress Report`.
- Optional supporting text: `View marks and teacher remarks for each school assessment.`
- Student identity: Name, Class & Section, Roll Number, and Academic Session.
- Primary action: `Download PDF Report Card`.

The identity must remain tied to the authenticated student or linked parent account.

### Step 2: Mandatory assessment category selector

Place a prominent dropdown directly in the header area. The visible label must be:

**Select Assessment Category**

Required options:

```text
Monthly Class Tests
  - August Test
  - September Test
  - October Test
Assignments & Homework Marks
Mid-Term Examination
Final Annual Examination
```

The month-specific options may be implemented as grouped options or as a second month selector that appears after `Monthly Class Tests` is selected.

The dropdown must:

- Show only published assessments available to the current student.
- Default to the latest published assessment.
- Preserve the selected option while the result is loaded.
- Show a loading state during assessment changes.
- Refresh all marks, grades, remarks, totals, and summary data together.
- Never mix rows from different assessments.
- Disable PDF download when no published assessment is selected.

### Step 3: Active exam information badge

Place an active information badge immediately below the page title and selector, before the summary cards.

Required format:

```text
Currently Viewing: Mid-Term Examination | Session 2025-2026
```

Examples:

```text
Currently Viewing: August Test | Session 2025-2026
Currently Viewing: Assignments & Homework Marks | Session 2025-2026
Currently Viewing: Mid-Term Examination | Session 2025-2026
Currently Viewing: Final Annual Examination | Session 2025-2026
```

The badge must update only after the selected assessment data has loaded successfully. It must contain the exact label used in the result table and PDF.

### Step 4: Summary cards

Show four compact school-only summary cards for the active assessment:

1. `Total Marks Obtained`, for example `400 / 500`.
2. `Overall Percentage`, for example `80%`.
3. `Overall Grade`, for example `Grade A`.
4. `Class Position`, for example `3rd Position`.

The cards must not show CGPA, credits, semester, or GPA. If a value is unavailable, show `Not published` rather than an invented number.

### Step 5: Detailed marks breakdown table

Render exactly six visible columns:

|   # | Column                      | Example                 |
| --: | --------------------------- | ----------------------- |
|   1 | Subject Name                | Mathematics             |
|   2 | Class Test / Quiz Weightage | 18 / 20                 |
|   3 | Main Written Exam Marks     | 70 / 80                 |
|   4 | Total Marks Obtained        | 88 / 100                |
|   5 | Subject Grade               | A+                      |
|   6 | Teacher Remarks             | Excellent understanding |

Column rules:

- `Subject Name` contains the school subject only.
- `Class Test / Quiz Weightage` contains internal assessment marks. For an assessment where this component does not apply, show `Not applicable`.
- `Main Written Exam Marks` contains written exam marks. For assignments or monthly tests without a written component, show `Not applicable` or the configured component label.
- `Total Marks Obtained` shows the combined result, for example `88 / 100`.
- `Subject Grade` shows the configured letter grade such as A+, A, B, C, or F.
- `Teacher Remarks` shows only published remarks for the selected assessment.

The table must not include GPA, grade point, credits, semester, course code, or faculty remarks columns.

### Step 6: Assessment-specific breakdown behavior

#### Monthly Class Tests

For `August Test`:

- Class Test / Quiz Weightage: marks from the August class test or quiz component.
- Main Written Exam Marks: `Not applicable` unless the school configured a written component.
- Total Marks Obtained: the published August assessment total.
- Teacher remarks: August assessment remarks only.

#### Assignments & Homework Marks

- Class Test / Quiz Weightage: `Not applicable` unless the school includes quizzes in this category.
- Main Written Exam Marks: `Not applicable`.
- Total Marks Obtained: assignment/homework marks according to the configured maximum.
- Teacher remarks: assignment feedback or teacher remarks only.

#### Mid-Term Examination

- Class Test / Quiz Weightage: internal assessment marks, for example `18 / 20`.
- Main Written Exam Marks: written paper marks, for example `70 / 80`.
- Total Marks Obtained: combined value, for example `88 / 100`.
- Teacher remarks: mid-term remarks only.

#### Final Annual Examination

- Class Test / Quiz Weightage: annual internal assessment marks.
- Main Written Exam Marks: final written examination marks.
- Total Marks Obtained: combined annual result.
- Teacher remarks: final annual remarks only.

### Step 7: Result footer

Below the table, display:

- `Final Result Status`: Passed, Promoted, Retest, or Not Published.
- Class Teacher signature placeholder.
- Principal signature placeholder.

These values must belong to the selected assessment. A status from the final exam must not appear while the user is viewing a monthly test.

### Step 8: PDF action

The `Download PDF Report Card` button must download the currently selected assessment only.

The PDF must contain:

- Student name, class/section, roll number, and session.
- Selected assessment name.
- Active badge text.
- Four summary metrics.
- The exact six-column marks breakdown.
- Final result status.
- Signature placeholders or configured signatures.

The PDF must not contain CGPA, credits, semester, GPA, or grade point fields.

## 4. Functional Data Requirements

### Assessment object

```text
id
category
name
academicSession
published
publishedAt
subjects[]
resultStatus
classPosition (optional)
```

### Subject assessment result

```text
subjectId
subjectName
classTestQuizMarks (optional)
classTestQuizTotal (optional)
writtenExamMarks (optional)
writtenExamTotal (optional)
totalMarksObtained
totalMarks
letterGrade
teacherRemarks
```

### Calculations

```text
Total Marks Obtained = classTestQuizMarks + writtenExamMarks
Total Maximum Marks = classTestQuizTotal + writtenExamTotal
Percentage = Total Marks Obtained / Total Maximum Marks * 100
```

For categories where one component is not applicable, exclude that component from the calculation and label it `Not applicable`. Missing published data must not be converted to zero.

## 5. Interaction and State Rules

| State                           | Required behavior                                                 |
| ------------------------------- | ----------------------------------------------------------------- |
| Initial load                    | Select latest published assessment and show its badge/results.    |
| Assessment changed              | Show loading state, then replace all page data atomically.        |
| No published assessments        | Show `No published assessment available` and disable download.    |
| No rows for selected assessment | Show `No subject results are published for this assessment.`      |
| Partial result                  | Show `Partial Result` and identify missing subjects/components.   |
| Failed load                     | Show retry action and do not retain an unlabeled previous result. |
| Unauthorized assessment         | Do not reveal whether another student's result exists.            |
| Valid zero marks                | Display `0` as a real mark.                                       |
| Missing mark                    | Display `Not published`, not `0`.                                 |

## 6. Markdown Visual Mockups

### 6.1 Mid-Term Examination selected

```text
+--------------------------------------------------------------------------------+
| Student Terminal Progress Report                     [Download PDF Report Card] |
| KHAN MH  |  Class 9-B  |  Roll No. 18  |  Session 2025-2026                  |
|                                                                                |
| Select Assessment Category                                                     |
| [ Mid-Term Examination v ]                                                     |
|                                                                                |
| [ Currently Viewing: Mid-Term Examination | Session 2025-2026 ]                |
|                                                                                |
| [ TOTAL MARKS ] [ PERCENTAGE ] [ OVERALL GRADE ] [ CLASS POSITION ]             |
| [   440 / 500 ] [    88%   ] [   Grade A   ] [   3rd Position ]                |
|                                                                                |
| Subject       | Class Test / Quiz | Main Written | Total Marks | Grade | Remarks |
|---------------|-------------------|--------------|-------------|-------|---------|
| Mathematics   | 18 / 20           | 70 / 80      | 88 / 100    | A+    | Excellent|
| English       | 17 / 20           | 66 / 80      | 83 / 100    | A     | Good    |
| Science       | 19 / 20           | 72 / 80      | 91 / 100    | A+    | Strong  |
|                                                                                |
| Final Result Status: Passed                                                    |
| ____________________ Class Teacher        ____________________ Principal       |
+--------------------------------------------------------------------------------+
```

### 6.2 Assignment and homework marks selected

```text
+--------------------------------------------------------------------------------+
| Student Terminal Progress Report                     [Download PDF Report Card] |
| KHAN MH  |  Class 9-B  |  Roll No. 18  |  Session 2025-2026                  |
|                                                                                |
| Select Assessment Category                                                     |
| [ Assignments & Homework Marks v ]                                             |
|                                                                                |
| [ Currently Viewing: Assignments & Homework Marks | Session 2025-2026 ]         |
|                                                                                |
| Subject       | Class Test / Quiz | Main Written | Total Marks | Grade | Remarks |
|---------------|-------------------|--------------|-------------|-------|---------|
| Mathematics   | Not applicable    | Not applicable| 18 / 20    | A     | Complete|
| English       | Not applicable    | Not applicable| 16 / 20    | B+    | Improve |
| Science       | 9 / 10            | Not applicable| 9 / 10     | A     | Good    |
|                                                                                |
| Final Result Status: Published                                                 |
| ____________________ Class Teacher        ____________________ Principal       |
+--------------------------------------------------------------------------------+
```

### 6.3 Final Annual Examination selected

```text
+--------------------------------------------------------------------------------+
| Student Terminal Progress Report                     [Download PDF Report Card] |
| KHAN MH  |  Class 9-B  |  Roll No. 18  |  Session 2025-2026                  |
|                                                                                |
| Select Assessment Category                                                     |
| [ Final Annual Examination v ]                                                 |
|                                                                                |
| [ Currently Viewing: Final Annual Examination | Session 2025-2026 ]             |
|                                                                                |
| Subject       | Class Test / Quiz | Main Written | Total Marks | Grade | Remarks |
|---------------|-------------------|--------------|-------------|-------|---------|
| Mathematics   | 19 / 20           | 74 / 80      | 93 / 100    | A+    | Excellent|
| English       | 18 / 20           | 68 / 80      | 86 / 100    | A     | Very good|
| Science       | 20 / 20           | 76 / 80      | 96 / 100    | A+    | Outstanding|
|                                                                                |
| Final Result Status: Promoted                                                 |
| ____________________ Class Teacher        ____________________ Principal       |
+--------------------------------------------------------------------------------+
```

## 7. Acceptance Criteria

1. The page visibly contains `Select Assessment Category`.
2. The dropdown supports Monthly Class Tests, month-specific tests, Assignments & Homework Marks, Mid-Term Examination, and Final Annual Examination.
3. The active badge appears directly below the title/selector and identifies the selected assessment and academic session.
4. Changing the assessment changes the badge, summaries, table rows, remarks, status, and PDF content together.
5. The marks table has exactly six visible columns defined in this document.
6. Internal/class-test marks and written-exam marks are separately visible for applicable assessments.
7. Non-applicable components are labeled clearly and are not represented as fabricated zero marks.
8. CGPA, Completed Credits, Semester, Grade Point, and GPA are absent from the page and PDF.
9. Students and linked parents cannot select or download unauthorized or unpublished assessments.
10. The design remains readable on desktop, tablet, and mobile without page-level horizontal overflow.
