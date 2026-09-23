import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  ChartNoAxesColumnIncreasing,
  Trophy,
  Printer,
  FileText,
  Medal,
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
  const { student, periods } = useSelector(selectStudentGrades);
  const [selected, setSelected] = useState("");
  const period =
    periods.find((item) => item.key === selected) ??
    periods.find((item) => item.semester === student?.semester) ??
    periods[0];
  const sheet = useRef(null);
  const totalMarks =
    period?.rows.reduce((sum, row) => sum + (Number(row.totalMarks) || 0), 0) ||
    0;
  const marksObtained =
    period?.rows.reduce((sum, row) => sum + (Number(row.score) || 0), 0) || 0;
  const percentage = totalMarks
    ? Math.round((marksObtained / totalMarks) * 100)
    : null;
  const overallGrade =
    period?.overallGrade ||
    student?.overallGrade ||
    (percentage == null
      ? null
      : percentage >= 80
        ? "A"
        : percentage >= 70
          ? "B"
          : percentage >= 60
            ? "C"
            : percentage >= 50
              ? "D"
              : "F");
  const classPosition =
    period?.classPosition ||
    student?.classPosition ||
    student?.position ||
    null;
  const resultStatus = period?.resultStatus || student?.resultStatus || null;
  const termLabel = (item) => {
    const source = item?.term || item?.semester || "Exam Term";
    if (/midterm/i.test(source)) return "Mid-Term";
    if (/final|annual/i.test(source)) return "Final Exam";
    if (/first|1st/i.test(source)) return "1st Term";
    return source;
  };
  const stats = [
    {
      label: "Total Marks Obtained",
      icon: FileText,
      value: period?.rows.length ? `${marksObtained} / ${totalMarks}` : "—",
    },
    {
      label: "Overall Percentage",
      icon: ChartNoAxesColumnIncreasing,
      value: percentage == null ? "—" : `${percentage}%`,
    },
    {
      label: "Overall Grade",
      icon: Trophy,
      value: overallGrade ? `Grade ${overallGrade}` : "—",
    },
    {
      label: "Class Position",
      icon: Medal,
      value: classPosition ? `${classPosition} Position` : "Not published",
    },
  ];
  return (
    <section className="student-grades-page">
      <div className="sg-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sg-stat" />
        ))}
      </div>
      <header className="sg-page-heading">
        <label className="sg-period">
          <span>Exam Term</span>
          <select
            value={period?.key || ""}
            disabled={!periods.length}
            onChange={(event) => setSelected(event.target.value)}
          >
            {periods.length ? (
              periods.map((item) => (
                <option key={item.key} value={item.key}>
                  {termLabel(item)} · {item.academicYear}
                </option>
              ))
            ) : (
              <option value="">No published term</option>
            )}
          </select>
        </label>
        <Button
          variant="outline"
          disabled={!period?.rows.length}
          onClick={() =>
            printElement(
              sheet.current,
              `${student?.name || "Student"} - Result Card`,
            )
          }
        >
          <Printer aria-hidden="true" />
          Download Result Card (PDF)
        </Button>
      </header>
      <Card className="sg-sheet" ref={sheet}>
        <div className="sg-sheet-heading">
          <div className="sg-sheet-title">
            <span data-print-hide>
              <FileText aria-hidden="true" />
            </span>
            <div>
              <h2>Student Exam Result Card</h2>
              <p>
                {student?.name || "Student record not linked"}
                {student?.roll ? ` · Roll No: ${student.roll}` : ""}
              </p>
              <p>
                {student?.gradeOrClass ||
                  student?.className ||
                  "Class not linked"}
                {student?.section ? ` - Section ${student.section}` : ""}
                {period ? ` · Session ${period.academicYear}` : ""}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="sg-transcript-badge"
            data-print-hide
          >
            {period ? termLabel(period) : "Result Card"}
          </Badge>
        </div>
        <Table aria-label="Student exam results">
          <TableHeader>
            <TableRow>
              {[
                "Subject",
                "Total Marks",
                "Marks Obtained",
                "Letter Grade",
                "Teacher Remarks",
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
                </TableCell>
                <TableCell>{row.totalMarks}</TableCell>
                <TableCell>{row.score}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="sg-grade">
                    {row.grade || "—"}
                  </Badge>
                </TableCell>
                <TableCell>{row.remarks.trim() || "No remarks"}</TableCell>
              </TableRow>
            ))}
            {!period?.rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="sg-empty">
                  {student
                    ? "No academic results available yet."
                    : "Your academic results will appear when your student record is linked."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="sg-result-footer">
          <div>
            <strong>Final Result Status</strong>
            <span>{resultStatus || "Not published"}</span>
          </div>
          <div className="sg-signatures">
            <span>Class Teacher Signature</span>
            <span>Principal Signature</span>
          </div>
        </div>
      </Card>
    </section>
  );
}
