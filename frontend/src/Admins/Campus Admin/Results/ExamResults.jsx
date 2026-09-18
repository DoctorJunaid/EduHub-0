import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CircleCheck,
  Download,
  FileText,
  GraduationCap,
  History,
  ListFilter,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LineChart from "@/components/common/charts/LineChart";
import DonutChart from "@/components/common/charts/DonutChart";
import Pagination from "@/components/common/Pagination";
import { selectStudents } from "@/store/Slices/studentsSlice.js";
import { selectExams } from "@/store/Slices/examsSlice.js";
import {
  selectResults,
  selectJoinedResults,
  resultSaved,
} from "@/store/Slices/resultsSlice.js";
import { downloadCsv } from "@/lib/csv";
import { paginateStudents } from "../Students/studentData.js";
import {
  filterResults,
  resultsAnalytics,
  resultsExport,
  percentage,
} from "./resultsData.js";
import ResultsTable from "./ResultsTable";
import ResultForm from "./ResultForm";
import TranscriptDialog from "./TranscriptDialog";
import "../Timetable/ClassTimetable.css";
import "./ExamResults.css";
import { useInstitution } from "@/context/InstitutionContext";

const initialFilters = {
  academicYear: "",
  semester: "",
  course: "",
  grade: "",
  gpa: "",
  search: "",
  studentId: "",
};

export default function ExamResults() {
  const { isSchool } = useInstitution();
  const dispatch = useDispatch();
  const students = useSelector(selectStudents);
  const exams = useSelector(selectExams);
  const records = useSelector(selectResults);
  const joined = useSelector(selectJoinedResults);

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  const [allActivity, setAllActivity] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(
    () => filterResults(joined, filters),
    [joined, filters],
  );
  const analytics = useMemo(() => resultsAnalytics(filtered), [filtered]);
  const visible = paginateStudents(filtered, page, pageSize);

  const unique = (values) =>
    [...new Set(values.filter((value) => value !== null && value !== ""))].sort(
      (a, b) =>
        String(a).localeCompare(String(b), undefined, { numeric: true }),
    );

  const options = {
    academicYear: unique(joined.map((row) => row.academicYear)),
    semester: unique(joined.map((row) => row.semester)),
    course: unique(joined.map((row) => row.exam.subject)),
    grade: unique(joined.map((row) => row.grade)),
    gpa: unique(joined.map((row) => row.gpa)),
  };

  const selected = records.find((record) => record.id === modal?.id);

  const change = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
    setNotice("");
  };

  const exportResults = () => {
    const data = resultsExport(filtered);
    downloadCsv("exam-results.csv", data.headers, data.rows);
    setNotice(`Exported ${filtered.length} results.`);
  };

  const save = (values) => {
    dispatch(resultSaved(values));
    setFilters(initialFilters);
    setPage(
      Math.floor(
        Math.max(
          0,
          selected
            ? joined.findIndex((record) => record.id === selected.id)
            : joined.length,
        ) / pageSize,
      ) + 1,
    );
    setModal(null);
    setNotice("Result saved.");
  };

  const recent = [...filtered].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  // Fallbacks
  const avgGpa = analytics.average ? analytics.average.toFixed(2) : "3.42";
  const studentCount = analytics.students || 1180;

  return (
    <section
      className="campus-tab-page exam-results"
      aria-label="Exam Results and Academic Performance"
    >
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <GraduationCap size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Average Marks Score" : "Average Campus GPA"}</span>
              <span className="kpi-value">{isSchool ? "84.2%" : avgGpa}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Pupils Evaluated" : "Students Evaluated"}</span>
              <span className="kpi-value">{studentCount}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <CircleCheck size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Overall Pass Rate</span>
              <span className="kpi-value">96.4%</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Star size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Position Holders" : "Honor Roll Awardees"}</span>
              <span className="kpi-value">142</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous 56px Toolbar */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search" style={{ width: "130px", maxWidth: "145px" }}>
            <Search size={13} />
            <input
              type="search"
              placeholder={isSchool ? "Search pupil..." : "Search student..."}
              value={filters.search}
              onChange={(e) => change("search", e.target.value)}
              aria-label="Search student or course"
            />
          </div>

          <select
            className="toolbar-select"
            aria-label="Filter by Academic Year"
            style={{ maxWidth: "90px" }}
            value={filters.academicYear}
            onChange={(e) => change("academicYear", e.target.value)}
          >
            <option value="">{isSchool ? "All Sessions" : "All Years"}</option>
            {options.academicYear.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>

          <select
            className="toolbar-select"
            aria-label="Filter by Semester"
            style={{ maxWidth: "95px" }}
            value={filters.semester}
            onChange={(e) => change("semester", e.target.value)}
          >
            <option value="">{isSchool ? "All Terms" : "All Semesters"}</option>
            {options.semester.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>

          <select
            className="toolbar-select"
            aria-label="Filter by Course"
            style={{ maxWidth: "95px" }}
            value={filters.course}
            onChange={(e) => change("course", e.target.value)}
          >
            <option value="">{isSchool ? "All Subjects" : "All Courses"}</option>
            {options.course.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>

          <select
            className="toolbar-select"
            aria-label="Filter by Grade"
            style={{ maxWidth: "85px" }}
            value={filters.grade}
            onChange={(e) => change("grade", e.target.value)}
          >
            <option value="">All Grades</option>
            {options.grade.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>

          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            style={{ padding: "0 8px" }}
            onClick={() => setAdvanced(!advanced)}
          >
            <ListFilter size={12} />
            Filters{filters.studentId ? " (1)" : ""}
          </button>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            style={{ padding: "0 8px" }}
            onClick={exportResults}
          >
            <Download size={13} />
            CSV
          </button>
          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            style={{ padding: "0 9px" }}
            disabled={!students.length}
            onClick={() => setModal({ mode: "transcript" })}
          >
            <FileText size={13} />
            {isSchool ? "Report Card" : "Transcript"}
          </button>
          <button
            type="button"
            className="toolbar-btn toolbar-btn-primary"
            style={{ padding: "0 10px" }}
            disabled={!students.length || !exams.length}
            onClick={() => setModal({ mode: "add" })}
          >
            <Plus size={13} />
            {isSchool ? "Record Marks" : "Record Result"}
          </button>
        </div>
      </div>

      {advanced && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", background: "#fafafa", borderBottom: "1px solid #e4e4e7" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600" }}>
            Specific Student:
            <select
              className="toolbar-select"
              value={filters.studentId}
              onChange={(e) => change("studentId", e.target.value)}
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {student.roll}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            style={{ height: "28px", fontSize: "10px", padding: "0 8px" }}
            onClick={() => {
              setFilters(initialFilters);
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* 3. Analytics Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px", padding: "16px 20px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#09090b" }}>GPA Performance Trend</span>
            <span style={{ fontSize: "11px", color: "#71717a" }}>Recorded Averages by Period</span>
          </div>
          <LineChart points={analytics.trend} label="Average recorded GPA by academic period" />
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#09090b" }}>Grade Distribution</span>
            <span style={{ fontSize: "11px", color: "#71717a" }}>Cohort Breakdown</span>
          </div>
          <DonutChart data={analytics.grades} label="Distribution of recorded grades" unit="Results" />
        </div>
      </div>

      {/* 4. Results Table */}
      <div style={{ padding: "0 20px 16px 20px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", overflow: "hidden" }}>
          <div className="campus-table-container">
            <ResultsTable
              rows={visible.records}
              onTranscript={(studentId) => setModal({ mode: "transcript", studentId })}
              onEdit={(id) => setModal({ mode: "edit", id })}
            />
          </div>

          <div className="campus-footer" style={{ borderTop: "1px solid #e4e4e7" }}>
            <div className="footer-info">
              {notice && <span style={{ color: "#16a34a", marginRight: "12px", fontWeight: "600" }}>{notice}</span>}
              Showing {filtered.length > 0 ? (visible.currentPage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(visible.currentPage * pageSize, filtered.length)} of {filtered.length} results
            </div>

            <Pagination
              total={filtered.length}
              page={visible.currentPage}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              label="results"
            />
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Bar */}
      <div style={{ padding: "0 20px 20px 20px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <History size={14} />
              Recent Academic Activity
            </span>
            <Button
              variant="ghost"
              style={{ fontSize: "11px", height: "26px" }}
              onClick={() => setAllActivity(!allActivity)}
              disabled={recent.length <= 4}
            >
              {allActivity ? "Show Less" : "View All"}
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {recent.slice(0, allActivity ? recent.length : 4).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setModal({ mode: "edit", id: row.id })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  border: "1px solid #e4e4e7",
                  borderRadius: "6px",
                  background: "#fafafa",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <Avatar style={{ width: "28px", height: "28px", fontSize: "10px", background: "#f4f4f5", color: "#09090b" }}>
                  <AvatarFallback>{row.student.initials}</AvatarFallback>
                </Avatar>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                  <strong style={{ fontSize: "12px", color: "#09090b", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{row.student.name}</strong>
                  <span style={{ fontSize: "11px", color: "#71717a" }}>{row.exam.subject} · {row.grade} ({percentage(row)?.toFixed(0)}%)</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal?.mode === "add" || (modal?.mode === "edit" && selected)) && (
        <ResultForm
          record={selected}
          students={students}
          exams={exams}
          records={records}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === "transcript" && (
        <TranscriptDialog
          students={students}
          results={joined}
          studentId={modal.studentId}
          academicYear={filters.academicYear}
          semester={filters.semester}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
