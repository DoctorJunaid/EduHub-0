# EduHub School Result Card

## Functional and UI Specification

**Module:** Student Exam Result Card  
**Audience:** Students, parents/guardians, school administrators, teachers, frontend/backend engineers, QA  
**Primary route:** `/student/grades` or the school's configured Progress Report Card route  
**Status:** School-first replacement for the university-style CGPA transcript screen

## 1. Module Objective

Replace the higher-education transcript screen with a simple K-12 result card that helps a student or parent answer four questions immediately:

1. Which exam term is selected?
2. How many marks did the student obtain?
3. What percentage and overall grade did the student achieve?
4. What is the student's class position and subject-wise performance?

The module must use school terminology and must not expose university metrics or transcript language.

## 2. Terminology and Content Rules

### 2.1 Required school terminology

Use these terms consistently:

- Student Exam Result Card
- Terminal Progress Report
- Academic Session
- Exam Term
- 1st Term
- Mid-Term
- Final Exam
- Session 2025-2026
- Subject
- Total Marks
- Marks Obtained
- Percentage
- Letter Grade
- Teacher Remarks
- Class Position
- Download Result Card (PDF)

### 2.2 Prohibited terminology

The following labels, headings, table columns, badges, descriptions, and fallback messages must not appear in the Student Portal Result Card module:

- Cumulative GPA
- CGPA
- Grade Point
- GPA
- Completed Credits
- Credits Not Available
- Current Semester
- Semester
- Official Transcript
- Course-wise transcript
- Faculty evaluation remarks
- Frontend academic report
- Not institutionally certified
- Credit-weighted result

`Subject` is preferred over `Course` in visible school UI. If a legacy table identifier still uses `course`, it must not leak into user-facing text.

## 3. Page Layout

### 3.1 Page header

The page header must contain:

- H1: `Student Exam Result Card`.
- Optional supporting text: `View your published marks and term performance.`
- Term selector aligned to the right on desktop and below the title on smaller screens.
- Primary action: `Download Result Card (PDF)` with a download icon.

Do not display the old subtitle `Semester evaluation breakdown, letter grades, GPA index, and faculty remarks.`

The header must remain compact and follow the Student Portal page rhythm used by Dashboard, Attendance, and Fees:

- Small page padding.
- Tight vertical gap.
- Compact heading typography.
- No marketing copy or technical/legal explanation.

### 3.2 Student identity strip

Below the page header, show the identity context for the selected result:

- Student name.
- Class and section, for example `Class 9 - Section B`.
- Roll number.
- Academic session, for example `Session 2025-2026`.
- Selected exam term.

This strip must use the current authenticated student's record. It must not allow the viewer to select another student.

### 3.3 Summary metric strip

Render exactly four equal summary cards in this order:

1. **Total Marks Obtained**
   - Example: `480 / 600`
   - Indicates obtained marks over maximum marks for the selected term.
2. **Percentage**
   - Example: `80%`
   - Uses the school's configured percentage calculation.
3. **Overall Grade**
   - Example: `Grade A`
   - Uses the school's configured grade scale.
4. **Class Position**
   - Example: `3rd Position`
   - Shows only when the school publishes position data.

Cards must follow the shared compact Student Portal style:

- Equal width.
- Stable height.
- Compact icon and label.
- Small uppercase label or equivalent compact label treatment.
- No rounded floating-card treatment when the shared portal uses a contiguous strip.
- Thin separators between cards.
- Two columns on tablet and one column on mobile.

If a metric is unavailable, show a neutral value such as `Not published` or `—` with a short, plain explanation. Never use a fabricated zero.

## 4. Term Selection

### 4.1 Selector placement

Place the term selector in the page header near the PDF action. On mobile, the selector must wrap below the title and remain full width or comfortably sized.

Label the control `Exam Term` or `Select Exam Term`.

### 4.2 Allowed options

Options are supplied by the school and may include:

- 1st Term
- Mid-Term
- 2nd Term
- Final Exam
- Annual Examination
- Session 2025-2026

The option model should contain:

```text
id
label
academicSession
termType
startDate (optional)
endDate (optional)
published
```

Do not derive an exam term from `semester` or display a legacy semester field.

### 4.3 Selection behavior

- Default to the latest published term for the current academic session.
- If no term is published, show an empty state and disable the PDF action.
- Changing the term refreshes identity context, summary metrics, table rows, remarks, and PDF content together.
- Preserve the selected term during navigation only if the product explicitly supports URL/query persistence.
- Do not show unpublished terms to students or parents.
- If a selected term is withdrawn or becomes unavailable, return to the latest valid published term and show a non-blocking notice.

## 5. Result Table

### 5.1 Required columns

The table must contain exactly these five visible columns, in this order:

| Column          | Meaning                                             |
| --------------- | --------------------------------------------------- |
| Subject         | School subject name, such as Mathematics or English |
| Total Marks     | Maximum marks for the subject                       |
| Marks Obtained  | Marks awarded to the student                        |
| Letter Grade    | School-configured grade, such as A, B, or C         |
| Teacher Remarks | Published subject-specific teacher remark           |

Do not add GPA, grade point, credits, semester, course code, assessment transcript metadata, or faculty evaluation fields.

### 5.2 Table behavior

- Sort rows by the school's configured subject order, not alphabetically unless configured.
- Keep table headers visible while scrolling on long result sets where supported.
- Use an internally scrollable table container on small screens; never create document-level horizontal overflow.
- Align marks numerically and subject/remarks text left.
- Preserve zero marks as `0`; do not confuse them with missing marks.
- Use `Not published` or `—` for missing values according to the school's display policy.
- Wrap long teacher remarks without breaking the table layout.

### 5.3 Row data contract

Each published result row should support:

```text
studentId
examTermId
subjectId
subjectName
totalMarks
marksObtained
letterGrade
teacherRemarks
subjectOrder
publishedAt
```

`studentId` and `examTermId` must be validated server-side. The frontend must not use a subject name alone as an authorization or identity key.

## 6. Calculations and Business Rules

### 6.1 Total marks

```text
Total Marks Obtained = sum(marksObtained for published subject rows)
Maximum Marks = sum(totalMarks for published subject rows)
```

Display format:

```text
{Total Marks Obtained} / {Maximum Marks}
```

Only include rows that are published for the selected term. If one or more required subjects are pending publication, the school may configure either:

- Partial result mode, clearly labeled `Partial Result`; or
- Hold summary metrics until all required subjects are published.

The selected policy must be consistent across web and PDF output.

### 6.2 Percentage

```text
Percentage = (Total Marks Obtained / Maximum Marks) * 100
```

- Round only for display according to school configuration, normally to one or two decimal places.
- Do not calculate a percentage if maximum marks are zero, missing, or incomplete under the school's publication policy.
- A genuine `0%` must remain `0%` when marks are valid and published.

### 6.3 Overall grade

The overall grade must come from the school's configured percentage-to-grade scale or an explicitly recorded school result value.

Example configuration:

| Percentage range | Grade |
| ---------------- | ----- |
| 80-100           | A     |
| 70-79            | B     |
| 60-69            | C     |
| 50-59            | D     |
| Below 50         | E     |

The actual ranges are configurable and must not be hardcoded in the Student Portal UI.

### 6.4 Class position

- Display `3rd Position`, `1st Position`, etc. only when the school has published an authorized position.
- Do not calculate rank in the browser from visible student records.
- Do not expose other students' names, marks, or ranks.
- If position is not published, show `Not published` rather than `N/A` without explanation.

## 7. PDF Result Card

### 7.1 Action

Rename the existing action from `Print Official Transcript` to:

**Download Result Card (PDF)**

Use a download icon and a clear accessible label.

### 7.2 Availability

- Enabled only for a published result card.
- Disabled with an explanation when the selected term has no published results.
- Disabled while the PDF is being generated.
- Re-enable after a failed generation so the user can retry.

### 7.3 PDF content

The PDF must contain:

- School name and logo, if configured.
- Document title: `Student Exam Result Card` or `Terminal Progress Report`.
- Student name.
- Class and section.
- Roll number.
- Academic session.
- Exam term.
- Four summary metrics: total marks, percentage, overall grade, and class position when published.
- The exact five-column result table.
- Teacher remarks.
- Publication date.
- Optional authorized class teacher/principal signature area if provided by the school.

The PDF must not contain:

- CGPA, GPA, grade point, credits, semester, transcript, or certification disclaimer text.
- Other students' data.
- Internal IDs, API metadata, draft remarks, or hidden admin notes.

### 7.4 Download naming

Use a safe, readable filename such as:

```text
EduHub_Result_Card_KHAN_MH_2025-2026_Final-Exam.pdf
```

Sanitize names and term labels before creating the filename.

## 8. Empty, Loading, Error, and Partial States

### Loading

- Show the compact page header and skeletons for the term selector, summary strip, and result table.
- Do not display stale results under a newly selected term while the new term is loading unless the UI explicitly labels them as previous data.

### No published result

Show:

`No published result card is available for this exam term yet.`

Disable PDF download.

### Unlinked student

Show:

`Your result card will appear when your student record is linked.`

Do not show another student's identity or results.

### Partial result

Show a visible, plain label:

`Partial Result - Some subjects are still pending publication.`

Apply the configured partial-result calculation policy consistently.

### Load or download error

Show a recoverable error:

`We could not load this result card. Please try again.`

For PDF failure:

`The result card could not be downloaded. Please try again.`

Do not claim that a file was downloaded when generation or authorization failed.

## 9. Permissions and Data Isolation

### Student

- View only their own published result cards.
- Download only their own published result cards.
- Cannot edit marks, grades, remarks, position, or publication status.

### Parent/Guardian

- View and download published results only for explicitly linked children.
- Child selection may be provided only when multiple linked children exist.
- Changing child must refresh all page data and authorization context.

### Teacher

Teacher entry and publication workflows are outside this Student Portal screen. Teacher remarks shown here must come from the authorized published result record.

### School administrator

School administrators configure terms, grade scales, publication rules, and PDF branding in the admin product. Those controls must not appear in the Student Portal.

## 10. Responsive and Accessibility Requirements

- Use the shared Student Portal compact layout and spacing.
- At desktop widths, display four summary cells in one row.
- At tablet widths, display two cells per row.
- At mobile widths, display one cell per row in the same logical order.
- The term selector and PDF button must not overlap or truncate.
- Table scrolling must stay inside a bounded table container.
- All controls need visible focus states and accessible names.
- Summary values must not rely on color alone.
- Status badges and unavailable values must be readable in light and dark themes.
- Use semantic `h1`, `h2`, table headers, captions or accessible labels, and `time` elements where applicable.
- Support keyboard selection for the term dropdown and keyboard activation for PDF download.

## 11. Migration Checklist

- [ ] Rename page heading to `Student Exam Result Card` or `Terminal Progress Report`.
- [ ] Remove CGPA summary card.
- [ ] Remove Completed Credits summary card.
- [ ] Remove Current Semester summary card.
- [ ] Add Total Marks Obtained summary card.
- [ ] Add Percentage summary card.
- [ ] Add Overall Grade summary card.
- [ ] Add Class Position summary card.
- [ ] Add Exam Term dropdown.
- [ ] Remove GPA/Grade Point table column.
- [ ] Reduce table to exactly five required columns.
- [ ] Remove semester and transcript terminology from all visible text.
- [ ] Remove technical/legal academic-report disclaimer text.
- [ ] Rename print action to `Download Result Card (PDF)`.
- [ ] Update PDF content and filename to school terminology.
- [ ] Add published/unpublished, partial, empty, loading, and error states.
- [ ] Verify student/parent data isolation.
- [ ] Verify desktop, tablet, mobile, keyboard, light-theme, and dark-theme layouts.

## 12. Acceptance Criteria

The module is accepted when:

1. A student sees `Student Exam Result Card` or `Terminal Progress Report` as the page title.
2. No visible UI contains CGPA, GPA, Grade Point, Credits, Semester, or Official Transcript.
3. The page provides a working Exam Term selector with only authorized published terms.
4. Exactly four school summary metrics are visible: total marks, percentage, overall grade, and class position.
5. The results table contains exactly Subject, Total Marks, Marks Obtained, Letter Grade, and Teacher Remarks.
6. The page provides `Download Result Card (PDF)` and the generated file contains only authorized school result data.
7. Empty and unavailable data are explicit and never replaced with fabricated values.
8. A parent cannot access an unlinked child's result card.
9. The layout remains usable without document-level horizontal overflow on mobile.
10. The selected term, table data, summary metrics, and PDF output always represent the same result period.
