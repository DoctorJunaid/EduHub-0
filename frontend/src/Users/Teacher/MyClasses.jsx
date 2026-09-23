import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Clock3, MoreVertical, Plus, Search } from "lucide-react";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectTimetable } from "@/store/Slices/timetableSlice";
import { dayLabel, timeLabel, weekdays } from "@/lib/schedule";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./MyClasses.css";

const value = (record, ...keys) =>
  keys
    .map((key) => record?.[key])
    .find((item) => item !== undefined && item !== null && item !== "") || "";
const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "T";
const daysFor = (days = []) =>
  days
    .map((day) => (typeof day === "number" ? day : weekdays.indexOf(day) + 1))
    .filter((day) => day > 0);

export default function MyClasses() {
  const user = useSelector(selectCurrentUser);
  const records = useSelector(selectTimetable);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const teacherId = user?.id || user?._id;
  const teacherName = user?.name || user?.fullName;
  const classes = useMemo(
    () =>
      records.filter((record) => {
        if (!teacherId && !teacherName) return true;
        return (
          record.teacherId === teacherId ||
          record.instructorId === teacherId ||
          record.instructor === teacherName ||
          record.teacherName === teacherName
        );
      }),
    [records, teacherId, teacherName],
  );
  const subjects = [
    ...new Set(
      classes
        .map((record) => value(record, "subject", "title", "periodName"))
        .filter(Boolean),
    ),
  ].sort();
  const rooms = [
    ...new Set(
      classes
        .map((record) => value(record, "room", "roomNumber"))
        .filter(Boolean),
    ),
  ].sort();
  const visible = classes.filter((record) => {
    const days = daysFor(
      record.days || (record.dayOfWeek ? [record.dayOfWeek] : []),
    );
    const text = [
      value(record, "subject", "title", "periodName"),
      value(record, "section", "className", "program"),
      value(record, "room", "roomNumber"),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!query || text.includes(query.toLowerCase())) &&
      (!subject ||
        value(record, "subject", "title", "periodName") === subject) &&
      (!room || value(record, "room", "roomNumber") === room) &&
      (!day || days.includes(Number(day)))
    );
  });
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const rows = visible.slice((page - 1) * pageSize, page * pageSize);
  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };
  const instructor = (record) =>
    value(record, "instructor", "teacherName") ||
    teacherName ||
    "Assigned instructor";

  return (
    <main className="teacher-classes" aria-labelledby="teacher-classes-title">
      <header className="teacher-classes-heading">
        <div>
          <p className="page-eyebrow">Home / Classes</p>
          <h1 id="teacher-classes-title">My Classes</h1>
        </div>
        <Button disabled title="Class scheduling is managed by Campus Admin">
          <Plus size={17} /> Admin-managed schedules
        </Button>
      </header>
      <section className="teacher-classes-card">
        <div className="teacher-class-filters">
          <label className="teacher-class-search">
            <Search size={17} />
            <span className="sr-only">Search classes or subjects</span>
            <input
              value={query}
              onChange={resetPage(setQuery)}
              placeholder="Search classes or subjects..."
            />
          </label>
          <FilterSelect
            label="All Subjects"
            value={subject}
            options={subjects}
            onChange={resetPage(setSubject)}
          />
          <FilterSelect
            label="All Rooms"
            value={room}
            options={rooms}
            onChange={resetPage(setRoom)}
          />
          <FilterSelect
            label="All Days"
            value={day}
            options={weekdays.map((name, index) => ({
              value: index + 1,
              label: name,
            }))}
            onChange={resetPage(setDay)}
          />
        </div>
        <div className="teacher-classes-table-wrap">
          <table className="teacher-classes-table">
            <thead>
              <tr>
                <th>Subject &amp; Section</th>
                <th>Days &amp; Time</th>
                <th>Room / Lab</th>
                <th>Assigned Instructor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const id = record.id || record._id;
                const days = daysFor(
                  record.days || (record.dayOfWeek ? [record.dayOfWeek] : []),
                );
                return (
                  <tr key={id}>
                    <td>
                      <strong>
                        {value(record, "subject", "title", "periodName") ||
                          "Untitled class"}
                      </strong>
                      <small>
                        Section:{" "}
                        {value(record, "section", "className", "program") ||
                          "—"}
                      </small>
                    </td>
                    <td>
                      <div className="teacher-class-time">
                        <Clock3 size={17} />
                        <strong>
                          {record.startTime && record.endTime
                            ? `${timeLabel(record.startTime)} – ${timeLabel(record.endTime)}`
                            : "Time not set"}
                        </strong>
                        <small>
                          {days.length ? dayLabel(days) : "Days not set"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="teacher-room-badge">
                        {value(record, "room", "roomNumber") || "Room not set"}
                      </span>
                    </td>
                    <td>
                      <span className="teacher-instructor">
                        <span className="teacher-avatar">
                          {initials(instructor(record))}
                        </span>
                        {instructor(record)}
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${value(record, "subject", "title")}`}
                          >
                            <MoreVertical size={17} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/teacher/attendance?classId=${id}`}>
                              Take Attendance
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/teacher/diary?classId=${id}`}>
                              Daily Diary
                            </Link>
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
            <div className="teacher-classes-empty">
              <strong>
                {classes.length
                  ? "No classes match these filters."
                  : "No classes assigned yet."}
              </strong>
              <span>
                {classes.length
                  ? "Try changing your search or filters."
                  : "Classes assigned to your teacher account will appear here."}
              </span>
            </div>
          )}
        </div>
        <footer className="teacher-classes-footer">
          <span>
            Showing {visible.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, visible.length)} of {visible.length}{" "}
            records
          </span>
          <div>
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              ‹
            </Button>
            <strong>{page}</strong>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              ›
            </Button>
          </div>
        </footer>
      </section>
    </main>
  );
}

function FilterSelect({ label, value: selected, options, onChange }) {
  return (
    <label className="teacher-class-select">
      <span className="sr-only">{label}</span>
      <select value={selected} onChange={onChange}>
        <option value="">{label}</option>
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? { value: option, label: option }
              : option;
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
