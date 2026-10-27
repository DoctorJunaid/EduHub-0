import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Award, CheckCircle2 } from "lucide-react";

export default function MyClassWidget({ classInfo, attendance, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs animate-pulse flex flex-col lg:flex-row lg:items-center justify-between"
        style={{
          padding: "20px 24px",
          gap: "16px",
          marginBottom: "20px",
          boxSizing: "border-box",
          minHeight: "80px",
        }}
      >
        <div className="flex items-center min-w-0" style={{ gap: "12px" }}>
          <div className="w-10 h-10 rounded-lg bg-neutral-200 shrink-0" />
          <div className="flex flex-col" style={{ gap: "6px" }}>
            <div className="h-4 bg-neutral-200 rounded w-28" />
            <div className="h-3 bg-neutral-200 rounded w-44" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center w-full lg:w-auto shrink-0" style={{ gap: "10px" }}>
          <div className="h-9 bg-neutral-200 rounded-lg w-full sm:w-24" />
          <div className="h-9 bg-neutral-200 rounded-lg w-full sm:w-28" />
          <div className="col-span-2 sm:col-span-1 h-9 bg-neutral-200 rounded-lg w-full sm:w-40" />
        </div>
      </div>
    );
  }

  if (!classInfo) return null;

  const isMarkedToday = attendance?.isMarkedToday;
  const summary = attendance?.summary || {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: classInfo.studentCount || 0,
    percentage: 100,
  };

  const handleClassHub = () => navigate("/teacher/my-class");
  const handleClassResults = () => navigate("/teacher/my-class/results");
  const handleMarkAttendance = () => navigate("/teacher/my-class/attendance");

  const enrolledCount = classInfo.studentCount ?? (summary.total || 0);

  return (
    <div
      className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between"
      style={{
        padding: "20px 24px",
        gap: "16px",
        marginBottom: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* Left: Icon, Class Teacher Badge & Enrolled Subtitle ("My Class — ..." removed) */}
      <div className="flex items-center min-w-0" style={{ gap: "12px" }}>
        <div
          className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
          style={{ width: "40px", height: "40px" }}
        >
          <GraduationCap className="w-5 h-5 text-neutral-700 stroke-[1.75]" />
        </div>
        <div className="flex flex-col min-w-0" style={{ gap: "4px" }}>
          <div className="flex items-center flex-wrap" style={{ gap: "8px" }}>
            <span
              className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
              style={{ padding: "3px 10px" }}
            >
              Class Teacher
            </span>
          </div>
          <p className="text-xs text-neutral-500 truncate">
            {enrolledCount} Enrolled Students • Academic Session 2026-2027
          </p>
        </div>
      </div>

      {/* Right: Responsive Action Buttons */}
      <div
        className="grid grid-cols-2 sm:flex sm:flex-row items-center w-full lg:w-auto shrink-0"
        style={{ gap: "10px" }}
      >
        <button
          type="button"
          onClick={handleClassHub}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
          style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
        >
          <BookOpen className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
          <span>Class Hub</span>
        </button>
        <button
          type="button"
          onClick={handleClassResults}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
          style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
        >
          <Award className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
          <span>Class Results</span>
        </button>
        <button
          type="button"
          onClick={handleMarkAttendance}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
          style={{ height: "38px", padding: "0 16px", gap: "6px", boxSizing: "border-box" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
          <span>
            {isMarkedToday ? "Edit Attendance" : "Mark Today's Attendance"}
          </span>
        </button>
      </div>
    </div>
  );
}
