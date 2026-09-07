import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StudentStatusBadge from "./StudentStatusBadge";

export default function StudentProfileDialog({ student, onClose }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="student-profile-dialog"
        overlayClassName="student-modal-overlay"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <div className="student-profile-heading">
          <Avatar className="student-profile-avatar">
            <AvatarFallback>{student.initials}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle>{student.name}</DialogTitle>
            <p>{student.roll}</p>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="student-modal-close"
              aria-label="Close student profile"
            >
              <X size={23} />
            </Button>
          </DialogClose>
        </div>
        <dl className="student-profile-summary">
          <div>
            <dt>Class / Program</dt>
            <dd>{student.program || "—"}</dd>
          </div>
          <div>
            <dt>Section &amp; Semester</dt>
            <dd>
              {[student.section, student.semester]
                .filter(Boolean)
                .join(" • ") || "—"}
            </dd>
          </div>
          <div>
            <dt>Campus Branch</dt>
            <dd>{student.campus || "—"}</dd>
          </div>
          <div>
            <dt>Enrollment Status</dt>
            <dd>
              <StudentStatusBadge status={student.status} />
            </dd>
          </div>
        </dl>
        <div className="student-profile-subjects">
          <h3>Enrolled Subjects</h3>
          <p>{student.subjects || "—"}</p>
        </div>
        <dl className="student-profile-guardian">
          <div>
            <dt>Father / Guardian</dt>
            <dd>{student.guardian || "—"}</dd>
          </div>
          <div>
            <dt>Guardian Contact</dt>
            <dd>{student.guardianPhone || "—"}</dd>
          </div>
        </dl>
        <div className="student-modal-actions">
          <Button onClick={onClose}>Close Profile</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
