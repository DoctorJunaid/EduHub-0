import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { validateResult, resultKey } from './resultsData.js';

export default function ResultForm({ record, students, exams, records, onClose, onSave }) {
  const id = useId();
  const [values, setValues] = useState(() => ({ studentId: record?.studentId ?? '', examId: record?.examId ?? '', academicYear: record?.academicYear ?? '', semester: record?.semester ?? '', courseCode: record?.courseCode ?? '', score: record?.score ?? '', totalMarks: record?.totalMarks ?? '', grade: record?.grade ?? '', gpa: record?.gpa ?? '', remarks: record?.remarks ?? '' }));
  const [error, setError] = useState('');
  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value, ...(key === 'examId' ? { totalMarks: exams.find((exam) => exam.id === value)?.totalMarks ?? '' } : {}) })); setError('');
  };
  const submit = (event) => {
    event.preventDefault();
    const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    const payload = { ...cleaned, score: cleaned.score === '' ? NaN : Number(cleaned.score), totalMarks: cleaned.totalMarks === '' ? NaN : Number(cleaned.totalMarks), gpa: cleaned.gpa === '' ? null : Number(cleaned.gpa) };
    const message = validateResult(payload);
    if (message) return setError(message);
    if (!students.some((student) => student.id === payload.studentId) || !exams.some((exam) => exam.id === payload.examId)) return setError('Select a current student and scheduled exam.');
    if (records.some((item) => item.id !== record?.id && resultKey(item) === resultKey(payload))) return setError('This student already has a result for that exam and academic period. Edit the existing result.');
    onSave({ ...payload, ...(record ? { id: record.id } : {}) });
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={`${id}-help`}>
    <div className="tt-dialog-heading"><DialogTitle>{record ? 'Edit Result' : 'Record Exam Result'}</DialogTitle></div><p className="results-form-note" id={`${id}-help`}>Enter the awarded grade and GPA if known. They are not calculated from marks.</p>
    <form onSubmit={submit}><div className="tt-form-grid">
      <div className="tt-field"><Label htmlFor={`${id}-student`}>Student *</Label><select id={`${id}-student`} required value={values.studentId} onChange={(e) => change('studentId', e.target.value)}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.roll}</option>)}</select></div>
      <div className="tt-field"><Label htmlFor={`${id}-exam`}>Exam / Subject *</Label><select id={`${id}-exam`} required value={values.examId} onChange={(e) => change('examId', e.target.value)}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.subject} — {exam.examType} — {exam.date} — {exam.section}</option>)}</select></div>
      {[['academicYear', 'Academic Year', 'text', true], ['semester', 'Semester', 'text', true], ['courseCode', 'Course Code', 'text', false], ['score', 'Score', 'number', true], ['totalMarks', 'Total Marks', 'number', true], ['grade', 'Awarded Grade', 'text', false], ['gpa', 'Awarded GPA', 'number', false]].map(([key, label, type, required]) => <div className="tt-field" key={key}><Label htmlFor={`${id}-${key}`}>{label}{required && ' *'}</Label><Input id={`${id}-${key}`} type={type} step={type === 'number' ? 'any' : undefined} required={required} list={type === 'text' ? `${id}-${key}-options` : undefined} value={values[key]} onChange={(e) => change(key, e.target.value)} />{type === 'text' && <datalist id={`${id}-${key}-options`}>{[...new Set(records.map((item) => item[key]).filter(Boolean))].map((value) => <option key={value} value={value} />)}</datalist>}</div>)}
      <div className="tt-field"><Label htmlFor={`${id}-remarks`}>Academic Remarks</Label><Textarea id={`${id}-remarks`} value={values.remarks} onChange={(e) => change('remarks', e.target.value)} /></div>
    </div>{error && <p role="alert" className="tt-error">{error}</p>}<div className="tt-dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{record ? 'Save Changes' : 'Save Result'}</Button></div></form>
  </DialogContent></Dialog>;
}
