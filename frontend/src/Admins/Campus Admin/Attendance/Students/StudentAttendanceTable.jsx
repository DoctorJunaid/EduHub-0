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
  return <Table aria-label="Student attendance register"><TableHeader><TableRow>{['#', 'Student & Roll No.', 'Program / Section', 'Subject & Class', 'Date & Time', 'Status', 'Actions'].map((label) => <TableHead scope="col" key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {visible.records.map((row, index) => {
      const { student, session, record, date } = row;
      return <TableRow key={studentAttendanceKey({ studentId: student.id, classId: session.id, date })}>
        <TableCell>{visible.start + index + 1}</TableCell>
        <TableCell><div className="student-attendance-person"><Avatar><AvatarFallback>{student.initials || student.name[0]}</AvatarFallback></Avatar><div><strong>{student.name}</strong><small>{student.roll}</small></div></div></TableCell>
        <TableCell>{student.program}<small>{student.section}</small></TableCell>
        <TableCell><span className="student-attendance-subject"><i />{session.subject}</span><small className="student-attendance-room"><MapPin size={12} />{session.room}</small></TableCell>
        <TableCell>{date}<small>{timeLabel(session.startTime)} – {timeLabel(session.endTime)}</small></TableCell>
        <TableCell><AttendanceStatusBadge status={record?.status} /></TableCell>
        <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="student-attendance-action" aria-label={`Change attendance for ${student.name}, ${session.subject}, ${date}`}>{record?.status === 'Present' ? 'Mark Absent' : record ? 'Mark Present' : 'Set Status'}<ChevronDown size={13} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" aria-label="Attendance status">{attendanceStatuses.map((status) => <DropdownMenuItem key={status} disabled={record?.status === status} onSelect={() => onMark(row, status)}>Mark {status}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></TableCell>
      </TableRow>;
    })}
    {!visible.records.length && <TableRow><TableCell colSpan={7} className="tt-empty">No student attendance sessions match this date and filters.</TableCell></TableRow>}
  </TableBody></Table>;
}
