import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  ChartNoAxesColumnIncreasing,
  GraduationCap,
  CalendarDays,
  Trophy,
  Printer,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import SummaryCard from "@/components/common/SummaryCard";
import { printElement } from "@/lib/print";
import { selectStudentGrades } from "@/store/selectors/studentGrades";
import "./StudentGrades.css";

export default function StudentGrades() {
  const { student, cgpa, periods } = useSelector(selectStudentGrades);
  const [selected, setSelected] = useState("");
  const period =
    periods.find((item) => item.key === selected) ??
    periods.find((item) => item.semester === student?.semester) ??
    periods[0];
  const sheet = useRef(null);
  const stats = [
    {
      label: "Cumulative GPA (CGPA)",
      icon: ChartNoAxesColumnIncreasing,
      value: cgpa == null ? "—" : cgpa.toFixed(2),
      description:
        cgpa == null ? "CGPA not recorded" : "Recorded cumulative GPA",
    },
    {
      label: "Completed Credits",
      icon: GraduationCap,
      value: Number.isFinite(student?.completedCredits)
        ? student.completedCredits
        : "—",
      description: student?.academicSummaryDemo
        ? "Recorded demo credits"
        : "Recorded completed credits",
    },
    {
      label: "Current Semester",
      icon: CalendarDays,
      value: student?.semester || "—",
      description: student?.program || "Student record not linked",
    },
    {
      label: "Academic Standing",
      icon: Trophy,
      value: student?.academicStanding || "—",
      description: student?.academicSummaryDemo
        ? "Demo academic standing"
        : "Recorded standing",
    },
  ];
  return (
    <section className="student-grades-page">
      <header className="sg-page-heading">
        <div>
          <h1>Academic Results &amp; CGPA Transcript</h1>
          <p>
            Semester evaluation breakdown, letter grades, GPA index, and faculty
            remarks.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!period?.rows.length}
          onClick={() =>
            printElement(sheet.current, `${student.name} - Academic Results`)
          }
        >
          <Printer aria-hidden="true" />
          Print Official Transcript
        </Button>
      </header>
      <div className="sg-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sg-stat" />
        ))}
      </div>
      {periods.length > 1 && (
        <label className="sg-period">
          Academic period
          <select
            value={period.key}
            onChange={(event) => setSelected(event.target.value)}
          >
            {periods.map((item) => (
              <option key={item.key} value={item.key}>
                {item.semester} · {item.academicYear}
              </option>
            ))}
          </select>
        </label>
      )}
      <Card className="sg-sheet" ref={sheet}>
        <div className="sg-sheet-heading">
          <div className="sg-sheet-title">
            <span data-print-hide>
              <FileText aria-hidden="true" />
            </span>
            <div>
              <h2>
                Semester Grade Sheet{period ? ` (${period.semester})` : ""}
              </h2>
              <p>
                {student?.name || "Student record not linked"}
                {student?.roll ? ` · Roll No: ${student.roll}` : ""}
              </p>
              {period && (
                <p>
                  {student?.program} · Academic Year: {period.academicYear}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            className="sg-transcript-badge"
            data-print-hide
          >
            Official Transcript · Demo
          </Badge>
        </div>
        <p className="sg-note">
          Frontend academic report; not institutionally certified. Grades and
          GPA are recorded exam awards, not a calculated semester or
          credit-weighted CGPA.
        </p>
        <Table aria-label="Semester academic results">
          <TableHeader>
            <TableRow>
              {[
                "Course / Subject",
                "Marks Obtained",
                "Total Marks",
                "Letter Grade",
                "Grade Point (GPA)",
                "Faculty Evaluation Remarks",
              ].map((heading) => (
                <TableHead key={heading} scope="col">
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {period?.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <strong>{row.exam.subject}</strong>
                  <small>
                    {row.exam.examType}
                    {row.courseCode ? ` · ${row.courseCode}` : ""}
                  </small>
                  <small>
                    {Number.isFinite(row.creditHours)
                      ? `${row.creditHours} Credit Hours`
                      : "Credit hours not available"}
                  </small>
                </TableCell>
                <TableCell>{row.score}</TableCell>
                <TableCell>{row.totalMarks}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="sg-grade">
                    {row.grade || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.gpa == null ? "—" : row.gpa.toFixed(2)}
                </TableCell>
                <TableCell>{row.remarks.trim() || "No remarks"}</TableCell>
              </TableRow>
            ))}
            {!period?.rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="sg-empty">
                  {student
                    ? "No academic results available yet."
                    : "Your academic results will appear when your student record is linked."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="sg-print-summary">
          Recorded CGPA: {cgpa == null ? "Not available" : cgpa.toFixed(2)} ·
          Completed credits: {student?.completedCredits ?? "Not available"}
        </p>
      </Card>
    </section>
  );
}
