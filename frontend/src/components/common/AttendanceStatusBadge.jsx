import './AttendanceStatusBadge.css';
import { Badge } from '@/components/ui/Badge';
export default function AttendanceStatusBadge({ status }) {
  return status ? <Badge className={`attendance-status attendance-${status.toLowerCase().replaceAll(' ', '-')}`}><i />{status}</Badge> : <span className="attendance-unrecorded" aria-label="Attendance not recorded">—</span>;
}
