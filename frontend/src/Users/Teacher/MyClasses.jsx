import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Clock3, FileText, MoreVertical, Search } from "lucide-react";
import {
  selectAssignedTeacherClasses,
  selectTeacherIdentity,
} from "./teacherScope";
import { getTeacherClasses } from "@/api/assignment.api";
import { qk } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import { dayLabel, timeLabel, weekdays } from "@/lib/schedule";
import TeacherPagination from "./TeacherPagination";
import { Button } from "@/components/ui/button";
import { SpinnerCustom } from "@/components/ui/spinner";
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
  const reduxClasses = useSelector(selectAssignedTeacherClasses);
  const teacher = useSelector(selectTeacherIdentity);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data: liveClasses = [], isLoading } = useQuery({
    queryKey: qk.teacherClasses(),
    queryFn: async () => {
      const res = await getTeacherClasses();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const classes = liveClasses.length > 0 ? liveClasses : reduxClasses;
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
      value(record, "instructor", "teacherName") || teacher?.name,
      ...(Array.isArray(record.days) ? record.days.map(String) : []),
      record.dayOfWeek,
      record.startTime,
      record.endTime,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!debouncedQuery || text.includes(debouncedQuery.toLowerCase())) &&
      (!subject ||
        value(record, "subject", "title", "periodName") === subject) &&
      (!room || value(record, "room", "roomNumber") === room) &&
      (!day || days.includes(Number(day)))
    );
  });
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };
  const instructor = (record) =>
    value(record, "instructor", "teacherName") ||
    teacher?.name ||
    "Assigned instructor";

  return (
    <main className="campus-tab-page teacher-classes" aria-labelledby="teacher-classes-title">
      <h1 id="teacher-classes-title" className="sr-only">
        My Classes
      </h1>

      <div className="teacher-classes-section-container">
        <section className="teacher-classes-card">
          {/* 1. Filter Toolbar */}
          <div className="teacher-class-filters">
            <label className="teacher-class-search">
              <Search size={14} />
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
              className="teacher-class-select-subject"
            />
            <FilterSelect
              label="All Rooms"
              value={room}
              options={rooms}
              onChange={resetPage(setRoom)}
              className="teacher-class-select-room"
            />
            <FilterSelect
              label="All Days"
              value={day}
              options={weekdays.map((name, index) => ({
                value: index + 1,
                label: name,
              }))}
              onChange={resetPage(setDay)}
              className="teacher-class-select-day"
            />
          </div>

          {/* 2. Table */}
          <div className="campus-table-container teacher-classes-table-wrap">
            <table className="teacher-classes-table">
              <colgroup>
                <col className="col-subject" />
                <col className="col-time" />
                <col className="col-room" />
                <col className="col-instructor" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>Subject &amp; Section</th>
                  <th>Days &amp; Time</th>
                  <th>Room / Lab</th>
                  <th>Assigned Instructor</th>
                  <th className="text-right">Actions</th>
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
                        <div className="teacher-class-subject-group">
                          <strong className="teacher-class-subject-title">
                            {value(record, "subject", "title", "periodName") ||
                              "Untitled class"}
                          </strong>
                          <span className="teacher-class-section-sub">
                            Section:{" "}
                            {value(record, "section", "className", "program") ||
                              "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="teacher-class-time-group">
                          <div className="teacher-class-time-row">
                            <Clock3 size={15} className="teacher-class-clock-icon" />
                            <strong className="teacher-class-time-title">
                              {record.startTime && record.endTime
                                ? `${timeLabel(record.startTime)} – ${timeLabel(record.endTime)}`
                                : "Time not set"}
                            </strong>
                          </div>
                          <span className="teacher-class-days-sub">
                            {days.length ? dayLabel(days) : "Days not set"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="teacher-room-badge">
                          {value(record, "room", "roomNumber") || "Room not set"}
                        </span>
                      </td>
                      <td>
                        <div className="teacher-instructor">
                          <div className="teacher-avatar">
                            {initials(instructor(record))}
                          </div>
                          <span className="teacher-instructor-name">
                            {instructor(record)}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="table-icon-btn inline-flex teacher-action-trigger"
                              aria-label={`Actions for ${value(record, "subject", "title")}`}
                            >
                              <MoreVertical size={16} aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            collisionPadding={12}
                            className="teacher-action-menu"
                          >
                            <DropdownMenuItem asChild className="teacher-action-item">
                              <Link to={`/teacher/attendance?classId=${encodeURIComponent(id)}`}>
                                <ClipboardCheck size={16} aria-hidden="true" />
                                Take Attendance
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="teacher-action-item">
                              <Link to={`/teacher/diary?classId=${encodeURIComponent(id)}`}>
                                <FileText size={16} aria-hidden="true" />
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

          {/* 3. Footer Pagination */}
          <footer className="teacher-classes-footer">
            <span>
              Showing <strong>{visible.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, visible.length)}</strong> of <strong>{visible.length}</strong>{" "}
              records
            </span>
            <div className="campus-pagination">
              <TeacherPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} label="Class pages" />
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function FilterSelect({ label, value: selected, options, onChange, className = "" }) {
  return (
    <label className={`teacher-class-select ${className}`}>
      <span className="sr-only">{label}</span>
      <select className="toolbar-select" value={selected} onChange={onChange}>
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
