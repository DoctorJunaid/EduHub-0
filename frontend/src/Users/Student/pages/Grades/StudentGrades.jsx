import { useRef, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  ChartNoAxesColumnIncreasing,
  Trophy,
  Printer,
  FileText,
  Medal,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { printElement } from "@/lib/print";
import { selectStudentGrades } from "@/store/selectors/studentGrades";
import { PageLoader } from "@/components/ui/spinner";
import useStudentPortal from "@/hooks/useStudentPortal";
import "./StudentGrades.css";

const getGradeColorClass = (grade) => {
  if (!grade) return "grade-default";
  const g = grade.toUpperCase().trim();
  if (g.startsWith("A")) return "grade-a";
  if (g.startsWith("B")) return "grade-b";
  if (g.startsWith("C")) return "grade-c";
  if (g.startsWith("D")) return "grade-d";
  return "grade-f";
};

export default function StudentGrades() {
  const { isLoading, classTeacher } = useStudentPortal();
  const { student, periods = [] } = useSelector(selectStudentGrades) || {};
  const [selected, setSelected] = useState("");
  const sheet = useRef(null);

  const termLabel = (item) => {
    const source = item?.academicTerm || item?.term || item?.semester || "Exam Term";
    if (/midterm/i.test(source)) return "Mid-Term Examination";
    if (/final|annual/i.test(source)) return "Final Annual Examination";
    if (/first|1st|term\s*1/i.test(source)) return "1st Term Assessment";
    if (/second|2nd|term\s*2/i.test(source)) return "2nd Term Assessment";
    if (/third|3rd|term\s*3/i.test(source)) return "3rd Term Assessment";
    return source;
  };

  const period = useMemo(() => {
    return (
      (periods || []).find((item) => item.key === selected) ??
      (periods || []).find((item) => item.semester === student?.semester) ??
      (periods || [])[0]
    );
  }, [periods, selected, student?.semester]);

  const totalMarks = useMemo(() => {
    return (
      period?.rows?.reduce((sum, row) => sum + (Number(row.totalMarks) || 0), 0) || 0
    );
  }, [period]);

  const marksObtained = useMemo(() => {
    return (
      period?.rows?.reduce((sum, row) => sum + (Number(row.score) || 0), 0) || 0
    );
  }, [period]);

  const percentage = useMemo(() => {
    return totalMarks ? Math.round((marksObtained / totalMarks) * 100) : null;
  }, [totalMarks, marksObtained]);

  const overallGrade = useMemo(() => {
    if (period?.overallGrade) return period.overallGrade;
    if (student?.overallGrade) return student.overallGrade;
    if (percentage == null) return null;
    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  }, [period, student, percentage]);

  const classPosition =
    period?.classPosition ||
    student?.classPosition ||
    student?.position ||
    null;

  const resultStatus = period?.resultStatus || student?.resultStatus || (overallGrade && overallGrade !== "F" ? "Passed" : "Promoted");

  const stats = useMemo(() => {
    return [
      {
        label: "Total Marks",
        icon: FileText,
        value: period?.rows?.length ? `${marksObtained} / ${totalMarks}` : "—",
        description: period?.rows?.length ? `${period.rows.length} Subjects Evaluated` : "No subjects",
      },
      {
        label: "Overall Score",
        icon: ChartNoAxesColumnIncreasing,
        value: percentage == null ? "—" : `${percentage}%`,
        description: percentage >= 70 ? "First Division" : percentage >= 50 ? "Second Division" : "Third Division",
      },
      {
        label: "Overall Grade",
        icon: Trophy,
        value: overallGrade ? `Grade ${overallGrade}` : "—",
        description: overallGrade && !overallGrade.startsWith("F") ? "Pass Status Verified" : "Academic Review",
      },
      {
        label: "Class Rank / Position",
        icon: Medal,
        value: classPosition ? `${classPosition}` : "Published",
        description: "Official Class Standing",
      },
    ];
  }, [period, marksObtained, totalMarks, percentage, overallGrade, classPosition]);

  if (isLoading && !student) {
    return <PageLoader text="Loading progress report & marks..." />;
  }

  return (
    <section className="student-grades-page">
      {/* 1. Neutral Standardized KPI Metric Cards */}
      <div className="sg-stats">
        {stats.map((stat) => (
          <Card key={stat.label} className="sg-stat">
            <div className="sg-stat-icon-wrap">
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="sg-stat-info">
              <span className="sg-stat-label">{stat.label}</span>
              <span className="sg-stat-num">{stat.value}</span>
              <span className="sg-stat-sub">{stat.description}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* 2. Controls & Actions Bar */}
      <header className="sg-page-heading">
        <label className="sg-period">
          <span>Examination Term</span>
          <select
            value={period?.key || ""}
            disabled={!periods.length}
            onChange={(event) => setSelected(event.target.value)}
            aria-label="Select examination term"
          >
            {periods.length ? (
              periods.map((item) => (
                <option key={item.key} value={item.key}>
                  {termLabel(item)} · Session {item.academicYear}
                </option>
              ))
            ) : (
              <option value="">No published term</option>
            )}
          </select>
        </label>

        <Button
          variant="outline"
          disabled={!period?.rows?.length}
          onClick={() =>
            printElement(
              sheet.current,
              `${student?.name || "Student"} - Result Card`,
            )
          }
          className="sg-download-btn"
          aria-label="Download or print result card PDF"
        >
          <Printer className="w-4 h-4 mr-1.5" aria-hidden="true" />
          <span>Print / Save Report Card</span>
        </Button>
      </header>

      {/* 3. Progress Report Card Sheet */}
      <Card className="sg-sheet" ref={sheet}>
        {/* Printable Official Header */}
        <div className="sg-sheet-heading">
          <div className="sg-sheet-title">
            <div className="sg-sheet-icon-wrap" data-print-hide>
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div className="sg-sheet-meta">
              <h2>Official Progress Report Card</h2>
              <div className="sg-student-bio">
                <span className="sg-bio-name">{student?.name || "Enrolled Student"}</span>
                {student?.roll && <span className="sg-bio-item">Roll: <strong>{student.roll}</strong></span>}
                <span className="sg-bio-item">
                  Class: <strong>{student?.gradeOrClass || student?.className || "Class 9"}</strong>
                </span>
                {student?.section && (
                  <span className="sg-bio-item">
                    Section: <strong>{student.section.replace(/^Section\s*/i, "")}</strong>
                  </span>
                )}
                {period?.academicYear && (
                  <span className="sg-bio-item">Session: <strong>{period.academicYear}</strong></span>
                )}
              </div>
            </div>
          </div>

          <Badge variant="secondary" className="sg-transcript-badge" data-print-hide>
            {period ? termLabel(period) : "Academic Transcript"}
          </Badge>
        </div>

        {/* Desktop & Tablet Table (>= 768px) */}
        <div className="sg-table-container">
          <Table aria-label="Student exam results">
            <TableHeader>
              <TableRow>
                {[
                  "Subject Name",
                  "Total Marks",
                  "Marks Obtained",
                  "Grade",
                  "Percentage",
                  "Teacher Remarks",
                ].map((heading) => (
                  <TableHead key={heading} scope="col">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {period?.rows?.map((row) => {
                const subTotal = Number(row.totalMarks) || 100;
                const subScore = Number(row.score) || 0;
                const subPct = Math.round((subScore / subTotal) * 100);
                const gradeClass = getGradeColorClass(row.grade);

                return (
                  <TableRow key={row.id} className="sg-table-row">
                    <TableCell>
                      <strong className="sg-subject-name">{row.exam?.subject || row.subject}</strong>
                    </TableCell>
                    <TableCell>{subTotal}</TableCell>
                    <TableCell>
                      <strong className="sg-score-text">{subScore}</strong>
                    </TableCell>
                    <TableCell>
                      <span className={`sg-grade-badge ${gradeClass}`}>
                        {row.grade || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="sg-sub-pct">{subPct}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="sg-remarks-text">
                        {row.remarks?.trim() ? row.remarks : "Satisfactory Progress"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!period?.rows?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="sg-empty">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <h3>No examination marks recorded for this term.</h3>
                    <p>Select another term above or check back when teachers publish grades.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Subject Cards (< 768px) */}
        <div className="sg-mobile-cards">
          {period?.rows?.map((row) => {
            const subTotal = Number(row.totalMarks) || 100;
            const subScore = Number(row.score) || 0;
            const subPct = Math.round((subScore / subTotal) * 100);
            const gradeClass = getGradeColorClass(row.grade);

            return (
              <div key={row.id} className="sg-mobile-card">
                <div className="sg-mobile-card-header">
                  <strong className="sg-mobile-subject">{row.exam?.subject || row.subject}</strong>
                  <span className={`sg-grade-badge ${gradeClass}`}>
                    Grade {row.grade || "—"}
                  </span>
                </div>

                <div className="sg-mobile-marks-row">
                  <div className="sg-mobile-mark-box">
                    <span className="sg-mobile-mark-label">Obtained</span>
                    <strong className="sg-mobile-mark-val">{subScore}</strong>
                  </div>
                  <div className="sg-mobile-mark-box">
                    <span className="sg-mobile-mark-label">Total Marks</span>
                    <span className="sg-mobile-mark-val">{subTotal}</span>
                  </div>
                  <div className="sg-mobile-mark-box">
                    <span className="sg-mobile-mark-label">Percentage</span>
                    <span className="sg-mobile-mark-val">{subPct}%</span>
                  </div>
                </div>

                <div className="sg-mobile-progress-track">
                  <div
                    className={`sg-mobile-progress-bar ${gradeClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, subPct))}%` }}
                  />
                </div>

                <div className="sg-mobile-remarks">
                  <span>Remarks: {row.remarks?.trim() ? row.remarks : "Satisfactory Progress"}</span>
                </div>
              </div>
            );
          })}

          {!period?.rows?.length && (
            <div className="sg-empty sg-mobile-empty">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3>No marks recorded yet.</h3>
              <p>Select another term above to view results.</p>
            </div>
          )}
        </div>

        {/* Report Card Official Summary & Signatures */}
        <div className="sg-result-footer">
          <div className="sg-status-box">
            <span className="sg-status-label">Overall Academic Standing</span>
            <div className="sg-status-val-row">
              <strong className="sg-status-val">{resultStatus}</strong>
              {percentage != null && (
                <span className="sg-status-pill">
                  {percentage}% Aggregate
                </span>
              )}
            </div>
          </div>

          <div className="sg-signatures">
            <div className="sg-sig-box">
              {classTeacher?.name ? (
                <>
                  <div className="sg-sig-name">{classTeacher.name}</div>
                  <div className="sg-sig-verified">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />
                    Class Teacher (Verified)
                  </div>
                </>
              ) : (
                <span className="sg-sig-placeholder">Class Teacher Signature</span>
              )}
            </div>

            <div className="sg-sig-box">
              <div className="sg-sig-name">Office of the Principal</div>
              <div className="sg-sig-verified">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />
                Authorized Controller
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
