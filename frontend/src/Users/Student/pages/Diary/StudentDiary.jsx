import { useState } from "react";
import { useSelector } from "react-redux";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { selectStudentCourses } from "@/store/selectors/studentCourses";
import {
  selectStudentDiary,
  filterDiaryBySubject,
} from "@/store/selectors/studentDiary";
import StudentDiaryEntry from "../../components/StudentDiaryEntry";
import "./StudentDiary.css";

export default function StudentDiary() {
  const courses = useSelector(selectStudentCourses);
  const entries = useSelector(selectStudentDiary);
  const [selected, setSelected] = useState("");
  const subject = courses.some((course) => course.title === selected)
    ? selected
    : "";
  const visible = filterDiaryBySubject(entries, subject);
  return (
    <section className="student-diary-page">
      <header className="sdp-heading">
        <Select
          value={subject ? `subject:${subject}` : "all"}
          onValueChange={(value) =>
            setSelected(value === "all" ? "" : value.slice(8))
          }
        >
          <SelectTrigger aria-label="Filter diary by subject">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="student-diary-subjects">
            <SelectItem value="all">All Subjects</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.title} value={`subject:${course.title}`}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>
      <div className="sdp-entries" aria-live="polite">
        {visible.map((entry) => (
          <StudentDiaryEntry key={entry.id} entry={entry} />
        ))}
        {!visible.length && (
          <Card className="sdp-empty">
            <BookOpen aria-hidden="true" />
            <h2>
              {subject
                ? "No diary entries found for this subject."
                : "No diary entries available."}
            </h2>
            <p>
              Lecture notes for your enrolled classes will appear here when
              available.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}
