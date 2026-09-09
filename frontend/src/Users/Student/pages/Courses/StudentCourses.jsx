import { useSelector } from "react-redux";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { selectStudentCourses } from "@/store/selectors/studentCourses";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import StudentCourseCard from "../../components/StudentCourseCard";
import "./StudentCourses.css";

export default function StudentCourses() {
  const courses = useSelector(selectStudentCourses);
  const student = useSelector(selectCurrentStudent);
  return (
    <section
      className="student-courses"
      aria-labelledby="student-courses-title"
    >
      <div className="sc-page-heading">
        <h1 id="student-courses-title">My Enrolled Courses &amp; Routine</h1>
        <p>
          Semester course allocations, syllabus modules, and instructor details.
        </p>
      </div>
      {courses.length ? (
        <div className="sc-grid">
          {courses.map((course) => (
            <StudentCourseCard key={course.title} course={course} />
          ))}
        </div>
      ) : (
        <Card className="sc-empty" role="status">
          <BookOpen aria-hidden="true" />
          <h2>No enrolled courses found.</h2>
          <p>
            {student
              ? "Your assigned subjects will appear here once added to your student record."
              : "Ask your institute to verify the email address on your student record."}
          </p>
        </Card>
      )}
    </section>
  );
}
