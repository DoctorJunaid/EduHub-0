import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Clock3,
  FileText,
  Search,
  Users,
} from "lucide-react";
import {
  selectAssignedTeacherClasses,
  selectStudentsForAssignedClasses,
  selectTeacherIdentity,
} from "./teacherScope";
import { Button } from "@/components/ui/button";
import "./TeacherDashboard.css";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";

export default function TeacherDashboard() {
  const classes = useSelector(selectAssignedTeacherClasses);
  const teacher = useSelector(selectTeacherIdentity);
  const enrolledStudents = useSelector(selectStudentsForAssignedClasses);
  const assignments = useSelector((state) => state.assignments?.records || []);
  const submissions = useSelector((state) => state.submissions?.records || []);
  const diary = useSelector((state) => state.diary?.records || []);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const teacherId = teacher?.id;
  const classIds = new Set(classes.map((item) => item.id || item._id));
  const filteredClasses = classes.filter((item) =>
    `${item.title || ""} ${item.subject || ""} ${item.className || ""} ${item.section || ""} ${item.room || ""} ${item.teacherName || item.instructor || ""} ${(item.days || []).join(" ")} ${item.dayOfWeek || ""} ${item.startTime || ""} ${item.endTime || ""}`
      .toLowerCase()
      .includes(scheduleSearch.toLowerCase()),
  );
  const assignedCourseCount = new Set(
    classes
      .map((item) => item.courseId || item.subjectId || item.title || item.subject)
      .filter(Boolean),
  ).size;
  const assignedAssignments = assignments.filter((assignment) => classIds.has(assignment.classId));
  const assignedAssignmentIds = new Set(assignedAssignments.map((assignment) => assignment.id));
  const pending = submissions.filter(
    (item) => item.status === "Submitted" && assignedAssignmentIds.has(item.assignmentId),
  );
  const assignmentTitle = (submission) =>
    assignedAssignments.find((assignment) => assignment.id === submission.assignmentId)?.title ||
    submission.assignmentTitle ||
    submission.assignmentId;
  const filteredSubmissions = pending.filter((item) =>
    `${item.studentName || item.studentId} ${assignmentTitle(item)}`
      .toLowerCase()
      .includes(submissionSearch.toLowerCase()),
  );
  const enrolledStudentCount = enrolledStudents.length;
  const metric = [
    [BookOpen, "Assigned Courses", assignedCourseCount],
    [FileText, "Pending Submissions", pending.length],
    [Users, "Enrolled Students", enrolledStudentCount],
    [
      Clock3,
      "Daily Diaries Posted",
      diary.filter(
        (item) => classIds.has(item.classId) && item.teacherId === teacherId,
      ).length,
    ],
  ];

  return (
    <main
      className="teacher-dashboard"
      aria-labelledby="teacher-dashboard-title"
    >
      <h1 id="teacher-dashboard-title" className="sr-only">Teacher Overview</h1>
      <section className="teacher-metrics" aria-label="Teaching summary">
        {metric.map(([Icon, label, value]) => (
          <article className="teacher-metric" key={label}>
            <Icon size={22} aria-hidden="true" />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>
      <nav className="teacher-quick-actions" aria-label="Teacher quick actions">
        <Link to="/teacher/assignments">
          <ClipboardList size={17} /> Assignments &amp; Grading
        </Link>
        <Link to="/teacher/attendance">
          <CalendarCheck size={17} /> Take Student Attendance
        </Link>
        <Link to="/teacher/diary">
          <FileText size={17} /> Daily Lecture Diary
        </Link>
        <Link to="/teacher/gradebook">
          <BookOpen size={17} /> Exam Marks &amp; Gradebook
        </Link>
      </nav>
      <TeacherTable
        title="My Teaching Schedule & Classes"
        subtitle="Assigned weekly lectures and room allocations"
        search={scheduleSearch}
        setSearch={setScheduleSearch}
        placeholder="Search classes or subjects..."
        actionLabel="Mark Attendance Now"
        actionTo="/teacher/attendance"
      >
        <table>
          <thead>
            <tr>
              <th>Course / Subject</th>
              <th>Section / Batch</th>
              <th>Day &amp; Time Routine</th>
              <th>Room / Lab</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map((item) => (
              <tr key={item.id || item._id}>
                <td>
                  <strong>
                    {item.title || item.subject || "Untitled class"}
                  </strong>
                </td>
                <td>{item.section || item.className || item.program || "—"}</td>
                <td>
                  <Clock3 size={15} />{" "}
                  {(item.days || [item.dayOfWeek]).filter(Boolean).join(", ")}{" "}
                  {item.startTime
                    ? `${item.startTime} – ${item.endTime || ""}`
                    : ""}
                </td>
                <td>{item.room || item.roomNumber || "—"}</td>
                <td>
                  <Link
                    to={`/teacher/attendance?classId=${encodeURIComponent(item.id || item._id)}`}
                  >
                    Attendance
                  </Link>
                  <Link to={`/teacher/diary?classId=${encodeURIComponent(item.id || item._id)}`}>
                    Diary
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredClasses.length && (
          <EmptyRow text="No assigned classes are available yet." />
        )}
      </TeacherTable>
      <TeacherTable
        title="Pending Assignment Submissions"
        subtitle="Review and grade student deliverables"
        search={submissionSearch}
        setSearch={setSubmissionSearch}
        placeholder="Search students or assignments..."
        actionLabel="All Submissions"
        actionTo="/teacher/assignments"
      >
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment Title</th>
              <th>Submission Date</th>
              <th>Status</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="teacher-student">
                    <span className="teacher-avatar">
                      {initials(item.studentName)}
                    </span>
                    <strong>{item.studentName || item.studentId}</strong>
                  </span>
                </td>
                <td>{assignmentTitle(item)}</td>
                <td>{item.submittedAt || item.submissionDate || "—"}</td>
                <td>
                  <span className="teacher-status">Needs Grading</span>
                </td>
                <td>—</td>
                <td>
                  <Button size="sm" asChild>
                    <Link to={`/teacher/assignments?submissionId=${encodeURIComponent(item.id)}`}>
                      Evaluate
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredSubmissions.length && (
          <EmptyRow text="No pending submissions are available." />
        )}
      </TeacherTable>
    </main>
  );
}

function TeacherTable({
  title,
  subtitle,
  search,
  setSearch,
  placeholder,
  actionLabel,
  actionTo,
  children,
}) {
  return (
    <section className="teacher-table-card">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="teacher-table-tools">
          <label>
            <Search size={16} />
            <span className="sr-only">{placeholder}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
            />
          </label>
          <Button variant="outline" asChild>
            <Link to={actionTo}>{actionLabel} →</Link>
          </Button>
        </div>
      </header>
      <div className="teacher-table-wrap">{children}</div>
    </section>
  );
}
function EmptyRow({ text }) {
  return (
    <div className="teacher-empty">
      <span>{text}</span>
    </div>
  );
}
