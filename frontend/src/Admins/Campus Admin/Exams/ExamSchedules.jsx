import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, ChevronLeft, ChevronRight, FileClock, GraduationCap, List, Plus, Search, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import SummaryCard from '@/components/common/SummaryCard';
import { selectExams, selectExamStats, addExam, updateExam, deleteExam } from '@/store/Slices/examsSlice.js';
import { selectFaculty } from '@/store/Slices/facultySlice.js';
import { selectStudents } from '@/store/Slices/studentsSlice.js';
import { selectTimetable } from '@/store/Slices/timetableSlice.js';
import { mondayOf, shiftDays } from '../../../lib/schedule.js';
import { dateKey, parseDate, examTypes, filterExams } from './examData.js';
import ExamCalendar from './ExamCalendar';
import ExamForm from './ExamForm';
import ExamDetailsDialog from './ExamDetailsDialog';
import ScheduledExams from './ScheduledExams';
import '../Timetable/ClassTimetable.css';
import './ExamSchedules.css';

const emptyFilters = { search: '', examType: '', department: '', room: '', invigilator: '' };
export default function ExamSchedules() {
  const dispatch = useDispatch();
  const records = useSelector(selectExams);
  const stats = useSelector((state) => selectExamStats(state, dateKey(new Date())));
  const faculty = useSelector(selectFaculty), students = useSelector(selectStudents), timetable = useSelector(selectTimetable);
  const [view, setView] = useState('week');
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [filters, setFilters] = useState(emptyFilters);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const unique = (values) => [...new Set(values.filter(Boolean))].sort();
  const options = {
    examType: examTypes,
    department: unique([...faculty.map((item) => item.department), ...records.map((item) => item.department)]),
    room: unique([...timetable.map((item) => item.room), ...records.map((item) => item.room)]),
    invigilator: unique([...faculty.map((item) => item.name), ...records.map((item) => item.invigilator)]),
    section: unique([...students, ...timetable, ...records].map((item) => item.section)),
    subject: unique([...timetable, ...records].map((item) => item.subject)),
  };
  const filtered = filterExams(records, filters).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const selected = records.find((item) => item.id === modal?.id);
  const onAction = (mode, id) => setModal({ mode, id });
  const close = () => setModal(null);
  const changeFilter = (key, value) => { setFilters((previous) => ({ ...previous, [key]: value })); setPage(1); };
  const save = (values) => {
    const action = selected ? updateExam({ ...values, id: selected.id }) : addExam(values);
    dispatch(action);
    setFilters(emptyFilters);
    setWeek(mondayOf(parseDate(values.date)));
    const sorted = [...records.filter((item) => item.id !== action.payload.id), action.payload].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    setPage(Math.floor(sorted.findIndex((item) => item.id === action.payload.id) / pageSize) + 1);
    close();
  };
  const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return <section className="class-timetable exam-schedules" aria-labelledby="exam-title">
    <div className="tt-page-heading"><div><h1 id="exam-title">Examination Datesheets &amp; Schedules</h1><p>Manage midterm, final exams, test dates, and assigned invigilators.</p></div><Button className="tt-primary" onClick={() => onAction('add')}><Plus size={18} />Schedule Exam</Button></div>
    <div className="exam-summary">{[[FileClock, stats.total, 'Total Exams'], [CalendarDays, stats.midterms, 'Midterms'], [GraduationCap, stats.finals, 'Final Exams'], [Users, stats.week, 'This Week']].map(([Icon, value, label]) => <SummaryCard key={label} icon={Icon} value={value} label={label} />)}</div>
    <Tabs value={view} onValueChange={setView}>
      <Card className="tt-card exam-schedule-panel">
        <div className="exam-controls"><div className="exam-filter-row"><div className="exam-search"><Search size={17} /><Input aria-label="Search exams" placeholder="Search exams by subject, room, or invigilator..." value={filters.search} onChange={(e) => changeFilter('search', e.target.value)} /></div><div className="exam-filters">{[['examType', 'Exam Types'], ['department', 'Departments'], ['room', 'Halls'], ['invigilator', 'Invigilators']].map(([key, label]) => <select key={key} aria-label={`Filter by ${label}`} value={filters[key]} onChange={(e) => changeFilter(key, e.target.value)}><option value="">All {label}</option>{options[key].map((value) => <option key={value}>{value}</option>)}</select>)}</div></div>
          <div className="exam-view-row"><TabsList aria-label="Exam schedule view"><TabsTrigger value="week"><CalendarDays size={13} />Week View</TabsTrigger><TabsTrigger value="list"><List size={13} />List View</TabsTrigger></TabsList>
            <div className="tt-date-controls"><div><Button variant="ghost" aria-label="Previous week" onClick={() => setWeek(shiftDays(week, -7))}><ChevronLeft size={15} /></Button><span aria-live="polite"><CalendarDays size={14} />{week.toLocaleDateString('en-US', dateOptions)} – {shiftDays(week, 6).toLocaleDateString('en-US', dateOptions)}</span><Button variant="ghost" aria-label="Next week" onClick={() => setWeek(shiftDays(week, 7))}><ChevronRight size={15} /></Button></div><Button variant="outline" onClick={() => setWeek(mondayOf(new Date()))}>Today</Button></div>
            <div className="exam-legend">{examTypes.map((type) => <span key={type}><i className={`exam-${type.toLowerCase()}`} />{type}</span>)}</div>
          </div>
        </div>
        <TabsContent value="week"><ExamCalendar records={filtered} week={week} onView={(id) => onAction('view', id)} /></TabsContent>
        <TabsContent value="list"><p className="exam-list-note">All scheduled dates are shown below, including weekend exams.</p></TabsContent>
      </Card>
      <ScheduledExams records={filtered} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} onAction={onAction} />
    </Tabs>
    {(modal?.mode === 'add' || (modal?.mode === 'edit' && selected)) && <ExamForm record={selected} options={options} onSave={save} onClose={close} />}
    {modal?.mode === 'view' && selected && <ExamDetailsDialog record={selected} onClose={close} />}
    <ConfirmDialog open={modal?.mode === 'delete' && Boolean(selected)} title="Delete Exam?" description={`Are you sure you want to delete ${selected?.subject ?? 'this exam'}? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" onCancel={close} onConfirm={() => { if (selected) dispatch(deleteExam(selected.id)); close(); }} />
  </section>;
}
