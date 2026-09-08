import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  CircleCheck,
  Download,
  FileText,
  GraduationCap,
  History,
  ListFilter,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import SummaryCard from "@/components/common/SummaryCard";
import Pagination from "@/components/common/Pagination";
import LineChart from "@/components/common/charts/LineChart";
import DonutChart from "@/components/common/charts/DonutChart";
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
  const dispatch = useDispatch();
  const students = useSelector(selectStudents),
    exams = useSelector(selectExams),
    records = useSelector(selectResults),
    joined = useSelector(selectJoinedResults);
  const [filters, setFilters] = useState(initialFilters),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState(null),
    [advanced, setAdvanced] = useState(false),
    [allActivity, setAllActivity] = useState(false),
    [notice, setNotice] = useState("");
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
  const select = (key, label, ariaLabel = label) => (
    <select
      aria-label={ariaLabel}
      value={filters[key]}
      onChange={(event) => change(key, event.target.value)}
    >
      <option value="">{label}</option>
      {options[key].map((value) => (
        <option key={value} value={value}>
          {key === "gpa" ? Number(value).toFixed(2) : value}
        </option>
      ))}
    </select>
  );
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
  return (
    <section
      className="class-timetable exam-results"
      aria-labelledby="results-title"
    >
      <div className="tt-page-heading">
        <div>
          <h1 id="results-title">Exam Results &amp; Academic Performance</h1>
          <p>
            View student exam results, grades, GPA ratings and academic
            performance reports.
          </p>
        </div>
        <div className="results-header-controls">
          {select("academicYear", "All Academic Years")}
          {select("semester", "All Semesters", "Header semester")}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download size={15} />
                Export
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={exportResults}>
                Export filtered CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="tt-primary"
            disabled={!students.length}
            onClick={() => setModal({ mode: "transcript" })}
          >
            <FileText size={14} />
            Generate Transcript
          </Button>
        </div>
      </div>
      <div className="results-summary">
        {[
          [
            GraduationCap,
            analytics.average?.toFixed(2) ?? "—",
            "Campus Average GPA",
          ],
          [Users, analytics.students, "Students Evaluated"],
          [CircleCheck, "—", "Pass Rate"],
          [Star, "—", "Dean's Honor Roll"],
        ].map(([Icon, value, label]) => (
          <SummaryCard icon={Icon} value={value} label={label} key={label} />
        ))}
      </div>
      <p className="results-policy-note">
        Average GPA is the unweighted mean of recorded values. Pass Rate and
        Honor Roll require approved academic rules.
      </p>
      <div className="results-charts">
        <Card className="tt-card">
          <div className="results-panel-heading">
            <h2>GPA Performance</h2>
            <select
              aria-label="GPA chart metric"
              defaultValue="average"
              disabled
            >
              <option value="average">Average GPA</option>
            </select>
          </div>
          <LineChart
            points={analytics.trend}
            label="Average recorded GPA by academic period"
          />
        </Card>
        <Card className="tt-card">
          <div className="results-panel-heading">
            <h2>Grade Distribution</h2>
          </div>
          <DonutChart
            data={analytics.grades}
            label="Distribution of recorded grades"
            unit="Graded results"
          />
        </Card>
      </div>
      <Card className="tt-card results-table-panel">
        <div className="results-filters">
          <Input
            aria-label="Search student, course or roll number"
            placeholder="Search student, course or roll number..."
            value={filters.search}
            onChange={(event) => change("search", event.target.value)}
          />
          {[
            ["semester", "All Semesters", "Semester"],
            ["course", "All Courses", "Course"],
            ["grade", "All Grades", "Grade"],
            ["gpa", "All GPA", "GPA"],
          ].map(([key, label, heading]) => (
            <label key={key}>
              {heading}
              {select(key, label, `Table ${heading}`)}
            </label>
          ))}
          <Button
            variant="outline"
            aria-expanded={advanced}
            aria-controls="results-advanced-filters"
            onClick={() => setAdvanced(!advanced)}
          >
            <ListFilter size={14} />
            Filters{filters.studentId ? " (1)" : ""}
          </Button>
          <span>{filtered.length} results</span>
        </div>
        {advanced && (
          <div id="results-advanced-filters" className="results-advanced">
            <label>
              Student
              <select
                value={filters.studentId}
                onChange={(event) => change("studentId", event.target.value)}
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
              onClick={() => {
                setFilters(initialFilters);
                setPage(1);
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
        <div className="results-entry-bar">
          <span>
            Grades and GPA are recorded awards, not calculated from scores.
          </span>
          <Button
            variant="outline"
            disabled={!students.length || !exams.length}
            onClick={() => setModal({ mode: "add" })}
          >
            <Plus size={14} />
            Record Result
          </Button>
        </div>
        <ResultsTable
          rows={visible.records}
          onTranscript={(studentId) =>
            setModal({ mode: "transcript", studentId })
          }
          onEdit={(id) => setModal({ mode: "edit", id })}
        />
        <div className="results-footer">
          <span role="status">{notice}</span>
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
      </Card>
      <Card className="tt-card results-activity">
        <div className="results-panel-heading">
          <h2>
            <History size={16} />
            Recent Academic Activity
          </h2>
          <Button
            variant="ghost"
            onClick={() => setAllActivity(!allActivity)}
            disabled={recent.length <= 4}
          >
            {allActivity ? "Show Recent" : "View All"}
          </Button>
        </div>
        <div className="results-activity-grid">
          {recent.slice(0, allActivity ? recent.length : 4).map((row) => (
            <button
              className="results-activity-item"
              key={row.id}
              onClick={() => setModal({ mode: "edit", id: row.id })}
            >
              <Avatar>
                <AvatarFallback>{row.student.initials}</AvatarFallback>
              </Avatar>
              <div>
                <strong>{row.student.name}</strong>
                <span>{row.exam.subject}</span>
                <span>
                  {row.grade || "Grade not recorded"} ·{" "}
                  {percentage(row)?.toFixed(1)}%
                </span>
                <small>
                  {row.updatedAt === row.createdAt ? "Recorded" : "Updated"}{" "}
                  {new Date(row.updatedAt).toLocaleString()}
                </small>
              </div>
            </button>
          ))}
        </div>
        {!recent.length && (
          <p className="results-empty-activity">
            No results have been recorded in this selection.
          </p>
        )}
      </Card>
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
