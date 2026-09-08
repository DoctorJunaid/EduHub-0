import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { attendanceStatuses } from '@/lib/attendance';
import { timeLabel } from '@/lib/schedule';
import { validStudentAttendance } from './studentAttendanceData.js';

export default function StudentAttendanceForm({ students, classes, date, records, onSave, onClose }) {
  const id = useId();
  const [values, setValues] = useState({ studentId: '', classId: '', date, status: '' });
  const [error, setError] = useState('');
  const existing = records.find((record) => record.studentId === values.studentId && record.classId === values.classId && record.date === values.date);
  const change = (key, value) => { setValues((previous) => ({ ...previous, [key]: value })); setError(''); };
  const submit = (event) => {
    event.preventDefault();
    if (!validStudentAttendance(values)) return setError('Select a student, class, valid date, and approved status.');
    if (!students.some((student) => student.id === values.studentId) || !classes.some((session) => session.id === values.classId)) return setError('Select an existing student and timetable class.');
    onSave(values);
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={`${id}-help`}>
    <div className="tt-dialog-heading"><DialogTitle>Record Student Attendance</DialogTitle></div><p id={`${id}-help`} className="student-attendance-form-help">Select the student and class session you want to record. Status is set manually.</p>
    <form onSubmit={submit}><div className="tt-form-grid">
      <div className="tt-field"><Label htmlFor={`${id}-student`}>Student *</Label><select id={`${id}-student`} value={values.studentId} required onChange={(e) => change('studentId', e.target.value)}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.roll}</option>)}</select></div>
      <div className="tt-field"><Label htmlFor={`${id}-class`}>Timetable Class *</Label><select id={`${id}-class`} value={values.classId} required onChange={(e) => change('classId', e.target.value)}><option value="">Select class</option>{classes.map((session) => <option key={session.id} value={session.id}>{session.subject} — {session.section} — {timeLabel(session.startTime)} — {session.room}</option>)}</select></div>
      <div className="tt-field"><Label htmlFor={`${id}-date`}>Date *</Label><Input id={`${id}-date`} type="date" required value={values.date} onChange={(e) => change('date', e.target.value)} /></div>
      <div className="tt-field"><Label htmlFor={`${id}-status`}>Status *</Label><select id={`${id}-status`} value={values.status} required onChange={(e) => change('status', e.target.value)}><option value="">Select status</option>{attendanceStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>
    </div>{existing && <p className="student-attendance-form-help">An entry already exists ({existing.status}). Saving updates that entry.</p>}{error && <p role="alert" className="tt-error">{error}</p>}<div className="tt-dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{existing ? 'Update Attendance' : 'Save Attendance'}</Button></div></form>
  </DialogContent></Dialog>;
}
