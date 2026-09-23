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
import { submitStudentAssignment } from "@/store/submitStudentAssignment";

export default function AssignmentSubmissionForm({ assignment, onSaved }) {
  const dispatch = useDispatch();
  const [notes, setNotes] = useState(assignment.submission?.notes ?? "");
  const [error, setError] = useState("");
  const editing = Boolean(assignment.submission);
  const submit = (event) => {
    event.preventDefault();
    Promise.resolve(
      dispatch(submitStudentAssignment({ assignmentId: assignment.id, notes })),
    ).then((problem) => {
      if (problem) setError(problem);
      else onSaved();
    });
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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "assignment-error" : "assignment-save-note"}
        />
        <p id="assignment-save-note">
          Your submission is sent to your school. File attachments are not
          available yet.
        </p>
        {error && (
          <p id="assignment-error" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">
            {editing ? "Save Changes" : "Submit Work"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
