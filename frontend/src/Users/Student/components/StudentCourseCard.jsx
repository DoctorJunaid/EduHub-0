import { useState } from "react";
import { Clock3, MapPin, UserRound, BookOpen, GraduationCap, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import StudentSubjectDetailModal from "./StudentSubjectDetailModal";

const getSubjectTheme = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("math")) {
    return {
      gradient: "from-blue-600 to-indigo-600",
      bgLight: "bg-blue-50/70 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/50",
      accent: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    };
  }
  if (t.includes("physic")) {
    return {
      gradient: "from-violet-600 to-purple-700",
      bgLight: "bg-purple-50/70 dark:bg-purple-950/20",
      border: "border-purple-200 dark:border-purple-900/50",
      accent: "text-purple-600 dark:text-purple-400",
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    };
  }
  if (t.includes("chem")) {
    return {
      gradient: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50/70 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-900/50",
      accent: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    };
  }
  if (t.includes("computer") || t.includes("cs")) {
    return {
      gradient: "from-cyan-600 to-sky-700",
      bgLight: "bg-cyan-50/70 dark:bg-cyan-950/20",
      border: "border-cyan-200 dark:border-cyan-900/50",
      accent: "text-cyan-600 dark:text-cyan-400",
      badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
    };
  }
  if (t.includes("bio")) {
    return {
      gradient: "from-green-600 to-lime-700",
      bgLight: "bg-green-50/70 dark:bg-green-950/20",
      border: "border-green-200 dark:border-green-900/50",
      accent: "text-green-600 dark:text-green-400",
      badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    };
  }
  if (t.includes("english")) {
    return {
      gradient: "from-amber-600 to-orange-700",
      bgLight: "bg-amber-50/70 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/50",
      accent: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    };
  }
  if (t.includes("urdu")) {
    return {
      gradient: "from-rose-600 to-pink-700",
      bgLight: "bg-rose-50/70 dark:bg-rose-950/20",
      border: "border-rose-200 dark:border-rose-900/50",
      accent: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    };
  }
  if (t.includes("islamic") || t.includes("islamiat") || t.includes("quran") || t.includes("mutala")) {
    return {
      gradient: "from-teal-600 to-emerald-800",
      bgLight: "bg-teal-50/70 dark:bg-teal-950/20",
      border: "border-teal-200 dark:border-teal-900/50",
      accent: "text-teal-600 dark:text-teal-400",
      badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    };
  }
  if (t.includes("pakistan")) {
    return {
      gradient: "from-green-700 to-emerald-900",
      bgLight: "bg-green-50/70 dark:bg-green-950/20",
      border: "border-green-200 dark:border-green-900/50",
      accent: "text-green-700 dark:text-green-400",
      badge: "bg-green-100 text-green-900 dark:bg-green-900/50 dark:text-green-300",
    };
  }
  return {
    gradient: "from-zinc-700 to-zinc-900",
    bgLight: "bg-zinc-50 dark:bg-zinc-900/30",
    border: "border-zinc-200 dark:border-zinc-800",
    accent: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
  };
};

export default function StudentCourseCard({ course }) {
  const [modalOpen, setModalOpen] = useState(false);

  const theme = getSubjectTheme(course.title);
  const routines = course.routines && course.routines.length
    ? course.routines
    : [
        {
          id: "routine-default",
          schedule: "Mon – Fri · 08:45 AM – 09:30 AM",
          room: "Room 101",
          instructor: course.instructor || "Assigned Faculty",
        },
      ];

  const attendanceRate = course.attendance?.rate != null ? course.attendance.rate : 90;
  const isAttendanceRisk = attendanceRate < 75;

  return (
    <>
      <Card className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        {/* Top Gradient Banner */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${theme.gradient}`} />

        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          {/* Top Header Row */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${theme.badge}`}>
                  {course.code || "SSC-9"}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {course.category || "Compulsory"}
                </span>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                {course.section ? `Sec ${course.section}` : "Section A"}
              </Badge>
            </div>

            {/* Subject Title */}
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
              {course.title}
            </h3>

            {/* Curriculum subtitle */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
              {course.description || "BISE Peshawar Board Standard Secondary Curriculum"}
            </p>
          </div>

          {/* Instructor & Routine Box */}
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5 space-y-2.5 text-xs">
            {/* Instructor */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {(course.instructor || "F")[0]}
                </div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {course.instructor || routines[0]?.instructor || "Assigned Faculty"}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 shrink-0">Teacher</span>
            </div>

            {/* Schedule */}
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 truncate">
                <Clock3 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{routines[0]?.schedule || "Schedule available"}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span>{routines[0]?.room || "Room 101"}</span>
              </div>
            </div>
          </div>

          {/* Attendance Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Attendance Standing</span>
              <span className={`font-bold flex items-center gap-1 ${isAttendanceRisk ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {isAttendanceRisk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {attendanceRate}%
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAttendanceRisk ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-mono">
              Marks: <strong>{course.totalMarks || 75}</strong>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg group/btn"
            >
              Details & Syllabus
              <ChevronRight className="w-3.5 h-3.5 ml-1 text-zinc-400 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </Card>

      <StudentSubjectDetailModal
        course={course}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
