import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Building,
  Users,
  BookOpen,
} from "lucide-react";
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
  const rawRecords = useSelector(selectTimetable);
  const records = useMemo(() => {
    return rawRecords?.length ? rawRecords : initialSchedules;
  }, [rawRecords]);

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

  const options = useMemo(() => {
    return Object.fromEntries(
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
  }, [filters, records, students, faculty]);

  const filtered = useMemo(() => filterSchedules(records, filters), [records, filters]);
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

  // KPI Calculations
  const totalClasses = records.length;
  const activeInstructors = new Set(records.map((r) => r.instructor).filter(Boolean)).size || 16;
  const lectureHalls = new Set(records.map((r) => r.room).filter(Boolean)).size || 12;
  const totalHours = Math.round(records.length * 1.5);

  return (
    <section className="campus-tab-page class-timetable" aria-label="Class Timetable Management">
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <BookOpen size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Scheduled Classes</span>
              <span className="kpi-value">{totalClasses}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Active Instructors</span>
              <span className="kpi-value">{activeInstructors}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Building size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Rooms Allocated</span>
              <span className="kpi-value">{lectureHalls}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Clock size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Weekly Hours</span>
              <span className="kpi-value">{totalHours} hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous 56px Toolbar */}
      <Tabs value={view} onValueChange={setView} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <div className="campus-toolbar">
          <div className="toolbar-left">
            <TabsList style={{ height: "32px", padding: "2px", background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", display: "inline-flex", alignItems: "center" }}>
              <TabsTrigger value="week" style={{ height: "26px", fontSize: "11px", fontWeight: "600", padding: "0 10px", borderRadius: "4px" }}>Week</TabsTrigger>
              <TabsTrigger value="list" style={{ height: "26px", fontSize: "11px", fontWeight: "600", padding: "0 10px", borderRadius: "4px" }}>List</TabsTrigger>
            </TabsList>

            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #e4e4e7", borderRadius: "6px", background: "#ffffff", height: "32px", boxSizing: "border-box" }}>
              <button
                type="button"
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#71717a", height: "100%" }}
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
              >
                <ChevronLeft size={13} />
              </button>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#09090b", padding: "0 4px", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                <CalendarDays size={12} style={{ color: "#71717a" }} />
                {week.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {shiftDays(week, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button
                type="button"
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#71717a", height: "100%" }}
                aria-label="Next week"
                onClick={() => setWeek(shiftDays(week, 7))}
              >
                <ChevronRight size={13} />
              </button>
            </div>

            <button
              type="button"
              className="toolbar-btn toolbar-btn-outline"
              onClick={() => setWeek(mondayOf(new Date()))}
            >
              Today
            </button>

            {Object.keys(filters).map((key) => (
              <select
                key={key}
                className="toolbar-select"
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
                  All {key === "program" ? "Programs" : key === "section" ? "Sections" : key === "instructor" ? "Faculty" : "Rooms"}
                </option>
                {options[key]?.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            ))}
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={() => onAction("add")}
            >
              <Plus size={14} />
              Schedule Class
            </button>
          </div>
        </div>

        {/* 3. Panel Content */}
        <div style={{ padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
          <TabsContent value="week" style={{ margin: 0, padding: 0 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e4e4e7", background: "#fafafa" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#09090b" }}>Weekly Schedule Matrix</span>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: "#71717a" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#09090b" }} />
                    Regular Class
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f59e0b" }} />
                    Break / Interval
                  </span>
                </div>
              </div>
              <div style={{ padding: "12px" }}>
                <TimetableGrid
                  records={filtered}
                  week={week}
                  onView={(id) => onAction("view", id)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" style={{ margin: 0, padding: 0 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", overflow: "hidden" }}>
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
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal Dialogs */}
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
