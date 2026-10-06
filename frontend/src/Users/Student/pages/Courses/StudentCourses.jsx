import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { selectStudentCourses } from "@/store/selectors/studentCourses";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import StudentCourseCard from "../../components/StudentCourseCard";
import axiosInstance from "@/api/axiosInstance";
import { studentsLoaded } from "@/store/Slices/studentsSlice";
import { schedulesLoaded } from "@/store/Slices/timetableSlice";
import toast from "react-hot-toast";
import "./StudentCourses.css";

export default function StudentCourses() {
  const dispatch = useDispatch();
  const courses = useSelector(selectStudentCourses);
  const student = useSelector(selectCurrentStudent);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const res = await axiosInstance.get("/student/portal");
      if (res.data?.data) {
        const portal = res.data.data;
        if (portal.student) dispatch(studentsLoaded(portal.student));
        if (portal.schedules) dispatch(schedulesLoaded(portal.schedules));
        toast.success("Enrolled subjects and schedules refreshed!");
      }
    } catch {
      toast.error("Could not refresh live subjects. Please check connection.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const categories = ["All", "Compulsory", "Science & Technical", "Electives & Arts"];

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
        (selectedCategory === "Compulsory" && course.category === "Compulsory") ||
        (selectedCategory === "Science & Technical" && course.category === "Science & Technical") ||
        (selectedCategory === "Electives & Arts" && course.category === "Electives & Arts");

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

  const className = student?.gradeOrClass || student?.program || "Class 9";
  const sectionName = student?.section || "Section A";

  return (
    <section className="student-courses-page w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-semibold px-2.5 py-0.5">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" /> BISE Peshawar Board Standard
              </Badge>
              <Badge className="bg-white/10 text-zinc-200 border-white/20 text-xs">
                {className} · {sectionName}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              My Enrolled Subjects
            </h1>
            <p className="text-sm text-zinc-300 max-w-xl">
              Access your registered curriculum, lesson syllabus, weekly class schedule, and subject-wise attendance performance.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-xl h-10 px-4 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Syncing..." : "Sync Subjects"}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Total Subjects</span>
            <span className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {courses.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Avg. Attendance</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {averageAttendance}%
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Weekly Periods</span>
            <span className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {courses.length * 5} Periods
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Current Term</span>
            <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate block">
              Annual 2026
            </span>
          </div>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search subjects by name, code (e.g. MATH-9), or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm placeholder:text-zinc-400 focus-visible:ring-indigo-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={selectedCategory === cat ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`h-9 px-3.5 text-xs font-semibold rounded-xl shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Academic Notice */}
      <Alert className="rounded-2xl border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200">
        <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <AlertTitle className="text-xs font-bold uppercase tracking-wider">Peshawar Board Academic Session Active</AlertTitle>
        <AlertDescription className="text-xs mt-0.5 text-zinc-600 dark:text-zinc-300">
          All subjects are synchronized with your campus academic records. Clicking any subject card lets you view its full Peshawar Board syllabus units, textbook recommendations, and instructor details.
        </AlertDescription>
      </Alert>

      {/* Grid of Subject Cards */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredCourses.map((course) => (
            <StudentCourseCard key={course.title} course={course} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
          <BookOpen className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            No subjects matched your criteria
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
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
              className="rounded-xl mt-2 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      )}
    </section>
  );
}
