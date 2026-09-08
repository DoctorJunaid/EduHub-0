import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { attendanceStatuses, validateAttendance } from './attendanceData.js';

export default function AttendanceForm({ record, faculty, date, facultyId, records, onSave, onClose }) {
  const id = useId();
  const [values, setValues] = useState(() => ({ facultyId: record?.facultyId ?? facultyId ?? '', date: record?.date ?? date, checkInTime: record?.checkInTime ?? '', checkOutTime: record?.checkOutTime ?? '', status: record?.status ?? '' }));
  const [error, setError] = useState('');
  const change = (key, value) => { setValues((previous) => ({ ...previous, [key]: value })); setError(''); };
  const existing = records.find((item) => item.facultyId === values.facultyId && item.date === values.date && item.id !== record?.id);
  const submit = (event) => {
    event.preventDefault();
    const message = validateAttendance(values);
    if (message) return setError(message);
    if (!faculty.some((person) => person.id === values.facultyId)) return setError('This faculty member is no longer available. Select a current member.');
    if (existing) return setError('Attendance already exists for this member and date. Open that record to update it.');
    onSave({ ...values, ...(record ? { id: record.id } : {}) });
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={`${id}-help`}>
    <div className="tt-dialog-heading"><DialogTitle>{record ? 'Update Attendance' : 'Record Attendance'}</DialogTitle></div>
    <p id={`${id}-help`} className="attendance-form-help">Choose the status manually. Leave unknown check-in or check-out times blank.</p>
    <form onSubmit={submit}><div className="tt-form-grid">
      <div className="tt-field"><Label htmlFor={`${id}-faculty`}>Faculty / Staff *</Label><select id={`${id}-faculty`} required value={values.facultyId} onChange={(e) => change('facultyId', e.target.value)}><option value="">Select faculty / staff</option>{faculty.map((person) => <option key={person.id} value={person.id}>{person.name} — {person.email}</option>)}</select></div>
      <div className="tt-field"><Label htmlFor={`${id}-date`}>Date *</Label><Input id={`${id}-date`} type="date" required value={values.date} onChange={(e) => change('date', e.target.value)} /></div>
      {['checkInTime', 'checkOutTime'].map((key) => <div className="tt-field" key={key}><Label htmlFor={`${id}-${key}`}>{key === 'checkInTime' ? 'Check-in Time' : 'Check-out Time'}</Label><Input id={`${id}-${key}`} type="time" value={values[key]} onChange={(e) => change(key, e.target.value)} /></div>)}
      <div className="tt-field"><Label htmlFor={`${id}-status`}>Status *</Label><select id={`${id}-status`} required value={values.status} onChange={(e) => change('status', e.target.value)}><option value="">Select status</option>{attendanceStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>
    </div>{error && <p role="alert" className="tt-error">{error}</p>}<div className="tt-dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{record ? 'Save Changes' : 'Save Attendance'}</Button></div></form>
  </DialogContent></Dialog>;
}
