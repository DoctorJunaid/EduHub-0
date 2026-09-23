import { useRef } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { printElement } from '@/lib/print';
import { formatFeeAmount } from '@/store/feeReferenceData';

export default function StudentChallanDialog({ voucher, student, demo = false }) {
  const sheet = useRef(null);
  return <DialogContent className="student-challan-dialog">
    <DialogHeader><DialogTitle>Print Challan</DialogTitle><DialogDescription>Review the selected voucher before printing.</DialogDescription></DialogHeader>
    <div ref={sheet} className="student-challan-sheet">
      <h2>EduHub Fee Challan</h2>
      <p>{demo ? 'Reference demo voucher. Not a payment receipt.' : 'Frontend copy of the recorded voucher.'}</p>
      <table aria-label="Selected fee challan"><tbody>{[
        ['Student', student?.name || 'Student'], ['Student Reference ID', student?.roll || 'Not available'], ['Voucher Number', voucher.voucherNo], ['Fee Type', voucher.feeCategory], ['Term / Month', voucher.semester || 'Not recorded'], ['Amount', formatFeeAmount(voucher.amount)], ['Due Date', voucher.dueDate], ['Status', voucher.paymentStatus], ['Payment Method', voucher.paymentMethod || 'Not recorded'], ['Payment Date', voucher.paymentDate || 'Not recorded'],
      ].map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>
    </div>
    <DialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose><Button onClick={() => printElement(sheet.current, `${voucher.voucherNo} - Fee Challan`)}>Print Challan</Button></DialogFooter>
  </DialogContent>;
}
