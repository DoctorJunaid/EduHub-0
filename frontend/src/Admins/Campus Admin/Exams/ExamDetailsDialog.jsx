import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { examFields } from './examData.js';
import { timeLabel } from '../../../lib/schedule.js';
export default function ExamDetailsDialog({ record, onClose }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={undefined}>
    <div className="tt-dialog-heading"><DialogTitle>Exam Details</DialogTitle></div>
    <dl className="tt-details">{examFields.map(([key, label, type]) => <div key={key}><dt>{label}</dt><dd>{type === 'time' ? timeLabel(record[key]) : record[key] || 'Not specified'}</dd></div>)}</dl>
    <div className="tt-dialog-actions"><Button onClick={onClose}>Close</Button></div>
  </DialogContent></Dialog>;
}
