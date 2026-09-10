import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
export default function AssignmentFeedbackDialog({ assignment }) {
  return (
    <DialogContent className="student-assignment-dialog">
      <DialogHeader>
        <DialogTitle>Assignment Feedback</DialogTitle>
        <DialogDescription>{assignment.title}</DialogDescription>
      </DialogHeader>
      <dl className="student-assignment-feedback">
        <dt>Score</dt>
        <dd className="sa-score">{assignment.scoreLabel}</dd>
        <dt>Teacher feedback</dt>
        <dd>
          {assignment.submission?.feedback || "No teacher feedback provided."}
        </dd>
        <dt>Your submission</dt>
        <dd>
          {assignment.submission?.notes || "Submission details not available."}
        </dd>
      </dl>
      <DialogFooter showCloseButton />
    </DialogContent>
  );
}
