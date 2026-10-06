import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  CalendarDays,
  FileText,
  BookOpen,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  GraduationCap,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { selectStudentAssignments } from "@/store/selectors/studentAssignments";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { selectStudentDiary } from "@/store/selectors/studentDiary";
import { assignmentAction } from "@/store/assignmentData";
import AssignmentStatusBadge from "../../components/AssignmentStatusBadge";
import AssignmentSubmissionForm from "../../components/AssignmentSubmissionForm";
import AssignmentFeedbackDialog from "../../components/AssignmentFeedbackDialog";
import StudentDiaryEntry from "../../components/StudentDiaryEntry";
import axiosInstance from "@/api/axiosInstance";
import { assignmentsLoaded, submissionsLoaded } from "@/store/Slices/assignmentsSlice";
import { diaryLoaded } from "@/store/Slices/diarySlice";
import { schedulesLoaded } from "@/store/Slices/timetableSlice";
import "./StudentAssignments.css";

function AssignmentAction({ assignment }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={
            assignment.status === "Pending Submission" ? "default" : "outline"
          }
          size="sm"
          className="sa-action-btn"
          aria-label={`${assignmentAction(assignment.status)}: ${assignment.title}`}
        >
          {assignmentAction(assignment.status)}
        </Button>
      </DialogTrigger>
      {open &&
        (assignment.status === "Graded" ? (
          <AssignmentFeedbackDialog assignment={assignment} />
        ) : (
          <AssignmentSubmissionForm
            assignment={assignment}
            onSaved={() => setOpen(false)}
          />
        ))}
    </Dialog>
  );
}

export default function StudentAssignments() {
  const dispatch = useDispatch();
  const assignments = useSelector(selectStudentAssignments);
  const diaryEntries = useSelector(selectStudentDiary);
  const student = useSelector(selectCurrentStudent);

  const [activeTab, setActiveTab] = useState("all"); // "all", "diary", "pending", "completed"
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await axiosInstance.get("/student/portal");
      const portal = data?.data || {};
      if (portal.assignments) dispatch(assignmentsLoaded(portal.assignments));
      if (portal.submissions) dispatch(submissionsLoaded(portal.submissions));
      if (portal.diary) dispatch(diaryLoaded(portal.diary));
      if (portal.schedules) dispatch(schedulesLoaded(portal.schedules));
    } catch {
      // Keep existing state on error
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      !normalizedQuery ||
      item.title?.toLowerCase().includes(normalizedQuery) ||
      item.subject?.toLowerCase().includes(normalizedQuery) ||
      item.description?.toLowerCase().includes(normalizedQuery);

    if (!matchesSearch) return false;
    if (activeTab === "pending") return item.status === "Pending Submission";
    if (activeTab === "completed") return item.status === "Submitted" || item.status === "Graded";
    return true;
  });

  const filteredDiary = diaryEntries.filter((item) => {
    return (
      !normalizedQuery ||
      item.title?.toLowerCase().includes(normalizedQuery) ||
      item.subject?.toLowerCase().includes(normalizedQuery) ||
      item.homework?.toLowerCase().includes(normalizedQuery) ||
      item.instructor?.toLowerCase().includes(normalizedQuery)
    );
  });

  const pendingCount = assignments.filter((a) => a.status === "Pending Submission").length;
  const completedCount = assignments.filter((a) => a.status === "Submitted" || a.status === "Graded").length;

  return (
    <section className="student-assignments">
      {/* Top Header & Overview */}
      <div className="sa-header-wrapper">
        <div className="sa-header-main">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Daily Diary &amp; Homework Portal
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Live academic stream from your subject teachers &amp; class instructors
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="sa-sync-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync Live Updates"}
          </Button>
        </div>

        {/* Metric KPI Cards */}
        <div className="sa-kpi-grid">
          <Card className="sa-kpi-card">
            <div className="sa-kpi-icon-wrap bg-amber-500/10 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div className="sa-kpi-info">
              <span className="sa-kpi-num">{pendingCount}</span>
              <span className="sa-kpi-label">Pending Tasks</span>
            </div>
          </Card>

          <Card className="sa-kpi-card">
            <div className="sa-kpi-icon-wrap bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="sa-kpi-info">
              <span className="sa-kpi-num">{completedCount}</span>
              <span className="sa-kpi-label">Submitted / Graded</span>
            </div>
          </Card>

          <Card className="sa-kpi-card">
            <div className="sa-kpi-icon-wrap bg-blue-500/10 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="sa-kpi-info">
              <span className="sa-kpi-num">{diaryEntries.length}</span>
              <span className="sa-kpi-label">Daily Diary Notes</span>
            </div>
          </Card>

          <Card className="sa-kpi-card">
            <div className="sa-kpi-icon-wrap bg-purple-500/10 text-purple-600">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="sa-kpi-info">
              <span className="sa-kpi-num">
                {student?.gradeOrClass || student?.program || "Class 9"}
              </span>
              <span className="sa-kpi-label">Section {student?.section || "A"}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="sa-controls-row">
        <div className="sa-tab-pills">
          <button
            type="button"
            className={`sa-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Tasks ({assignments.length})
          </button>
          <button
            type="button"
            className={`sa-tab-btn ${activeTab === "diary" ? "active" : ""}`}
            onClick={() => setActiveTab("diary")}
          >
            Daily Diary Stream ({diaryEntries.length})
          </button>
          <button
            type="button"
            className={`sa-tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Tasks ({pendingCount})
          </button>
          <button
            type="button"
            className={`sa-tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="sa-search-wrap">
          <Search className="w-4 h-4 text-muted-foreground ml-3" />
          <Input
            placeholder="Search by subject, topic or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab !== "diary" && (
        <Card className="sa-card">
          <div className="sa-card-heading">
            <h2>
              <span>
                <FileText aria-hidden="true" />
              </span>
              Active Course Tasks &amp; Homework Assignments
            </h2>
            <p className="sa-count-tag">{filteredAssignments.length} assignments found</p>
          </div>

          <div className="sa-table-container">
            <Table aria-label="Course assignments and submissions">
              <TableHeader>
                <TableRow>
                  {[
                    "Assignment Title & Subject",
                    "Due Date",
                    "Total Marks",
                    "Submission Status",
                    "Score / Feedback",
                    "Action",
                  ].map((title) => (
                    <TableHead key={title} scope="col">
                      {title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id} className="sa-table-row">
                    <TableCell>
                      <div className="sa-title-cell">
                        <strong className="sa-task-title">{assignment.title}</strong>
                        <div className="sa-subject-tag-row">
                          <span className="sa-badge-sub">{assignment.subject}</span>
                          {assignment.section && (
                            <span className="sa-badge-sec">Sec {assignment.section}</span>
                          )}
                        </div>
                        {assignment.description && (
                          <p className="sa-task-desc">{assignment.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.dueDate ? (
                        <span className="sa-date">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          <time dateTime={assignment.dueDate}>{assignment.dueDate}</time>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Due date not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="sa-marks-pill">
                        {assignment.totalMarks == null
                          ? "—"
                          : `${assignment.totalMarks} Pts`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AssignmentStatusBadge status={assignment.status} />
                    </TableCell>
                    <TableCell
                      className={assignment.status === "Graded" ? "sa-score font-semibold" : ""}
                    >
                      {assignment.scoreLabel}
                    </TableCell>
                    <TableCell>
                      <AssignmentAction assignment={assignment} />
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredAssignments.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="sa-empty">
                      <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                      <h3>No assignments available.</h3>
                      <p>
                        {student
                          ? "Assignments published by your teachers for Class " +
                            (student.gradeOrClass || "9") +
                            " will appear here automatically."
                          : "Your assignments will appear when your student profile is loaded."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Daily Diary Stream */}
      {(activeTab === "all" || activeTab === "diary") && (
        <Card className="sa-card sa-diary-stream">
          <div className="sa-card-heading">
            <h2>
              <span className="sa-diary-icon-bg">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </span>
              Daily Diary &amp; Teacher Lecture Notes
            </h2>
            <p className="sa-count-tag">{filteredDiary.length} published notes</p>
          </div>
          <div className="sa-diary-list" aria-live="polite">
            {filteredDiary.map((entry) => (
              <StudentDiaryEntry key={entry.id} entry={entry} />
            ))}
            {!filteredDiary.length && (
              <div className="sa-diary-empty-card">
                <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p>Diary notes and homework will appear here when published by your class teacher.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}

