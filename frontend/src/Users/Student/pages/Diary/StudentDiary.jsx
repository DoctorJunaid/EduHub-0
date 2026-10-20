import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Search,
  Sparkles,
  CalendarDays,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { selectStudentCourses } from "@/store/selectors/studentCourses";
import { selectStudentDiary } from "@/store/selectors/studentDiary";
import StudentDiaryEntry from "../../components/StudentDiaryEntry";
import "./StudentDiary.css";

export default function StudentDiary() {
  const courses = useSelector(selectStudentCourses) || [];
  const entries = useSelector(selectStudentDiary) || [];

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

  return (
    <section className="student-diary-page w-full">
      {/* 1. Neutral Standardized KPI Metric Cards */}
      <div className="student-diary-metrics grid grid-cols-2 lg:grid-cols-4">
        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Total Diary Logs
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {totalEntries}
            </span>
          </div>
        </Card>

        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Homework Tasks
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {homeworkCount}
            </span>
          </div>
        </Card>

        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <FileText className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Covered Subjects
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {distinctSubjectsCount} Subjects
            </span>
          </div>
        </Card>

        <Card className="student-diary-metric">
          <div className="student-diary-metric-icon">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="student-diary-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Latest Session
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate block">
              {latestDate}
            </span>
          </div>
        </Card>
      </div>

      {/* 2. Search & Subject Filter Bar */}
      <div className="student-diary-filters flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-2 sm:p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        {/* Search Input */}
        <div className="student-diary-search relative flex-1 min-w-0">
          <Search className="student-diary-search-icon w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search diary notes, lecture topics, homework tasks, or teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="student-diary-search-input h-10 rounded-lg border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:ring-neutral-400"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="student-diary-subject-tabs flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {availableSubjects.map((sub) => {
            const isActive = selectedSubject === sub;
            return (
              <Button
                key={sub}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={isActive}
                onClick={() => setSelectedSubject(sub)}
                className={`student-diary-filter-button h-9 px-3 text-xs font-medium rounded-lg shrink-0 transition-colors border ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 font-semibold shadow-2xs"
                    : "bg-transparent text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900"
                }`}
              >
                {sub}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 3. Peshawar Board & Session Alert Notice */}
      <div className="student-diary-alert flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 text-xs text-neutral-600 dark:text-neutral-400">
        <AlertCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-neutral-900 dark:text-neutral-200 uppercase tracking-wide text-[11px] mr-1.5">
            Daily Academic Routine Synchronized:
          </strong>
          Faculty log class lecture key points, textbook chapter readings, and practice exercises after each period.
          Complete assignments can be submitted directly from linked diary entries.
        </p>
      </div>

      {/* 4. Diary Entries Feed */}
      <div className="sdp-entries" aria-live="polite">
        {filteredEntries.map((entry) => (
          <StudentDiaryEntry key={entry.id} entry={entry} />
        ))}

        {!filteredEntries.length && (
          <Card className="sdp-empty p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {searchQuery || selectedSubject !== "All"
                ? "No diary entries match your filter"
                : "No diary entries available yet"}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
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
                className="rounded-lg mt-2 text-xs border-neutral-200 dark:border-neutral-700"
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
