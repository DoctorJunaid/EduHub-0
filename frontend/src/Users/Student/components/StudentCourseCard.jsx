import { useState } from "react";
import {
  Clock3,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import StudentSubjectDetailModal from "./StudentSubjectDetailModal";

export default function StudentCourseCard({ course }) {
  const [modalOpen, setModalOpen] = useState(false);

  const routines =
    course.routines && course.routines.length
      ? course.routines
      : [
          {
            id: "routine-default",
            schedule: "Mon – Fri · 08:45 AM – 09:30 AM",
            instructor: course.instructor || "Assigned Faculty",
          },
        ];

  const attendanceRate =
    course.attendance?.rate != null ? course.attendance.rate : 90;
  const isAttendanceRisk = attendanceRate < 75;

  return (
    <>
      <Card
        className="student-course-card group relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 shadow-xs transition-all flex flex-col"
        data-category={course.category || "Compulsory"}
      >
        <div className="student-course-card-content flex flex-1 flex-col">
          <div className="student-course-card-heading">
            <div className="student-course-card-tags">
              <div className="student-course-card-category">
                <span className="student-course-code">
                  {course.code || "SSC-9"}
                </span>
              </div>
            </div>

            <h3 className="student-course-title line-clamp-2">
              {course.title}
            </h3>
          </div>

          <div className="student-course-facts">
            <div className="student-course-instructor">
              <div className="student-course-instructor-main">
                <div className="student-course-avatar">
                  {(course.instructor || routines[0]?.instructor || "F")[0]}
                </div>
                <span className="student-course-instructor-name">
                  {course.instructor ||
                    routines[0]?.instructor ||
                    "Assigned Faculty"}
                </span>
              </div>
              <span className="student-course-teacher-label">Teacher</span>
            </div>

            <div className="student-course-schedule">
              <div className="student-course-schedule-time">
                <Clock3 aria-hidden="true" />
                <span>{routines[0]?.schedule || "Schedule available"}</span>
              </div>
            </div>
          </div>

          <div className="student-course-attendance">
            <div className="student-course-attendance-heading">
              <span>Attendance Standing</span>
              <span
                className={`student-course-attendance-value${isAttendanceRisk ? " is-at-risk" : ""}`}
              >
                {isAttendanceRisk ? (
                  <AlertTriangle aria-hidden="true" />
                ) : (
                  <CheckCircle2 aria-hidden="true" />
                )}
                {attendanceRate}%
              </span>
            </div>
            <div
              className="student-course-attendance-track"
              role="progressbar"
              aria-label="Attendance standing"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.max(0, attendanceRate))}
            >
              <div
                className={`student-course-attendance-fill${isAttendanceRisk ? " is-at-risk" : ""}`}
                style={{
                  width: `${Math.min(100, Math.max(0, attendanceRate))}%`,
                }}
              />
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="student-course-card-footer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="student-course-details-button group/btn"
            >
              Details &amp; Syllabus
              <ChevronRight aria-hidden="true" />
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
