import { Badge } from "@/components/ui/Badge";
export default function AssignmentStatusBadge({ status }) {
  return (
    <Badge
      variant="secondary"
      className={`student-assignment-status ${status === "Graded" ? "is-graded" : status === "Submitted" ? "is-submitted" : ""}`}
    >
      {status}
    </Badge>
  );
}
