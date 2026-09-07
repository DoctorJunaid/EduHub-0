import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { longDate } from '@/lib/dates';
import { timeLabel } from '@/lib/schedule';
import AttendanceStatusBadge from '@/components/common/AttendanceStatusBadge';
export default function AttendanceDetails({ record, person, onClose }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={undefined}>
    <div className="tt-dialog-heading"><DialogTitle>Attendance Details</DialogTitle></div>
    <dl className="tt-details">{[['Teacher / Staff', person.name], ['Email', person.email], ['Department', person.department], ['Date', longDate(record.date)], ['Check-in', record.checkInTime ? timeLabel(record.checkInTime) : '—'], ['Check-out', record.checkOutTime ? timeLabel(record.checkOutTime) : '—']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Status</dt><dd><AttendanceStatusBadge status={record.status} /></dd></div></dl>
    <div className="tt-dialog-actions"><Button onClick={onClose}>Close</Button></div>
  </DialogContent></Dialog>;
}
