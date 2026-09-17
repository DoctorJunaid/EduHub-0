import { CalendarDays, Clock, MapPin, Eye, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Pagination from '@/components/common/Pagination';
import { timeLabel } from '../../../lib/schedule.js';
export default function ScheduledExams({ records, page, pageSize, onPage, onPageSize, onAction }) {
  const current = Math.min(page, Math.max(1, Math.ceil(records.length / pageSize)));
  const columnDefs = [
    { label: 'Subject & Exam Type', width: '24%', align: 'left' },
    { label: 'Date & Time', width: '20%', align: 'left' },
    { label: 'Exam Hall / Room', width: '14%', align: 'left' },
    { label: 'Invigilator', width: '18%', align: 'left' },
    { label: 'Total Marks', width: '12%', align: 'center' },
    { label: 'Actions', width: '12%', align: 'right' },
  ];

  return <Card className="tt-card exam-table"><div className="tt-panel-heading"><h2>Scheduled Exams</h2><Pagination total={records.length} page={current} pageSize={pageSize} onPage={onPage} onPageSize={onPageSize} label="exams" /></div>
    <Table aria-label="Scheduled exams"><TableHeader><TableRow>{columnDefs.map(({ label, width, align }) => <TableHead key={label} scope="col" style={{ width, textAlign: align }}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{records.slice((current - 1) * pageSize, current * pageSize).map((record) => <TableRow key={record.id}>
        <TableCell style={{ width: '24%' }}><div className="tt-person"><span className="tt-avatar">{record.subject.split(/\s+/).slice(0, 2).map((word) => word[0]).join('')}</span><div style={{ minWidth: 0, overflow: 'hidden' }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.subject}</strong><Badge className={`exam-badge exam-${record.examType.toLowerCase()}`}>{record.examType} Exam</Badge></div></div></TableCell>
        <TableCell style={{ width: '20%', whiteSpace: 'nowrap' }}><span className="exam-detail-line"><CalendarDays size={13} />{record.date}</span><small className="exam-detail-line"><Clock size={12} />{timeLabel(record.startTime)} – {timeLabel(record.endTime)}</small></TableCell>
        <TableCell style={{ width: '14%', whiteSpace: 'nowrap' }}><span className="exam-detail-line"><MapPin size={14} />{record.room}</span></TableCell>
        <TableCell style={{ width: '18%' }}><div className="tt-person"><span className="tt-instructor-avatar">{record.invigilator[0]}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.invigilator}</span></div></TableCell>
        <TableCell style={{ width: '12%', textAlign: 'center', whiteSpace: 'nowrap' }}><span className="exam-marks">{record.totalMarks} pts</span></TableCell>
        <TableCell style={{ width: '12%', textAlign: 'right' }}><div className="tt-row-actions" style={{ justifyContent: 'flex-end' }}>{[['view', Eye], ['edit', Pencil], ['delete', Trash2]].map(([mode, Icon]) => <Button key={mode} variant="outline" className={`tt-${mode}`} aria-label={`${mode[0].toUpperCase() + mode.slice(1)} ${record.subject}`} onClick={() => onAction(mode, record.id)}><Icon size={14} /></Button>)}</div></TableCell>
      </TableRow>)}{!records.length && <TableRow><TableCell colSpan={6} className="tt-empty">No exams match your search and filters.</TableCell></TableRow>}</TableBody>
    </Table>
  </Card>;
}
