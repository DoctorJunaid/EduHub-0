import { Clock3, MapPin, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function StudentCourseCard({ course }) {
  const routines = course.routines.length
    ? course.routines
    : [
        {
          id: "unavailable",
          schedule: "Schedule not available",
          room: "Location not available",
          instructor: "Instructor not assigned",
        },
      ];
  const attendanceText =
    course.attendance.rate == null
      ? "—"
      : `${Number(course.attendance.rate.toFixed(1))}%`;
  const attendanceHint = course.attendance.policyPending
    ? "Late/leave attendance policy is not configured."
    : course.attendance.marked
      ? `${course.attendance.present} of ${course.attendance.marked} recorded days present.`
      : "No attendance recorded for this subject.";
  return (
    <Card className="student-course-card">
      <div className="sc-card-top">
        <Badge variant="secondary" className="sc-section">
          {course.section ? `Sec ${course.section}` : "Section unavailable"}
        </Badge>
      </div>
      <h2>{course.title}</h2>
      <div className="sc-routines">
        {routines.map((routine) => (
          <dl className="sc-info" key={routine.id}>
            <div>
              <dt>
                <Clock3 aria-hidden="true" />
                Schedule:
              </dt>
              <dd>{routine.schedule}</dd>
            </div>
            <div>
              <dt>
                <MapPin aria-hidden="true" />
                Location:
              </dt>
              <dd>{routine.room}</dd>
            </div>
            <div>
              <dt>
                <UserRound aria-hidden="true" />
                Instructor:
              </dt>
              <dd>{routine.instructor}</dd>
            </div>
          </dl>
        ))}
      </div>
      <div className="sc-card-footer">
        <span
          title={attendanceHint}
          aria-label={`Attendance: ${attendanceText}. ${attendanceHint}`}
        >
          Attendance: {attendanceText}
        </span>
      </div>
    </Card>
  );
}
