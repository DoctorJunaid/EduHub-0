import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  MoreVertical,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { nanoid } from "@reduxjs/toolkit";
import { useSearchParams } from "react-router-dom";
import {
  selectAssignedTeacherClasses,
  selectTeacherIdentity,
  studentsForClass,
  teacherOwnsRecord,
} from "./teacherScope";
import TeacherConfirmDialog from "./TeacherConfirmDialog";
import TeacherPagination from "./TeacherPagination";
import { dateKey, validDate } from "@/lib/dates";
import {
  assignmentDeleted,
  assignmentSaved,
  submissionGraded,
} from "@/store/Slices/assignmentsSlice";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./TeacherAssignments.css";

const get = (row, ...keys) => {
  for (const key of keys) {
    const item = row?.[key];
    if (item !== undefined && item !== null && item !== "") {
      if (typeof item === "object") {
        const text = item.name || item.title || item.className || item.code || item.label || "";
        if (text) return String(text);
      } else {
        return String(item);
      }
    }
  }
  return "";
};
const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";
const date = (value) =>
  value ? new Date(value).toLocaleDateString("en-CA") : "—";

export default function TeacherAssignments() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const classes = useSelector(selectAssignedTeacherClasses);
  const teacher = useSelector(selectTeacherIdentity);
  const assignments = useSelector((state) => state.assignments?.records || []);
  const submissions = useSelector((state) => state.submissions?.records || []);
  const students = useSelector((state) => state.students?.records || []);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [grading, setGrading] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [submissionPage, setSubmissionPage] = useState(1);
  const assignmentSaving = useRef(false);
  const teacherId = teacher?.id || "";
  const teacherName = teacher?.name || "";
  const classIds = new Set(classes.map((row) => row.id || row._id));
  const scopedAssignments = assignments.filter(
    (row) => classIds.has(row.classId) && teacherOwnsRecord(row, teacher),
  );
  const requestedSubmissionId = params.get("submissionId");
  const requestedSubmission = requestedSubmissionId
    ? submissions.find((row) => row.id === requestedSubmissionId)
    : null;
  const requestedAssignmentId = requestedSubmission?.assignmentId;
  const selected =
    scopedAssignments.find(
      (row) => row.id === (requestedAssignmentId || selectedId),
    ) || null;
  const selectedClass = classes.find(
    (row) => (row.id || row._id) === selected?.classId,
  );
  const authorizedStudentIds = new Set(
    studentsForClass(students, selectedClass || {}).map(
      (row) => row.id || row._id,
    ),
  );
  const selectedSubmissions = submissions.filter(
    (row) =>
      row.assignmentId === selected?.id &&
      authorizedStudentIds.has(row.studentId),
  );
  const requestedSubmissionAuthorized = Boolean(
    requestedSubmission &&
      selected?.id === requestedSubmission.assignmentId &&
      authorizedStudentIds.has(requestedSubmission.studentId),
  );
  useEffect(() => {
    if (requestedSubmissionAuthorized)
      setGrading({ submission: requestedSubmission, assignment: selected });
  }, [requestedSubmissionAuthorized, requestedSubmission, selected]);
  const visible = selectedSubmissions.filter((row) => {
    const student = students.find(
      (item) => (item.id || item._id) === row.studentId,
    );
    const text =
      `${student?.name || row.studentName || row.studentId} ${student?.rollNo || student?.rollNumber || ""} ${row.notes || ""}`.toLowerCase();
    return (
      (!query || text.includes(query.toLowerCase())) &&
      (!status || row.status === status)
    );
  });
  const pageSize = 8;
  const assignmentPageCount = Math.max(
    1,
    Math.ceil(scopedAssignments.length / pageSize),
  );
  const submissionPageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const selectedAssignmentIndex = scopedAssignments.findIndex(
    (row) => row.id === selected?.id,
  );
  const requestedAssignmentPage =
    requestedAssignmentId && selectedAssignmentIndex >= 0
      ? Math.floor(selectedAssignmentIndex / pageSize) + 1
      : null;
  const currentAssignmentPage =
    requestedAssignmentPage || Math.min(assignmentPage, assignmentPageCount);
  const currentSubmissionPage = Math.min(submissionPage, submissionPageCount);
  const visibleAssignments = scopedAssignments.slice(
    (currentAssignmentPage - 1) * pageSize,
    currentAssignmentPage * pageSize,
  );
  const visibleSubmissions = visible.slice(
    (currentSubmissionPage - 1) * pageSize,
    currentSubmissionPage * pageSize,
  );
  const assignmentFor = (row) => {
    const cls = classes.find((item) => (item.id || item._id) === row.classId);
    return cls
      ? `${get(cls, "subject", "title")} · Sec ${get(cls, "section", "className")}`
      : "Assigned class";
  };
  const studentFor = (row) =>
    students.find((item) => (item.id || item._id) === row.studentId);
  const gradedCount = (assignment) =>
    submissions.filter(
      (row) => row.assignmentId === assignment.id && row.status === "Graded",
    ).length;
  const submittedCount = (assignment) =>
    submissions.filter((row) => row.assignmentId === assignment.id).length;
  const saveGrade = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const score = Number(form.get("score"));
    if (
      !grading ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > grading.assignment.totalMarks
    )
      return toast.error(
        "Score must be between zero and the assignment maximum.",
      );
    const currentAssignment = scopedAssignments.find(
      (row) => row.id === grading.assignment.id,
    );
    const currentSubmission = submissions.find(
      (row) => row.id === grading.submission.id,
    );
    const currentClass = classes.find(
      (row) => (row.id || row._id) === currentAssignment?.classId,
    );
    const stillAuthorized =
      currentClass &&
      studentsForClass(students, currentClass).some(
        (row) => (row.id || row._id) === currentSubmission?.studentId,
      );
    if (!currentAssignment || !currentSubmission || !stillAuthorized)
      return toast.error(
        "This submission is no longer available in your assigned classes.",
      );
    dispatch(
      submissionGraded({
        id: grading.submission.id,
        score,
        maxMarks: grading.assignment.totalMarks,
        feedback: String(form.get("feedback") || ""),
      }),
    );
    setGrading(null);
    toast.success("Submission graded.");
  };
  const saveAssignment = (event) => {
    event.preventDefault();
    if (assignmentSaving.current) return;
    if (!teacher) return toast.error("Teacher identity is unavailable.");
    const form = new FormData(event.currentTarget);
    const classId = String(form.get("classId") || "");
    const title = String(form.get("title") || "").trim();
    const dueDate = String(form.get("dueDate") || "");
    const totalMarks = Number(form.get("totalMarks"));
    const cls = classes.find((item) => String(item.id || item._id) === classId);
    if (!cls) return toast.error("Select one of your assigned classes.");
    if (!title) return toast.error("Enter an assignment title.");
    if (!validDate(dueDate)) return toast.error("Enter a valid due date.");
    if (!Number.isFinite(totalMarks) || totalMarks <= 0)
      return toast.error("Maximum marks must be a positive number.");
    if (
      editing?.id &&
      !scopedAssignments.some(
        (row) => row.id === editing.id && teacherOwnsRecord(row, teacher),
      )
    )
      return toast.error("This assignment is no longer available for editing.");
    assignmentSaving.current = true;
    dispatch(
      assignmentSaved({
        ...editing,
        id: editing.id || nanoid(),
        classId,
        title,
        dueDate,
        totalMarks,
        description: String(form.get("description") || "").trim(),
        teacherId,
        teacherName,
        subject: get(cls, "subject", "title"),
        section: get(cls, "section", "className"),
      }),
    );
    setEditing(null);
    toast.success("Assignment saved.");
  };
  const openCreateAssignment = () => {
    assignmentSaving.current = false;
    setEditing({});
  };
  return (
    <main
      className="campus-tab-page teacher-assignments"
      aria-labelledby="teacher-assignments-title"
    >
      <h1 id="teacher-assignments-title" className="sr-only">
        Assignments &amp; Grading
      </h1>
      {scopedAssignments.length > 0 && (
        <header className="campus-toolbar teacher-assignments-toolbar">
          <div className="toolbar-left"></div>
          <div className="toolbar-right">
            <Button
              className="toolbar-btn toolbar-btn-primary"
              onClick={openCreateAssignment}
              disabled={!teacher || !classes.length}
            >
              <Plus size={14} /> Create Assignment
            </Button>
          </div>
        </header>
      )}
      {scopedAssignments.length > 0 && (
        <section className="teacher-assignment-cards" aria-label="Assignments">
          {visibleAssignments.map((assignment) => (
            <article
              className={`teacher-assignment-card ${selected?.id === assignment.id ? "selected" : ""}`}
              key={assignment.id}
            >
              <button
                type="button"
                className="teacher-assignment-card-select"
                aria-pressed={selected?.id === assignment.id}
                onClick={() => {
                  setSelectedId(assignment.id);
                  setQuery("");
                  setStatus("");
                  setSubmissionPage(1);
                }}
              >
                <span className="teacher-assignment-icon">
                  <FileText size={21} />
                </span>
                <span className="teacher-assignment-context">
                  {assignmentFor(assignment)}
                </span>
                <strong>{assignment.title}</strong>
                <span className="teacher-assignment-description">
                  {assignment.description ||
                    "Review the submitted student deliverables for this assignment."}
                </span>
              </button>
              <footer>
                <span>
                  Due: <b>{date(assignment.dueDate)}</b>
                </span>
                <em>
                  {submittedCount(assignment)} Submitted (
                  {gradedCount(assignment)} Graded)
                </em>
              </footer>
              {teacherOwnsRecord(assignment, teacher) && (
                <span className="teacher-assignment-card-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${assignment.title}`}
                    onClick={() => {
                      assignmentSaving.current = false;
                      setEditing(assignment);
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${assignment.title}`}
                    onClick={() => {
                      if (submittedCount(assignment)) {
                        toast.error(
                          "Assignments with student submissions cannot be deleted.",
                        );
                        return;
                      }
                      setDeleteTarget(assignment);
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </span>
              )}
            </article>
          ))}
        </section>
      )}
      {!scopedAssignments.length && (
        <div className="teacher-assignments-section-container">
          <section className="teacher-assignment-empty-state" aria-live="polite">
            <span className="teacher-assignment-empty-icon">
              <FileText size={24} />
            </span>
            <h2>
              {classes.length
                ? "No assignments yet"
                : "No assigned classes available"}
            </h2>
            <p>
              {classes.length
                ? "Create an assignment for one of your assigned classes to start collecting student submissions."
                : "Assignments can be created after a class is assigned to your teacher account."}
            </p>
            <Button
              className="toolbar-btn toolbar-btn-primary"
              onClick={openCreateAssignment}
              disabled={!teacher || !classes.length}
            >
              <Plus size={14} /> Create Assignment
            </Button>
          </section>
        </div>
      )}
      {scopedAssignments.length > 0 && (
        <TeacherPagination
          page={currentAssignmentPage}
          pageCount={assignmentPageCount}
          onPageChange={setAssignmentPage}
          label="Assignment pages"
        />
      )}
      {selected && (
        <section className="campus-table-container teacher-submissions-card">
          <header className="campus-toolbar">
            <div className="toolbar-left">
              <strong style={{ fontSize: "14px" }}>Submissions for “{selected.title}”</strong>
              <span className="text-muted" style={{ fontSize: "12px", marginLeft: "8px" }}>
                Max Marks: {selected?.totalMarks ?? "—"} <span>•</span> Due
                Date: {date(selected?.dueDate)}
              </span>
            </div>
            <div className="toolbar-right teacher-submission-tools">
              <label className="toolbar-search">
                <Search size={14} />
                <span className="sr-only">Search students or submissions</span>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSubmissionPage(1);
                  }}
                  placeholder="Search students or submissions..."
                />
              </label>
              <select
                className="toolbar-select"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setSubmissionPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Graded">Graded</option>
              </select>
            </div>
          </header>
          <div className="teacher-submissions-wrap" style={{ flex: 1, overflowY: "auto" }}>
            <table className="campus-data-table teacher-table" style={{ width: "100%", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th>Student &amp; Roll No</th>
                  <th>Submission Content</th>
                  <th>Submitted At</th>
                  <th>Score / Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubmissions.map((row) => {
                  const student = studentFor(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="teacher-submission-student">
                          <span className="teacher-avatar">
                            {initials(student?.name || row.studentName)}
                          </span>
                          <strong>
                            {student?.name || row.studentName || row.studentId}
                          </strong>
                        </span>
                        <small>
                          {student?.rollNo ||
                            student?.rollNumber ||
                            "Roll number unavailable"}
                        </small>
                      </td>
                      <td>
                        <span className="teacher-submission-notes">
                          {row.notes || "No submission content provided."}
                        </span>
                        {row.url && (
                          <a href={row.url} target="_blank" rel="noreferrer">
                            View Attached Deliverable
                          </a>
                        )}
                      </td>
                      <td>{row.submittedAt || row.submissionDate || "—"}</td>
                      <td>
                        {row.status === "Graded"
                          ? `${row.score} / ${selected?.totalMarks ?? "—"}`
                          : "Ungraded"}
                      </td>
                      <td>
                        <span
                          className={`campus-status-pill ${row.status === "Graded" ? "is-active" : "is-pending"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <div className="teacher-submission-actions">
                          {row.status !== "Graded" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setGrading({
                                  submission: row,
                                  assignment: selected,
                                })
                              }
                            >
                              Grade Now
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="teacher-action-trigger"
                                aria-label="Submission actions"
                              >
                                <MoreVertical size={17} aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              sideOffset={6}
                              collisionPadding={12}
                              className="teacher-action-menu"
                            >
                              <DropdownMenuItem
                                className="teacher-action-item"
                                onSelect={() =>
                                  setGrading({
                                    submission: row,
                                    assignment: selected,
                                  })
                                }
                              >
                                <Pencil size={16} aria-hidden="true" />
                                {row.status === "Graded"
                                  ? "Edit Grade"
                                  : "Grade Now"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!visible.length && (
              <div className="teacher-assignments-empty">
                {selectedSubmissions.length
                  ? "No submissions match the selected filters."
                  : "No submissions have been received for this assignment yet."}
              </div>
            )}
          </div>
          <footer className="teacher-assignments-footer">
            Showing{" "}
            {visibleSubmissions.length
              ? (currentSubmissionPage - 1) * pageSize + 1
              : 0}
            –{Math.min(currentSubmissionPage * pageSize, visible.length)} of{" "}
            {visible.length} matching records
            <TeacherPagination
              page={currentSubmissionPage}
              pageCount={submissionPageCount}
              onPageChange={setSubmissionPage}
              label="Submission pages"
            />
          </footer>
        </section>
      )}
      {scopedAssignments.length > 0 && !selected && (
        <section
          className="teacher-assignment-selection-state"
          aria-live="polite"
        >
          <FileText size={24} />
          <div>
            <h2>Select an assignment</h2>
            <p>Select an assignment card to view and grade its submissions.</p>
          </div>
        </section>
      )}
      <Dialog
        open={Boolean(grading)}
        onOpenChange={(open) => !open && setGrading(null)}
      >
        <DialogContent className="teacher-dialog teacher-dialog-compact">
          <DialogHeader>
            <DialogTitle>Grade submission</DialogTitle>
            <DialogDescription>
              {grading?.submission?.studentName ||
                grading?.submission?.studentId}{" "}
              · {grading?.assignment?.title} · Maximum{" "}
              {grading?.assignment?.totalMarks ?? "—"} marks
            </DialogDescription>
          </DialogHeader>
          {grading && (
            <form className="teacher-grade-form" onSubmit={saveGrade}>
              <div className="teacher-dialog-body">
                <div className="teacher-submission-review">
                  <strong>Submitted work</strong>
                  <p>
                    {grading.submission.notes ||
                      "No written submission was provided."}
                  </p>
                  {grading.submission.url && (
                    <a
                      href={grading.submission.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View attached deliverable
                    </a>
                  )}
                </div>
                <label>
                  Score
                  <input
                    name="score"
                    type="number"
                    min="0"
                    max={grading.assignment.totalMarks}
                    required
                    defaultValue={grading.submission.score ?? ""}
                  />
                </label>
                <label>
                  Feedback
                  <textarea
                    name="feedback"
                    rows="4"
                    defaultValue={grading.submission.feedback || ""}
                  />
                </label>
              </div>
              <DialogFooter className="teacher-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGrading(null)}
                >
                  Cancel
                </Button>
                <Button className="toolbar-btn toolbar-btn-primary" type="submit">
                  Save Grade
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            assignmentSaving.current = false;
            setEditing(null);
          }
        }}
      >
        <DialogContent className="teacher-dialog teacher-assignment-dialog">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit assignment" : "Create assignment"}
            </DialogTitle>
            <DialogDescription>
              Assignments are visible to students enrolled in the selected
              assigned class.
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <form className="teacher-grade-form" onSubmit={saveAssignment}>
              <div className="teacher-dialog-body teacher-dialog-grid">
                <label className="teacher-dialog-field-full">
                  Assigned class
                  <select
                    name="classId"
                    defaultValue={
                      editing.classId || classes[0]?.id || classes[0]?._id || ""
                    }
                    required
                  >
                    {classes.map((item) => (
                      <option
                        key={item.id || item._id}
                        value={item.id || item._id}
                      >
                        {get(item, "subject", "title")} -{" "}
                        {get(item, "section", "className")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="teacher-dialog-field-full">
                  Title
                  <input
                    name="title"
                    required
                    defaultValue={editing.title || ""}
                  />
                </label>
                <label>
                  Due date
                  <input
                    name="dueDate"
                    type="date"
                    required
                    min={editing.dueDate || dateKey(new Date())}
                    defaultValue={editing.dueDate || ""}
                  />
                </label>
                <label>
                  Total marks
                  <input
                    name="totalMarks"
                    type="number"
                    min="1"
                    required
                    defaultValue={editing.totalMarks || 50}
                  />
                </label>
                <label className="teacher-dialog-field-full">
                  Description
                  <textarea
                    name="description"
                    rows="3"
                    defaultValue={editing.description || ""}
                  />
                </label>
              </div>
              <DialogFooter className="teacher-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    assignmentSaving.current = false;
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
                <Button className="toolbar-btn toolbar-btn-primary" type="submit">
                  Save Assignment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <TeacherConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete assignment?"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This assignment has no student submissions.`
            : ""
        }
        confirmText="Delete Assignment"
        onConfirm={() => {
          const current = scopedAssignments.find(
            (row) =>
              row.id === deleteTarget?.id && teacherOwnsRecord(row, teacher),
          );
          if (current) dispatch(assignmentDeleted(current.id));
          else
            toast.error("This assignment is no longer available for deletion.");
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
