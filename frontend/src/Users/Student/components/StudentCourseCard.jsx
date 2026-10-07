import { useState } from "react";
import { Clock3, MapPin, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import StudentSubjectDetailModal from "./StudentSubjectDetailModal";

export default function StudentCourseCard({ course }) {
  const [modalOpen, setModalOpen] = useState(false);

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
      <Card className="student-course-card group relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
        <div className="student-course-card-content p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
          {/* Top Header Row */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700">
                  {course.code || "SSC-9"}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-800">
                  {course.category || "Compulsory"}
                </span>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
                {course.section ? `Sec ${course.section}` : "Section A"}
              </Badge>
            </div>

            {/* Subject Title */}
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
              {course.title}
            </h3>

            {/* Curriculum subtitle */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
              {course.description || "BISE Peshawar Board Standard Secondary Curriculum"}
            </p>
          </div>

          {/* Instructor & Routine Box */}
          <div className="rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 p-3 space-y-2 text-xs">
            {/* Instructor */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {(course.instructor || routines[0]?.instructor || "F")[0]}
                </div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {course.instructor || routines[0]?.instructor || "Assigned Faculty"}
                </span>
              </div>
              <span className="student-course-teacher-label text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">Teacher</span>
            </div>

            {/* Schedule */}
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <Clock3 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{routines[0]?.schedule || "Schedule available"}</span>
              </div>
              <div className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300 shrink-0">
                <MapPin className="w-3 h-3 text-neutral-400" />
                <span>{routines[0]?.room || "Room 101"}</span>
              </div>
            </div>
          </div>

          {/* Attendance Bar */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Attendance Standing</span>
              <span className={`font-semibold flex items-center gap-1 ${isAttendanceRisk ? "text-amber-600 dark:text-amber-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                {isAttendanceRisk ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />}
                {attendanceRate}%
              </span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAttendanceRisk ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="student-course-card-footer pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 mt-auto">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              Marks: <strong className="text-neutral-700 dark:text-neutral-300">{course.totalMarks || 75}</strong>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 px-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg group/btn"
            >
              Details &amp; Syllabus
              <ChevronRight className="w-3.5 h-3.5 ml-1 text-neutral-400 group-hover/btn:translate-x-0.5 transition-transform" />
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
