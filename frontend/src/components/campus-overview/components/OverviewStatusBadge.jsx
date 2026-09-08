import { Badge } from "@/components/ui/Badge";

export default function OverviewStatusBadge({ status }) {
  return (
    <Badge
      variant="secondary"
      className={`overview-status ${status === "Pending" ? "is-pending" : ""}`}
    >
      <span aria-hidden="true" />
      {status}
    </Badge>
  );
}
