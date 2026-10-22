import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Search,
  Sparkles,
  CalendarDays,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { selectStudentCourses } from "@/store/selectors/studentCourses";
import { selectStudentDiary } from "@/store/selectors/studentDiary";
import StudentDiaryEntry from "../../components/StudentDiaryEntry";
import { PageLoader } from "@/components/ui/spinner";
import useStudentPortal from "@/hooks/useStudentPortal";
import "./StudentDiary.css";

const EMPTY_COURSES = [];
const EMPTY_ENTRIES = [];

export default function StudentDiary() {
  const { isLoading } = useStudentPortal();
  const rawCourses = useSelector(selectStudentCourses);
  const rawEntries = useSelector(selectStudentDiary);
  const courses = rawCourses || EMPTY_COURSES;
  const entries = rawEntries || EMPTY_ENTRIES;

  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Distinct subjects available for filtering
  const availableSubjects = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.title && set.add(c.title));
    entries.forEach((e) => e.subject && set.add(e.subject));
    return ["All", ...Array.from(set)];
  }, [courses, entries]);

  // Filtered diary entries based on search & selected subject
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((entry) => {
      const matchesSearch =
        !q ||
        entry.title?.toLowerCase().includes(q) ||
        entry.subject?.toLowerCase().includes(q) ||
        entry.recap?.toLowerCase().includes(q) ||
        entry.homework?.toLowerCase().includes(q) ||
        entry.instructor?.toLowerCase().includes(q) ||
        entry.resources?.toLowerCase().includes(q);

      const matchesSubject =
        selectedSubject === "All" || entry.subject === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [entries, searchQuery, selectedSubject]);

  // Derived KPI metrics
  const totalEntries = entries.length;
  const homeworkCount = useMemo(() => {
    return entries.filter(
      (e) => (e.homework && e.homework.trim()) || e.assignmentId,
    ).length;
  }, [entries]);

  const distinctSubjectsCount = useMemo(() => {
    return new Set(entries.map((e) => e.subject).filter(Boolean)).size;
  }, [entries]);

  const latestDate = entries[0]?.date || "Today";

  if (isLoading && !entries.length) {
    return <PageLoader text="Loading your daily diary & homework notes..." />;
  }

  return (
    <section className="student-diary-page w-full">
      {/* 1. Neutral Standardized KPI Metric Cards */}
      <div className="student-diary-metrics">
        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="student-diary-metric-label">
              Total Diary Logs
            </span>
            <span className="student-diary-metric-value">
              {totalEntries}
            </span>
          </div>
        </Card>

        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="student-diary-metric-label">
              Homework Tasks
            </span>
            <span className="student-diary-metric-value">
              {homeworkCount}
            </span>
          </div>
        </Card>

        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <FileText className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="student-diary-metric-label">
              Covered Subjects
            </span>
            <span className="student-diary-metric-value">
              {distinctSubjectsCount} Subjects
            </span>
          </div>
        </Card>

        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="student-diary-metric-label">
              Latest Session
            </span>
            <span className="student-diary-metric-value truncate">
              {latestDate}
            </span>
          </div>
        </Card>
      </div>

      {/* 2. Search & Subject Filter Bar */}
      <div className="student-diary-filters">
        {/* Search Input */}
        <div className="student-diary-search">
          <Search className="student-diary-search-icon" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search diary notes, lecture topics, homework tasks, or teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="student-diary-search-input"
            aria-label="Search diary notes and homework"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="student-diary-search-clear"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject Filter Pills */}
        <div className="student-diary-subject-tabs" role="tablist" aria-label="Filter diary by subject">
          {availableSubjects.map((sub) => {
            const isActive = selectedSubject === sub;
            return (
              <Button
                key={sub}
                type="button"
                variant="ghost"
                size="sm"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedSubject(sub)}
                className={`student-diary-filter-button ${
                  isActive ? "is-active" : ""
                }`}
              >
                {sub}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 3. Academic Routine Synchronized Notice */}
      <div className="student-diary-alert">
        <AlertCircle className="student-diary-alert-icon" aria-hidden="true" />
        <div className="student-diary-alert-text">
          <strong className="student-diary-alert-badge">
            Daily Academic Routine Synchronized:
          </strong>
          <span>
            Faculty log class lecture key points, textbook chapter readings, and practice exercises after each period.
            Complete assignments can be submitted directly from linked diary entries.
          </span>
        </div>
      </div>

      {/* 4. Diary Entries Feed */}
      <div className="sdp-entries" aria-live="polite">
        {filteredEntries.map((entry) => (
          <StudentDiaryEntry key={entry.id} entry={entry} />
        ))}

        {!filteredEntries.length && (
          <Card className="sdp-empty">
            <BookOpen className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto" />
            <h3 className="sdp-empty-title">
              {searchQuery || selectedSubject !== "All"
                ? "No diary entries match your filter"
                : "No diary entries available yet"}
            </h3>
            <p className="sdp-empty-desc">
              {searchQuery || selectedSubject !== "All"
                ? "Try searching for another topic or clearing your selected subject filter."
                : "Daily lecture notes and practice tasks for your enrolled classes will appear here once posted by teachers."}
            </p>
            {(searchQuery || selectedSubject !== "All") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubject("All");
                }}
                className="sdp-reset-btn"
              >
                Reset Filters
              </Button>
            )}
          </Card>
        )}
      </div>
    </section>
  );
}
