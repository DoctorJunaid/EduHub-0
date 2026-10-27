import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Clock3,
  FileText,
  MoreVertical,
  Search,
} from "lucide-react";
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

  const { data: liveClasses = [], isLoading: _isLoading } = useQuery({
    queryKey: qk.teacherClasses(),
    queryFn: async () => {
      const res = await getTeacherClasses();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    <main
      className="w-full flex flex-col p-4 sm:p-6"
      style={{ gap: "20px", boxSizing: "border-box" }}
      aria-labelledby="teacher-classes-title"
    >
      <h1 id="teacher-classes-title" className="sr-only">
        My Classes
      </h1>

      {/* 1. Filter Toolbar (2x2 Grid on Mobile, 4-Cols on Desktop) */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs"
        style={{ padding: "16px 20px", boxSizing: "border-box" }}
      >
        <div
          className="grid grid-cols-2 lg:grid-cols-4 w-full"
          style={{ gap: "10px" }}
        >
          {/* Search Input with Proper Padding */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search classes or subjects..."
              value={query}
              onChange={resetPage(setQuery)}
              className="w-full rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
              style={{
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* All Subjects Dropdown */}
          <FilterSelect
            label="All Subjects"
            value={subject}
            options={subjects}
            onChange={resetPage(setSubject)}
          />

          {/* All Rooms Dropdown */}
          <FilterSelect
            label="All Rooms"
            value={room}
            options={rooms}
            onChange={resetPage(setRoom)}
          />

          {/* All Days Dropdown */}
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
      </div>

      {/* 2. Classes Table Card with Touch Horizontal Scroll */}
      <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div
          className="w-full overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70">
                <th
                  className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                  style={{ padding: "12px 16px", width: "30%" }}
                >
                  Subject &amp; Section
                </th>
                <th
                  className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                  style={{ padding: "12px 16px", width: "26%" }}
                >
                  Days &amp; Time
                </th>
                <th
                  className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                  style={{ padding: "12px 16px", width: "16%" }}
                >
                  Room / Lab
                </th>
                <th
                  className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                  style={{ padding: "12px 16px", width: "18%" }}
                >
                  Assigned Instructor
                </th>
                <th
                  className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-right whitespace-nowrap"
                  style={{ padding: "12px 16px", width: "10%" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.length > 0 ? (
                rows.map((record) => {
                  const id = record.id || record._id;
                  const days = daysFor(
                    record.days || (record.dayOfWeek ? [record.dayOfWeek] : []),
                  );
                  return (
                    <tr
                      key={id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td
                        className="text-xs font-semibold text-neutral-900"
                        style={{ padding: "12px 16px" }}
                      >
                        <div>
                          {value(record, "subject", "title", "periodName") ||
                            "Untitled class"}
                        </div>
                        <div className="text-[11px] font-normal text-neutral-500 mt-0.5">
                          Section:{" "}
                          {value(record, "section", "className", "program") ||
                            "—"}
                        </div>
                      </td>
                      <td
                        className="text-xs text-neutral-700 whitespace-nowrap"
                        style={{ padding: "12px 16px" }}
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock3
                            size={14}
                            className="text-neutral-400 shrink-0"
                          />
                          <span className="font-semibold text-neutral-800">
                            {record.startTime && record.endTime
                              ? `${timeLabel(record.startTime)} – ${timeLabel(record.endTime)}`
                              : "Time not set"}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 whitespace-nowrap">
                          {days.length ? dayLabel(days) : "Days not set"}
                        </div>
                      </td>
                      <td
                        className="text-xs whitespace-nowrap"
                        style={{ padding: "12px 16px" }}
                      >
                        <span
                          className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-medium"
                          style={{ padding: "3px 8px" }}
                        >
                          {value(record, "room", "roomNumber") ||
                            "Room not set"}
                        </span>
                      </td>
                      <td
                        className="text-xs whitespace-nowrap"
                        style={{ padding: "12px 16px" }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-xs shrink-0">
                            {initials(instructor(record))}
                          </div>
                          <span className="font-medium text-neutral-800">
                            {instructor(record)}
                          </span>
                        </div>
                      </td>
                      <td
                        className="text-right whitespace-nowrap"
                        style={{ padding: "12px 16px" }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="table-icon-btn inline-flex"
                              aria-label={`Actions for ${value(record, "subject", "title")}`}
                            >
                              <MoreVertical size={16} aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            collisionPadding={12}
                          >
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/teacher/attendance?classId=${encodeURIComponent(id)}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <ClipboardCheck size={15} aria-hidden="true" />
                                <span>Take Attendance</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/teacher/diary?classId=${encodeURIComponent(id)}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <FileText size={15} aria-hidden="true" />
                                <span>Daily Diary</span>
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-xs text-neutral-500"
                    style={{ padding: "40px 20px" }}
                  >
                    <strong className="text-sm font-semibold text-neutral-800 block mb-1">
                      {classes.length
                        ? "No classes match these filters."
                        : "No classes assigned yet."}
                    </strong>
                    <span className="text-[11px] text-neutral-400">
                      {classes.length
                        ? "Try changing your search or filters."
                        : "Classes assigned to your teacher account will appear here."}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination Footer */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 bg-white gap-3"
          style={{ padding: "12px 20px", boxSizing: "border-box" }}
        >
          <span className="text-xs text-neutral-500">
            Showing{" "}
            <strong>
              {visible.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, visible.length)}
            </strong>{" "}
            of <strong>{visible.length}</strong> records
          </span>
          <div className="campus-pagination">
            <TeacherPagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              label="Class pages"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function FilterSelect({ label, value: selected, options, onChange }) {
  return (
    <div className="relative w-full">
      <select
        value={selected}
        onChange={onChange}
        className="w-full rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:border-neutral-400 transition-colors cursor-pointer"
        style={{
          height: "38px",
          padding: "0 12px",
          boxSizing: "border-box",
        }}
      >
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
    </div>
  );
}
