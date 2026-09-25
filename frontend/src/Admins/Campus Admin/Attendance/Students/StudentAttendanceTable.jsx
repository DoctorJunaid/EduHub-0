import { MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableHead, TableBody, TableCell, TableRow } from '@/components/ui/Table';
import AttendanceStatusBadge from '@/components/common/AttendanceStatusBadge';
import { timeLabel } from '@/lib/schedule';
import { paginateStudents } from '../../Students/studentData.js';
import { studentAttendanceKey } from './studentAttendanceData.js';
import { useInstitution } from '@/context/InstitutionContext';

export default function StudentAttendanceTable({ rows, page, pageSize }) {
  const { isSchool } = useInstitution();
  const visible = paginateStudents(rows, page, pageSize);
  const columnDefs = [
    { label: '#', width: '5%', align: 'left' },
    { label: 'Student & Roll No.', width: '25%', align: 'left' },
    { label: isSchool ? 'Class & Section' : 'Program / Section', width: '17%', align: 'left' },
    { label: isSchool ? 'Subject & Period' : 'Subject & Class', width: '19%', align: 'left' },
    { label: 'Date & Time', width: '16%', align: 'left' },
    { label: 'Status', width: '18%', align: 'center' },
  ];

  return (
    <Table aria-label="Student attendance register">
      <TableHeader>
        <TableRow>
          {columnDefs.map(({ label, width, align }) => (
            <TableHead scope="col" key={label} style={{ width, textAlign: align }}>
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.records.map((row, index) => {
          const { student, session, record, date } = row;
          const displayClass = isSchool
            ? (student.gradeOrClass || student.program?.replace(/BS\s+/i, 'Grade 10 - ') || "Grade 10")
            : student.program;

          return (
            <TableRow key={studentAttendanceKey({ studentId: student?.id || student?._id || index, classId: session?.id || 'def', date })}>
              <TableCell style={{ width: '4%' }}>{visible.start + index + 1}</TableCell>
              <TableCell style={{ width: '23%' }}>
                <div className="student-attendance-person">
                  <Avatar>
                    <AvatarFallback>{student?.initials || student?.name?.[0] || 'S'}</AvatarFallback>
                  </Avatar>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student?.name || 'Student'}
                    </strong>
                    <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#71717a' }}>
                      {isSchool ? `Roll: ${student?.roll || student?.rollNo || student?.admissionNo || "STD-001"}` : (student?.roll || 'STD-001')}
                    </small>
                  </div>
                </div>
              </TableCell>
              <TableCell style={{ width: '16%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayClass}
                <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isSchool ? `Section ${student?.section || "A"}` : (student?.section || "A")}
                </small>
              </TableCell>
              <TableCell style={{ width: '18%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span className="student-attendance-subject">
                  <i />
                  {session?.subject || student?.gradeOrClass || "General Academic"}
                </span>
                <small className="student-attendance-room">
                  <MapPin size={12} />
                  {session?.room || "Classroom"}
                </small>
              </TableCell>
              <TableCell style={{ width: '14%', whiteSpace: 'nowrap' }}>
                {date}
                <small style={{ display: 'block' }}>
                  {timeLabel(session?.startTime || "08:00")} – {timeLabel(session?.endTime || "14:00")}
                </small>
              </TableCell>
              <TableCell style={{ width: '11%', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <AttendanceStatusBadge status={record?.status} emptyLabel="Not Taken" />
              </TableCell>
            </TableRow>
          );
        })}
        {!visible.records.length && (
          <TableRow>
            <TableCell colSpan={6} className="tt-empty">
              {isSchool ? "No student attendance records match this date and filters." : "No student attendance sessions match this date and filters."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
