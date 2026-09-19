import { useState, useMemo, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  selectTimetable,
  fetchSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/store/Slices/timetableSlice.js";
import { selectFaculty, fetchFaculty } from "@/store/Slices/facultySlice.js";
import { selectStudents, fetchStudents } from "@/store/Slices/studentsSlice.js";
import {
  educationTypeOptions,
  timetableTemplates,
} from "./timetableData.js";
import { filterSchedules, mondayOf, shiftDays } from "../../../lib/schedule.js";
import { useInstitution } from "@/context/InstitutionContext";
import toast from "react-hot-toast";
import TimetableGrid from "./TimetableGrid";
import ScheduledClasses from "./ScheduledClasses";
import ScheduleClassForm from "./ScheduleClassForm";
import ClassDetailsDialog from "./ClassDetailsDialog";
import "./ClassTimetable.css";

export default function ClassTimetable() {
  const { isSchool } = useInstitution();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSchedules());
    dispatch(fetchFaculty());
    dispatch(fetchStudents());
  }, [dispatch]);

  const rawRecords = useSelector(selectTimetable);
  const records = useMemo(() => {
    return Array.isArray(rawRecords) ? rawRecords : [];
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
  const [educationType, setEducationType] = useState(() => isSchool ? "School" : "Colleges");

  useEffect(() => {
    setEducationType(isSchool ? "School" : "Colleges");
  }, [isSchool]);

  const options = useMemo(() => {
    const studentPrograms = [...new Set(students.map((s) => s.gradeOrClass || s.program).filter(Boolean))];
    const studentSections = [...new Set(students.map((s) => s.section).filter(Boolean))];
    const teacherNames = [...new Set(faculty.map((f) => f.name).filter(Boolean))];

    return {
      program: studentPrograms.length ? studentPrograms : ["Grade 10", "Grade 9", "Grade 8", "Grade 7", "Grade 6"],
      section: studentSections.length ? studentSections : ["Section A", "Section B", "Section C"],
      instructor: teacherNames.length ? teacherNames : [...new Set(records.map((r) => r.instructor).filter(Boolean))],
      room: [...new Set(records.map((r) => r.room).filter(Boolean)), "Room 101", "Room 102", "Room 103", "Science Lab", "Computer Lab"],
    };
  }, [records, students, faculty]);

  const filtered = useMemo(
    () => filterSchedules(records, filters),
    [records, filters],
  );
  const templateRecords = timetableTemplates[educationType];
  const selected = records.find((record) => record.id === modal?.id || record._id === modal?.id);
  const close = () => setModal(null);
  const onAction = (mode, id) => setModal({ mode, id });

  const save = async (values) => {
    try {
      if (selected) {
        await dispatch(
          updateSchedule({ ...values, id: selected._id || selected.id })
        ).unwrap();
        toast.success("Schedule updated successfully!");
      } else {
        await dispatch(addSchedule(values)).unwrap();
        toast.success("Class routine scheduled successfully!");
      }
      setFilters({ program: "", section: "", instructor: "", room: "" });
      close();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save schedule");
    }
  };

  // Real KPI Calculations
  const totalClasses = records.length;
  const activeInstructors =
    new Set(records.map((r) => r.instructor).filter(Boolean)).size || 0;
  const lectureHalls =
    new Set(records.map((r) => r.room).filter(Boolean)).size || 0;
  const totalHours = Math.round(records.length * 0.75);

  return (
    <section
      className="campus-tab-page class-timetable"
      aria-label="Class Timetable Management"
    >
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <BookOpen size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Scheduled Periods" : "Scheduled Classes"}</span>
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
              <span className="kpi-label">{isSchool ? "Teachers on Duty" : "Active Instructors"}</span>
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
              <span className="kpi-label">{isSchool ? "Classrooms & Labs" : "Rooms Allocated"}</span>
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
              <span className="kpi-label">{isSchool ? "Teaching Periods" : "Weekly Hours"}</span>
              <span className="kpi-value">{isSchool ? `${records.length * 5} periods` : `${totalHours} hrs`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous 56px Toolbar */}
      <Tabs
        value={view}
        onValueChange={setView}
        style={{ width: "100%", display: "flex", flexDirection: "column" }}
      >
        <div className="campus-toolbar">
          <div className="toolbar-left">
            <TabsList
              style={{
                height: "32px",
                padding: "2px",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <TabsTrigger
                value="week"
                style={{
                  height: "26px",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "0 10px",
                  borderRadius: "4px",
                }}
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="list"
                style={{
                  height: "26px",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "0 10px",
                  borderRadius: "4px",
                }}
              >
                List
              </TabsTrigger>
            </TabsList>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                background: "#ffffff",
                height: "32px",
                boxSizing: "border-box",
              }}
            >
              <button
                type="button"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "0 5px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#71717a",
                  height: "100%",
                }}
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
              >
                <ChevronLeft size={13} />
              </button>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#09090b",
                  padding: "0 4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                <CalendarDays size={12} style={{ color: "#71717a" }} />
                {week.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                –{" "}
                {shiftDays(week, 6).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "0 5px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#71717a",
                  height: "100%",
                }}
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
                  All{" "}
                  {key === "program"
                    ? (isSchool ? "Classes" : "Programs")
                    : key === "section"
                      ? "Sections"
                      : key === "instructor"
                        ? (isSchool ? "Teachers" : "Faculty")
                        : "Rooms"}
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
              {isSchool ? "Schedule Period" : "Schedule Class"}
            </button>
          </div>
        </div>

        {/* 3. Panel Content */}
        <div
          style={{
            padding: "16px 20px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <TabsContent value="week" style={{ margin: 0, padding: 0 }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div className="tt-template-heading">
                <div>
                  <span className="tt-template-title">
                    {isSchool ? "School Weekly Timetable & Period Matrix" : "Weekly Schedule Matrix"}
                  </span>
                  <small>
                    {isSchool ? "Class periods, Morning Assembly, and Break schedule" : "Template preview for the selected education type"}
                  </small>
                </div>
                <label className="tt-type-control">
                  <span>Institution type</span>
                  <select
                    className="toolbar-select"
                    aria-label="Institution type"
                    value={educationType}
                    onChange={(event) => setEducationType(event.target.value)}
                  >
                    {educationTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    fontSize: "11px",
                    color: "#71717a",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        background: "#09090b",
                      }}
                    />
                    Regular Class
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        background: "#f59e0b",
                      }}
                    />
                    Break / Interval
                  </span>
                </div>
              </div>
              <div style={{ padding: "12px" }}>
                <TimetableGrid
                  records={templateRecords}
                  week={week}
                  onView={(id) => onAction("view", id)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" style={{ margin: 0, padding: 0 }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
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
        onConfirm={async () => {
          if (selected) {
            try {
              await dispatch(deleteSchedule(selected._id || selected.id)).unwrap();
              toast.success("Class routine removed successfully");
            } catch (err) {
              toast.error("Failed to delete class routine");
            }
          }
          close();
        }}
      />
    </section>
  );
}
