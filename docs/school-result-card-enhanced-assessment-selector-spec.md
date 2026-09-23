# School Result Card: Enhanced Assessment Selector

## Developer Functional and UI Specification

## 1. Objective

The Student Terminal Progress Report must make the active assessment unmistakable. A student or parent must always know whether the displayed marks belong to a monthly class test, homework/assignment evaluation, mid-term examination, or final annual examination.

The selected assessment is the single source of truth for the result card. It controls the active badge, summary cards, subject rows, marks breakdown, teacher remarks, final status, and PDF output.

This specification applies to Class 1 through Class 10 and uses school terminology only.

## 2. Required UI Structure

The page shall render the following order:

1. Page header and student identity.
2. Prominent assessment selector at the top.
3. Download PDF Report Card action.
4. Result card container.
5. Active View badge inside the result card container.
6. Four school summary cards.
7. Six-column marks breakdown table.
8. Final result status and signature placeholders.

## 3. Step-by-Step Implementation Requirements

### Step 1: Page header

Render:

- H1: `Student Terminal Progress Report`.
- Student name.
- Class and section, for example `Class 9-B`.
- Roll number.
- Academic session, for example `Session 2025-2026`.
- Primary action button: `Download PDF Report Card`.

Remove or prohibit:

- CGPA.
- Completed Credits.
- Semester.
- Grade Point.
- GPA.
- Transcript language.

The header must remain compact, but the assessment selector must receive stronger visual priority than secondary metadata.

### Step 2: Prominent assessment selector

Replace the current `Exam Term` selector label with:

**Select Assessment Type:**

Place the selector in the top header area, adjacent to or directly below the page title and above the result card. It must be visually larger than a normal inline select:

- Minimum control height: 44px on desktop.
- Minimum control height: 44px on mobile.
- Visible label above or immediately before the control.
- Clear border and focus state.
- Width sufficient to display the longest option without truncation.
- Full width or stacked layout on narrow screens.

The selector is mandatory. It must not be hidden just because there is only one currently published option.

### Step 3: Assessment options

The selector shall expose these options:

```text
Monthly Class Tests
  August Test
  September Test
  October Test

Homework & Assignment Evaluations

Mid-Term Examination

Final Term / Annual Examination
```

Implementation options:

- Use grouped native `<optgroup>` options for monthly tests; or
- Use a primary category select followed by a month select when `Monthly Class Tests` is selected.

The preferred accessible implementation is a category select plus a month select because it makes the selected category and month independently readable to keyboard and screen-reader users.

Normalized option data:

```js
{
  id: "mid-term-2025-2026",
  category: "mid_term",
  label: "Mid-Term Examination",
  month: null,
  academicSession: "2025-2026",
  published: true
}
```

Monthly example:

```js
{
  id: "monthly-august-2025-2026",
  category: "monthly_test",
  label: "August Test",
  month: "August",
  academicSession: "2025-2026",
  published: true
}
```

Only published and authorized assessments may be returned to the client.

### Step 4: Selection lifecycle

On page load:

1. Fetch or read the published assessments for the authenticated student.
2. Select the latest published assessment for the current academic session.
3. Populate the selector with only valid options.
4. Fetch the selected assessment result.
5. Render the active badge, summary cards, table, and final status from that same result object.

On selection change:

1. Store the selected assessment ID.
2. Clear or skeletonize assessment-dependent content.
3. Show a loading indicator associated with the new assessment label.
4. Fetch the selected assessment result.
5. Replace the page data atomically.
6. Update the Active View badge only after the result has loaded successfully.
7. Enable PDF download only when the selected result is published and available.

The implementation must never combine the previous assessment's summary with the newly selected assessment's table.

### Step 5: Active View badge inside result card

Inside the result card container, directly below the card heading and before the summary cards or marks table, render a dynamic sub-header badge.

Required format:

```text
Active View: Mid-Term Examination | Academic Session 2025-2026
```

Required examples:

```text
Active View: August Test | Academic Session 2025-2026
Active View: Homework & Assignment Evaluations | Academic Session 2025-2026
Active View: Mid-Term Examination | Academic Session 2025-2026
Active View: Final Term / Annual Examination | Academic Session 2025-2026
```

The badge must:

- Use the exact selected assessment label.
- Show the academic session from the assessment record.
- Be visually prominent enough to identify the current view at a glance.
- Remain visible when the user scrolls the result table, where practical.
- Update after successful selection loading.
- Be included in the PDF result card.
- Never display CGPA, credits, semester, or GPA terminology.

### Step 6: School summary cards

Below the Active View badge, show four cards for the selected assessment:

- `Total Marks Obtained`, example `400 / 500`.
- `Overall Percentage`, example `80%`.
- `Overall Grade`, example `Grade A`.
- `Class Position`, example `3rd Position`.

These values must be recalculated or loaded for the active assessment only. If class position is not published, show `Not published`.

### Step 7: Detailed marks table

The table shall contain exactly six visible columns with these labels and order:

| Order | Required label          | Purpose                                                      |
| ----: | ----------------------- | ------------------------------------------------------------ |
|     1 | Subject                 | School subject name, such as Mathematics or Science          |
|     2 | Class Work / Test Marks | Internal class work, test, quiz, or monthly assessment marks |
|     3 | Exam Marks              | Main written examination marks                               |
|     4 | Total Marks Obtained    | Combined obtained marks and maximum, such as `88 / 100`      |
|     5 | Grade                   | Subject letter grade, such as A+, A, B, C, or F              |
|     6 | Teacher Remarks         | Published remarks for the selected assessment                |

Example row:

```text
Subject       Class Work / Test Marks   Exam Marks   Total Marks Obtained   Grade   Teacher Remarks
Mathematics   18 / 20                   70 / 80      88 / 100               A+      Excellent work
```

Column behavior:

- `Class Work / Test Marks` displays internal marks such as assignments, quizzes, class work, or tests.
- `Exam Marks` displays main written paper marks.
- `Total Marks Obtained` displays combined marks, not only the written paper score.
- `Grade` displays the configured school subject grade.
- `Teacher Remarks` displays only published remarks tied to the selected assessment.
- Use `Not applicable` when a component does not belong to the selected assessment.
- Use `Not published` when a component is expected but has not been released.
- Display a valid zero as `0`.

### Step 8: Assessment-specific marks rules

#### Monthly Class Tests

- Class Work / Test Marks: selected monthly test score.
- Exam Marks: `Not applicable` unless configured.
- Total Marks Obtained: monthly test total.
- Grade and remarks: selected monthly test values only.

#### Homework & Assignment Evaluations

- Class Work / Test Marks: assignment, homework, or quiz score where configured.
- Exam Marks: `Not applicable`.
- Total Marks Obtained: published assignment evaluation total.
- Grade and remarks: selected assignment evaluation values only.

#### Mid-Term Examination

- Class Work / Test Marks: internal assessment score, for example `18 / 20`.
- Exam Marks: written paper score, for example `70 / 80`.
- Total Marks Obtained: `88 / 100`.
- Grade and remarks: mid-term values only.

#### Final Term / Annual Examination

- Class Work / Test Marks: annual internal assessment score.
- Exam Marks: final written examination score.
- Total Marks Obtained: combined annual total.
- Grade and remarks: final annual values only.

### Step 9: Final result section

Below the table, render:

- `Final Result Status`: Passed, Promoted, Retest, or Not Published.
- `Class Teacher Signature` placeholder.
- `Principal Signature` placeholder.

The final status must belong to the active assessment. It must not be a global student status reused across all assessment types.

### Step 10: PDF behavior

`Download PDF Report Card` must export the currently active assessment.

The PDF must include:

- Student identity.
- Class and section.
- Roll number.
- Academic session.
- Active View badge text.
- Four summary metrics.
- Exact six-column marks table.
- Final result status.
- Signature placeholders or configured signatures.

The PDF must exclude CGPA, Completed Credits, Semester, Grade Point, GPA, transcript labels, and data from other assessment categories.

## 4. Data Contract

### Assessment record

```text
id
category
label
academicSession
month (optional)
published
publishedAt
resultStatus (optional)
classPosition (optional)
subjects[]
```

### Subject result record

```text
subjectId
subjectName
classWorkTestMarks (optional)
classWorkTestTotal (optional)
examMarks (optional)
examTotal (optional)
totalMarksObtained
totalMarks
grade
teacherRemarks
published
```

### Calculation rules

```text
Total Marks Obtained = Class Work / Test Marks + Exam Marks
Total Maximum Marks = Class Work / Test Total + Exam Total
Percentage = Total Marks Obtained / Total Maximum Marks * 100
```

For non-examination categories, exclude the non-applicable component rather than treating it as zero. If required values are missing, show an unavailable state instead of calculating a misleading percentage.

## 5. UI States

| State                           | UI behavior                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| Published assessments available | Select latest published option and render its result.                   |
| No published assessments        | Selector disabled with `No published assessment`; PDF disabled.         |
| Selection loading               | Show loading indicator and prevent stale data from appearing unlabeled. |
| No results for selection        | Show `No published results for this assessment.`                        |
| Partial result                  | Show `Partial Result` and identify missing subjects/components.         |
| Unauthorized assessment         | Do not expose whether another student's result exists.                  |
| PDF failure                     | Keep the selected view and show a retryable download error.             |
| Valid zero                      | Show `0`, not `Not published`.                                          |

## 6. Accessibility and Responsive Requirements

- The selector must have an accessible label exactly matching `Select Assessment Type:`.
- The active badge must be announced as a status or heading when the selection changes.
- Keyboard users must be able to select categories, select monthly options, and download the report.
- The selector must have a visible focus ring.
- Desktop: selector is prominent in the top header row.
- Tablet: selector may wrap below the title without overlapping the PDF action.
- Mobile: selector is full width and appears before the result card.
- Table scrolling is contained within the table wrapper; the page must not overflow horizontally.
- Status must not rely on color alone.

## 7. Acceptance Criteria

1. The old `Exam Term` label is replaced by `Select Assessment Type:`.
2. The selector visibly supports Monthly Class Tests with August, September, and October options.
3. The selector supports Homework & Assignment Evaluations, Mid-Term Examination, and Final Term / Annual Examination.
4. The selector is visually prominent and appears at the top of the page.
5. The result card contains an Active View badge in the required format.
6. Changing the selector updates the badge, summary cards, table, remarks, status, and PDF together.
7. The result table contains exactly six columns with the required labels.
8. Class Work / Test Marks and Exam Marks remain separate for applicable assessments.
9. No CGPA, Completed Credits, Semester, Grade Point, or GPA appears anywhere in the result card or PDF.
10. The design works on desktop, tablet, and mobile without page-level horizontal overflow.
