import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MoreVertical, Plus, Search } from "lucide-react";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectTimetable } from "@/store/Slices/timetableSlice";
import { selectStudents } from "@/store/Slices/studentsSlice";
import { resultSaved, selectResults } from "@/store/Slices/resultsSlice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./TeacherGradebook.css";

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

export default function TeacherGradebook() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const timetable = useSelector(selectTimetable);
  const students = useSelector(selectStudents);
  const results = useSelector(selectResults);
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const teacherId = user?.id || user?._id;
  const teacherName = user?.name || user?.fullName;
  const classes = useMemo(
    () =>
      timetable.filter(
        (row) =>
          (!teacherId && !teacherName) ||
          row.teacherId === teacherId ||
          row.instructorId === teacherId ||
          row.instructor === teacherName ||
          row.teacherName === teacherName,
      ),
    [timetable, teacherId, teacherName],
  );
  const classIds = new Set(classes.map((row) => row.id || row._id));
  const authorizedStudents = students.filter((student) => classes.some((row) => (row.section && row.section === student.section) || ((row.program || row.className) && (row.program || row.className) === (student.program || student.gradeOrClass))));
  const authorizedSubjects = [
    ...new Set(
      classes
        .map((row) => get(row, "subject", "title", "periodName"))
        .filter(Boolean),
    ),
  ];
  const scoped = results.filter((result) => {
    const cls = classes.find((row) => (row.id || row._id) === result.classId);
    return classIds.size === 0
      ? true
      : cls || authorizedSubjects.includes(result.subject || result.courseCode);
  });
  const terms = [
    ...new Set(scoped.map((row) => row.semester || row.term).filter(Boolean)),
  ];
  const visible = scoped.filter((row) => {
    const student = students.find(
      (item) => String(item.id || item._id) === String(row.studentId),
    );
    const text =
      `${student?.name || row.student?.name || "Student"} ${student?.roll || student?.rollNo || ""}`.toLowerCase();
    return (
      (!subject || (row.subject || row.courseCode) === subject) &&
      (!term || (row.semester || row.term) === term) &&
      (!search || text.includes(search.toLowerCase()))
    );
  });
  const save = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const score = Number(data.score);
    const totalMarks = Number(data.totalMarks);
    if (
      !editing?.studentId ||
      !data.examId ||
      !data.academicYear ||
      !data.semester ||
      !Number.isFinite(score) ||
      !Number.isFinite(totalMarks) ||
      score < 0 ||
      score > totalMarks
    )
      return;
    const subjectName = editing.subject || editing.courseCode;
    dispatch(
      resultSaved({
        ...editing,
        ...data,
        score,
        totalMarks,
        subject: subjectName,
        courseCode: editing.courseCode || subjectName,
        grade: editing.grade || "",
        gpa: editing.gpa ?? null,
        remarks: data.remarks || "",
      }),
    );
    setEditing(null);
  };
  const openNew = () =>
    setEditing({
      studentId: "",
      subject: subject || authorizedSubjects[0] || "",
      courseCode: subject || authorizedSubjects[0] || "",
      examId: "teacher-assessment",
      academicYear: "2025-2026",
      semester: term || "Fall 2025",
      score: "",
      totalMarks: 100,
      remarks: "",
    });
  const studentFor = (row) =>
    students.find(
      (item) => String(item.id || item._id) === String(row.studentId),
    ) ||
    row.student ||
    {};

  return (
    <main
      className="teacher-gradebook"
      aria-labelledby="teacher-gradebook-title"
    >
      <header className="teacher-gradebook-heading">
        <div>
          <p className="page-eyebrow">Home / Gradebook</p>
          <h1 id="teacher-gradebook-title">Gradebook &amp; Marks</h1>
          <p>Review and update academic marks for your assigned classes.</p>
        </div>
        <Button
          onClick={openNew}
          disabled={!authorizedStudents.length || !authorizedSubjects.length}
        >
          <Plus size={17} /> Add Marks
        </Button>
      </header>
      <section className="teacher-gradebook-card">
        <div className="teacher-gradebook-filters">
          <label>
            <Search size={16} />
            <span className="sr-only">Search students</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students, roll number..."
            />
          </label>
          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option value="">All Assigned Subjects</option>
            {authorizedSubjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          >
            <option value="">All Terms</option>
            {terms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="teacher-gradebook-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student Name &amp; Roll No</th>
                <th>Program &amp; Section</th>
                <th>Marks Obtained</th>
                <th>Letter Grade</th>
                <th>GPA Point</th>
                <th>Teacher Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const student = studentFor(row);
                return (
                  <tr key={row.id}>
                    <td>
                      <span className="teacher-gradebook-student">
                        <span className="teacher-avatar">
                          {initials(student.name)}
                        </span>
                        <strong>{student.name || "Student"}</strong>
                      </span>
                      <small>
                        {student.roll ||
                          student.rollNo ||
                          student.rollNumber ||
                          "Roll number unavailable"}
                      </small>
                    </td>
                    <td>
                      {student.program || student.gradeOrClass || "—"}
                      <small>
                        Sec: {student.section || row.section || "—"}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {row.score} / {row.totalMarks}
                      </strong>
                    </td>
                    <td>
                      <span className="teacher-grade-badge">
                        {row.grade || "—"}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {row.gpa == null ? "—" : Number(row.gpa).toFixed(2)}
                      </strong>
                    </td>
                    <td>{row.remarks || "—"}</td>
                    <td>
                      <div className="teacher-gradebook-actions">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(row)}
                        >
                          Edit Marks
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Result actions"
                            >
                              <MoreVertical size={17} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditing(row)}>
                              Edit Marks
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
            <div className="teacher-gradebook-empty">
              {results.length
                ? "No results match the selected filters."
                : "No marks are available for your assigned classes."}
            </div>
          )}
        </div>
        <footer className="teacher-gradebook-footer">
          Showing {visible.length} of {scoped.length} records
        </footer>
      </section>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit Marks" : "Add Marks"}
            </DialogTitle>
            <DialogDescription>
              Marks are validated against the total marks and use the existing
              result record structure.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form className="teacher-grade-form" onSubmit={save}>
              <label>
                Student
                <select
                  name="studentId"
                  defaultValue={editing.studentId}
                  required
                  disabled={Boolean(editing.id)}
                >
                  <option value="">Select student</option>
                  {authorizedStudents.map((student) => (
                    <option
                      key={student.id || student._id}
                      value={student.id || student._id}
                    >
                      {student.name} · {student.roll || student.rollNo || ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assessment ID
                <input name="examId" defaultValue={editing.examId} required />
              </label>
              <label>
                Academic Year
                <input
                  name="academicYear"
                  defaultValue={editing.academicYear}
                  required
                />
              </label>
              <label>
                Term / Semester
                <input
                  name="semester"
                  defaultValue={editing.semester}
                  required
                />
              </label>
              <label>
                Marks Obtained
                <input
                  name="score"
                  type="number"
                  min="0"
                  max={editing.totalMarks}
                  defaultValue={editing.score}
                  required
                />
              </label>
              <label>
                Total Marks
                <input
                  name="totalMarks"
                  type="number"
                  min="1"
                  defaultValue={editing.totalMarks}
                  required
                />
              </label>
              <label>
                Teacher Remarks
                <textarea
                  name="remarks"
                  rows="3"
                  defaultValue={editing.remarks || ""}
                />
              </label>
              <Button type="submit">Save Marks</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
