import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileText, MoreVertical, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { nanoid } from "@reduxjs/toolkit";
import { Link } from "react-router-dom";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectTimetable } from "@/store/Slices/timetableSlice";
import { assignmentDeleted, assignmentSaved, submissionGraded } from "@/store/Slices/assignmentsSlice";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const user = useSelector(selectCurrentUser);
  const timetable = useSelector(selectTimetable);
  const assignments = useSelector((state) => state.assignments?.records || []);
  const submissions = useSelector((state) => state.submissions?.records || []);
  const students = useSelector((state) => state.students?.records || []);
  const [selectedId, setSelectedId] = useState(assignments[0]?.id || "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [grading, setGrading] = useState(null);
  const [editing, setEditing] = useState(null);
  const teacherId = user?.id || user?._id;
  const teacherName = user?.name || user?.fullName;
  const classes = useMemo(
    () =>
      timetable.filter(
        (row) =>
          (teacherId || teacherName) && (row.teacherId === teacherId ||
          row.instructorId === teacherId ||
          row.instructor === teacherName ||
          row.teacherName === teacherName),
      ),
    [timetable, teacherId, teacherName],
  );
  const classIds = new Set(classes.map((row) => row.id || row._id));
  const scopedAssignments = assignments.filter(
    (row) => classIds.size === 0 || classIds.has(row.classId),
  );
  const selected =
    scopedAssignments.find((row) => row.id === selectedId) ||
    scopedAssignments[0];
  const selectedSubmissions = submissions.filter(
    (row) => row.assignmentId === selected?.id,
  );
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
      !Number.isFinite(score) ||
      score < 0 ||
      score > grading.assignment.totalMarks
    )
      return;
    dispatch(
      submissionGraded({
        id: grading.submission.id,
        score,
        feedback: String(form.get("feedback") || ""),
      }),
    );
    setGrading(null);
  };

  return (
    <main
      className="teacher-assignments"
      aria-labelledby="teacher-assignments-title"
    >
      <header className="teacher-assignments-heading">
        <div>
          <p className="page-eyebrow">Home / Assignments</p>
          <h1 id="teacher-assignments-title">Assignments &amp; Grading</h1>
          <p>Review student deliverables and record assessment feedback.</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus size={17} /> Create Assignment
        </Button>
      </header>
      <section className="teacher-assignment-cards" aria-label="Assignments">
        {scopedAssignments.map((assignment) => (
          <button
            type="button"
            className={`teacher-assignment-card ${selected?.id === assignment.id ? "selected" : ""}`}
            key={assignment.id}
            onClick={() => {
              setSelectedId(assignment.id);
              setQuery("");
              setStatus("");
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
            <footer>
              <span>
                Due: <b>{date(assignment.dueDate)}</b>
              </span>
              <em>
                {submittedCount(assignment)} Submitted (
                {gradedCount(assignment)} Graded)
              </em>
            </footer>
            <span className="teacher-assignment-card-actions">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${assignment.title}`} onClick={(event) => { event.stopPropagation(); setEditing(assignment); }}><Pencil size={15} /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${assignment.title}`} onClick={(event) => { event.stopPropagation(); if (window.confirm(`Delete ${assignment.title}?`)) dispatch(assignmentDeleted(assignment.id)); }}><Trash2 size={15} /></Button>
            </span>
          </button>
        ))}
      </section>
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students or submissions..."
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
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
              {visible.map((row) => {
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
          Showing {visible.length} of {selectedSubmissions.length} records
        </footer>
      </section>
      <Dialog
        open={Boolean(grading)}
        onOpenChange={(open) => !open && setGrading(null)}
      >
        <DialogContent>
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
              <Button type="submit">Save Grade</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit assignment" : "Create assignment"}</DialogTitle><DialogDescription>Assignments are visible to students enrolled in the selected assigned class.</DialogDescription></DialogHeader>
          {editing !== null && <form className="teacher-grade-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const classId = String(form.get("classId") || ""); const title = String(form.get("title") || "").trim(); const dueDate = String(form.get("dueDate") || ""); const totalMarks = Number(form.get("totalMarks")); if (!classId || !title || !dueDate || !Number.isFinite(totalMarks) || totalMarks <= 0) return; const cls = classes.find((item) => (item.id || item._id) === classId); dispatch(assignmentSaved({ ...editing, id: editing.id || nanoid(), classId, title, dueDate, totalMarks, description: String(form.get("description") || ""), teacherId, teacherName, subject: get(cls, "subject", "title"), section: get(cls, "section", "className") })); setEditing(null); }}>
            <label>Assigned class<select name="classId" defaultValue={editing.classId || classes[0]?.id || classes[0]?._id || ""}>{classes.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{get(item, "subject", "title")} · {get(item, "section", "className")}</option>)}</select></label>
            <label>Title<input name="title" required defaultValue={editing.title || ""} /></label>
            <label>Due date<input name="dueDate" type="date" required defaultValue={editing.dueDate || ""} /></label>
            <label>Total marks<input name="totalMarks" type="number" min="1" required defaultValue={editing.totalMarks || 50} /></label>
            <label>Description<textarea name="description" rows="3" defaultValue={editing.description || ""} /></label>
            <Button type="submit">Save Assignment</Button>
          </form>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
