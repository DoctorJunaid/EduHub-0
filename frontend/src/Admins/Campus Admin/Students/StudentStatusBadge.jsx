import { Badge } from "@/components/ui/Badge";

export default function StudentStatusBadge({ status }) {
  return (
    <Badge
      variant="secondary"
      className={`student-status student-status-${status.toLowerCase()}`}
    >
      <span aria-hidden="true" />
      {status}
    </Badge>
  );
}
