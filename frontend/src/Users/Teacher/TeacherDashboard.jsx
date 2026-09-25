import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coins,
  FileText,
  Search,
  Users,
} from "lucide-react";
import {
  selectAssignedTeacherClasses,
  selectStudentsForAssignedClasses,
  selectTeacherIdentity,
} from "./teacherScope";
import { getTodayClasses, getMySummary, markSessionStatus } from "@/api/classSession.api";
import { Button } from "@/components/ui/button";
import { SpinnerCustom } from "@/components/ui/spinner";
import toast from "react-hot-toast";
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
  const [todaySessions, setTodaySessions] = useState([]);
  const [creditSummary, setCreditSummary] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchLiveCredits = async () => {
    try {
      setLoadingSessions(true);
      const [todayRes, sumRes] = await Promise.all([
        getTodayClasses(),
        getMySummary({ month: new Date().toISOString().slice(0, 7) }),
      ]);
      if (todayRes.data?.success) setTodaySessions(todayRes.data.data || []);
      if (sumRes.data?.success) setCreditSummary(sumRes.data.data || null);
    } catch {
      // Fallback gracefully
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchLiveCredits();
  }, []);

  const handleQuickComplete = async (sessionId) => {
    try {
      const res = await markSessionStatus(sessionId, { status: "Completed" });
      if (res.data?.success) {
        toast.success("Teaching credit recorded!");
        fetchLiveCredits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark class completed.");
    }
  };

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
    [Award, "Monthly Credits", creditSummary?.totalCredits ?? "—"],
    [Coins, "Bonus Earned", `PKR ${(creditSummary?.totalBonusEarned || 0).toLocaleString()}`],
    [BookOpen, "Assigned Courses", assignedCourseCount],
    [FileText, "Pending Submissions", pending.length],
    [Users, "Enrolled Students", enrolledStudentCount],
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
        <Link to="/teacher/credits" className="font-bold text-blue-700 bg-blue-50/80 border border-blue-200">
          <Award size={17} /> My Teaching Credits &amp; Sessions
        </Link>
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

      {/* Today's Teaching Credits Table */}
      <section className="teacher-table-card">
        <header>
          <div>
            <h2>Today's Teaching Credits &amp; Periods</h2>
            <p>Fulfill assigned lecture periods to accrue monthly teaching credits &amp; bonuses</p>
          </div>
          <div className="teacher-table-tools">
            <Button variant="outline" asChild>
              <Link to="/teacher/credits">All Credit Records →</Link>
            </Button>
          </div>
        </header>
        <div className="teacher-table-wrap">
          {loadingSessions ? (
            <div className="p-8 flex items-center justify-center">
              <SpinnerCustom text="Loading today's periods..." size="default" />
            </div>
          ) : todaySessions.length === 0 ? (
            <EmptyRow text="No teaching classes scheduled for today." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Period &amp; Time</th>
                  <th>Class &amp; Section</th>
                  <th>Subject</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Credits</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {todaySessions.map((sess) => (
                  <tr key={sess._id}>
                    <td>
                      <strong>Period {sess.period}</strong> ({sess.startTime} – {sess.endTime})
                    </td>
                    <td>{sess.className} {sess.section ? `(${sess.section})` : ""}</td>
                    <td><strong>{sess.subject}</strong></td>
                    <td>
                      {sess.isSubstituteDuty ? (
                        <span className="text-purple-700 font-semibold">Substitution Duty</span>
                      ) : sess.isSubstitutedOut ? (
                        <span className="text-amber-700 font-semibold">Substituted Out</span>
                      ) : (
                        <span>Assigned Teacher</span>
                      )}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        sess.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : sess.status === "Missed" || sess.status === "Absent"
                          ? "bg-rose-100 text-rose-800"
                          : sess.status === "Substituted"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {sess.status}
                      </span>
                    </td>
                    <td>
                      {sess.status === "Completed" ? (
                        <strong className="text-emerald-700">+{sess.creditValue || 1} Cr</strong>
                      ) : sess.deductionValue > 0 ? (
                        <strong className="text-rose-600">-PKR {sess.deductionValue}</strong>
                      ) : (
                        <span className="text-slate-400">1 Cr pending</span>
                      )}
                    </td>
                    <td>
                      {sess.status === "Scheduled" && !sess.isSubstitutedOut && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-3 text-xs"
                          onClick={() => handleQuickComplete(sess._id)}
                        >
                          <CheckCircle2 size={13} className="mr-1" /> Mark Done
                        </Button>
                      )}
                      {sess.status === "Completed" && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                      {(sess.status === "Missed" || sess.status === "Absent") && (
                        <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                          <Link to="/teacher/credits">Review Dispute</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
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
