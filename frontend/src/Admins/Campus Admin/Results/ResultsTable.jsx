import { FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { percentage } from "./resultsData.js";
export default function ResultsTable({ rows, onTranscript, onEdit }) {
  const columnDefs = [
    { label: "Student & Roll No", width: "23%", align: "left" },
    { label: "Course / Subject", width: "19%", align: "left" },
    { label: "Semester", width: "11%", align: "left" },
    { label: "Score & %", width: "10%", align: "left" },
    { label: "Grade", width: "7%", align: "center" },
    { label: "GPA", width: "7%", align: "center" },
    { label: "Remarks", width: "10%", align: "left" },
    { label: "Actions", width: "13%", align: "right" },
  ];

  return (
    <Table aria-label="Exam results">
      <TableHeader>
        <TableRow>
          {columnDefs.map(({ label, width, align }) => (
            <TableHead scope="col" key={label} style={{ width, textAlign: align }}>
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell style={{ width: "23%" }}>
              <div className="results-person">
                <Avatar>
                  <AvatarFallback>
                    {row.student.initials || row.student.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.student.name}</strong>
                  <small style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#71717a" }}>{row.student.roll}</small>
                </div>
              </div>
            </TableCell>
            <TableCell style={{ width: "19%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.exam.subject}</strong>
              <small style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#71717a" }}>{row.courseCode || "—"}</small>
            </TableCell>
            <TableCell style={{ width: "11%" }}>
              {row.semester}
              <small>{row.academicYear}</small>
            </TableCell>
            <TableCell className="results-score" style={{ width: "10%" }}>
              {row.score} / {row.totalMarks}{" "}
              <small>({percentage(row)?.toFixed(1) ?? "—"}%)</small>
            </TableCell>
            <TableCell style={{ width: "7%", textAlign: "center" }}>
              <Badge variant="secondary" className="results-grade">
                {row.grade || "—"}
              </Badge>
            </TableCell>
            <TableCell style={{ width: "7%", textAlign: "center" }}>{row.gpa?.toFixed(2) ?? "—"}</TableCell>
            <TableCell className="results-remarks" style={{ width: "10%" }}>
              {row.remarks || "—"}
            </TableCell>
            <TableCell style={{ width: "13%", textAlign: "right" }}>
              <div className="results-actions">
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn-outline"
                  style={{ height: "26px", padding: "0 7px", fontSize: "11px", fontWeight: "600" }}
                  onClick={() => onTranscript(row.studentId)}
                  aria-label={`View transcript for ${row.student.name}`}
                >
                  <FileText size={12} />
                  Transcript
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="table-icon-btn"
                      style={{ width: "24px", height: "26px" }}
                      aria-label={`Result actions for ${row.student.name}, ${row.exam.subject}`}
                    >
                      <MoreVertical size={13} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(row.id)}>
                      Edit result
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {!rows.length && (
          <TableRow>
            <TableCell colSpan={8} className="tt-empty">
              No results match the selected filters. Record a result to get
              started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
