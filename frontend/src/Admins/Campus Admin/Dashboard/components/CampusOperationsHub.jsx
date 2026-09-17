import React, { useState, useMemo } from 'react';
import {
  Users,
  CalendarDays,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

const ACADEMIC_PROGRAMS_DATA = [
  {
    id: 'prog-1',
    name: 'BS Computer Science',
    degree: '4-Year Undergraduate',
    department: 'Department of Computing',
    enrolledCount: 520,
    sections: 'CS-1A, CS-2A, CS-3B, CS-4A, CS-4B',
    hod: 'Dr. Usman Khan',
    status: 'Active',
  },
  {
    id: 'prog-2',
    name: 'BS Software Engineering',
    degree: '4-Year Undergraduate',
    department: 'Department of Software Engineering',
    enrolledCount: 410,
    sections: 'SE-1A, SE-2B, SE-3A, SE-4A',
    hod: 'Dr. Ayesha Malik',
    status: 'Active',
  },
  {
    id: 'prog-3',
    name: 'BS Artificial Intelligence',
    degree: '4-Year Undergraduate',
    department: 'Department of Computing',
    enrolledCount: 185,
    sections: 'AI-1A, AI-2A, AI-3A',
    hod: 'Dr. Tariq Mahmood',
    status: 'Active',
  },
  {
    id: 'prog-4',
    name: 'BS Data Science',
    degree: '4-Year Undergraduate',
    department: 'Department of Computing',
    enrolledCount: 133,
    sections: 'DS-1A, DS-2A',
    hod: 'Dr. Bilal Qureshi',
    status: 'Active',
  },
];

export default function CampusOperationsHub({
  students = [],
  faculty = [],
  timetable = [],
  activeTab = 'students',
  onAddStudent,
  onAddTeacher,
  onViewStudentProfile,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  React.useEffect(() => {
    setSearchQuery('');
    setProgramFilter('');
    setStatusFilter('');
    setPage(1);
  }, [activeTab]);

  // Generate attendance rows from students and timetable
  const attendanceRows = useMemo(() => {
    return students.map((s, idx) => ({
      id: `att-${s.id || idx}`,
      student: s,
      subject: idx % 2 === 0 ? 'Advanced Web Design' : 'Data Structures & Algorithms',
      room: idx % 2 === 0 ? 'Lab 302' : 'Hall B',
      time: '10:00 AM – 11:30 AM',
      date: 'Today',
      status: s.status === 'Pending' ? 'Late' : idx === 3 ? 'Absent' : 'Present',
    }));
  }, [students]);

  // Filter logic based on active tab
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (activeTab === 'students') {
      return students.filter((s) => {
        const matchesSearch =
          !q ||
          `${s.name} ${s.roll} ${s.program} ${s.guardian}`.toLowerCase().includes(q);
        const matchesProgram = !programFilter || s.program === programFilter;
        const matchesStatus = !statusFilter || s.status === statusFilter;
        return matchesSearch && matchesProgram && matchesStatus;
      });
    }

    if (activeTab === 'faculty') {
      return faculty.filter((f) => {
        const matchesSearch =
          !q ||
          `${f.name} ${f.department} ${f.designation} ${f.subjects}`
            .toLowerCase()
            .includes(q);
        const matchesStatus = !statusFilter || f.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    }

    if (activeTab === 'timetable') {
      return timetable.filter((item) => {
        const matchesSearch =
          !q ||
          `${item.subject} ${item.section} ${item.room} ${item.instructor}`
            .toLowerCase()
            .includes(q);
        const matchesProgram = !programFilter || item.program === programFilter;
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesProgram && matchesStatus;
      });
    }

    if (activeTab === 'attendance') {
      return attendanceRows.filter((r) => {
        const matchesSearch =
          !q ||
          `${r.student.name} ${r.student.roll} ${r.subject} ${r.room}`
            .toLowerCase()
            .includes(q);
        const matchesStatus = !statusFilter || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    }

    if (activeTab === 'programs') {
      return ACADEMIC_PROGRAMS_DATA.filter((p) => {
        const matchesSearch =
          !q ||
          `${p.name} ${p.degree} ${p.department} ${p.hod}`.toLowerCase().includes(q);
        return matchesSearch;
      });
    }

    return [];
  }, [
    activeTab,
    students,
    faculty,
    timetable,
    attendanceRows,
    searchQuery,
    programFilter,
    statusFilter,
  ]);

  // Pagination calculation
  const totalCount = filteredData.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayedRows = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const programsList = [
    'BS Computer Science',
    'BS Software Engineering',
    'BS Artificial Intelligence',
    'BS Data Science',
  ];

  return (
    <div className="campus-operations-hub">
      {/* Filter & Search Bar with Action Buttons Aligned on Right */}
      <div className="hub-filter-bar">
        <div className="hub-filter-left">
          <div className="hub-search-box">
            <Search size={14} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="hub-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={
                activeTab === 'students'
                  ? 'Search students...'
                  : activeTab === 'faculty'
                  ? 'Search faculty...'
                  : activeTab === 'timetable'
                  ? 'Search timetable...'
                  : activeTab === 'attendance'
                  ? 'Search attendance...'
                  : 'Search programs...'
              }
              aria-label="Search records"
            />
          </div>

          {/* Program Filter */}
          {(activeTab === 'students' || activeTab === 'timetable') && (
            <select
              className="hub-select"
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by program"
            >
              <option value="">All Programs</option>
              {programsList.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {activeTab !== 'programs' && (
            <select
              className="hub-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {activeTab === 'attendance' ? (
                <>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </>
              ) : (
                <>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                </>
              )}
            </select>
          )}
        </div>

        {/* Contextual Action Button Aligned on Far Right */}
        <div className="hub-top-actions">
          {activeTab === 'students' && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={onAddStudent}
            >
              <Plus size={14} />
              Add Student
            </button>
          )}
          {activeTab === 'faculty' && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={onAddTeacher}
            >
              <Plus size={14} />
              Add Teacher
            </button>
          )}
        </div>
      </div>

      {/* Table Data View */}
      <div className="hub-table-wrapper" tabIndex={0} aria-label="Campus operations data table">
        {/* 1. Students View */}
        {activeTab === 'students' && (
          <Table className="hub-students-table">
            <TableHeader>
              <TableRow>
                <TableHead>Student Name & Roll No</TableHead>
                <TableHead>Program & Semester</TableHead>
                <TableHead className="text-center">Section</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((student) => (
                <TableRow
                  key={student.id || student.roll}
                  className="hub-clickable-row"
                  onClick={() => onViewStudentProfile?.(student)}
                >
                  <TableCell>
                    <div className="hub-user-info">
                      <strong className="hub-student-link">{student.name}</strong>
                      <small>{student.roll}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{student.program}</strong>
                      <small>{student.semester || 'Spring 2025'}</small>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hub-badge-neutral">{student.section || 'CS-4A'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hub-attendance-rate">{student.attendance || '94.2%'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`hub-status-pill ${
                        student.status === 'Active'
                          ? 'is-active'
                          : student.status === 'Suspended' || student.status === 'Inactive'
                          ? 'is-suspended'
                          : 'is-pending'
                      }`}
                    >
                      <span className="dot" />
                      {student.status || 'Active'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="hub-empty-cell">
                    No student records found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 2. Faculty View */}
        {activeTab === 'faculty' && (
          <Table className="hub-faculty-table">
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation & Title</TableHead>
                <TableHead className="text-center">Duty Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((teacher) => (
                <TableRow key={teacher.id || teacher.name}>
                  <TableCell>
                    <div className="hub-user-info">
                      <strong className="hub-student-link">{teacher.name}</strong>
                      <small>{teacher.qualification || 'Ph.D. Academic'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral">{teacher.department}</span>
                  </TableCell>
                  <TableCell>
                    <strong>{teacher.designation}</strong>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`hub-status-pill ${
                        teacher.status === 'Active' ? 'is-active' : 'is-pending'
                      }`}
                    >
                      <span className="dot" />
                      {teacher.status === 'Active' ? 'On Duty' : 'On Leave'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="hub-empty-cell">
                    No faculty records found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 3. Class Timetable View */}
        {activeTab === 'timetable' && (
          <Table className="hub-timetable-table">
            <TableHeader>
              <TableRow>
                <TableHead>Course & Subject</TableHead>
                <TableHead>Section & Venue</TableHead>
                <TableHead>Schedule & Timings</TableHead>
                <TableHead className="text-center">Live Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((item) => (
                <TableRow key={item.id || item.subject}>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{item.subject}</strong>
                      <small>{item.instructor || 'Dr. Usman Khan'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <span className="hub-badge-neutral">{item.section}</span>
                      <small>{item.room || 'Lab 302'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-time-cell">
                      <span>{Array.isArray(item.days) ? item.days.join(', ') : item.days || 'Mon, Wed'}</span>
                      <small>{item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : item.time || '10:00 AM – 11:30 AM'}</small>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`hub-status-pill ${
                        item.status === 'Active' ? 'is-active' : 'is-pending'
                      }`}
                    >
                      <span className="dot" />
                      {item.status === 'Active' ? 'In Session' : 'Scheduled'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="hub-empty-cell">
                    No class schedules found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 4. Live Attendance View */}
        {activeTab === 'attendance' && (
          <Table className="hub-attendance-table">
            <TableHeader>
              <TableRow>
                <TableHead>Student Name & Roll No</TableHead>
                <TableHead>Program & Section</TableHead>
                <TableHead>Subject & Room</TableHead>
                <TableHead className="text-center">Attendance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="hub-user-info">
                      <strong className="hub-student-link">{row.student.name}</strong>
                      <small>{row.student.roll}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{row.student.program}</strong>
                      <small>Sec: {row.student.section}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{row.subject}</strong>
                      <small>{row.room} • {row.time}</small>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`hub-status-pill ${
                        row.status === 'Present'
                          ? 'is-active'
                          : row.status === 'Late'
                          ? 'is-pending'
                          : 'is-absent'
                      }`}
                    >
                      <span className="dot" />
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="hub-empty-cell">
                    No attendance records found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 5. Academic Programs View */}
        {activeTab === 'programs' && (
          <Table className="hub-programs-table">
            <TableHeader>
              <TableRow>
                <TableHead>Degree Program</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Enrolled Students</TableHead>
                <TableHead className="text-center">Head of Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((prog) => (
                <TableRow key={prog.id}>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{prog.name}</strong>
                      <small>{prog.degree}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>{prog.department}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hub-badge-neutral font-semibold">{prog.enrolledCount} Students</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <strong>{prog.hod}</strong>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="hub-empty-cell">
                    No academic programs found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination & Count Footer */}
      <div className="hub-footer">
        <div className="hub-count-info">
          Showing <strong>{displayedRows.length}</strong> of <strong>{totalCount}</strong> records
        </div>

        <div className="hub-pagination-controls">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>

          {Array.from({ length: pageCount }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`hub-page-btn ${num === currentPage ? 'is-active' : ''}`}
              onClick={() => setPage(num)}
              aria-current={num === currentPage ? 'page' : undefined}
            >
              {num}
            </button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
