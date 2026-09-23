import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  Save,
  Search,
  Users,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectTimetable } from "@/store/Slices/timetableSlice";
import { selectStudents } from "@/store/Slices/studentsSlice";
import {
  selectStudentAttendance,
  studentAttendanceMarked,
} from "@/store/Slices/studentAttendanceSlice";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import "./TeacherAttendance.css";

const dateKey = () => new Date().toISOString().slice(0, 10);
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

export default function TeacherAttendance() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const user = useSelector(selectCurrentUser);
  const timetable = useSelector(selectTimetable);
  const students = useSelector(selectStudents);
  const records = useSelector(selectStudentAttendance);
  const [classId, setClassId] = useState(params.get("classId") || "");
  const [date, setDate] = useState(dateKey());
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({});
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
  const selected =
    classes.find((row) => (row.id || row._id) === classId) || classes[0];
  const selectedId = selected?.id || selected?._id || "";
  const enrolled = selected
    ? students.filter(
        (student) =>
          (student.section || "") ===
            (selected.section || selected.className || "") ||
          ((student.program || student.gradeOrClass) ===
            (selected.program || selected.className) &&
            !selected.section),
      )
    : [];
  const statusFor = (student) =>
    draft[student.id || student._id] ||
    records.find(
      (record) =>
        record.studentId === (student.id || student._id) &&
        record.classId === selectedId &&
        record.date === date,
    )?.status ||
    "";
  const rows = enrolled.filter((student) =>
    `${student.name} ${student.roll || student.rollNo || student.rollNumber || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const counts = rows.reduce(
    (acc, student) => {
      const status = statusFor(student);
      if (status) acc[status] += 1;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0, "On Leave": 0 },
  );
  const mark = (studentId, status) =>
    setDraft((current) => ({ ...current, [studentId]: status }));
  const markAll = (status) =>
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(
        enrolled.map((student) => [student.id || student._id, status]),
      ),
    }));
  const save = () => {
    if (date > dateKey()) return toast.error("Future attendance cannot be recorded.");
    if (!selectedId || !date)
      return toast.error("Select a class and date first.");
    const changed = enrolled
      .filter((student) => statusFor(student))
      .map((student) => ({
        studentId: student.id || student._id,
        classId: selectedId,
        date,
        status: statusFor(student),
      }));
    changed.forEach((record) => dispatch(studentAttendanceMarked(record)));
    setDraft({});
    toast.success(
      `Saved attendance for ${changed.length} student${changed.length === 1 ? "" : "s"}.`,
    );
  };

  return (
    <main
      className="teacher-attendance"
      aria-labelledby="teacher-attendance-title"
    >
      <header className="teacher-attendance-heading">
        <div>
          <p className="page-eyebrow">Home / Attendance</p>
          <h1 id="teacher-attendance-title">Take Student Attendance</h1>
          <p>Mark attendance for students enrolled in your assigned class.</p>
        </div>
        <Button onClick={save} disabled={!selectedId || !enrolled.length}>
          <Save size={17} /> Save Attendance
        </Button>
      </header>
      <section className="teacher-attendance-metrics">
        <Metric icon={Users} label="Total Students" value={rows.length} />
        <Metric icon={CircleCheck} label="Present" value={counts.Present} />
        <Metric icon={CircleX} label="Absent" value={counts.Absent} />
        <Metric
          icon={Clock3}
          label="Late / Leave"
          value={counts.Late + counts["On Leave"]}
        />
      </section>
      <section className="teacher-attendance-card">
        <div className="teacher-attendance-controls">
          <label className="teacher-attendance-search">
            <Search size={16} />
            <span className="sr-only">Search students</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students, roll number..."
            />
          </label>
          <select
            value={selectedId}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">Select assigned class</option>
            {classes.map((row) => (
              <option key={row.id || row._id} value={row.id || row._id}>
                {get(row, "subject", "title")} ·{" "}
                {get(row, "section", "className")}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Attendance date"
          />
          <div className="teacher-attendance-bulk">
            <Button
              variant="outline"
              onClick={() => markAll("Present")}
              disabled={!enrolled.length}
            >
              <CheckCheck size={16} /> Mark All Present
            </Button>
            <Button
              variant="outline"
              onClick={() => markAll("Absent")}
              disabled={!enrolled.length}
            >
              <CircleX size={16} /> Mark All Absent
            </Button>
          </div>
        </div>
        <div className="teacher-attendance-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student Name &amp; Roll No</th>
                <th>Program &amp; Section</th>
                <th>Current Status</th>
                <th>Mark Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => {
                const id = student.id || student._id;
                const status = statusFor(student);
                return (
                  <tr key={id}>
                    <td>
                      <span className="teacher-attendance-student">
                        <span className="teacher-avatar">
                          {initials(student.name)}
                        </span>
                        <strong>{student.name}</strong>
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
                        Sec: {student.section || selected?.section || "—"}
                      </small>
                    </td>
                    <td>
                      <Status status={status} />
                    </td>
                    <td>
                      <div className="teacher-status-actions">
                        {["Present", "Absent", "Late"].map((option) => (
                          <Button
                            key={option}
                            size="sm"
                            variant={
                              status === option
                                ? option === "Absent"
                                  ? "destructive"
                                  : "default"
                                : "outline"
                            }
                            onClick={() => mark(id, option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${student.name}`}
                          >
                            <CircleAlert size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => mark(id, "Present")}
                          >
                            Mark Present
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => mark(id, "Absent")}>
                            Mark Absent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <div className="teacher-attendance-empty">
              {selected
                ? enrolled.length
                  ? "No students match your search."
                  : "No students are enrolled in this class."
                : "No assigned classes are available."}
            </div>
          )}
        </div>
        <footer className="teacher-attendance-footer">
          Showing {rows.length} of {enrolled.length} records
        </footer>
      </section>
    </main>
  );
}
function Metric({ icon: Icon, label, value }) {
  return (
    <article>
      <Icon size={22} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
function Status({ status }) {
  return status ? (
    <span
      className={`teacher-attendance-status ${status.toLowerCase().replace(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  ) : (
    <span className="teacher-attendance-unmarked">Not marked</span>
  );
}
