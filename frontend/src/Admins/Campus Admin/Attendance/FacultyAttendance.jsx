import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, CircleCheck, CircleX, Clock, Download, History, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SummaryCard from '@/components/common/SummaryCard';
import Pagination from '@/components/common/Pagination';
import AttendanceDateNavigator from '@/components/common/AttendanceDateNavigator';
import { selectFaculty } from '@/store/Slices/facultySlice.js';
import { selectAttendance, selectAttendanceSummary, attendanceSaved } from '@/store/Slices/attendanceSlice.js';
import { dateKey, parseDate, longDate } from '@/lib/dates';
import { mondayOf, shiftDays } from '@/lib/schedule';
import { downloadCsv } from '@/lib/csv';
import * as attendanceApi from '@/api/teacherAttendance.api.js';
import { attendanceRows, attendanceStatuses, filterPeople, weeklySummary, attendanceExport } from './attendanceData.js';
import AttendanceTable from './AttendanceTable';
import AttendanceForm from './AttendanceForm';
import AttendanceDetails from './AttendanceDetails';
import '../Timetable/ClassTimetable.css';
import './FacultyAttendance.css';

const initialFilters = { search: '', department: '', status: '', facultyId: '', from: '', to: '' };
export default function FacultyAttendance() {
  const dispatch = useDispatch();
  const faculty = useSelector(selectFaculty), records = useSelector(selectAttendance);
  const [date, setDate] = useState(() => dateKey(new Date()));
  const summary = useSelector((state) => selectAttendanceSummary(state, date));
  const [view, setView] = useState('daily'), [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState(null), [notice, setNotice] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const departments = [...new Set(faculty.map((person) => person.department).filter(Boolean))].sort();
  const rows = useMemo(() => {
    const matching = attendanceRows(records, faculty, date, view, filters);
    return view === 'weekly' ? weeklySummary(matching, filterPeople(faculty, filters), filters.status) : matching;
  }, [records, faculty, date, view, filters]);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize)));
  const selected = records.find((record) => record.id === modal?.recordId);
  const person = faculty.find((member) => member.id === (selected?.facultyId ?? modal?.facultyId));
  const changeDate = (value) => { setDate(value); setPage(1); setNotice(''); };
  const changeFilter = (key, value) => { setFilters((previous) => ({ ...previous, [key]: value })); setPage(1); setNotice(''); };
  const close = () => setModal(null);
  const onAction = (mode, facultyId, recordId) => setModal({ mode, facultyId, recordId });
  const quickAttendanceAction = async (action, facultyId) => {
    if (pendingAction) return;
    setPendingAction(`${action}:${facultyId}`);
    try {
      const response = await attendanceApi[action](facultyId);
      const saved = response.data?.data;
      if (!saved) throw new Error('Attendance response was empty.');
      const toPakistanParts = (value) => {
        const timestamp = new Date(value);
        if (Number.isNaN(timestamp.getTime())) return null;
        return new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Karachi',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).formatToParts(timestamp).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
      };
      const timestampParts = toPakistanParts(saved.checkInTime || saved.checkOutTime);
      const savedDate = timestampParts
        ? `${timestampParts.year}-${timestampParts.month}-${timestampParts.day}`
        : new Date(saved.date).toISOString().slice(0, 10);
      const toPakistanTime = (value) => {
        const parts = toPakistanParts(value);
        return parts ? `${parts.hour}:${parts.minute}` : '';
      };
      dispatch(attendanceSaved({
        id: saved._id,
        facultyId,
        date: savedDate,
        checkInTime: toPakistanTime(saved.checkInTime),
        checkOutTime: toPakistanTime(saved.checkOutTime),
        status: saved.status,
      }));
      setDate(savedDate);
      setView('daily');
      setNotice(`${action === 'checkIn' ? 'Check-in' : 'Check-out'} recorded. Time shown in Pakistan Standard Time.`);
    } catch (error) {
      setNotice(error.response?.data?.message || error.message || 'Could not update attendance.');
    } finally {
      setPendingAction(null);
    }
  };
  const week = mondayOf(parseDate(date));
  const heading = view === 'daily' ? `${date === dateKey(new Date()) ? "Today's Check-in Log" : 'Check-in Log'} (${longDate(date)})` : view === 'weekly' ? `Weekly Attendance (${longDate(dateKey(week))} – ${longDate(dateKey(shiftDays(week, 6)))})` : 'Attendance History';
  const save = (values) => {
    dispatch(attendanceSaved(values));
    setDate(values.date); setView('daily'); setFilters(initialFilters);
    setPage(Math.floor(Math.max(0, faculty.findIndex((member) => member.id === values.facultyId)) / pageSize) + 1);
    setNotice('Attendance saved.'); close();
  };
  const exportReport = () => {
    const data = attendanceExport(rows, view === 'weekly', [dateKey(week), dateKey(shiftDays(week, 6))]);
    downloadCsv(`faculty-attendance-${view}-${date}.csv`, data.headers, data.rows);
    setNotice(`Exported ${rows.length} ${view === 'weekly' ? 'weekly summaries' : 'rows'}.`);
  };
  return <section className="class-timetable faculty-attendance" aria-labelledby="attendance-title">
    <div className="tt-page-heading"><div><h1 id="attendance-title">Faculty &amp; Staff Attendance</h1><p>Track teacher presence, check-ins, and daily attendance records.</p></div><Button className="tt-primary" onClick={exportReport}><Download size={16} />Export Report</Button></div>
    <div className="attendance-summary">{[[Users, summary.total, 'Total Faculty & Staff'], [CircleCheck, summary.Present, date === dateKey(new Date()) ? 'Present Today' : 'Present on Selected Date'], [Clock, summary.Late, 'Late'], [CircleX, summary.Absent, 'Absent']].map(([Icon, value, label]) => <SummaryCard key={label} icon={Icon} value={value} label={label} />)}</div>
    <Tabs value={view} onValueChange={(next) => { setView(next); if (next !== 'history') setFilters((previous) => ({ ...previous, facultyId: '', from: '', to: '' })); setPage(1); setNotice(''); }}><Card className="tt-card attendance-panel">
      <div className="attendance-toolbar"><AttendanceDateNavigator date={date} onChange={changeDate} markedDates={records.map((record) => record.date)} />
        <TabsList aria-label="Attendance view">{[['daily', CalendarDays, 'Daily'], ['weekly', CalendarDays, 'Weekly'], ['history', History, 'History']].map(([value, Icon, label]) => <TabsTrigger key={value} value={value}><Icon size={14} />{label}</TabsTrigger>)}</TabsList>
      </div>
      <div className="attendance-filters"><div className="attendance-search"><Search size={17} /><Input type="search" aria-label="Search teacher, email, department" placeholder="Search teacher, department..." value={filters.search} onChange={(e) => changeFilter('search', e.target.value)} /></div>
        <select aria-label="Filter by department" value={filters.department} onChange={(e) => changeFilter('department', e.target.value)}><option value="">All Departments</option>{departments.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Filter by status" value={filters.status} onChange={(e) => changeFilter('status', e.target.value)}><option value="">All Status</option>{attendanceStatuses.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Filter by section (unavailable)" disabled aria-describedby="attendance-section-note"><option>All Sections</option></select>
      </div>
      {view === 'history' && <div className="attendance-history-filters"><label>Teacher / Staff<select value={filters.facultyId} onChange={(e) => changeFilter('facultyId', e.target.value)}><option value="">All Faculty & Staff</option>{faculty.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>From<Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => changeFilter('from', e.target.value)} /></label><label>To<Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => changeFilter('to', e.target.value)} /></label></div>}
      <div className="attendance-log-heading"><h2>{heading}</h2><Button variant="outline" onClick={() => onAction('edit')} disabled={!faculty.length}><Plus size={14} />Record Attendance</Button></div>
      <p className="attendance-note" id="attendance-section-note">Section filtering is unavailable: faculty records have no section assignments.{view === 'daily' && ' A dash means attendance has not been recorded.'}{view === 'weekly' && ' Counts include recorded days only.'}</p>
      <div className="attendance-table-wrap"><TabsContent value={view}><AttendanceTable rows={rows} view={view} page={current} pageSize={pageSize} onAction={onAction} onQuickAction={quickAttendanceAction} pendingAction={pendingAction} /></TabsContent></div>
      <div className="attendance-footer"><span role="status">{notice}</span><Pagination total={rows.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} label={view === 'history' ? 'records' : 'staff members'} /></div>
    </Card></Tabs>
    {modal?.mode === 'edit' && <AttendanceForm record={selected} faculty={faculty} facultyId={modal.facultyId} records={records} date={date} onSave={save} onClose={close} />}
    {modal?.mode === 'view' && selected && person && <AttendanceDetails record={selected} person={person} onClose={close} />}
  </section>;
}
