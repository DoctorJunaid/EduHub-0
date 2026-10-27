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
            <div className="h-4 bg-neutral-200 rounded w-48" />
            <div className="h-3 bg-neutral-200 rounded w-32" />
          </div>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: "10px" }}>
          <div className="h-9 bg-neutral-200 rounded-lg w-24" />
          <div className="h-9 bg-neutral-200 rounded-lg w-28" />
          <div className="h-9 bg-neutral-200 rounded-lg w-40" />
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
  const classNameDisplay = classInfo.className || "1st Year (11th) - Section A";

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
      {/* Left: Title & Subtitle */}
      <div className="flex items-center min-w-0" style={{ gap: "12px" }}>
        <div
          className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
          style={{ width: "40px", height: "40px" }}
        >
          <GraduationCap className="w-5 h-5 text-neutral-700 stroke-[1.75]" />
        </div>
        <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
          <div className="flex items-center flex-wrap" style={{ gap: "8px" }}>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate">
              My Class — {classNameDisplay}
            </h1>
            <span
              className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
              style={{ padding: "2px 8px" }}
            >
              Class Teacher
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 truncate">
            {enrolledCount} Enrolled Students • Academic Session 2026-2027
          </p>
        </div>
      </div>

      {/* Right: Action Buttons (Neutral Enterprise Theme) */}
      <div
        className="flex flex-wrap items-center shrink-0"
        style={{ gap: "10px" }}
      >
        <button
          type="button"
          onClick={handleClassHub}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
          style={{ height: "38px", padding: "0 14px", gap: "6px" }}
        >
          <BookOpen className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
          <span>Class Hub</span>
        </button>
        <button
          type="button"
          onClick={handleClassResults}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
          style={{ height: "38px", padding: "0 14px", gap: "6px" }}
        >
          <Award className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
          <span>Class Results</span>
        </button>
        <button
          type="button"
          onClick={handleMarkAttendance}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
          style={{ height: "38px", padding: "0 16px", gap: "6px" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 stroke-[1.75]" />
          <span>
            {isMarkedToday ? "Edit Attendance" : "Mark Today's Attendance"}
          </span>
        </button>
      </div>
    </div>
  );
}
