import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { dayLabel, timeLabel } from "./timetableData.js";
export default function ClassDetailsDialog({ record, onClose }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="tt-dialog"
        overlayClassName="tt-overlay"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogTitle>{record.subject}</DialogTitle>
        <dl className="tt-details">
          {[
            ["Program", record.program],
            ["Section", record.section],
            ["Instructor", record.instructor],
            ["Room / Lab", record.room],
            ["Days", dayLabel(record.days)],
            [
              "Time",
              `${timeLabel(record.startTime)} – ${timeLabel(record.endTime)}`,
            ],
            ["Status", record.status],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="tt-dialog-actions">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
