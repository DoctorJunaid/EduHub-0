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
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { useInstitution } from '@/context/InstitutionContext';
import DataPagination from '@/components/shared/DataPagination';

export default function CampusOperationsHub({
  students = [],
  faculty = [],
  timetable = [],
  activeTab = 'students',
  onAddStudent,
  onAddTeacher,
  onViewStudentProfile,
}) {
  const { isSchool } = useInstitution();
  const currentTab = isSchool && (activeTab === 'programs' || activeTab === 'classes') ? 'classes' : activeTab;

  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setSearchQuery('');
    setProgramFilter('');
    setStatusFilter('');
    setPage(1);
  }, [currentTab]);

  // Dynamically derive classes & sections from students and timetable
  const schoolClasses = useMemo(() => {
    const gradesMap = new Map();
    for (const s of students) {
      const g = s.gradeOrClass || s.program || 'Grade 10';
      if (!gradesMap.has(g)) {
        gradesMap.set(g, {
          id: `cls-${String(g).replace(/\s+/g, '-').toLowerCase()}`,
          grade: g,
          sections: new Set(),
          classTeacher: 'Assigned Teacher',
          enrolledCount: 0,
          room: s.room || 'Classroom',
          wing: 'Academic Block',
          subjectsCount: 0,
          status: 'Active',
        });
      }
      const item = gradesMap.get(g);
      item.enrolledCount++;
      if (s.section) item.sections.add(s.section);
    }
    for (const t of timetable) {
      const g = t.className || t.gradeOrClass || t.program;
      if (g) {
        if (!gradesMap.has(g)) {
          gradesMap.set(g, {
            id: `cls-${String(g).replace(/\s+/g, '-').toLowerCase()}`,
            grade: g,
            sections: new Set(),
            classTeacher: t.instructor || t.teacherName || 'Assigned Teacher',
            enrolledCount: 0,
            room: t.room || 'Classroom',
            wing: 'Academic Block',
            subjectsCount: 0,
            status: 'Active',
          });
        }
        const item = gradesMap.get(g);
        item.subjectsCount++;
        if (t.section) item.sections.add(t.section);
        if (t.instructor && item.classTeacher === 'Assigned Teacher') item.classTeacher = t.instructor;
        if (t.room && item.room === 'Classroom') item.room = t.room;
      }
    }
    return Array.from(gradesMap.values()).map((c) => ({
      ...c,
      sections: c.sections.size > 0 ? Array.from(c.sections).sort().join(', ') : 'Section A',
    }));
  }, [students, timetable]);

  // Dynamically derive degree programs from students for university mode
  const academicPrograms = useMemo(() => {
    const progMap = new Map();
    for (const s of students) {
      const p = s.program || s.gradeOrClass;
      if (p) {
        if (!progMap.has(p)) {
          progMap.set(p, {
            id: `prog-${String(p).replace(/\s+/g, '-').toLowerCase()}`,
            name: p,
            degree: 'Undergraduate / Graduate',
            department: s.department || 'Academic Department',
            enrolledCount: 0,
            hod: 'Department Chair',
            status: 'Active',
          });
        }
        progMap.get(p).enrolledCount++;
      }
    }
    return Array.from(progMap.values());
  }, [students]);

  // Generate attendance rows from real students
  const attendanceRows = useMemo(() => {
    return students.map((s, idx) => ({
      id: `att-${s.id || idx}`,
      student: s,
      subject: s.gradeOrClass || s.program || (isSchool ? 'General Studies' : 'Course Lecture'),
      room: s.room || (isSchool ? 'Classroom' : 'Lecture Hall'),
      time: '08:30 AM – 01:30 PM',
      date: 'Today',
      status: s.status === 'Pending' ? 'Late' : s.status === 'Inactive' ? 'Absent' : 'Present',
    }));
  }, [students, isSchool]);

  const effectiveTimetable = useMemo(() => {
    return timetable || [];
  }, [timetable]);

  // Filter logic based on active tab
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (currentTab === 'classes') {
      return schoolClasses.filter((c) => {
        const matchesSearch =
          !q ||
          `${c.grade} ${c.sections} ${c.classTeacher} ${c.room} ${c.wing}`
            .toLowerCase()
            .includes(q);
        const matchesStatus = !statusFilter || c.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    }

    if (currentTab === 'students') {
      return students.filter((s) => {
        const gradeOrProg = s.gradeOrClass || s.program || '';
        const matchesSearch =
          !q ||
          `${s.name} ${s.roll} ${gradeOrProg} ${s.guardian || ''}`.toLowerCase().includes(q);
        const matchesProgram = !programFilter || gradeOrProg === programFilter;
        const matchesStatus = !statusFilter || s.status === statusFilter;
        return matchesSearch && matchesProgram && matchesStatus;
      });
    }

    if (currentTab === 'faculty') {
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

    if (currentTab === 'timetable') {
      return effectiveTimetable.filter((item) => {
        const matchesSearch =
          !q ||
          `${item.subject || item.periodName} ${item.section || item.className} ${item.room} ${item.instructor || item.teacherName}`
            .toLowerCase()
            .includes(q);
        const matchesProgram = !programFilter || (item.program || item.className) === programFilter;
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesProgram && matchesStatus;
      });
    }

    if (currentTab === 'attendance') {
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

    if (currentTab === 'programs') {
      return academicPrograms.filter((p) => {
        const matchesSearch =
          !q ||
          `${p.name} ${p.degree} ${p.department} ${p.hod}`.toLowerCase().includes(q);
        return matchesSearch;
      });
    }

    return [];
  }, [
    currentTab,
    students,
    faculty,
    schoolClasses,
    academicPrograms,
    effectiveTimetable,
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

  const schoolClassesList = [
    'Grade 10',
    'Grade 9',
    'Grade 8',
    'Grade 7',
    'Grade 6',
    'Grade 5',
    'Grade 4',
    'Grade 3',
    'Grade 2',
    'Grade 1',
  ];

  const filterOptionsList = isSchool ? schoolClassesList : programsList;

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
                currentTab === 'students'
                  ? (isSchool ? 'Search students, roll, guardian...' : 'Search students...')
                  : currentTab === 'faculty'
                  ? (isSchool ? 'Search teachers, subjects...' : 'Search faculty...')
                  : currentTab === 'timetable'
                  ? (isSchool ? 'Search periods, class, subject...' : 'Search timetable...')
                  : currentTab === 'attendance'
                  ? 'Search attendance...'
                  : (isSchool ? 'Search classes, incharge, room...' : 'Search programs...')
              }
              aria-label="Search records"
            />
          </div>

          {/* Class / Program Filter */}
          {(currentTab === 'students' || currentTab === 'timetable') && (
            <select
              className="hub-select"
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value);
                setPage(1);
              }}
              aria-label={isSchool ? "Filter by class" : "Filter by program"}
            >
              <option value="">{isSchool ? 'All Classes' : 'All Programs'}</option>
              {filterOptionsList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {currentTab !== 'programs' && currentTab !== 'classes' && (
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
              {currentTab === 'attendance' ? (
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
          {currentTab === 'students' && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={onAddStudent}
            >
              <Plus size={14} />
              Add Student
            </button>
          )}
          {currentTab === 'faculty' && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={onAddTeacher}
            >
              <Plus size={14} />
              {isSchool ? 'Add Teacher' : 'Add Faculty'}
            </button>
          )}
          {currentTab === 'classes' && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={() => onAddStudent?.()}
            >
              <Plus size={14} />
              Add Class
            </button>
          )}
        </div>
      </div>

      {/* Table Data View */}
      <div className="hub-table-wrapper" tabIndex={0} aria-label="Campus operations data table">
        {/* 1. Students View */}
        {currentTab === 'students' && (
          <Table className="hub-students-table">
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '28%' }}>{isSchool ? 'Student Name & Roll / ID' : 'Student Name & Roll No'}</TableHead>
                <TableHead style={{ width: '22%' }}>{isSchool ? 'Class & Section' : 'Program & Semester'}</TableHead>
                <TableHead style={{ width: '24%' }}>{isSchool ? 'Parent / Guardian' : 'Section'}</TableHead>
                <TableHead style={{ width: '13%' }} className="text-center">Attendance</TableHead>
                <TableHead style={{ width: '13%' }} className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((student) => (
                <TableRow
                  key={student.id || student._id || student.roll}
                  className="hub-clickable-row"
                  onClick={() => onViewStudentProfile?.(student)}
                >
                  <TableCell>
                    <div className="hub-user-info">
                      <strong className="hub-student-link">{student.name}</strong>
                      <small>{student.roll || student.admissionNo || 'Roll Pending'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{isSchool ? (student.gradeOrClass || student.program || 'Grade 10') : student.program}</strong>
                      <small>{isSchool ? `Section ${student.section || 'A'}` : (student.semester || 'Spring 2025')}</small>
                    </div>
                  </TableCell>
                  {isSchool ? (
                    <TableCell>
                      <div className="hub-cell-stack">
                        <span style={{ fontWeight: 500 }}>{student.guardian || 'Guardian on File'}</span>
                        <small style={{ color: '#71717a' }}>{student.guardianPhone || student.phone || '+92 300 1234567'}</small>
                      </div>
                    </TableCell>
                  ) : (
                    <TableCell className="text-center">
                      <span className="hub-badge-neutral">{student.section || 'CS-4A'}</span>
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <span className="hub-attendance-rate">{student.attendance || (isSchool ? '96.2%' : '94.2%')}</span>
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
                    <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 600, color: '#09090b', fontSize: '13px', marginBottom: '4px' }}>
                        {isSchool ? 'No enrolled students found' : 'No students found'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '14px' }}>
                        {isSchool
                          ? 'There are currently no student records in this campus.'
                          : 'There are currently no student records matching your filters.'}
                      </p>
                      <button
                        type="button"
                        className="toolbar-btn toolbar-btn-primary"
                        onClick={onAddStudent}
                        style={{ margin: '0 auto' }}
                      >
                        <Plus size={14} />
                        Add First Student
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 2. Faculty / Teachers View */}
        {currentTab === 'faculty' && (
          <Table className="hub-faculty-table">
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '32%' }}>{isSchool ? 'Teacher & Qualification' : 'Faculty Member'}</TableHead>
                <TableHead style={{ width: '28%' }}>{isSchool ? 'Teaching Subject(s)' : 'Department'}</TableHead>
                <TableHead style={{ width: '26%' }}>{isSchool ? 'Designation & Wing' : 'Designation & Title'}</TableHead>
                <TableHead style={{ width: '14%' }} className="text-center">Duty Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((teacher) => (
                <TableRow key={teacher.id || teacher._id || teacher.name}>
                  <TableCell>
                    <div className="hub-user-info">
                      <strong className="hub-student-link">{teacher.name}</strong>
                      <small>{teacher.qualification || (isSchool ? 'M.Sc. Education, B.Ed' : 'Ph.D. Academic')}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral">{teacher.subjects || (isSchool ? 'General Science' : teacher.department)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{teacher.designation || (isSchool ? 'Senior Subject Teacher' : 'Faculty')}</strong>
                      <small>{teacher.department || (isSchool ? 'Secondary Wing' : 'Academic')}</small>
                    </div>
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
                    <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 600, color: '#09090b', fontSize: '13px', marginBottom: '4px' }}>
                        {isSchool ? 'No teaching staff found' : 'No faculty found'}
                      </p>
                      <button
                        type="button"
                        className="toolbar-btn toolbar-btn-primary"
                        onClick={onAddTeacher}
                        style={{ margin: '0 auto' }}
                      >
                        <Plus size={14} />
                        {isSchool ? 'Add First Teacher' : 'Add First Faculty'}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 3. Class Timetable / Routine View */}
        {currentTab === 'timetable' && (
          <Table className="hub-timetable-table">
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '28%' }}>{isSchool ? 'Period & Subject' : 'Course & Subject'}</TableHead>
                <TableHead style={{ width: '22%' }}>{isSchool ? 'Class & Room' : 'Section & Venue'}</TableHead>
                <TableHead style={{ width: '34%' }}>{isSchool ? 'Assigned Teacher & Routine' : 'Schedule & Timings'}</TableHead>
                <TableHead style={{ width: '16%' }} className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((item, idx) => (
                <TableRow key={item.id || item.subject}>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{item.subject}</strong>
                      <small>{isSchool ? (item.period || `Period ${(idx % 7) + 1}`) + ` (${item.startTime || '08:30'} – ${item.endTime || '09:15'})` : (item.instructor || 'Dr. Usman Khan')}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <span className="hub-badge-neutral">{item.section || (isSchool ? 'Grade 10-A' : 'CS-4A')}</span>
                      <small>{item.room || 'Room 201'}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="hub-time-cell">
                      <span>{item.instructor || (isSchool ? 'Subject Teacher' : 'Faculty')}</span>
                      <small>{Array.isArray(item.days) ? item.days.join(', ') : item.days || 'Mon, Tue, Wed, Thu, Fri'}</small>
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
                    No scheduled sessions found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 4. Live Attendance Register View */}
        {currentTab === 'attendance' && (
          <Table className="hub-attendance-table">
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>{isSchool ? 'Class & Section' : 'Program & Section'}</TableHead>
                <TableHead>{isSchool ? 'Subject & Period' : 'Subject & Room'}</TableHead>
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
                      <strong>{isSchool ? (row.student.gradeOrClass || 'Grade 10') : row.student.program}</strong>
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

        {/* 5. Classes & Sections View (School Mode) */}
        {currentTab === 'classes' && (
          <Table className="hub-programs-table">
            <TableHeader>
              <TableRow>
                <TableHead>Class / Grade</TableHead>
                <TableHead>Sections Available</TableHead>
                <TableHead className="text-center">Class Incharge / Homeroom</TableHead>
                <TableHead className="text-center">Enrolled Strength</TableHead>
                <TableHead className="text-center">Classroom & Wing</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>
                    <div className="hub-cell-stack">
                      <strong>{cls.grade}</strong>
                      <small>{cls.wing}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="hub-badge-neutral font-semibold">{cls.sections}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <strong>{cls.classTeacher}</strong>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hub-badge-neutral font-semibold">{cls.enrolledCount} Students</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span>{cls.room}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="hub-status-pill is-active">
                      <span className="dot" />
                      {cls.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {displayedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="hub-empty-cell">
                    No classes or sections found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* 6. Academic Programs View (University Mode Only) */}
        {currentTab === 'programs' && (
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

      {/* Standardized DataPagination */}
      <DataPagination
        page={currentPage}
        pageSize={pageSize}
        total={totalCount}
        pageCount={pageCount}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        itemLabel={currentTab === "students" ? "students" : currentTab === "faculty" ? "teachers" : "records"}
      />
    </div>
  );
}
