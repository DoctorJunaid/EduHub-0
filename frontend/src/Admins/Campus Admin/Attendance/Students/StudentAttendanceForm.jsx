import { useState } from 'react';
import { Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { attendanceStatuses } from '@/lib/attendance';
import { timeLabel } from '@/lib/schedule';
import { validStudentAttendance } from './studentAttendanceData.js';
import FullPageFormShell from '@/components/common/FullPageFormShell';

export default function StudentAttendanceForm({ students, classes, date, records, onSave, onClose }) {
  const [values, setValues] = useState({ studentId: '', classId: '', date, status: '' });
  const [error, setError] = useState('');

  const existing = records.find(
    (record) => record.studentId === values.studentId && record.classId === values.classId && record.date === values.date,
  );

  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validStudentAttendance(values)) return setError('Please select a student, class, valid date, and approved status.');
    if (!students.some((student) => student.id === values.studentId) || !classes.some((session) => session.id === values.classId))
      return setError('Select an existing student and timetable class.');
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
              onChange={(e) => change('studentId', e.target.value)}
            >
              <option value="">Select student from roster</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {student.roll} ({student.program})
                </option>
              ))}
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
              <option value="">Select class lecture</option>
              {classes.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.subject} — Section {session.section} ({timeLabel(session.startTime)}) — {session.room}
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
