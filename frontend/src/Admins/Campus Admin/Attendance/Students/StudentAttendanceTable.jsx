import { ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableHead, TableBody, TableCell, TableRow } from '@/components/ui/Table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import AttendanceStatusBadge from '@/components/common/AttendanceStatusBadge';
import { attendanceStatuses } from '@/lib/attendance';
import { timeLabel } from '@/lib/schedule';
import { paginateStudents } from '../../Students/studentData.js';
import { studentAttendanceKey } from './studentAttendanceData.js';

export default function StudentAttendanceTable({ rows, page, pageSize, onMark }) {
  const visible = paginateStudents(rows, page, pageSize);
  const columnDefs = [
    { label: '#', width: '4%', align: 'left' },
    { label: 'Student & Roll No.', width: '23%', align: 'left' },
    { label: 'Program / Section', width: '16%', align: 'left' },
    { label: 'Subject & Class', width: '18%', align: 'left' },
    { label: 'Date & Time', width: '14%', align: 'left' },
    { label: 'Status', width: '11%', align: 'center' },
    { label: 'Actions', width: '14%', align: 'right' },
  ];

  return <Table aria-label="Student attendance register"><TableHeader><TableRow>{columnDefs.map(({ label, width, align }) => <TableHead scope="col" key={label} style={{ width, textAlign: align }}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {visible.records.map((row, index) => {
      const { student, session, record, date } = row;
      return <TableRow key={studentAttendanceKey({ studentId: student.id, classId: session.id, date })}>
        <TableCell style={{ width: '4%' }}>{visible.start + index + 1}</TableCell>
        <TableCell style={{ width: '23%' }}><div className="student-attendance-person"><Avatar><AvatarFallback>{student.initials || student.name[0]}</AvatarFallback></Avatar><div style={{ minWidth: 0, overflow: 'hidden' }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</strong><small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#71717a' }}>{student.roll}</small></div></div></TableCell>
        <TableCell style={{ width: '16%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.program}<small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.section}</small></TableCell>
        <TableCell style={{ width: '18%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span className="student-attendance-subject"><i />{session.subject}</span><small className="student-attendance-room"><MapPin size={12} />{session.room}</small></TableCell>
        <TableCell style={{ width: '14%', whiteSpace: 'nowrap' }}>{date}<small style={{ display: 'block' }}>{timeLabel(session.startTime)} – {timeLabel(session.endTime)}</small></TableCell>
        <TableCell style={{ width: '11%', textAlign: 'center', whiteSpace: 'nowrap' }}><AttendanceStatusBadge status={record?.status} /></TableCell>
        <TableCell style={{ width: '14%', textAlign: 'right', whiteSpace: 'nowrap' }}><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="student-attendance-action" aria-label={`Change attendance for ${student.name}, ${session.subject}, ${date}`}>{record?.status === 'Present' ? 'Mark Absent' : record ? 'Mark Present' : 'Set Status'}<ChevronDown size={13} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" aria-label="Attendance status">{attendanceStatuses.map((status) => <DropdownMenuItem key={status} disabled={record?.status === status} onSelect={() => onMark(row, status)}>Mark {status}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></TableCell>
      </TableRow>;
    })}
    {!visible.records.length && <TableRow><TableCell colSpan={7} className="tt-empty">No student attendance sessions match this date and filters.</TableCell></TableRow>}
  </TableBody></Table>;
}
