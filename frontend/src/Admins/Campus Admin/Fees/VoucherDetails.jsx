import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { formatPKR } from '@/lib/currency';
import FeeStatusBadge from './FeeStatusBadge';
export default function VoucherDetails({ voucher, onClose }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="tt-dialog" overlayClassName="tt-overlay" aria-describedby={undefined}><div className="tt-dialog-heading"><DialogTitle>Fee Voucher Details</DialogTitle></div><dl className="tt-details">{[['Student', voucher.student.name], ['Voucher Number', voucher.voucherNo], ['Fee Category', voucher.feeCategory], ['Semester', voucher.semester || '—'], ['Amount', formatPKR(voucher.amount)], ['Due Date', voucher.dueDate], ['Payment Date', voucher.paymentDate || '—']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Payment Status</dt><dd><FeeStatusBadge status={voucher.paymentStatus} /></dd></div></dl><div className="tt-dialog-actions"><Button onClick={onClose}>Close</Button></div></DialogContent></Dialog>;
}
