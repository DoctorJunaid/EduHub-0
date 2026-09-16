import { LogIn, LogOut, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableHead, TableBody, TableCell, TableRow } from '@/components/ui/Table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { timeLabel } from '@/lib/schedule';
import { attendanceStatuses } from './attendanceData.js';
import AttendanceStatusBadge from '@/components/common/AttendanceStatusBadge';

export default function AttendanceTable({ rows, view, page, pageSize, onAction, onQuickAction, pendingAction }) {
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize)));
  const columns = view === 'weekly' ? ['#', 'Teacher / Staff', 'Department', ...attendanceStatuses] : ['#', 'Teacher / Staff', 'Department', ...(view === 'history' ? ['Date'] : []), 'Check-in (Pakistan Time)', 'Check-out (Pakistan Time)', 'Status', 'Actions'];
  return <Table aria-label={`${view} faculty attendance`}><TableHeader><TableRow>{columns.map((column) => <TableHead scope="col" key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>
    {rows.slice((current - 1) * pageSize, current * pageSize).map(({ person, record, date, counts }, index) => <TableRow key={record?.id ?? person.id}>
      <TableCell>{(current - 1) * pageSize + index + 1}</TableCell>
      <TableCell><div className="attendance-person"><Avatar><AvatarFallback>{person.initials || person.name[0]}</AvatarFallback></Avatar><div><strong>{person.name}</strong><small>{person.email}</small></div></div></TableCell>
      <TableCell>{person.department || '—'}</TableCell>
      {view === 'weekly' ? attendanceStatuses.map((status) => <TableCell key={status}>{counts[status]}</TableCell>) : <>
        {view === 'history' && <TableCell>{date}</TableCell>}
        <TableCell>{record?.checkInTime ? timeLabel(record.checkInTime) : '—'}</TableCell>
        <TableCell>{record?.checkOutTime ? timeLabel(record.checkOutTime) : '—'}</TableCell>
        <TableCell><AttendanceStatusBadge status={record?.status} /></TableCell>
        <TableCell><div className="attendance-actions"><Button variant="outline" onClick={() => onAction(record ? 'view' : 'edit', person.id, record?.id)} aria-label={`${record ? 'View' : 'Record'} attendance for ${person.name}`}>{record ? 'View' : 'Record'}</Button>
          {view === 'daily' && <>
            <Button variant="outline" size="sm" className={record?.checkInTime || ['Absent', 'On Leave'].includes(record?.status) ? 'attendance-action-disabled' : undefined} disabled={Boolean(record?.checkInTime) || ['Absent', 'On Leave'].includes(record?.status) || Boolean(pendingAction)} onClick={() => onQuickAction('checkIn', person.id)} aria-label={`Check in ${person.name}`} title="Record check-in time"><LogIn size={14} />{pendingAction === `checkIn:${person.id}` ? 'Checking in...' : 'Check in'}</Button>
            <Button variant="outline" size="sm" className={record?.checkOutTime || ['Absent', 'On Leave'].includes(record?.status) ? 'attendance-action-disabled' : undefined} disabled={!record?.checkInTime || Boolean(record?.checkOutTime) || ['Absent', 'On Leave'].includes(record?.status) || Boolean(pendingAction)} onClick={() => onQuickAction('checkOut', person.id)} aria-label={`Check out ${person.name}`} title="Record check-out time"><LogOut size={14} />{pendingAction === `checkOut:${person.id}` ? 'Checking out...' : 'Check out'}</Button>
          </>}
          {record && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="attendance-more-trigger" aria-label={`Attendance actions for ${person.name}`}><MoreVertical size={15} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="attendance-more-menu"><DropdownMenuItem className="attendance-more-item" onSelect={() => onAction('view', person.id, record.id)}>View details</DropdownMenuItem><DropdownMenuItem className="attendance-more-item" onSelect={() => onAction('edit', person.id, record.id)}>Update attendance</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
        </div></TableCell>
      </>}
    </TableRow>)}
    {!rows.length && <TableRow><TableCell colSpan={columns.length} className="tt-empty">{view === 'history' ? 'No attendance records match this date range and filters.' : 'No faculty or attendance records match these filters.'}</TableCell></TableRow>}
  </TableBody></Table>;
}
