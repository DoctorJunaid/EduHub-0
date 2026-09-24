import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { attendanceStatuses } from '@/lib/attendance';
import { timeLabel } from '@/lib/schedule';
import { validStudentAttendance } from './studentAttendanceData.js';
import FullPageFormShell from '@/components/common/FullPageFormShell';

const DEFAULT_PERIODS = [
  { id: 'daily-session', subject: 'General Daily Attendance', section: 'All', startTime: '08:00', endTime: '14:00', room: 'Classroom' },
  { id: 'period-1', subject: 'Period 1 (08:00 – 08:45)', section: 'Standard', startTime: '08:00', endTime: '08:45', room: 'Classroom' },
  { id: 'period-2', subject: 'Period 2 (08:45 – 09:30)', section: 'Standard', startTime: '08:45', endTime: '09:30', room: 'Classroom' },
  { id: 'period-3', subject: 'Period 3 (09:30 – 10:15)', section: 'Standard', startTime: '09:30', endTime: '10:15', room: 'Classroom' },
  { id: 'period-4', subject: 'Period 4 (10:45 – 11:30)', section: 'Standard', startTime: '10:45', endTime: '11:30', room: 'Classroom' },
  { id: 'period-5', subject: 'Period 5 (11:30 – 12:15)', section: 'Standard', startTime: '11:30', endTime: '12:15', room: 'Classroom' },
  { id: 'period-6', subject: 'Period 6 (12:15 – 13:00)', section: 'Standard', startTime: '12:15', endTime: '13:00', room: 'Classroom' },
];

export default function StudentAttendanceForm({ students = [], classes = [], date, records = [], onSave, onClose }) {
  const [values, setValues] = useState({ studentId: '', classId: '', date, status: '' });
  const [error, setError] = useState('');

  const selectedStudent = useMemo(() => {
    return students.find((s) => (s.id || s._id) === values.studentId);
  }, [students, values.studentId]);

  const availableSessions = useMemo(() => {
    if (Array.isArray(classes) && classes.length > 0) {
      if (selectedStudent) {
        const studentClass = selectedStudent.gradeOrClass || selectedStudent.program;
        const matching = classes.filter((c) => {
          const cClass = c.className || c.gradeOrClass || c.program;
          const matchClass = !studentClass || !cClass || String(cClass).toLowerCase() === String(studentClass).toLowerCase();
          const matchSection = !selectedStudent.section || !c.section || String(c.section).toLowerCase() === String(selectedStudent.section).toLowerCase();
          return matchClass && matchSection;
        });
        if (matching.length > 0) return matching;
      }
      return classes;
    }
    return DEFAULT_PERIODS;
  }, [classes, selectedStudent]);

  const existing = records.find(
    (record) =>
      (record.studentId === values.studentId || record.studentId?._id === values.studentId) &&
      record.classId === values.classId &&
      record.date === values.date,
  );

  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validStudentAttendance(values)) return setError('Please select a student, lecture session, valid date, and status.');
    if (!students.some((student) => (student.id || student._id) === values.studentId))
      return setError('Select an existing student from the roster.');
    onSave(values);
  };

  return (
    <FullPageFormShell
      title="Record Student Attendance"
      subtitle="Manually log presence or absence for a student in a specific lecture session."
      parentName="Student Attendance"
      icon={<Users size={22} />}
      onBack={onClose}
      maxWidth={1600}
      className="student-attendance-form-page"
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Session & Student Details</div>

          <div className="activity-form-field span-2">
            <Label htmlFor="att-stud-id">Select Enrolled Student *</Label>
            <select
              id="att-stud-id"
              value={values.studentId}
              required
              onChange={(e) => {
                const sId = e.target.value;
                change('studentId', sId);
              }}
            >
              <option value="">Select student from roster</option>
              {students.map((student) => {
                const sId = student.id || student._id;
                return (
                  <option key={sId} value={sId}>
                    {student.name} — {student.roll || student.rollNo || student.admissionNo || 'STD'} ({student.gradeOrClass || student.program || 'Class'})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="activity-form-field span-2">
            <Label htmlFor="att-stud-class">Timetable Lecture Session *</Label>
            <select
              id="att-stud-class"
              value={values.classId}
              required
              onChange={(e) => change('classId', e.target.value)}
            >
              <option value="">Select class lecture session</option>
              {availableSessions.map((session) => (
                <option key={session.id || session._id} value={session.id || session._id}>
                  {session.subject || 'Lecture'} {session.section ? `— Section ${session.section}` : ''} ({session.startTime ? timeLabel(session.startTime) : '08:00'} – {session.endTime ? timeLabel(session.endTime) : '14:00'}) {session.room ? `— ${session.room}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="att-stud-date">Attendance Date *</Label>
            <input
              id="att-stud-date"
              type="date"
              required
              value={values.date}
              onChange={(e) => change('date', e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="att-stud-status">Attendance Status *</Label>
            <select
              id="att-stud-status"
              value={values.status}
              required
              onChange={(e) => change('status', e.target.value)}
            >
              <option value="">Select status</option>
              {attendanceStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {existing && (
          <p
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#1d4ed8',
            }}
          >
            An attendance entry already exists for this session ({existing.status}). Submitting will update the record.
          </p>
        )}

        {error && (
          <p
            role="alert"
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#dc2626',
            }}
          >
            {error}
          </p>
        )}

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="activity-submit-btn">
            {existing ? 'Update Attendance Entry' : 'Save Attendance Entry'}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
