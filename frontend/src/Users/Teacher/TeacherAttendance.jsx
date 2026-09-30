import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {

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
import { selectStudents } from "@/store/Slices/studentsSlice";
import { selectAssignedTeacherClasses, studentsForClass } from "./teacherScope";
import { dateKey as localDateKey } from "@/lib/dates";
import {
  selectStudentAttendance,
  studentAttendanceMarked,
} from "@/store/Slices/studentAttendanceSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import "./TeacherAttendance.css";
import TeacherPagination from "./TeacherPagination";

const dateKey = () => localDateKey(new Date());
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

export default function TeacherAttendance() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const classes = useSelector(selectAssignedTeacherClasses);
  const students = useSelector(selectStudents);
  const records = useSelector(selectStudentAttendance);
  const [classId, setClassId] = useState(params.get("classId") || "");
  const [date, setDate] = useState(dateKey());
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({});
  const [page, setPage] = useState(1);
  useEffect(() => {
    const requestedClassId = params.get("classId");
    if (requestedClassId && classes.some((row) => String(row.id || row._id) === requestedClassId)) {
      setClassId(requestedClassId);
    }
  }, [params, classes]);
  const selected = classes.find((row) => String(row.id || row._id) === classId) || classes[0];
  const selectedId = selected?.id || selected?._id || "";
  const enrolled = selected ? studentsForClass(students, selected) : [];
  const draftKey = (studentId) => `${selectedId}:${date}:${studentId}`;
  const statusFor = (student) =>
    draft[draftKey(student.id || student._id)] ||
    records.find((record) => record.studentId === (student.id || student._id) && record.classId === selectedId && record.date === date)?.status ||
    "";
  const filteredStudents = enrolled.filter((student) =>
    `${student.name} ${student.roll || student.rollNo || student.rollNumber || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const rows = filteredStudents.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);
  const counts = filteredStudents.reduce(
    (acc, student) => {
      const status = statusFor(student);
      if (status) acc[status] += 1;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0, "On Leave": 0 },
  );
  const mark = (studentId, status) =>
    setDraft((current) => ({ ...current, [draftKey(studentId)]: status }));
  const markAll = (status) =>
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(
        enrolled.map((student) => [draftKey(student.id || student._id), status]),
      ),
    }));
  const save = () => {
    if (date > dateKey())
      return toast.error("Future attendance cannot be recorded.");
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
    if (!changed.length) return toast.error("Mark at least one student before saving.");
    changed.forEach((record) => dispatch(studentAttendanceMarked(record)));
    setDraft({});
    toast.success(
      `Saved attendance for ${changed.length} student${changed.length === 1 ? "" : "s"}.`,
    );
  };

  return (
    <main
      className="campus-tab-page teacher-attendance"
      aria-labelledby="teacher-attendance-title"
    >
      <header className="campus-toolbar teacher-attendance-toolbar">
        <h1 id="teacher-attendance-title" className="sr-only">Take Student Attendance</h1>
        <Button className="toolbar-btn toolbar-btn-primary" onClick={save} disabled={!selectedId || !enrolled.length || date > dateKey()}>
          <Save size={14} /> Save Attendance
        </Button>
      </header>
      <section className="teacher-attendance-metrics">
        <Metric icon={Users} label="Total Students" value={filteredStudents.length} variant="total" />
        <Metric icon={CircleCheck} label="Present" value={counts.Present} variant="present" />
        <Metric icon={CircleX} label="Absent" value={counts.Absent} variant="absent" />
        <Metric variant="late"
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
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search students, roll number..."
            />
          </label>
          <select
            value={selectedId}
            onChange={(event) => { setClassId(event.target.value); setPage(1); }}
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
            max={dateKey()}
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
          <table className="campus-data-table teacher-attendance-table" style={{ width: "100%", tableLayout: "fixed" }}>
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
                            className="teacher-action-trigger"
                            aria-label={`Actions for ${student.name}`}
                          >
                            <CircleAlert size={16} aria-hidden="true" />
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
                            onSelect={() => mark(id, "Present")}
                          >
                            <CircleCheck size={16} aria-hidden="true" />
                            Mark Present
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="teacher-action-item teacher-action-item-destructive"
                            onSelect={() => mark(id, "Absent")}
                          >
                            <CircleX size={16} aria-hidden="true" />
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
          {!filteredStudents.length && (
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
          <span>Showing {filteredStudents.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredStudents.length)} of {filteredStudents.length} matching records</span>
          <TeacherPagination page={page} pageCount={pageCount} onPageChange={setPage} label="Attendance pages" />
        </footer>
      </section>
    </main>
  );
}
function Metric({ icon: Icon, label, value, variant = "total" }) {
  return (
    <article>
      <span className={`teacher-attendance-metric-icon ${variant}`}>
        <Icon size={20} />
      </span>
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
