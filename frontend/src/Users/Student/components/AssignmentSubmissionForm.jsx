import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { submitStudentAssignment } from "@/store/submitStudentAssignment";

export default function AssignmentSubmissionForm({ assignment, onSaved }) {
  const dispatch = useDispatch();
  const [notes, setNotes] = useState(assignment.submission?.notes ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editing = Boolean(assignment.submission);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const problem = await Promise.resolve(
        dispatch(submitStudentAssignment({ assignmentId: assignment.id, notes })),
      );
      if (problem) setError(problem);
      else onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <DialogContent className="student-assignment-dialog">
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit Submission" : "Submit Assignment"}
        </DialogTitle>
        <DialogDescription>{assignment.title}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} noValidate>
        <label htmlFor="assignment-notes">Submission text / notes</label>
        <Textarea
          id="assignment-notes"
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setError("");
          }}
          placeholder="Type your homework response, solution steps, or comments here..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "assignment-error" : "assignment-save-note"}
        />
        <p id="assignment-save-note">
          Your submission is transmitted directly to your instructor for grading.
        </p>
        {error && (
          <p id="assignment-error" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {editing ? "Save Changes" : "Submit Work"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
