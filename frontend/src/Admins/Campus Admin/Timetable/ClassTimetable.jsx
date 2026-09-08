import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  selectTimetable,
  classScheduled,
  classUpdated,
  classDeleted,
} from "@/store/Slices/timetableSlice.js";
import { selectFaculty } from "@/store/Slices/facultySlice.js";
import { selectStudents } from "@/store/Slices/studentsSlice.js";
import { initialSchedules } from "./timetableData.js";
import { filterSchedules, mondayOf, shiftDays } from "../../../lib/schedule.js";
import TimetableGrid from "./TimetableGrid";
import ScheduledClasses from "./ScheduledClasses";
import ScheduleClassForm from "./ScheduleClassForm";
import ClassDetailsDialog from "./ClassDetailsDialog";
import "./ClassTimetable.css";

export default function ClassTimetable() {
  const dispatch = useDispatch();
  const records = useSelector(selectTimetable);
  const faculty = useSelector(selectFaculty);
  const students = useSelector(selectStudents);
  const [view, setView] = useState("week");
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [filters, setFilters] = useState({
    program: "",
    section: "",
    instructor: "",
    room: "",
  });
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const options = Object.fromEntries(
    Object.keys(filters).map((key) => [
      key,
      [
        ...new Set(
          [...initialSchedules, ...records]
            .map((record) => record[key])
            .concat(
              key === "program" || key === "section"
                ? students.map((student) => student[key])
                : key === "instructor"
                  ? faculty.map((teacher) => teacher.name)
                  : [],
            ),
        ),
      ],
    ]),
  );
  const filtered = filterSchedules(records, filters);
  const selected = records.find((record) => record.id === modal?.id);
  const close = () => setModal(null);
  const onAction = (mode, id) => setModal({ mode, id });
  const save = (values) => {
    const index = selected
      ? records.findIndex((record) => record.id === selected.id)
      : records.length;
    if (selected) dispatch(classUpdated({ ...values, id: selected.id }));
    else dispatch(classScheduled(values));
    setFilters({ program: "", section: "", instructor: "", room: "" });
    setPage(Math.floor(index / pageSize) + 1);
    close();
  };
  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  return (
    <section className="class-timetable" aria-labelledby="tt-title">
      <div className="tt-page-heading">
        <div>
          <h1 id="tt-title">Class Timetable &amp; Schedules</h1>
          <p>
            Manage lecture routines, weekly schedules, and classroom
            allocations.
          </p>
        </div>
        <Button className="tt-primary" onClick={() => onAction("add")}>
          <Plus size={18} />
          Schedule New Class
        </Button>
      </div>
      <Tabs value={view} onValueChange={setView}>
        <Card className="tt-card tt-toolbar">
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          <div className="tt-date-controls">
            <div>
              <Button
                variant="ghost"
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
              >
                <ChevronLeft size={15} />
              </Button>
              <span aria-live="polite">
                <CalendarDays size={16} />
                {week.toLocaleDateString("en-US", dateOptions)} –{" "}
                {shiftDays(week, 6).toLocaleDateString("en-US", dateOptions)}
              </span>
              <Button
                variant="ghost"
                aria-label="Next week"
                onClick={() => setWeek(shiftDays(week, 7))}
              >
                <ChevronRight size={15} />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setWeek(mondayOf(new Date()))}
            >
              Today
            </Button>
          </div>
          <div className="tt-filters">
            {Object.keys(filters).map((key) => (
              <select
                key={key}
                aria-label={`Filter by ${key}`}
                value={filters[key]}
                onChange={(event) => {
                  setFilters((previous) => ({
                    ...previous,
                    [key]: event.target.value,
                  }));
                  setPage(1);
                }}
              >
                <option value="">
                  All{" "}
                  {key === "program"
                    ? "Programs"
                    : key === "section"
                      ? "Sections"
                      : key === "instructor"
                        ? "Instructors"
                        : "Rooms"}
                </option>
                {options[key].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            ))}
          </div>
        </Card>
        <TabsContent value={view}>
          {view === "week" && (
            <Card className="tt-card tt-week-panel">
              <div className="tt-panel-heading">
                <h2>Weekly Schedule</h2>
                <div className="tt-legend">
                  <span>
                    <i />
                    Class
                  </span>
                  <span>
                    <i />
                    Break
                  </span>
                  <span>
                    <i />
                    Non-Scheduled
                  </span>
                </div>
              </div>
              <TimetableGrid
                records={filtered}
                week={week}
                onView={(id) => onAction("view", id)}
              />
            </Card>
          )}
          <ScheduledClasses
            records={filtered}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onAction={onAction}
          />
        </TabsContent>
      </Tabs>
      {(modal?.mode === "add" || (modal?.mode === "edit" && selected)) && (
        <ScheduleClassForm
          record={selected}
          options={options}
          onSave={save}
          onClose={close}
        />
      )}
      {modal?.mode === "view" && selected && (
        <ClassDetailsDialog record={selected} onClose={close} />
      )}
      <ConfirmDialog
        open={modal?.mode === "delete" && Boolean(selected)}
        title="Delete Scheduled Class?"
        description={`Are you sure you want to delete ${selected?.subject ?? "this class"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={close}
        onConfirm={() => {
          if (selected) dispatch(classDeleted(selected.id));
          close();
        }}
      />
    </section>
  );
}
