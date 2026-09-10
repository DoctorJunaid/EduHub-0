import { useState } from "react";
import { useSelector } from "react-redux";
import { CalendarDays, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { selectStudentAssignments } from "@/store/selectors/studentAssignments";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { assignmentAction } from "@/store/assignmentData";
import AssignmentStatusBadge from "../../components/AssignmentStatusBadge";
import AssignmentSubmissionForm from "../../components/AssignmentSubmissionForm";
import AssignmentFeedbackDialog from "../../components/AssignmentFeedbackDialog";
import "./StudentAssignments.css";

function AssignmentAction({ assignment }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={
            assignment.status === "Pending Submission" ? "default" : "outline"
          }
          aria-label={`${assignmentAction(assignment.status)}: ${assignment.title}`}
        >
          {assignmentAction(assignment.status)}
        </Button>
      </DialogTrigger>
      {open &&
        (assignment.status === "Graded" ? (
          <AssignmentFeedbackDialog assignment={assignment} />
        ) : (
          <AssignmentSubmissionForm
            assignment={assignment}
            onSaved={() => setOpen(false)}
          />
        ))}
    </Dialog>
  );
}
export default function StudentAssignments() {
  const assignments = useSelector(selectStudentAssignments);
  const student = useSelector(selectCurrentStudent);
  return (
    <section className="student-assignments">
      <header className="sa-page-heading">
        <h1>My Assignments &amp; Submissions</h1>
        <p>
          Submit project deliverables, track review statuses, and view teacher
          grading remarks.
        </p>
      </header>
      <Card className="sa-card">
        <div className="sa-card-heading">
          <h2>
            <span>
              <FileText aria-hidden="true" />
            </span>
            Active Course Tasks &amp; Homework
          </h2>
          <p>{assignments.length} total assignments</p>
        </div>
        <Table aria-label="Course assignments and submissions">
          <TableHeader>
            <TableRow>
              {[
                "Assignment Title & Subject",
                "Due Date",
                "Total Marks",
                "Submission Status",
                "Score / Feedback",
                "Action",
              ].map((title) => (
                <TableHead key={title} scope="col">
                  {title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <strong>{assignment.title}</strong>
                  <small>
                    {assignment.subject} • Sec {assignment.section}
                  </small>
                </TableCell>
                <TableCell>
                  {assignment.dueDate ? (
                    <span className="sa-date">
                      <CalendarDays aria-hidden="true" />
                      <time dateTime={assignment.dueDate}>
                        {assignment.dueDate}
                      </time>
                    </span>
                  ) : (
                    "Due date not available"
                  )}
                </TableCell>
                <TableCell>
                  {assignment.totalMarks == null
                    ? "Marks not available"
                    : `${assignment.totalMarks} Pts`}
                </TableCell>
                <TableCell>
                  <AssignmentStatusBadge status={assignment.status} />
                </TableCell>
                <TableCell
                  className={assignment.status === "Graded" ? "sa-score" : ""}
                >
                  {assignment.scoreLabel}
                </TableCell>
                <TableCell>
                  <AssignmentAction assignment={assignment} />
                </TableCell>
              </TableRow>
            ))}
            {!assignments.length && (
              <TableRow>
                <TableCell colSpan={6} className="sa-empty">
                  <FileText aria-hidden="true" />
                  <h3>No assignments available.</h3>
                  <p>
                    {student
                      ? "Assignments for your enrolled courses will appear here when available."
                      : "Your assignments will appear when your student record is linked."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
