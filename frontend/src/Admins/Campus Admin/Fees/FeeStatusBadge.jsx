import { Badge } from "@/components/ui/Badge";
export default function FeeStatusBadge({ status }) {
  return (
    <Badge className={`fee-status fee-${status.toLowerCase()}`}>{status}</Badge>
  );
}
