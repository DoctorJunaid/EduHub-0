import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { examFields, examTypes, validateExam } from './examData.js';

export default function ExamForm({ record, options, onSave, onClose }) {
  const id = useId();
  const [values, setValues] = useState(() => Object.fromEntries(examFields.map(([key]) => [key, record?.[key] ?? (key === 'examType' ? 'Midterm' : '')])));
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value).trim()]));
    const message = validateExam(cleaned);
    if (message) return setError(message);
    onSave({ ...cleaned, totalMarks: Number(cleaned.totalMarks) });
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={undefined}>
      <div className="tt-dialog-heading"><DialogTitle>{record ? 'Edit Exam' : 'Schedule Exam'}</DialogTitle></div>
      <form onSubmit={submit}>
        <div className="tt-form-grid">{examFields.map(([key, label, type]) => <div className="tt-field" key={key}>
          <Label htmlFor={`${id}-${key}`}>{label}{key !== 'department' && ' *'}</Label>
          {key === 'examType' ? <select id={`${id}-${key}`} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })}>{examTypes.map((value) => <option key={value}>{value}</option>)}</select> : <>
            <Input id={`${id}-${key}`} type={type ?? 'text'} required={key !== 'department'} step={type === 'number' ? 'any' : undefined} list={options[key]?.length ? `${id}-${key}-options` : undefined} value={values[key]} onChange={(e) => { setValues({ ...values, [key]: e.target.value }); setError(''); }} />
            {options[key]?.length > 0 && <datalist id={`${id}-${key}-options`}>{options[key].map((value) => <option key={value} value={value} />)}</datalist>}
          </>}
        </div>)}</div>
        {error && <p role="alert" className="tt-error">{error}</p>}
        <div className="tt-dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{record ? 'Save Changes' : 'Schedule Exam'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
