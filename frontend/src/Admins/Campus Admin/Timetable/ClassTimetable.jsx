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
  getMatrixConfig,
  getTemplateRecords,
  initialSchedules,
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
  const [educationType, setEducationType] = useState(() => (isSchool ? "School" : "College"));

  useEffect(() => {
    setEducationType(isSchool ? "School" : "College");
  }, [isSchool]);

  const options = useMemo(() => {
    const studentPrograms = [
      ...new Set(
        students
          .map((s) => s.gradeOrClass || s.program)
          .concat(records.map((r) => r.program || r.className))
          .filter(Boolean)
      ),
    ];
    const studentSections = [
      ...new Set(
        students
          .map((s) => s.section)
          .concat(records.map((r) => r.section))
          .filter(Boolean)
      ),
    ];
    const teacherNames = [
      ...new Set(
        faculty
          .map((f) => f.name)
          .concat(records.map((r) => r.instructor || r.teacherName))
          .filter(Boolean)
      ),
    ];
    const roomNames = [
      ...new Set(records.map((r) => r.room || r.roomNumber).filter(Boolean)),
    ];

    return {
      program: studentPrograms.length
        ? studentPrograms
        : isSchool
          ? ["Grade 10", "Grade 9", "Grade 8", "Grade 7", "Grade 6"]
          : ["BS Computer Science", "BBA", "BS Software Engineering"],
      section: studentSections.length
        ? studentSections
        : ["Section A", "Section B", "Section C"],
      instructor: teacherNames.length
        ? teacherNames
        : ["Dr. Usman Khan", "Prof. Sarah Ahmed"],
      room: roomNames.length
        ? roomNames
        : ["Room 101", "Room 102", "Room 103", "Science Lab", "Computer Lab"],
    };
  }, [records, students, faculty, isSchool]);

  const filtered = useMemo(
    () => filterSchedules(records, filters),
    [records, filters],
  );

  const matrixConfig = useMemo(
    () => getMatrixConfig(educationType),
    [educationType],
  );
  const templateRecords = useMemo(
    () => getTemplateRecords(educationType),
    [educationType],
  );

  const modalRecord =
    records.find((record) => record.id === modal?.id || record._id === modal?.id) ??
    templateRecords.find((record) => record.id === modal?.id);
  const isLiveRecord =
    modalRecord && !String(modalRecord.id).startsWith("template-");
  const close = () => setModal(null);
  const onAction = (mode, id, defaults) =>
    setModal(defaults ? { mode, id, defaults } : { mode, id });

  const save = async (values) => {
    try {
      const index = isLiveRecord
        ? records.findIndex(
            (record) =>
              record.id === modalRecord?.id || record._id === modalRecord?._id
          )
        : records.length;

      if (isLiveRecord && modalRecord) {
        await dispatch(
          updateSchedule({ ...values, id: modalRecord._id || modalRecord.id })
        ).unwrap();
        toast.success("Schedule updated successfully!");
      } else {
        const payload = {
          ...values,
          institutionType: educationType,
        };
        await dispatch(addSchedule(payload)).unwrap();
        toast.success(
          isSchool
            ? "Period routine scheduled successfully!"
            : "Class routine scheduled successfully!"
        );
      }
      setFilters({ program: "", section: "", instructor: "", room: "" });
      setPage(Math.floor(index / pageSize) + 1);
      close();
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : err?.message || "Failed to save schedule"
      );
    }
  };
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
      <div className="campus-kpi-track class-timetable-kpi">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <BookOpen size={14} />
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
              <Users size={14} />
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
              <Building size={14} />
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
              <Clock size={14} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Teaching Periods" : "Weekly Hours"}</span>
              <span className="kpi-value">{isSchool ? `${records.length * 5} periods` : `${totalHours} hrs`}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={view}
        onValueChange={setView}
        className="class-timetable-tabs"
      >
        <div className="campus-toolbar">
          <div className="toolbar-left">
            <TabsList className="tt-view-tabs">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>

            <div className="tt-week-nav">
              <button
                type="button"
                className="tt-week-nav-btn"
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="tt-week-range">
                <CalendarDays size={12} aria-hidden="true" />
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
                className="tt-week-nav-btn"
                aria-label="Next week"
                onClick={() => setWeek(shiftDays(week, 7))}
              >
                <ChevronRight size={14} />
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

        <div className="tt-panel-content">
          <TabsContent value="week">
            <div className="tt-panel-card">
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
                    className="toolbar-select tt-type-select"
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
                <div className="tt-legend tt-legend-inline">
                  <span>
                    <i className="tt-legend-class" />
                    Regular Class
                  </span>
                  <span>
                    <i className="tt-legend-break" />
                    Break / Interval
                  </span>
                </div>
              </div>
              <div className="tt-grid-panel">
                <TimetableGrid
                  records={templateRecords}
                  week={week}
                  matrixConfig={matrixConfig}
                  onView={(id) => onAction("view", id)}
                  onAction={onAction}
                  onQuickAdd={(defaults) =>
                    onAction("add", undefined, defaults)
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="tt-panel-card tt-list-panel">
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

      {(modal?.mode === "add" ||
        (modal?.mode === "edit" && (isLiveRecord || modalRecord))) && (
        <ScheduleClassForm
          record={isLiveRecord ? modalRecord : undefined}
          defaults={
            modal?.defaults ??
            (modal?.mode === "edit" && modalRecord && !isLiveRecord
              ? modalRecord
              : undefined)
          }
          options={options}
          onSave={save}
          onClose={close}
        />
      )}
      {modal?.mode === "view" && modalRecord && (
        <ClassDetailsDialog record={modalRecord} onClose={close} />
      )}
      <ConfirmDialog
        open={modal?.mode === "delete" && Boolean(isLiveRecord)}
        title="Delete Scheduled Class?"
        description={`Are you sure you want to delete ${modalRecord?.subject ?? "this class"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={close}
        onConfirm={async () => {
          if (isLiveRecord && modalRecord) {
            try {
              await dispatch(
                deleteSchedule(modalRecord._id || modalRecord.id)
              ).unwrap();
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
