import { useId, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { paymentStatuses, validateVoucher } from './feeData.js';

export default function FeeVoucherForm({ record, students, options, onSave, onClose }) {
  const id = useId();
  const [values, setValues] = useState(() => ({ studentId: record?.studentId ?? '', voucherNo: record?.voucherNo ?? '', feeCategory: record?.feeCategory ?? '', semester: record?.semester ?? '', amount: record?.amount ?? '', dueDate: record?.dueDate ?? '', paymentStatus: record?.paymentStatus ?? 'Pending', paymentDate: record?.paymentDate ?? '' }));
  const [error, setError] = useState('');
  const change = (key, value) => { setValues((previous) => ({ ...previous, [key]: value })); setError(''); };
  const submit = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    payload.amount = Number(payload.amount);
    const message = validateVoucher(payload);
    if (message) return setError(message);
    if (!students.some((student) => student.id === payload.studentId)) return setError('Select a current student.');
    onSave({ ...payload, ...(record ? { id: record.id } : {}) });
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={`${id}-help`}>
    <div className="tt-dialog-heading"><DialogTitle>{record ? 'Edit Fee Voucher' : 'Add Fee Voucher'}</DialogTitle></div><p id={`${id}-help`} className="fee-form-note">Record the voucher details and payment status. Paid vouchers require the actual payment date.</p>
    <form onSubmit={submit}><div className="tt-form-grid"><div className="tt-field"><Label htmlFor={`${id}-student`}>Student *</Label><select id={`${id}-student`} value={values.studentId} required onChange={(event) => change('studentId', event.target.value)}><option value="">Select student</option>{!students.some((student) => student.id === values.studentId) && values.studentId && <option value={values.studentId} disabled>Student unavailable</option>}{students.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.roll}</option>)}</select></div>
      {[['voucherNo', 'Voucher Number', 'text', true], ['feeCategory', 'Fee Category', 'text', true], ['semester', 'Semester (if applicable)', 'text', false], ['amount', 'Amount (PKR)', 'number', true], ['dueDate', 'Due Date', 'date', true], ['paymentDate', 'Payment Date', 'date', values.paymentStatus === 'Paid']].map(([key, label, type, required]) => <div className="tt-field" key={key}><Label htmlFor={`${id}-${key}`}>{label}{required && ' *'}</Label><Input id={`${id}-${key}`} type={type} step={type === 'number' ? 'any' : undefined} required={required} value={values[key]} list={options[key] ? `${id}-${key}-options` : undefined} onChange={(event) => change(key, event.target.value)} />{options[key] && <datalist id={`${id}-${key}-options`}>{options[key].map((value) => <option key={value} value={value} />)}</datalist>}</div>)}
      <div className="tt-field"><Label htmlFor={`${id}-status`}>Payment Status *</Label><select id={`${id}-status`} required value={values.paymentStatus} onChange={(event) => change('paymentStatus', event.target.value)}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></div>
    </div>{error && <p role="alert" className="tt-error">{error}</p>}<div className="tt-dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{record ? 'Save Changes' : 'Add Fee Voucher'}</Button></div></form>
  </DialogContent></Dialog>;
}
