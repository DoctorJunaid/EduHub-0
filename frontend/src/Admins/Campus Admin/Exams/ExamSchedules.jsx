import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileClock,
  GraduationCap,
  List,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  selectExams,
  selectExamStats,
  fetchExams,
  addExam,
  updateExam,
  deleteExam,
} from '@/store/Slices/examsSlice.js';
import { selectFaculty, fetchFaculty } from '@/store/Slices/facultySlice.js';
import { selectStudents, fetchStudents } from '@/store/Slices/studentsSlice.js';
import { selectTimetable, fetchSchedules } from '@/store/Slices/timetableSlice.js';
import { mondayOf, shiftDays } from '../../../lib/schedule.js';
import { dateKey, parseDate, examTypes, filterExams } from './examData.js';
import toast from 'react-hot-toast';
import ExamCalendar from './ExamCalendar';
import ExamForm from './ExamForm';
import ExamDetailsDialog from './ExamDetailsDialog';
import ScheduledExams from './ScheduledExams';
import '../Timetable/ClassTimetable.css';
import './ExamSchedules.css';

const emptyFilters = { search: '', examType: '', department: '', room: '', invigilator: '' };

export default function ExamSchedules() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchExams());
    dispatch(fetchFaculty());
    dispatch(fetchStudents());
    dispatch(fetchSchedules());
  }, [dispatch]);

  const rawRecords = useSelector(selectExams);
  const records = useMemo(() => Array.isArray(rawRecords) ? rawRecords : [], [rawRecords]);
  const stats = useSelector((state) => selectExamStats(state, dateKey(new Date())));
  const faculty = useSelector(selectFaculty);
  const students = useSelector(selectStudents);
  const timetable = useSelector(selectTimetable);

  const [view, setView] = useState('week');
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [filters, setFilters] = useState(emptyFilters);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const unique = (values) => [...new Set(values.filter(Boolean))].sort();
  const options = useMemo(() => ({
    examType: examTypes,
    department: unique([...faculty.map((item) => item.department), ...records.map((item) => item.department)]),
    room: unique([...timetable.map((item) => item.room), ...records.map((item) => item.room)]),
    invigilator: unique([...faculty.map((item) => item.name), ...records.map((item) => item.invigilator)]),
    section: unique([...students, ...timetable, ...records].map((item) => item.section)),
    subject: unique([...timetable, ...records].map((item) => item.subject)),
  }), [faculty, records, timetable, students]);

  const filtered = useMemo(() => {
    return filterExams(records, filters).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));
  }, [records, filters]);

  const selected = records.find((item) => item.id === modal?.id || item._id === modal?.id);
  const onAction = (mode, id) => setModal({ mode, id });
  const close = () => setModal(null);

  const changeFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const save = async (values) => {
    try {
      if (selected) {
        await dispatch(updateExam({ ...values, id: selected._id || selected.id })).unwrap();
        toast.success("Exam schedule updated successfully!");
      } else {
        await dispatch(addExam(values)).unwrap();
        toast.success("Exam scheduled successfully!");
      }
      setFilters(emptyFilters);
      close();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save exam schedule');
    }
  };

  const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };

  // Real Database Metrics
  const totalExams = records.length;
  const midterms = records.filter((item) => item.examType === 'Midterm').length;
  const finals = records.filter((item) => item.examType === 'Final').length;
  const thisWeek = stats.week || 0;

  return (
    <section className="campus-tab-page exam-schedules" aria-label="Exam Schedules Management">
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <FileClock size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Total Examinations</span>
              <span className="kpi-value">{totalExams}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <CalendarDays size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Midterm Papers</span>
              <span className="kpi-value">{midterms}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <GraduationCap size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Final Examinations</span>
              <span className="kpi-value">{finals}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">This Week's Sittings</span>
              <span className="kpi-value">{thisWeek}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous 56px Toolbar */}
      <Tabs value={view} onValueChange={setView} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="campus-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-search" style={{ width: "130px", maxWidth: "145px" }}>
              <Search size={13} />
              <input
                type="search"
                placeholder="Search exams..."
                value={filters.search}
                onChange={(e) => changeFilter('search', e.target.value)}
                aria-label="Search exams"
              />
            </div>

            <TabsList style={{ height: '32px', padding: '2px', background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
              <TabsTrigger value="week" style={{ height: '26px', fontSize: '11px', fontWeight: '600', padding: '0 8px', borderRadius: '4px' }}>
                <CalendarDays size={12} style={{ marginRight: '3px' }} /> Week
              </TabsTrigger>
              <TabsTrigger value="list" style={{ height: '26px', fontSize: '11px', fontWeight: '600', padding: '0 8px', borderRadius: '4px' }}>
                <List size={12} style={{ marginRight: '3px' }} /> List
              </TabsTrigger>
            </TabsList>

            <select
              className="toolbar-select"
              aria-label="Filter by Exam Type"
              style={{ maxWidth: "105px" }}
              value={filters.examType}
              onChange={(e) => changeFilter('examType', e.target.value)}
            >
              <option value="">All Types</option>
              {options.examType.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>

            <select
              className="toolbar-select"
              aria-label="Filter by Department"
              style={{ maxWidth: "105px" }}
              value={filters.department}
              onChange={(e) => changeFilter('department', e.target.value)}
            >
              <option value="">All Depts</option>
              {options.department.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>

            <select
              className="toolbar-select"
              aria-label="Filter by Room"
              style={{ maxWidth: "90px" }}
              value={filters.room}
              onChange={(e) => changeFilter('room', e.target.value)}
            >
              <option value="">All Halls</option>
              {options.room.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={() => onAction('add')}
            >
              <Plus size={14} />
              Schedule Exam
            </button>
          </div>
        </div>

        {/* 3. Panel Content */}
        <div style={{ padding: '16px 20px', width: '100%', boxSizing: 'border-box' }}>
          <TabsContent value="week" style={{ margin: 0, padding: 0 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e4e4e7', borderRadius: '6px', background: '#ffffff', height: '30px' }}>
                  <button
                    type="button"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center', color: '#71717a' }}
                    aria-label="Previous week"
                    onClick={() => setWeek(shiftDays(week, -7))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#09090b', padding: '0 6px' }}>
                    {week.toLocaleDateString('en-US', dateOptions)} – {shiftDays(week, 6).toLocaleDateString('en-US', dateOptions)}
                  </span>
                  <button
                    type="button"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center', color: '#71717a' }}
                    aria-label="Next week"
                    onClick={() => setWeek(shiftDays(week, 7))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
                  {examTypes.map((type) => (
                    <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        background: type.toLowerCase() === 'midterm' ? '#16a34a' : type.toLowerCase() === 'final' ? '#dc2626' : '#f59e0b'
                      }} />
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px' }}>
                <ExamCalendar records={filtered} week={week} onView={(id) => onAction('view', id)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" style={{ margin: 0, padding: 0 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
              <ScheduledExams
                records={filtered}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={(size) => { setPageSize(size); setPage(1); }}
                onAction={onAction}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal Dialogs */}
      {(modal?.mode === 'add' || (modal?.mode === 'edit' && selected)) && (
        <ExamForm record={selected} options={options} onSave={save} onClose={close} />
      )}
      {modal?.mode === 'view' && selected && (
        <ExamDetailsDialog record={selected} onClose={close} />
      )}
      <ConfirmDialog
        open={modal?.mode === 'delete' && Boolean(selected)}
        title="Delete Exam Schedule?"
        description={`Are you sure you want to delete ${selected?.subject ?? 'this exam'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={close}
        onConfirm={async () => {
          if (selected) {
            try {
              await dispatch(deleteExam(selected._id || selected.id)).unwrap();
              toast.success("Exam schedule deleted");
            } catch (err) {
              toast.error("Failed to delete exam schedule");
            }
          }
          close();
        }}
      />
    </section>
  );
}
