import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CircleCheck, CircleX, Download, Percent, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SummaryCard from '@/components/common/SummaryCard';
import Pagination from '@/components/common/Pagination';
import AttendanceDateNavigator from '@/components/common/AttendanceDateNavigator';
import { selectStudents } from '@/store/Slices/studentsSlice.js';
import { selectTimetable } from '@/store/Slices/timetableSlice.js';
import { selectStudentAttendance, selectStudentAttendanceHistory, studentAttendanceMarked } from '@/store/Slices/studentAttendanceSlice.js';
import { dateKey, longDate } from '@/lib/dates';
import { downloadCsv } from '@/lib/csv';
import { attendanceStatuses } from '@/lib/attendance';
import { paginateStudents } from '../../Students/studentData.js';
import { dailyStudentRows, filterStudentAttendance, studentAttendanceSummary, studentAttendanceExport } from './studentAttendanceData.js';
import StudentAttendanceTable from './StudentAttendanceTable';
import StudentAttendanceForm from './StudentAttendanceForm';
import '../../Timetable/ClassTimetable.css';
import './StudentAttendance.css';

const emptyFilters = { search: '', program: '', section: '', subject: '', status: '', studentId: '', from: '', to: '' };
export default function StudentAttendance({ matchTimetable, rateMode }) {
  const dispatch = useDispatch();
  const students = useSelector(selectStudents), classes = useSelector(selectTimetable), records = useSelector(selectStudentAttendance);
  const history = useSelector(selectStudentAttendanceHistory);
  const [date, setDate] = useState(() => dateKey(new Date()));
  const [view, setView] = useState('daily'), [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false), [notice, setNotice] = useState('');
  const rows = useMemo(() => {
    const source = view === 'daily' ? dailyStudentRows(records, students, classes, date, matchTimetable) : [...history].sort((a, b) => b.date.localeCompare(a.date) || a.session.startTime.localeCompare(b.session.startTime) || a.student.name.localeCompare(b.student.name));
    return filterStudentAttendance(source, filters);
  }, [records, students, classes, date, matchTimetable, history, view, filters]);
  const summary = useMemo(() => studentAttendanceSummary(rows, rateMode), [rows, rateMode]);
  const pagination = paginateStudents(rows, page, pageSize);
  const options = {
    program: [...new Set(students.map((student) => student.program).filter(Boolean))].sort(),
    section: [...new Set(students.map((student) => student.section).filter(Boolean))].sort(),
    subject: [...new Set(classes.map((session) => session.subject).filter(Boolean))].sort(),
    status: attendanceStatuses,
  };
  const changeFilter = (key, value) => { setFilters((previous) => ({ ...previous, [key]: value })); setPage(1); setNotice(''); };
  const changeDate = (value) => { setDate(value); setPage(1); setNotice(''); };
  const mark = ({ student, session, date: attendanceDate }, status) => {
    dispatch(studentAttendanceMarked({ studentId: student.id, classId: session.id, date: attendanceDate, status }));
    setNotice(`${student.name} marked ${status}.`);
  };
  const save = (values) => {
    dispatch(studentAttendanceMarked(values)); setDate(values.date); setView('daily'); setFilters(emptyFilters); setPage(1); setFormOpen(false); setNotice('Student attendance saved.');
  };
  const exportReport = () => {
    const data = studentAttendanceExport(rows);
    downloadCsv(`student-attendance-${view}-${date}.csv`, data.headers, data.rows);
    setNotice(`Exported ${rows.length} attendance sessions.`);
  };
  return <section className="class-timetable student-attendance" aria-labelledby="student-attendance-title">
    <div className="tt-page-heading"><div><h1 id="student-attendance-title">Student Attendance Register</h1><p>Track student lecture presence and class attendance logs.</p></div><Button className="tt-primary" onClick={exportReport}><Download size={16} />Export Report</Button></div>
    <div className="student-attendance-summary">{[[Users, summary.total, 'Total Students'], [CircleCheck, summary.Present, 'Present'], [CircleX, summary.Absent, 'Absent'], [Percent, summary.rate === null ? '—' : `${summary.rate.toFixed(1)}%`, 'Attendance Rate']].map(([Icon, value, label]) => <SummaryCard key={label} icon={Icon} value={value} label={label} />)}</div>
    <Tabs value={view} onValueChange={(value) => { setView(value); setPage(1); setNotice(''); if (value === 'daily') setFilters((previous) => ({ ...previous, studentId: '', from: '', to: '' })); }}><Card className="tt-card student-attendance-panel">
      <TabsList aria-label="Student attendance view"><TabsTrigger value="daily">Daily</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
      <div className="student-attendance-toolbar"><AttendanceDateNavigator date={date} onChange={changeDate} markedDates={records.map((record) => record.date)} /><div className="student-attendance-filters">{[['program', 'Programs'], ['section', 'Sections'], ['subject', 'Subjects'], ['status', 'Status']].map(([key, label]) => <select key={key} aria-label={`Filter by ${label}`} value={filters[key]} onChange={(event) => changeFilter(key, event.target.value)}><option value="">All {label}</option>{options[key].map((value) => <option key={value}>{value}</option>)}</select>)}</div></div>
      <div className="student-attendance-search"><Search size={16} /><Input aria-label="Search students by name, roll number, or program" type="search" placeholder="Search students by name, roll no. or program..." value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} /></div>
      {view === 'history' && <div className="student-attendance-history-filters"><label>Student<select value={filters.studentId} onChange={(event) => changeFilter('studentId', event.target.value)}><option value="">All Students</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.roll}</option>)}</select></label><label>From<Input type="date" max={filters.to || undefined} value={filters.from} onChange={(event) => changeFilter('from', event.target.value)} /></label><label>To<Input type="date" min={filters.from || undefined} value={filters.to} onChange={(event) => changeFilter('to', event.target.value)} /></label></div>}
      <TabsContent value={view}><div className="student-attendance-table-panel"><div className="student-attendance-log-heading"><h2>{view === 'history' ? 'Student Attendance History' : `${date === dateKey(new Date()) ? "Today's Attendance" : 'Attendance'} (${longDate(date)})`}</h2><div><span>Showing {rows.length ? pagination.start + 1 : 0}–{pagination.start + pagination.records.length} of {rows.length} sessions</span><Button variant="outline" disabled={!students.length || !classes.length} onClick={() => setFormOpen(true)}><Plus size={13} />Record Attendance</Button></div></div>
        <StudentAttendanceTable rows={rows} page={pagination.currentPage} pageSize={pageSize} onMark={mark} />
        <div className="student-attendance-footer"><span role="status">{notice}</span><Pagination total={rows.length} page={pagination.currentPage} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} label="sessions" /></div>
      </div></TabsContent>
      <p className="student-attendance-note">A dash means attendance is unrecorded. Total Students counts distinct students; Present and Absent count student-class sessions. {rateMode === 'include-late-exclude-leave' ? 'Rate includes Present and Late, excludes On Leave and unmarked sessions.' : rateMode ? 'Rate is Present divided by all marked sessions; unmarked sessions are excluded.' : 'Attendance rate definition is awaiting confirmation.'}{view === 'history' && ' History shows records across the chosen date range.'}</p>
    </Card></Tabs>
    {formOpen && <StudentAttendanceForm students={students} classes={classes} date={date} records={records} onSave={save} onClose={() => setFormOpen(false)} />}
  </section>;
}
