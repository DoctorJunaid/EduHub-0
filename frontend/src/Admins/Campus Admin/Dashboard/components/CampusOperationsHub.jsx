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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  onAddStudent,
  onAddTeacher,
  onViewStudentProfile,
}) {
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

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

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchQuery('');
    setProgramFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const programsList = [
    'BS Computer Science',
    'BS Software Engineering',
    'BS Artificial Intelligence',
    'BS Data Science',
  ];

  return (
    <Card className="campus-operations-hub">
      {/* Top Bar: Tabs & Quick Action Buttons */}
      <div className="hub-top-toolbar">
        {/* Navigation Tabs with Counter Badges */}
        <div className="hub-tabs-list" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'students'}
            className={`hub-tab-button ${activeTab === 'students' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('students')}
          >
            <Users size={15} />
            <span>Students Roster</span>
            <span className="hub-tab-counter">{students.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'faculty'}
            className={`hub-tab-button ${activeTab === 'faculty' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('faculty')}
          >
            <GraduationCap size={15} />
            <span>Faculty Members</span>
            <span className="hub-tab-counter">{faculty.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'timetable'}
            className={`hub-tab-button ${activeTab === 'timetable' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('timetable')}
          >
            <CalendarDays size={15} />
            <span>Class Timetable & Labs</span>
            <span className="hub-tab-counter">{timetable.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'attendance'}
            className={`hub-tab-button ${activeTab === 'attendance' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('attendance')}
          >
            <ClipboardCheck size={15} />
            <span>Live Attendance</span>
            <span className="hub-tab-counter">{attendanceRows.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'programs'}
            className={`hub-tab-button ${activeTab === 'programs' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('programs')}
          >
            <BookOpen size={15} />
            <span>Degree Programs</span>
            <span className="hub-tab-counter">{ACADEMIC_PROGRAMS_DATA.length}</span>
          </button>
        </div>
      </div>

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
                  ? 'Search students by name, roll number, or program...'
                  : activeTab === 'faculty'
                  ? 'Search faculty by name, department, or qualification...'
                  : activeTab === 'timetable'
                  ? 'Search classes by course, room, or instructor...'
                  : activeTab === 'attendance'
                  ? 'Search attendance logs by student name or subject...'
                  : 'Search degree programs or departments...'
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

        {/* Global Action Buttons Aligned on Far Right */}
        <div className="hub-top-actions">
          <Button
            size="sm"
            variant="outline"
            className="hub-action-btn"
            onClick={onAddStudent}
          >
            <Plus size={14} />
            Add Student
          </Button>
          <Button
            size="sm"
            className="hub-action-btn hub-primary-btn"
            onClick={onAddTeacher}
          >
            <Plus size={14} />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Table Data View */}
      <div className="hub-table-wrapper" tabIndex={0} aria-label="Campus operations data table">
        {/* 1. Students View */}
        {activeTab === 'students' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name & Roll No</TableHead>
                <TableHead>Program & Semester</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Guardian Contact</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((student) => (
                <TableRow key={student.id || student.roll}>
                  <TableCell>
                    <div className="hub-user-cell">
                      <Avatar className="hub-avatar">
                        <AvatarFallback>{student.initials || 'ST'}</AvatarFallback>
                      </Avatar>
                      <div className="hub-user-info">
                        <strong>{student.name}</strong>
                        <small>{student.roll}</small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{student.program}</strong>
                      <small>{student.semester || 'Spring 2025'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral">{student.section || 'CS-4A'}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`hub-status-pill ${
                        student.status === 'Active' ? 'is-active' : 'is-pending'
                      }`}
                    >
                      <span className="dot" />
                      {student.status || 'Active'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <div>{student.guardian || 'Guardian Contact'}</div>
                      <small className="text-muted">{student.phone || student.guardianPhone || '+92 300 0000000'}</small>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hub-row-btn"
                      onClick={() => onViewStudentProfile?.(student)}
                    >
                      <Eye size={12} />
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="hub-empty-cell">
                    No student records found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 2. Faculty View */}
        {activeTab === 'faculty' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation & Title</TableHead>
                <TableHead>Assigned Subjects</TableHead>
                <TableHead>Duty Status</TableHead>
                <TableHead className="text-right">Official Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((teacher) => (
                <TableRow key={teacher.id || teacher.name}>
                  <TableCell>
                    <div className="hub-user-cell">
                      <Avatar className="hub-avatar">
                        <AvatarFallback>{teacher.initials || 'FC'}</AvatarFallback>
                      </Avatar>
                      <div className="hub-user-info">
                        <strong>{teacher.name}</strong>
                        <small>{teacher.qualification || 'Ph.D. Academic'}</small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral">{teacher.department}</span>
                  </TableCell>
                  <TableCell>
                    <strong>{teacher.designation}</strong>
                  </TableCell>
                  <TableCell>
                    <div>{teacher.subjects}</div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`hub-status-pill ${
                        teacher.status === 'Active' ? 'is-active' : 'is-pending'
                      }`}
                    >
                      <span className="dot" />
                      {teacher.status === 'Active' ? 'On Duty' : 'On Leave'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <small className="text-muted">{teacher.email || 'faculty@nust.edu.pk'}</small>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="hub-empty-cell">
                    No faculty records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 3. Class Timetable View */}
        {activeTab === 'timetable' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject & Course</TableHead>
                <TableHead>Section & Program</TableHead>
                <TableHead>Schedule & Timings</TableHead>
                <TableHead>Room / Lab Allocation</TableHead>
                <TableHead>Assigned Instructor</TableHead>
                <TableHead>Live Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((item) => (
                <TableRow key={item.id || item.subject}>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{item.subject}</strong>
                      <small>Core Course</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <span className="hub-badge-neutral">{item.section}</span>
                      <small>{item.program || 'BS Computer Science'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-time-cell">
                      <span>{Array.isArray(item.days) ? item.days.join(', ') : item.days || 'Mon, Wed'}</span>
                      <small>{item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : item.time || '10:00 AM – 11:30 AM'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <strong className="font-semibold">{item.room}</strong>
                  </TableCell>
                  <TableCell>
                    <div className="hub-user-cell">
                      <Avatar className="hub-avatar">
                        <AvatarFallback>UK</AvatarFallback>
                      </Avatar>
                      <span>{item.instructor || 'Dr. Usman Khan'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
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
                  <TableCell colSpan={6} className="hub-empty-cell">
                    No class schedules found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 4. Live Attendance View */}
        {activeTab === 'attendance' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name & Roll No</TableHead>
                <TableHead>Program & Section</TableHead>
                <TableHead>Subject / Lecture</TableHead>
                <TableHead>Room / Venue</TableHead>
                <TableHead>Session Time</TableHead>
                <TableHead className="text-right">Attendance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="hub-user-cell">
                      <Avatar className="hub-avatar">
                        <AvatarFallback>{row.student.initials || 'ST'}</AvatarFallback>
                      </Avatar>
                      <div className="hub-user-info">
                        <strong>{row.student.name}</strong>
                        <small>{row.student.roll}</small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <strong>{row.student.program}</strong>
                    <small>Sec: {row.student.section}</small>
                  </TableCell>
                  <TableCell>
                    <strong>{row.subject}</strong>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral">{row.room}</span>
                  </TableCell>
                  <TableCell>
                    <small>{row.time}</small>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`hub-status-pill ${
                        row.status === 'Present'
                          ? 'is-active'
                          : row.status === 'Late'
                          ? 'is-pending'
                          : 'is-pending'
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
                  <TableCell colSpan={6} className="hub-empty-cell">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 5. Academic Programs View */}
        {activeTab === 'programs' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Degree Program</TableHead>
                <TableHead>Academic Level</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Enrolled Students</TableHead>
                <TableHead>Active Class Sections</TableHead>
                <TableHead className="text-right">Head of Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((prog) => (
                <TableRow key={prog.id}>
                  <TableCell>
                    <strong className="font-semibold">{prog.name}</strong>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral">{prog.degree}</span>
                  </TableCell>
                  <TableCell>
                    <div>{prog.department}</div>
                  </TableCell>
                  <TableCell>
                    <strong>{prog.enrolledCount} Students</strong>
                  </TableCell>
                  <TableCell>
                    <small>{prog.sections}</small>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>{prog.hod}</strong>
                  </TableCell>
                </TableRow>
              ))}
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
    </Card>
  );
}
