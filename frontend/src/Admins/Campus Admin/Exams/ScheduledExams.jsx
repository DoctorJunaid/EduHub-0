import { CalendarDays, Clock, MapPin, Eye, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Pagination from '@/components/common/Pagination';
import { timeLabel } from '../../../lib/schedule.js';
export default function ScheduledExams({ records, page, pageSize, onPage, onPageSize, onAction }) {
  const current = Math.min(page, Math.max(1, Math.ceil(records.length / pageSize)));
  return <Card className="tt-card exam-table"><div className="tt-panel-heading"><h2>Scheduled Exams</h2><Pagination total={records.length} page={current} pageSize={pageSize} onPage={onPage} onPageSize={onPageSize} label="exams" /></div>
    <Table aria-label="Scheduled exams"><TableHeader><TableRow>{['Subject & Exam Type', 'Date & Time', 'Exam Hall / Room', 'Invigilator', 'Total Marks', 'Actions'].map((label) => <TableHead key={label} scope="col">{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{records.slice((current - 1) * pageSize, current * pageSize).map((record) => <TableRow key={record.id}>
        <TableCell><div className="tt-person"><span className="tt-avatar">{record.subject.split(/\s+/).slice(0, 2).map((word) => word[0]).join('')}</span><div><strong>{record.subject}</strong><Badge className={`exam-badge exam-${record.examType.toLowerCase()}`}>{record.examType} Exam</Badge></div></div></TableCell>
        <TableCell><span className="exam-detail-line"><CalendarDays size={13} />{record.date}</span><small className="exam-detail-line"><Clock size={12} />{timeLabel(record.startTime)} – {timeLabel(record.endTime)}</small></TableCell>
        <TableCell><span className="exam-detail-line"><MapPin size={14} />{record.room}</span></TableCell>
        <TableCell><div className="tt-person"><span className="tt-instructor-avatar">{record.invigilator[0]}</span>{record.invigilator}</div></TableCell>
        <TableCell><span className="exam-marks">{record.totalMarks} pts</span></TableCell>
        <TableCell><div className="tt-row-actions">{[['view', Eye], ['edit', Pencil], ['delete', Trash2]].map(([mode, Icon]) => <Button key={mode} variant="outline" className={`tt-${mode}`} aria-label={`${mode[0].toUpperCase() + mode.slice(1)} ${record.subject}`} onClick={() => onAction(mode, record.id)}><Icon size={14} /></Button>)}</div></TableCell>
      </TableRow>)}{!records.length && <TableRow><TableCell colSpan={6} className="tt-empty">No exams match your search and filters.</TableCell></TableRow>}</TableBody>
    </Table>
  </Card>;
}
