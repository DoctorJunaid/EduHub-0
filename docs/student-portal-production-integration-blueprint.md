# EduHub Student Portal

## Production Integration Blueprint for School ERP

**Audience:** Principal engineers, backend/frontend teams, QA, DevOps, security, school product owners  
**Target:** K-12 school portal for Class 1-10  
**Existing stack:** React + Redux Toolkit frontend, Express + Mongoose backend, MongoDB persistence  
**API base:** `/api/v1` (recommended versioned boundary)

## 1. Architecture Decision

### 1.1 Canonical ownership

- **Admin System:** creates students, classes, sections, subjects, teacher assignments, exams, fee schedules, notices, and publication states.
- **Teacher Portal:** writes daily attendance, class work, tests, homework, diary notes, marks, teacher remarks, and publication requests.
- **Student/Parent Portal:** reads only authorized published data; submits homework completion, payment initiation, and optional leave applications.
- **Backend:** is the authorization boundary, calculation authority, publication gate, payment authority, and notification event producer.
- **Frontend:** renders server-authorized view models and handles loading, empty, error, and retry states. Frontend filtering is never security.

### 1.2 Existing implementation to preserve

The current code already provides useful foundations:

- `backend/src/routes/student.routes.js` with protected student routes.
- `backend/src/controllers/studentPortal.controller.js` with a portal aggregation endpoint, assignment submission, and conversation messages.
- Mongoose models for users, schedules, attendance, fees, performance, assignments, diary, and conversations.
- `frontend/src/Users/Student/StudentLayout.jsx` loading `/student/portal` into Redux slices.
- Redux slices/selectors for results, attendance, fees, timetable, assignments, diary, faculty, and messages.

The current aggregation endpoint remains available for a compatibility phase, but production modules must move toward versioned, scoped endpoints and a single normalized `StudentPortalView` response.

### 1.3 Non-negotiable invariants

1. Every record carries `instituteId` and `campusId` or is resolvable to them.
2. Every student-facing query is scoped by authenticated identity and guardian relationship.
3. Only records with `publicationStatus: Published` are visible to students/parents.
4. School metrics use class/section/session/term concepts; no CGPA, credits, semester, GPA, or grade-point fields are returned to the Student Portal.
5. Server-side calculations are authoritative; clients display returned values.
6. Payment state changes only from verified provider callbacks or authorized reconciliation.
7. Notification delivery is asynchronous and retryable through an outbox.
8. All write APIs are idempotent where retries can create duplicates.

## 2. Identity, Class, and Linkage Model

### 2.1 Resolve the current student

The authentication token identifies a `User`. A production student profile must be linked by `StudentProfile.user` or a verified `User.studentProfileId`.

The backend must not infer a student from email alone when multiple records match. If no link exists, return a structured `UNLINKED_PROFILE` response and no other student's data.

### 2.2 Required class linkage

A student must resolve to:

```text
studentProfileId
studentId
instituteId
campusId
classId
sectionId
academicSessionId
rollNo
```

Legacy fields such as `gradeOrClass`, `program`, `section`, and `semester` may be read during migration, but canonical APIs return `class`, `section`, `academicSession`, and `rollNo`.

### 2.3 Account states

```text
UNLINKED_PROFILE
LINKED_NO_PUBLISHED_DATA
LIVE_PUBLISHED_DATA
SUSPENDED_ACCOUNT
```

The API includes `portalState` in every bootstrap response so every module can render the same state consistently.

## 3. Canonical MongoDB/Mongoose Schemas

The following are logical schemas. Existing collections may be migrated with versioned backfills rather than replaced in one deployment.

### 3.1 Students

Collection: `studentProfiles`

```js
{
  _id: ObjectId,
  userId: ObjectId,              // unique User reference
  studentCode: String,           // unique within institute
  instituteId: ObjectId,
  campusId: ObjectId,
  name: String,
  classId: ObjectId,
  sectionId: ObjectId,
  rollNo: String,
  parentIds: [ObjectId],
  parentPhone: String,
  academicSessionId: ObjectId,
  status: "Active" | "Inactive" | "Graduated" | "Suspended",
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```text
{ instituteId: 1, campusId: 1, studentCode: 1 } unique
{ userId: 1 } unique
{ campusId: 1, classId: 1, sectionId: 1, rollNo: 1 } unique
{ parentIds: 1 }
```

### 3.2 Classes, sections, and subjects

```js
Class {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  name: String,                  // Class 9
  order: Number,
  academicSessionId: ObjectId,
  active: Boolean
}

Section {
  _id: ObjectId,
  classId: ObjectId,
  name: String,                  // A / B
  capacity: Number,
  classTeacherId: ObjectId,
  active: Boolean
}

Subject {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  name: String,
  code: String,
  active: Boolean
}
```

### 3.3 Teachers and assignments

```js
TeacherProfile {
  _id: ObjectId,
  userId: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  employeeCode: String,
  name: String,
  assignedSubjectIds: [ObjectId],
  assignedClassIds: [ObjectId],
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}

ClassSubjectTeacher {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  academicSessionId: ObjectId,
  classId: ObjectId,
  sectionId: ObjectId,
  subjectId: ObjectId,
  teacherId: ObjectId,
  room: String,
  active: Boolean
}
```

Indexes:

```text
{ campusId: 1, academicSessionId: 1, classId: 1, sectionId: 1, subjectId: 1 } unique
{ teacherId: 1, academicSessionId: 1 }
```

### 3.4 Class timetable

```js
ClassRoutine {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  academicSessionId: ObjectId,
  classId: ObjectId,
  sectionId: ObjectId,
  subjectId: ObjectId,
  teacherId: ObjectId,
  dayOfWeek: Number,             // 1-7
  periodNo: Number,
  startTime: String,
  endTime: String,
  room: String,
  active: Boolean,
  updatedAt: Date
}
```

### 3.5 Examinations and assessment categories

Collection: `examinations`

```js
{
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  academicSessionId: ObjectId,
  classId: ObjectId,
  sectionId: ObjectId | null,     // null for class-wide assessment
  category: "monthly_test" | "assignment_homework" | "mid_term" | "final_annual",
  termName: String,               // August Test, Mid-Term Examination
  month: String | null,
  status: "Draft" | "Published" | "Archived",
  publishedAt: Date | null,
  publishedBy: ObjectId | null,
  resultStatus: "Passed" | "Promoted" | "Retest" | "NotPublished" | null,
  classPosition: Number | null,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```text
{ campusId: 1, academicSessionId: 1, classId: 1, category: 1, status: 1 }
{ campusId: 1, sectionId: 1, termName: 1 } unique
```

### 3.6 Marks

Collection: `marks`

```js
{
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  examinationId: ObjectId,
  studentId: ObjectId,
  subjectId: ObjectId,
  classWorkTestMarks: Number | null,
  classWorkTestTotal: Number | null,
  examMarks: Number | null,
  examTotal: Number | null,
  totalMarksObtained: Number,
  totalMarks: Number,
  grade: String,
  teacherRemarks: String,
  status: "Draft" | "Published",
  enteredBy: ObjectId,
  publishedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

Constraints:

```text
unique(examinationId, studentId, subjectId)
classWorkTestMarks <= classWorkTestTotal when both exist
examMarks <= examTotal when both exist
totalMarksObtained = applicable component sum
```

### 3.7 Daily attendance

Collection: `dailyAttendance`

```js
{
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  studentId: ObjectId,
  classId: ObjectId,
  sectionId: ObjectId,
  date: String,                   // local school date YYYY-MM-DD
  status: "Present" | "Absent" | "Leave" | "Late" | "NotMarked",
  remarks: String,
  markedBy: ObjectId,
  markedAt: Date,
  source: "roll_call" | "manual_correction" | "leave_approval"
}
```

Indexes:

```text
{ campusId: 1, studentId: 1, date: 1 } unique
{ campusId: 1, classId: 1, sectionId: 1, date: 1 }
```

Working days must come from an `academicCalendars` collection, not from attendance row count.

### 3.8 Homework and diary

```js
DailyDiaryEntry {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  academicSessionId: ObjectId,
  classId: ObjectId,
  sectionId: ObjectId | null,
  subjectId: ObjectId | null,
  teacherId: ObjectId,
  date: String,
  note: String,
  homeworkItems: [{
    id: ObjectId,
    title: String,
    description: String,
    dueDate: String | null,
    totalMarks: Number | null,
    published: Boolean
  }],
  status: "Draft" | "Published" | "Archived",
  publishedAt: Date | null,
  updatedAt: Date
}

HomeworkCompletion {
  _id: ObjectId,
  homeworkItemId: ObjectId,
  studentId: ObjectId,
  status: "Pending" | "Completed",
  completedAt: Date | null,
  updatedAt: Date
}
```

Unique key: `unique(homeworkItemId, studentId)`.

### 3.9 Fees and payments

```js
FeeVoucher {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  studentId: ObjectId,
  month: String,
  billingPeriod: String,
  lineItems: [{ code: String, title: String, amount: Number }],
  totalAmount: Number,
  paidAmount: Number,
  dueDate: Date,
  status: "Unpaid" | "PartiallyPaid" | "Paid" | "Overdue" | "Cancelled" | "AwaitingVerification",
  voucherNo: String,
  receiptNo: String | null,
  createdAt: Date,
  updatedAt: Date
}

PaymentIntent {
  _id: ObjectId,
  voucherId: ObjectId,
  studentId: ObjectId,
  provider: "stripe" | "jazzcash" | "easypaisa" | "bank_gateway",
  providerIntentId: String,
  amount: Number,
  currency: String,
  status: "Created" | "Pending" | "Succeeded" | "Failed" | "Cancelled",
  idempotencyKey: String unique,
  createdAt: Date,
  updatedAt: Date
}

PaymentTransaction {
  _id: ObjectId,
  paymentIntentId: ObjectId,
  voucherId: ObjectId,
  provider: String,
  providerTransactionId: String unique,
  amount: Number,
  status: "Succeeded" | "Failed" | "Refunded",
  rawEventRef: String,
  paidAt: Date
}
```

### 3.10 Notices and notifications

```js
Notice {
  _id: ObjectId,
  instituteId: ObjectId,
  campusId: ObjectId,
  title: String,
  body: String,
  type: "Circular" | "Event" | "Holiday" | "Exam" | "Fee" | "Emergency",
  priority: "Normal" | "High" | "Urgent",
  audience: {
    classIds: [ObjectId],
    sectionIds: [ObjectId],
    roles: [String]
  },
  status: "Draft" | "Published" | "Expired",
  publishedAt: Date,
  expiresAt: Date | null,
  attachmentUrl: String | null,
  createdBy: ObjectId
}

NotificationOutbox {
  _id: ObjectId,
  eventType: String,
  aggregateType: String,
  aggregateId: ObjectId,
  recipientUserIds: [ObjectId],
  channels: ["portal", "email", "sms"],
  payload: Object,
  status: "Pending" | "Processing" | "Sent" | "Partial" | "Failed",
  attempts: Number,
  nextAttemptAt: Date,
  idempotencyKey: String unique,
  lastError: String | null,
  createdAt: Date,
  processedAt: Date | null
}
```

## 4. REST API Contracts

All endpoints are under `/api/v1`, require bearer authentication, and apply role and relationship authorization. Responses use:

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "req_123" }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "UNLINKED_PROFILE",
    "message": "Student profile is not linked to this account.",
    "details": {}
  },
  "meta": { "requestId": "req_123" }
}
```

### 4.1 Student bootstrap

`GET /api/v1/student/portal`

Returns the minimum shell data and module states.

```json
{
  "success": true,
  "data": {
    "portalState": "LIVE_PUBLISHED_DATA",
    "student": {
      "id": "stu_123",
      "name": "Khan MH",
      "class": "Class 9",
      "section": "B",
      "rollNo": "18",
      "academicSession": "2025-2026",
      "classTeacher": { "id": "tea_1", "name": "Ms. Sana" }
    },
    "modules": {
      "results": "published",
      "subjects": "live",
      "attendance": "live",
      "diaryHomework": "published",
      "fees": "live",
      "notices": "published"
    }
  }
}
```

For an unlinked account, return HTTP 200 with `portalState: UNLINKED_PROFILE`, or HTTP 422 only where the client must stop. Do not return guessed student data.

### 4.2 Profile and class routine

`GET /api/v1/student/profile`

`GET /api/v1/student/subjects`

`GET /api/v1/student/routine?date=2026-09-21`

Example:

```json
{
  "success": true,
  "data": {
    "class": { "id": "class_9", "name": "Class 9" },
    "section": { "id": "sec_b", "name": "B" },
    "classTeacher": { "id": "tea_1", "name": "Ms. Sana" },
    "subjects": [
      {
        "id": "sub_math",
        "name": "Mathematics",
        "teacher": { "id": "tea_2", "name": "Mr. Ali" },
        "room": "Room 4"
      }
    ],
    "routine": []
  }
}
```

### 4.3 Results and exam analytics

`GET /api/v1/student/assessments?academicSessionId=session_1`

Returns only published assessments available to the student.

```json
{
  "success": true,
  "data": [
    {
      "id": "exam_mid_1",
      "category": "mid_term",
      "label": "Mid-Term Examination",
      "academicSession": "2025-2026",
      "status": "Published"
    },
    {
      "id": "exam_aug_1",
      "category": "monthly_test",
      "label": "August Test",
      "academicSession": "2025-2026",
      "status": "Published"
    }
  ]
}
```

`GET /api/v1/student/assessments/:assessmentId/result`

```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "exam_mid_1",
      "label": "Mid-Term Examination",
      "academicSession": "2025-2026",
      "status": "Published"
    },
    "summary": {
      "totalMarksObtained": 440,
      "totalMarks": 500,
      "percentage": 88,
      "grade": "A",
      "classPosition": 3,
      "resultStatus": "Passed"
    },
    "rows": [
      {
        "subject": "Mathematics",
        "classWorkTest": { "obtained": 18, "total": 20 },
        "exam": { "obtained": 70, "total": 80 },
        "total": { "obtained": 88, "total": 100 },
        "grade": "A+",
        "teacherRemarks": "Excellent understanding"
      }
    ]
  }
}
```

`GET /api/v1/student/assessments/:assessmentId/result.pdf`

Returns an authorized PDF stream. The server regenerates the PDF from the same result service; clients must not construct official result PDFs from untrusted local state.

### 4.4 Attendance

`GET /api/v1/student/attendance?from=2026-09-01&to=2026-09-30`

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalWorkingDays": 22,
      "daysPresent": 19,
      "absences": 2,
      "leaves": 1,
      "lateArrivals": 0,
      "percentage": 86.36,
      "risk": false,
      "riskThreshold": 75
    },
    "days": [{ "date": "2026-09-01", "status": "Present", "remarks": "" }]
  }
}
```

`GET /api/v1/student/attendance/months`

`POST /api/v1/student/leave-applications` (optional, if enabled)

`GET /api/v1/student/leave-applications`

Attendance summary uses school calendar working days, not lecture count.

### 4.5 Unified diary and homework

`GET /api/v1/student/diary-homework?from=2026-09-01&to=2026-09-30&status=pending`

`PATCH /api/v1/student/homework/:homeworkItemId/completion`

Request:

```json
{
  "status": "Completed"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "homeworkItemId": "hw_1",
    "studentId": "stu_123",
    "status": "Completed",
    "completedAt": "2026-09-21T09:30:00.000Z"
  }
}
```

Use `Idempotency-Key` for completion writes. The server verifies the homework item belongs to the student's class/section and is published.

### 4.6 Fees and payment

`GET /api/v1/student/fees?voucherStatus=unpaid`

`GET /api/v1/student/fees/:voucherId`

`GET /api/v1/student/fees/:voucherId/challan.pdf`

`POST /api/v1/student/fees/:voucherId/payment-intents`

Request:

```json
{
  "provider": "jazzcash",
  "returnUrl": "https://portal.example.com/student/fees/payment-complete"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_123",
    "provider": "jazzcash",
    "status": "Pending",
    "amount": 12500,
    "currency": "PKR",
    "checkoutUrl": "https://provider.example/checkout/pi_123"
  }
}
```

`GET /api/v1/student/payments/:paymentIntentId`

`POST /api/v1/webhooks/payments/:provider` (provider signature required)

Never mark a voucher paid from the browser redirect alone. The signed provider webhook is authoritative.

### 4.7 Notices

`GET /api/v1/student/notices?status=active&type=all&page=1&pageSize=20`

`POST /api/v1/student/notices/:noticeId/read`

Notice reads are idempotent and scoped to the authenticated user.

### 4.8 Teacher/Admin publishing endpoints

Teacher routes:

```text
GET  /api/v1/teacher/classes
POST /api/v1/teacher/attendance/daily/bulk
POST /api/v1/teacher/diary-homework
PATCH /api/v1/teacher/diary-homework/:id
POST /api/v1/teacher/assessments/:id/marks
POST /api/v1/teacher/assessments/:id/submit-for-review
```

Admin/principal routes:

```text
POST /api/v1/admin/assessments
PATCH /api/v1/admin/assessments/:id/publish
POST /api/v1/admin/assessments/:id/recalculate
POST /api/v1/admin/fees/vouchers/generate
POST /api/v1/admin/notices
PATCH /api/v1/admin/notices/:id/publish
```

Publication must run validation, calculate totals, freeze the published version, and emit an outbox event in the same database transaction where supported.

## 5. Frontend State Management Blueprint

### 5.1 Redux slices

Add or normalize these slices:

```text
studentProfileSlice
studentSubjectsSlice
studentRoutineSlice
studentAssessmentsSlice
studentAttendanceSlice
studentDiaryHomeworkSlice
studentFeesSlice
studentNoticesSlice
studentNotificationsSlice
```

Existing slices can be retained during migration, but the API adapter should normalize backend payloads into these view models.

### 5.2 Common async state

Every slice exposes:

```js
{
  status: "idle" | "loading" | "succeeded" | "failed",
  error: null | { code, message, requestId },
  lastLoadedAt: null,
  records: [],
  portalState: "UNLINKED_PROFILE" | "LINKED_NO_PUBLISHED_DATA" | "LIVE_PUBLISHED_DATA"
}
```

### 5.3 State A: unlinked profile

Condition: authenticated account has no verified StudentProfile link.

Render:

- Warning banner: `Your student profile is not linked yet.`
- Student-owned identity only: account name/email, never a guessed record.
- Empty module states.
- Demo Preview Mode only when explicitly enabled by an environment/config flag and visibly labeled `Demo Preview`.
- Disable official downloads, payment, attendance actions, and homework completion in demo mode.

Never fall back to the first student, email substring matching, or a campus-wide record.

### 5.4 State B: linked but no published data

Condition: valid student linkage exists, but a module has no published records.

Render module-specific empty states:

- Results: `Results will appear once published by your school.`
- Diary/Homework: `Notes and homework will appear once published by your class teacher.`
- Attendance: `Attendance records will appear after daily roll call is submitted.`
- Fees: `No fee vouchers are currently available.`
- Notices: `No notices have been published for your class.`

Do not render fake zeros, fake marks, or sample official records.

### 5.5 State C: live and published

Condition: verified student link plus authorized published data.

Render real records, server-calculated summaries, timestamps, publication labels, and retryable errors. Update affected selectors after successful writes or push events.

### 5.6 Query and cache keys

Use query keys that include authorization scope and period:

```text
studentProfile:{studentId}
studentRoutine:{studentId}:{date}
studentAssessments:{studentId}:{sessionId}
studentResult:{studentId}:{assessmentId}
studentAttendance:{studentId}:{from}:{to}
studentDiaryHomework:{studentId}:{from}:{to}:{status}
studentFees:{studentId}:{status}
studentNotices:{studentId}:{page}:{filter}
```

Invalidate result, dashboard, and PDF metadata after assessment publication. Invalidate attendance after a teacher correction. Invalidate fees after verified payment. Invalidate diary counts after completion changes.

### 5.7 Optimistic writes

Only homework completion and notice-read state may be optimistic. Payment, marks, attendance, and publication statuses are server-authoritative and require confirmed responses.

## 6. Real-Time Notifications and Automation

### 6.1 Event catalog

Publish domain events to `NotificationOutbox`:

```text
assessment.published
attendance.absent_marked
homework.published
fee.voucher_generated
fee.voucher_overdue
payment.succeeded
notice.published
```

Each event contains:

```json
{
  "eventId": "evt_123",
  "eventType": "assessment.published",
  "occurredAt": "2026-09-21T09:30:00.000Z",
  "instituteId": "inst_1",
  "campusId": "campus_1",
  "aggregateId": "exam_mid_1",
  "recipientScope": {
    "classId": "class_9",
    "sectionId": "sec_b"
  },
  "payload": {
    "title": "Mid-Term Result Published",
    "message": "Your Mid-Term Examination result is now available."
  }
}
```

### 6.2 Delivery channels

The notification worker resolves recipients and sends:

- Portal notification: always when the recipient has an account.
- Email: according to guardian/student preferences.
- SMS: for absence, urgent notices, fee overdue, and configured result events.

Provider credentials and templates remain server-side. Never send provider secrets to the frontend.

### 6.3 Required automation

#### Result publication

1. Teacher submits marks.
2. Admin/principal publishes assessment.
3. Server validates all rows and freezes result version.
4. Emit `assessment.published`.
5. Notify linked student and parents.
6. Refresh Student Portal assessment list through WebSocket/SSE event or next query.

#### Absence

1. Teacher submits daily roll call.
2. Server stores idempotent daily attendance.
3. For each newly created Absent record, emit `attendance.absent_marked`.
4. Deduplicate notifications by `studentId + date + absenceEvent`.
5. Notify student/parents by configured portal/SMS/email channels.

#### Homework/diary publication

1. Teacher publishes daily entry.
2. Server verifies class/section audience.
3. Emit `homework.published`.
4. Notify linked accounts and update dashboard pending count.

#### Fee generation/overdue

1. Scheduler generates voucher with idempotency key `studentId:billingPeriod:feePlanVersion`.
2. Emit `fee.voucher_generated`.
3. A daily job marks unpaid vouchers overdue after due date.
4. Emit `fee.voucher_overdue` once per overdue transition.

### 6.4 Client real-time contract

Recommended transport: authenticated Server-Sent Events for one-way portal updates, or WebSocket if chat and bidirectional events are required.

`GET /api/v1/student/events` emits:

```json
{
  "type": "assessment.published",
  "entityId": "exam_mid_1",
  "invalidate": ["studentAssessments", "studentResult", "dashboard"],
  "notificationId": "notif_1"
}
```

Client behavior:

- Validate event scope and entity IDs.
- Invalidate matching Redux queries.
- Show a non-blocking toast and unread notification count.
- Refetch only authorized resources.
- Reconnect with exponential backoff and a last-event ID.

## 7. Backend Service Boundaries

Recommended services/modules inside the existing backend:

```text
StudentAccessService       // identity and parent relationship checks
ClassRosterService          // class, section, subject, teacher resolution
AssessmentService           // draft, validation, calculation, publication
AttendanceService           // daily roll call and summaries
DiaryHomeworkService        // publication and completion
FeeService                  // vouchers, payment intents, reconciliation
NoticeService               // audience targeting and read state
NotificationService         // outbox, templates, provider delivery
PdfReportService            // authorized result card/challan generation
AuditService                // immutable sensitive action log
```

Controllers should not directly assemble cross-module business rules. The current `getStudentPortal` controller should become a thin orchestrator over these services.

## 8. Authorization Matrix

| Operation              |   Student |       Parent |                Teacher | Admin/Principal |
| ---------------------- | --------: | -----------: | ---------------------: | --------------: |
| Read own profile       |       Yes | Linked child |         Assigned class |    Campus scope |
| Read subjects/routine  |       Yes | Linked child |         Assigned class |    Campus scope |
| Read published results |       Yes | Linked child |         Assigned class |    Campus scope |
| Enter marks            |        No |           No | Assigned subject/class |             Yes |
| Publish result         |        No |           No |           Request only |             Yes |
| Read attendance        |       Own | Linked child |         Assigned class |    Campus scope |
| Mark attendance        |        No |           No |         Assigned class |             Yes |
| Read diary/homework    | Own class | Linked child |         Assigned class |    Campus scope |
| Mark homework complete |       Own | Linked child |                     No |              No |
| Read fees              |       Own | Linked child |                     No |             Yes |
| Initiate payment       |       Own | Linked child |                     No |              No |
| Publish notice         |        No |           No |           Request only |             Yes |

Every row must be enforced server-side with institute/campus and relationship checks.

## 9. API Error and Fallback Contract

Required error codes:

```text
UNAUTHENTICATED
FORBIDDEN_SCOPE
UNLINKED_PROFILE
CLASS_NOT_LINKED
NO_PUBLISHED_DATA
ASSESSMENT_NOT_PUBLISHED
ATTENDANCE_POLICY_UNAVAILABLE
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_NOT_CONFIRMED
VALIDATION_ERROR
DUPLICATE_REQUEST
RATE_LIMITED
INTERNAL_ERROR
```

Frontend mapping:

- `UNLINKED_PROFILE`: warning banner + no fallback identity.
- `CLASS_NOT_LINKED`: class/routine empty state and support action.
- `NO_PUBLISHED_DATA`: module empty state.
- `PAYMENT_PROVIDER_UNAVAILABLE`: keep voucher visible, disable payment, show manual instructions.
- `PAYMENT_NOT_CONFIRMED`: show pending verification, never Paid.
- `FORBIDDEN_SCOPE`: generic unavailable message without record existence disclosure.
- `RATE_LIMITED`: retry-after UI.

## 10. Payment Production Requirements

- Use provider-hosted checkout or tokenized payment fields.
- Store no raw card number, CVV, or wallet secret.
- Verify webhook signatures and replay timestamps.
- Use idempotency keys for payment intent creation and webhook processing.
- Reconcile provider transactions against voucher amount and currency.
- Use a transactional update or outbox to mark vouchers paid and issue receipts.
- Support failed, cancelled, expired, pending, succeeded, refunded, and disputed states.
- Record an immutable payment audit trail.
- Health-check providers and expose a non-sensitive status to the portal.

## 11. API and Data Migration Plan

### Phase 0: Contract and safety

- Add `/api/v1` routing without removing existing routes.
- Add request IDs, structured errors, validation, rate limits, and audit logging.
- Add StudentProfile linkage checks.
- Add tenant scope middleware.

### Phase 1: Identity and academics

- Backfill `StudentProfile` from valid User fields.
- Create Class, Section, Subject, TeacherAssignment, AcademicSession records.
- Map legacy `program`, `gradeOrClass`, `section`, and `roll` to canonical fields.
- Add assessment publication and marks versioning.
- Ship result selector and PDF endpoint behind a feature flag.

### Phase 2: Daily operations

- Migrate lecture/session attendance reads to dailyAttendance summaries.
- Add academic calendar working days.
- Merge diary and assignment views into one API view model.
- Add completion writes and teacher publication states.

### Phase 3: Finance and communication

- Migrate fee records from `semester`-oriented fields to billing period/month.
- Integrate one payment provider in sandbox, then production.
- Add notices, notification preferences, and outbox worker.
- Add SSE/WebSocket event stream.

### Phase 4: Cutover and cleanup

- Compare old and new view models for a defined pilot campus.
- Remove university labels from API DTOs and frontend strings.
- Deprecate `/student/portal` after all clients use versioned endpoints.
- Remove legacy direct localStorage demo behavior in production builds.

## 12. Testing and Release Gates

### Backend tests

- Tenant isolation across institute and campus.
- Student and parent relationship authorization.
- Unlinked/ambiguous profile handling.
- Assessment publication and term filtering.
- Marks component calculation and valid zero handling.
- Result PDF authorization and content snapshot.
- Daily attendance working-day calculations and risk threshold.
- Homework completion idempotency.
- Fee payment signature, idempotency, reconciliation, and duplicate webhook handling.
- Notice audience targeting.
- Outbox retry, dead-letter, and duplicate notification suppression.

### Frontend tests

- Redux bootstrap state A/B/C.
- Assessment selector updates all dependent views atomically.
- Dashboard invalidation after result, attendance, homework, fee, and notice events.
- No university terminology in rendered Student Portal content.
- Responsive table containment at 390px.
- Offline/error retry and payment pending states.
- Accessible labels, keyboard selection, focus restoration, and live announcements.

### Operational gates

- API contract tests generated from OpenAPI.
- Load test dashboard/bootstrap and result PDF endpoints.
- Security test IDOR paths for every student-scoped endpoint.
- Payment provider sandbox certification.
- Notification provider sandbox certification.
- Backup/restore drill for marks, attendance, fees, and outbox.
- Observability dashboards and alerts configured before production enablement.

## 13. Definition of Production Ready

The integration is production-ready only when:

- Every Student Portal module reads from authorized versioned APIs.
- No module silently falls back to another student's data or fake official values.
- Student, teacher, admin, and parent workflows share stable IDs for class, section, subject, assessment, attendance, and voucher records.
- Results, attendance, diary/homework, fees, notices, and notifications have publication/status state machines.
- Payment confirmation comes only from verified provider callbacks.
- Domain events are durable, retryable, observable, and deduplicated.
- All sensitive endpoints pass tenant isolation and relationship authorization tests.
- Frontend fallback states are explicit and consistent.
- PDF results and portal results are generated from the same server-authoritative view model.
- Legacy university terminology is removed from Student Portal DTOs, UI, PDF, accessibility labels, and notifications.
- Migration, rollback, backup, monitoring, and support runbooks are approved before enabling each module for a live campus.
