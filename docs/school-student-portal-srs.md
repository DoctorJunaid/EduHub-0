# EduHub School Student Portal

## Software Requirements Specification (SRS)

**Document status:** Proposed school-first product baseline  
**Audience:** Product, UX/UI, frontend, backend, QA, school administrators  
**Primary users:** Students, parents/guardians, class teachers, subject teachers, school administrators  
**Scope:** K-12 schools, academies, and school sections of larger institutions

## 1. System Scope & Design Objectives

### 1.1 Scope

EduHub Student Portal is a role-aware school information system for students and parents. It provides a simple daily view of the learner's class identity, timetable, homework, diary notes, attendance, assessments, fees, and school communication.

The portal must represent school operations rather than university operations. The primary academic unit is the **class and section**. The primary academic time unit is the **academic session, term, and examination period**. The primary progress measures are **marks, percentage, letter grade, class position, attendance days, and teacher feedback**.

The portal is read-only for official academic and financial records unless a workflow explicitly permits a student or parent action, such as marking homework complete, submitting a leave application, or paying a fee challan.

### 1.2 University-to-school adaptation objectives

- Replace course, semester, credit, GPA, and transcript language with subject, class, section, academic session, term, marks, percentage, and report card language.
- Make the dashboard useful within seconds for a child or parent checking today's routine, pending homework, attendance, and notices.
- Reduce visual density without hiding important actions or status information.
- Use consistent compact cards, borders, spacing, typography, and responsive behavior across every Student Portal page.
- Keep school-specific data isolated to the authenticated student and their authorized parent/guardian accounts.
- Preserve truthful empty states. The UI must never fabricate marks, ranks, attendance, assignments, notices, or payment status.

### 1.3 Core design principles

1. **Class-first:** Class, section, roll number, and class teacher are more prominent than program or course metadata.
2. **Daily-first:** Today's timetable, homework, diary notes, attendance, and urgent notices are prioritized.
3. **Parent-readable:** Labels and explanations must be understandable without academic or technical knowledge.
4. **Action-oriented:** Every pending item exposes its next valid action, status, and due date.
5. **Consistent:** Shared compact page headers, summary strips, table density, empty states, and responsive rules are used across modules.
6. **Honest:** Unavailable values are labeled as unavailable; no calculation or official status is implied without an approved source.

## 2. UI Cleanup Matrix

| Current university-oriented item                    | Decision                                                     | School replacement or behavior                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `Credits not available` on subject cards            | Remove completely                                            | Subject cards show subject name, class/section, teacher, routine, and attendance/status where available.                           |
| CGPA                                                | Remove terminology and calculations                          | Report Card shows Overall Percentage, Total Marks Obtained, Letter Grade, and Class Position.                                      |
| Grade Point (GPA)                                   | Remove from all student-facing UI and report tables          | Show marks, percentage, letter grade, and teacher remarks.                                                                         |
| Semester                                            | Remove from labels, selectors, breadcrumbs, and descriptions | Use Academic Session and Academic Term, for example `Session 2025-2026`, `1st Term`, `Mid-Term`, or `Final Exams`.                 |
| Course-wise lecture attendance                      | Remove from Student Portal                                   | Attendance is summarized by working days, days present, absences, leaves, and monthly history.                                     |
| `Lectures Attended` metric                          | Replace                                                      | `Days Present`.                                                                                                                    |
| `Absences` as a course/session count                | Replace scope                                                | `Absent Days`, based on approved daily attendance records.                                                                         |
| `Late / Leave` combined metric                      | Replace                                                      | Separate `Leaves` and, if the school policy requires it, a clearly labeled `Late Arrivals` count.                                  |
| Technical transcript disclaimer                     | Remove from normal student-facing view                       | Use a plain status such as `School report card` or `Published by school`. Certification metadata belongs to admin/print workflows. |
| `Official Transcript` badge                         | Replace                                                      | `Report Card` or `Term Report Card`.                                                                                               |
| `Course / Subject`                                  | Replace in school contexts                                   | `Subject`. Use `Class / Section` where the class identity is needed.                                                               |
| `Current Semester`                                  | Replace                                                      | `Academic Term / Session`.                                                                                                         |
| `Completed Credits`                                 | Remove                                                       | `Total Marks Obtained` or `Subjects Completed`, depending on the approved data source.                                             |
| `Academic Standing`                                 | Replace                                                      | `Class Position` or `Position in Class`, only when published by the school.                                                        |
| Separate `Homework & Diary` and `Daily Diary` links | Merge                                                        | One `Daily Diary & Homework` module and one sidebar destination.                                                                   |
| University transcript print action                  | Replace                                                      | Prominent `Download PDF Report Card` action for a published report card.                                                           |
| Course registration language                        | Remove                                                       | Enrollment is maintained by the school; students see their assigned subjects and class routine.                                    |
| Faculty evaluation terminology                      | Simplify                                                     | `Teacher Remarks` or `Class Teacher Remarks`.                                                                                      |

## 3. Deep Functional Requirements

### 3.1 Student & Class Profile Dashboard

#### Purpose

Provide a single school-focused overview for a student or parent immediately after login.

#### Required profile information

The profile header must display:

- Student full name and avatar/initials.
- Class and section, for example `Class 9 - Sec B`.
- Roll number, for example `Roll No. 18`.
- Academic session, for example `Session 2025-2026`.
- Optional class teacher name when available.
- Account role where relevant: Student, Parent, or Guardian.

The profile header must not display program, semester, credits, CGPA, GPA, or university transcript terminology.

#### Dashboard summary strip

The dashboard should provide compact summary cells/cards for:

- Today's classes or periods.
- Pending homework count.
- Attendance summary, such as present days and attendance percentage when policy supports it.
- Current term percentage or latest published result.
- Unread notices or circulars.

Summary values must link to their owning module. Cards must retain stable dimensions on desktop, tablet, and mobile layouts.

#### Daily overview

The dashboard must include:

- Today's timetable with subject, period/time, room where applicable, and teacher.
- Today's diary notes and homework preview.
- Pending or overdue homework preview.
- Latest school notices and event alerts.
- Attendance snapshot with a link to monthly history.

Empty states must explain what will appear and why it is currently unavailable.

#### Profile actions

Authorized actions may include:

- Open Daily Diary & Homework.
- Open Attendance.
- Open Report Card.
- Open Fee Challans.
- Open Notices.
- Open profile or account settings.

Actions must not route a student to an Admin-only page.

### 3.2 Unified Daily Diary & Homework Tracking

#### Purpose

Combine the class teacher's daily notes and subject homework into one chronological module so students and parents do not need to check two separate pages.

#### Navigation and naming

- Sidebar label: `Daily Diary & Homework`.
- Route and breadcrumb must use the unified module name.
- Existing `Homework & Diary` and `Daily Diary` destinations must resolve to one canonical page or redirect to it.
- No duplicate diary or assignment list should be maintained.

#### Diary entry data

Each daily entry should support:

- Date.
- Class and section.
- Subject, when the entry is subject-specific.
- Teacher/class teacher name.
- Note or lesson recap.
- Homework description.
- Due date.
- Attached resource links, when approved by the school.
- Completion status for each homework item.
- Published/visible status controlled by the school workflow.

#### Student and parent actions

- View entries by date, subject, and completion status.
- Mark a homework item as completed.
- Unmark an item when it was marked accidentally, subject to school policy.
- Add an optional private parent note only if the product explicitly supports it.
- Open a linked assignment or resource.
- See overdue, due today, upcoming, and completed states.

Marking an item complete is an acknowledgement, not proof that the teacher graded or accepted the work. Only authorized teacher workflows can mark work as reviewed, graded, or approved.

#### Completion behavior

- Completion state must be stored per student and homework item.
- A student must not be able to modify another student's state.
- The dashboard pending count must update when completion changes.
- The UI must show the last update time where useful.
- Offline or failed saves must show a recoverable error and must not silently claim completion.

#### Empty and exceptional states

- No diary entries: `No diary notes or homework have been published yet.`
- No homework for a day: `No homework assigned for this date.`
- Unpublished teacher draft: never expose it to students or parents.
- Missing due date: show `No due date` rather than an invented date.

### 3.3 Attendance & Monthly Progress Logs

#### Purpose

Show school attendance as a day-based record rather than a lecture or course-based university metric.

#### Summary metrics

The Attendance page must show:

- Total Working Days.
- Days Present.
- Absences.
- Leaves.
- Optional Late Arrivals, only when the school has an approved late policy.
- Attendance percentage, calculated from the school's configured attendance policy.

The four primary metrics are Total Working Days, Days Present, Absences, and Leaves. They must be visually prominent and use the same compact summary strip style as the dashboard.

#### Calculation rules

- Total Working Days must come from the school's calendar or approved attendance source.
- Days Present, Absences, and Leaves must be mutually defined by the school's attendance statuses.
- Approved leave must not be counted as an absence unless the school's policy explicitly says so.
- Holidays, weekends, school closures, and non-working days must not be counted as absences.
- If the denominator or policy is unavailable, show `Attendance percentage unavailable` rather than a guessed percentage.
- The UI must not present course-wise lecture attendance as the primary school metric.

#### Monthly log

The page must provide:

- Month selector.
- Monthly calendar or date list.
- Daily status: Present, Absent, Leave, Holiday, or Not Marked.
- Optional check-in/check-out times only when supplied by the school.
- Attendance remarks where authorized.
- Current month and previous month navigation.
- A clear indicator when records are incomplete or awaiting publication.

#### Parent and student permissions

- Students can view their own attendance.
- Parents/guardians can view linked children's attendance.
- Students cannot edit attendance.
- Leave application is a separate controlled workflow if enabled; submitting an application does not automatically change attendance until approved.

### 3.4 Term Report Card & Examination Analytics

#### Purpose

Replace the university transcript/CGPA view with a school report card that communicates performance clearly to students and parents.

#### Report card identity

Every report card must identify:

- Student name.
- Class and section.
- Roll number.
- Academic session.
- Academic term or examination period: 1st Term, Mid-Term, Final Exams, etc.
- Publication date.
- School name and logo where configured.

#### Summary metrics

The report card summary must support:

- Overall Percentage (%).
- Total Marks Obtained.
- Total Marks / Maximum Marks, where available.
- Letter Grade: A, B, C, or the school's configured grade scale.
- Class Rank/Position, for example `3rd in Class`, only when published and authorized.
- Optional attendance summary for the reporting period.
- Optional class teacher remarks.

The following must not appear in the school Student Portal:

- CGPA.
- GPA or Grade Point.
- Completed Credits.
- Semester.
- Course-wise transcript language.

#### Subject result table

Each row should support:

- Subject name.
- Marks obtained.
- Maximum marks.
- Percentage, when useful.
- Letter grade.
- Teacher remarks.
- Optional assessment component breakdown, such as Written, Oral, Practical, or Project, when configured by the school.

The table must preserve zero marks and explicitly distinguish a missing result from a zero result.

#### Report card actions

- Show a prominent `Download PDF Report Card` button when the report card is published.
- Disable or hide download when no report card is available, with a clear explanation.
- The generated PDF must contain the same authorized data as the visible report card.
- PDF output should include student identity, class/section, session/term, subject results, totals, percentage, grade, position, and remarks.
- PDF generation must not expose other students' results or internal administrative notes.

#### Examination analytics

Optional analytics may include:

- Subject-wise percentage comparison across published terms.
- Improvement or decline from the previous published term.
- Highest and lowest subject marks.
- Grade distribution for the individual student.

Class comparison charts, rank, or peer analytics must be shown only when school policy authorizes them and must not expose peer identities or individual peer marks.

### 3.5 School Fee Challans & Online Payment

#### Purpose

Let parents and students view payable school fees, download challans, and complete an approved online payment flow.

#### Fee record

Each fee item should show:

- Student name and class/section.
- Fee month or billing period.
- Fee category: Tuition, Transport, Examination, Activity, Admission, or configured category.
- Amount due.
- Discount or concession, where authorized.
- Fine/late fee, where applicable.
- Total payable amount.
- Due date.
- Status: Unpaid, Partially Paid, Paid, Overdue, Cancelled, or Awaiting Verification.
- Receipt or transaction reference after payment.

#### Actions

- View fee details.
- Download or print fee challan.
- Pay online through the configured payment provider.
- View payment instructions when online payment is unavailable.
- Download receipt after confirmed payment.
- Filter by current, overdue, and paid records.

#### Payment requirements

- Payment status changes only after a trusted payment response or school verification.
- Do not display a successful payment before confirmation.
- Payment retries must be idempotent and must not create duplicate charges.
- Parent accounts may pay only for linked students.
- Sensitive payment data must be handled by the payment provider; the portal must not store raw card credentials.

### 3.6 Notice Board & Circular Announcements

#### Purpose

Provide one trusted place for school notices, parent circulars, events, reminders, and holiday announcements.

#### Notice types

- School circular.
- Parent notice.
- Holiday announcement.
- Exam schedule notice.
- Event or activity alert.
- Transport or closure alert.
- Fee reminder.
- Emergency or urgent announcement.

#### Notice fields

- Title.
- Notice type and priority.
- Published date/time.
- Effective date or event date.
- Expiry date, when applicable.
- Audience: school, class, section, parent, or student group.
- Body content.
- Attachment or downloadable document, when approved.
- Publisher identity or department.
- Read/unread state per user.

#### User experience

- Dashboard shows the latest important notices.
- Notices page supports unread, pinned, recent, and category filters.
- Urgent notices are visually distinct but must remain accessible and non-alarming.
- A notice can be marked as read; read state is per account.
- Expired notices are archived and clearly labeled.
- Students and parents cannot edit, delete, or publish notices.

#### Safety and trust

- Only authorized school staff can publish notices.
- Targeting must be enforced server-side by class, section, campus, and account relationship.
- Attachments must be scanned and access-controlled.
- The UI must show the publication source and date to reduce confusion from forwarded messages.

## 4. Non-Functional Requirements

### 4.1 Usability and accessibility

- The portal must be understandable to primary-school students and parents with limited technical knowledge.
- Use plain school vocabulary: Class, Section, Subject, Term, Marks, Attendance, Homework, Notice, and Fee.
- Avoid unexplained abbreviations. If an abbreviation is necessary, provide its full label.
- Primary actions must use clear text and familiar icons.
- Touch targets must be at least 44 by 44 CSS pixels on mobile for interactive controls.
- Forms, checkboxes, tables, dialogs, and status changes must be keyboard accessible.
- Use semantic headings, labels, focus states, accessible names, and screen-reader announcements for save/error states.
- Do not rely on color alone for attendance, payment, homework, or result status.
- Support readable contrast in light and dark themes if both themes remain enabled.
- Preserve user-entered text and selection when recoverable network errors occur.

### 4.2 Responsive behavior

- Support desktop, tablet, and mobile viewport widths without document-level horizontal overflow.
- Use the shared compact Student Portal page rhythm: constrained padding, small gaps, stable card dimensions, and consistent borders.
- Summary strips must collapse to two columns or one column at defined breakpoints without changing reading order.
- Tables may scroll inside their own bounded container; the page itself must not become wider than the viewport.
- Diary, homework, notices, and fee records must remain usable on a 390px-wide viewport.
- PDF/download actions must wrap without overlapping headings or other controls.

### 4.3 Performance and speed

- The dashboard's initial useful content should render quickly on normal school broadband and mid-range mobile devices.
- Fetch only the authenticated student's or parent's authorized data.
- Use pagination or incremental loading for long diary, notice, attendance, and fee histories.
- Avoid loading full school-wide student, marks, or payment datasets into the browser.
- Cache safe read-only reference data where appropriate, but invalidate or refresh time-sensitive notices, fees, and attendance according to product policy.
- User actions such as marking homework complete must provide immediate pending/saved feedback without falsely confirming a failed request.

### 4.4 Data isolation and authorization

- Every API request must be authorized server-side using the authenticated account and relationship to the student.
- A student must never access another student's profile, diary, attendance, marks, fee records, notices targeted to another class, or messages.
- Parent accounts may access only explicitly linked children.
- Class position may be returned only where the school has enabled publication for that reporting period.
- Downloaded PDFs must enforce the same authorization as the web page.
- Frontend filtering is not a security boundary.
- Audit sensitive events: report card publication, attendance changes, fee status changes, notice publication, and parent/student account linking.

### 4.5 Reliability and data integrity

- Official records must have a clear source, publication status, and update timestamp.
- Duplicate homework completion events, fee payments, and leave submissions must be prevented through idempotent server operations.
- Missing or invalid data must produce a recoverable empty/error state, not fabricated defaults.
- Draft teacher content must not appear in Student Portal queries.
- Data changes from teacher/admin workflows must propagate to student and parent views according to the product's freshness target.
- Backups, retention, and archival policies must cover attendance, report cards, fees, notices, and homework completion history.

### 4.6 Privacy and security

- Protect student names, marks, attendance, fee records, and parent contact data as sensitive educational information.
- Use encrypted transport for all authenticated traffic.
- Use secure session handling, expiry, logout invalidation, and role-based access control.
- Do not include sensitive data in client logs, analytics events, URLs, or downloadable filenames.
- Provide appropriate consent and retention handling for parent/guardian relationships.
- File uploads and downloadable attachments require type validation, malware scanning, authorization, and controlled storage.

### 4.7 Localization and school configuration

- Support school-configured grading scales, attendance statuses, fee categories, academic sessions, terms, holidays, and notice types.
- Support local date, number, currency, and language formatting without changing the underlying data model.
- Do not hardcode `2025-2026`, class names, grade thresholds, rank labels, or attendance policies.
- Configured terminology must remain school-safe; administrators should not be able to reintroduce university labels into the school portal accidentally.

### 4.8 Observability and support

- Capture structured error events for failed report downloads, payment callbacks, attendance loads, homework completion saves, and notice attachments.
- Provide correlation/reference IDs for support without exposing internal stack traces to students or parents.
- Admin support views may show technical details that remain hidden from Student Portal users.
- Monitor page load, API latency, failed saves, payment success/failure, PDF generation, and unauthorized access attempts.

## 5. Acceptance Baseline

The school-first Student Portal is considered aligned when:

- No Student Portal screen displays CGPA, GPA, Grade Point, Completed Credits, or Semester terminology.
- No subject card displays `Credits not available`.
- Attendance is day-based and exposes working days, present days, absences, and leaves.
- Homework and diary are reachable through one unified module and support completion state.
- Report cards expose percentage, marks, letter grade, and authorized class position, with a working PDF download for published results.
- The student profile clearly shows class, section, roll number, and session.
- School notices are available from both the dashboard and a dedicated notice board.
- Fees support school challans and a verified payment/receipt flow where enabled.
- All modules use the compact, responsive Student Portal visual system.
- Authorization tests prove that a student or parent cannot access another student's records.
- Empty, loading, error, draft, unpublished, and unavailable states are explicit and truthful.
