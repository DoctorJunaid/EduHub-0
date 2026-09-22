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

const get = (row, ...keys) =>
  keys
    .map((key) => row?.[key])
    .find((item) => item !== undefined && item !== null && item !== "") || "";
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
  const scopedAssignments = assignments.filter((row) =>
    classIds.has(row.classId),
  );
  const requestedSubmissionId = params.get("submissionId");
  const requestedSubmission = requestedSubmissionId
    ? submissions.find((row) => row.id === requestedSubmissionId)
    : null;
  const requestedAssignmentId = requestedSubmission?.assignmentId;
  const selected =
    scopedAssignments.find(
      (row) => row.id === (requestedAssignmentId || selectedId),
    ) || scopedAssignments[0];
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
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected?.id, selectedId]);
  useEffect(() => {
    if (
      requestedSubmission &&
      selected?.id === requestedSubmission.assignmentId &&
      authorizedStudentIds.has(requestedSubmission.studentId)
    )
      setGrading({ submission: requestedSubmission, assignment: selected });
  }, [requestedSubmission?.id, selected?.id]);
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
  const assignmentPageCount = Math.max(1, Math.ceil(scopedAssignments.length / pageSize));
  const submissionPageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const selectedAssignmentIndex = scopedAssignments.findIndex((row) => row.id === selected?.id);
  const visibleAssignments = scopedAssignments.slice((assignmentPage - 1) * pageSize, assignmentPage * pageSize);
  const visibleSubmissions = visible.slice((submissionPage - 1) * pageSize, submissionPage * pageSize);
  useEffect(() => setAssignmentPage((page) => Math.min(page, assignmentPageCount)), [assignmentPageCount]);
  useEffect(() => { if (selectedAssignmentIndex >= 0) setAssignmentPage(Math.floor(selectedAssignmentIndex / pageSize) + 1); }, [selectedAssignmentIndex]);
  useEffect(() => setSubmissionPage((page) => Math.min(page, submissionPageCount)), [submissionPageCount]);
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
    const currentAssignment = scopedAssignments.find((row) => row.id === grading.assignment.id);
    const currentSubmission = submissions.find((row) => row.id === grading.submission.id);
    const currentClass = classes.find((row) => (row.id || row._id) === currentAssignment?.classId);
    const stillAuthorized = currentClass && studentsForClass(students, currentClass).some((row) => (row.id || row._id) === currentSubmission?.studentId);
    if (!currentAssignment || !currentSubmission || !stillAuthorized) return toast.error('This submission is no longer available in your assigned classes.');
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
    if (editing?.id && !scopedAssignments.some((row) => row.id === editing.id && row.teacherId === teacherId)) return toast.error("This assignment is no longer available for editing.");
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
  return (
    <main
      className="teacher-assignments"
      aria-labelledby="teacher-assignments-title"
    >
      <header className="teacher-assignments-toolbar">
        <h1 id="teacher-assignments-title" className="sr-only">Assignments &amp; Grading</h1>
        <Button className="teacher-primary-action"
          onClick={() => { assignmentSaving.current = false; setEditing({}); }}
          disabled={!teacher || !classes.length}
        >
          <Plus size={17} /> Create Assignment
        </Button>
      </header>
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
            {assignment.teacherId === teacherId && (
              <span className="teacher-assignment-card-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${assignment.title}`}
                  onClick={() => { assignmentSaving.current = false; setEditing(assignment); }}
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
                      toast.error("Assignments with student submissions cannot be deleted.");
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
        {!scopedAssignments.length && (
          <div className="teacher-assignments-empty">
            {classes.length
              ? "No assignments have been created for your assigned classes."
              : "No assigned classes are available."}
          </div>
        )}
      </section>
      <TeacherPagination page={assignmentPage} pageCount={assignmentPageCount} onPageChange={setAssignmentPage} label="Assignment pages" />
      <section className="teacher-submissions-card">
        <header>
          <div>
            <h2>
              Submissions for “{selected?.title || "Selected Assignment"}”
            </h2>
            <p>
              Max Marks: {selected?.totalMarks ?? "—"} <span>•</span> Due Date:{" "}
              {date(selected?.dueDate)}
            </p>
          </div>
          <div className="teacher-submission-tools">
            <label>
              <Search size={16} />
              <span className="sr-only">Search students or submissions</span>
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setSubmissionPage(1); }}
                placeholder="Search students or submissions..."
              />
            </label>
            <select
              value={status}
              onChange={(event) => { setStatus(event.target.value); setSubmissionPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Graded">Graded</option>
            </select>
          </div>
        </header>
        <div className="teacher-submissions-wrap">
          <table>
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
                        className={`teacher-assignment-status ${row.status.toLowerCase()}`}
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
                              aria-label="Submission actions"
                            >
                              <MoreVertical size={17} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                setGrading({
                                  submission: row,
                                  assignment: selected,
                                })
                              }
                            >
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
              {selected
                ? "No submissions match the selected filters."
                : "No assignments are available for this Teacher."}
            </div>
          )}
        </div>
        <footer className="teacher-assignments-footer">
          Showing {visibleSubmissions.length ? (submissionPage - 1) * pageSize + 1 : 0}–{Math.min(submissionPage * pageSize, visible.length)} of {visible.length} matching records
          <TeacherPagination page={submissionPage} pageCount={submissionPageCount} onPageChange={setSubmissionPage} label="Submission pages" />
        </footer>
      </section>
      <Dialog
        open={Boolean(grading)}
        onOpenChange={(open) => !open && setGrading(null)}
      >
        <DialogContent className="teacher-dialog">
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
                  <p>{grading.submission.notes || "No written submission was provided."}</p>
                  {grading.submission.url && <a href={grading.submission.url} target="_blank" rel="noreferrer">View attached deliverable</a>}
                </div>
                <label>
                  Score
                  <input name="score" type="number" min="0" max={grading.assignment.totalMarks} required defaultValue={grading.submission.score ?? ""} />
                </label>
                <label>
                  Feedback
                  <textarea name="feedback" rows="4" defaultValue={grading.submission.feedback || ""} />
                </label>
              </div>
              <DialogFooter className="teacher-dialog-footer">
                <Button type="button" variant="outline" onClick={() => setGrading(null)}>Cancel</Button>
                <Button className="teacher-primary-action" type="submit">Save Grade</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => { if (!open) { assignmentSaving.current = false; setEditing(null); } }}
      >
        <DialogContent className="teacher-dialog">
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
              <div className="teacher-dialog-body">
                <label>
                  Assigned class
                  <select name="classId" defaultValue={editing.classId || classes[0]?.id || classes[0]?._id || ""} required>
                    {classes.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{get(item, "subject", "title")} - {get(item, "section", "className")}</option>)}
                  </select>
                </label>
                <label>Title<input name="title" required defaultValue={editing.title || ""} /></label>
                <label>Due date<input name="dueDate" type="date" required min={editing.dueDate || dateKey(new Date())} defaultValue={editing.dueDate || ""} /></label>
                <label>Total marks<input name="totalMarks" type="number" min="1" required defaultValue={editing.totalMarks || 50} /></label>
                <label>Description<textarea name="description" rows="3" defaultValue={editing.description || ""} /></label>
              </div>
              <DialogFooter className="teacher-dialog-footer">
                <Button type="button" variant="outline" onClick={() => { assignmentSaving.current = false; setEditing(null); }}>Cancel</Button>
                <Button className="teacher-primary-action" type="submit">Save Assignment</Button>
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
          const current = scopedAssignments.find((row) => row.id === deleteTarget?.id && row.teacherId === teacherId);
          if (current) dispatch(assignmentDeleted(current.id));
          else toast.error('This assignment is no longer available for deletion.');
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
