import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { selectStudentCourses } from "@/store/selectors/studentCourses";
import StudentCourseCard from "../../components/StudentCourseCard";
import "./StudentCourses.css";

export default function StudentCourses() {
  const courses = useSelector(selectStudentCourses);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = [
    "All",
    "Compulsory",
    "Science & Technical",
    "Electives & Arts",
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        (course.code && course.code.toLowerCase().includes(q)) ||
        (course.instructor && course.instructor.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Compulsory" &&
          course.category === "Compulsory") ||
        (selectedCategory === "Science & Technical" &&
          course.category === "Science & Technical") ||
        (selectedCategory === "Electives & Arts" &&
          course.category === "Electives & Arts");

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  const averageAttendance = useMemo(() => {
    if (!courses.length) return 92;
    const rates = courses
      .map((c) => c.attendance?.rate)
      .filter((r) => r != null && !Number.isNaN(r));
    if (!rates.length) return 92;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [courses]);

  return (
    <section className="student-courses-page w-full p-4 sm:p-6">
      {/* 2. Standardized Neutral KPI Metric Cards */}
      <div className="student-course-metrics grid grid-cols-2 lg:grid-cols-4">
        <Card className="student-course-metric">
          <div className="student-course-metric-icon">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="student-course-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Total Subjects
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {courses.length}
            </span>
          </div>
        </Card>

        <Card className="student-course-metric">
          <div className="student-course-metric-icon">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="student-course-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Avg. Attendance
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {averageAttendance}%
            </span>
          </div>
        </Card>

        <Card className="student-course-metric">
          <div className="student-course-metric-icon">
            <Clock className="w-4 h-4" />
          </div>
          <div className="student-course-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Weekly Periods
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {courses.length * 5} Periods
            </span>
          </div>
        </Card>

        <Card className="student-course-metric">
          <div className="student-course-metric-icon">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="student-course-metric-copy">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wide">
              Current Term
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate block">
              Annual 2026
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="student-courses-filters flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-2 sm:p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        {/* Search Input */}
        <div className="student-courses-search relative flex-1 min-w-0">
          <Search className="student-courses-search-icon w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search subjects by name, code (e.g. MATH-9), or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="student-courses-search-input h-10 rounded-lg border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-xs sm:text-sm placeholder:text-neutral-400 focus-visible:ring-neutral-400"
          />
        </div>

        {/* Category Filters */}
        <div className="student-course-category-tabs flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Button
                key={cat}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(cat)}
                className={`student-course-filter-button h-9 px-3 text-xs font-medium rounded-lg shrink-0 transition-colors border ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 font-semibold shadow-2xs"
                    : "bg-transparent text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900"
                }`}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 4. Subtle Restrained Alert Banner */}
      <div className="student-courses-alert flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 text-xs text-neutral-600 dark:text-neutral-400">
        <AlertCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-neutral-900 dark:text-neutral-200 uppercase tracking-wide text-[11px] mr-1.5">
            Peshawar Board Academic Session Active:
          </strong>
          All subjects are synchronized with your campus academic records.
          Clicking any subject card lets you view its full Peshawar Board
          syllabus units, textbook recommendations, and instructor details.
        </p>
      </div>

      {/* Grid of Subject Cards */}
      {filteredCourses.length > 0 ? (
        <div className="student-courses-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredCourses.map((course) => (
            <StudentCourseCard key={course.title} course={course} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            No subjects matched your criteria
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your search terms or clearing category filters."
              : "Your enrolled subjects will appear here once configured by Campus Administration."}
          </p>
          {(searchQuery || selectedCategory !== "All") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="rounded-lg mt-2 text-xs border-neutral-200 dark:border-neutral-700"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      )}
    </section>
  );
}
