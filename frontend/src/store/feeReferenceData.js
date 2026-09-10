import { formatPKR } from '../lib/currency.js';
export const formatFeeAmount = (amount) => formatPKR(amount).replace(/^Rs\s*/, 'PKR ');
// Screenshot-provided preview only; never inserted into issued fees.records or Admin totals.
export const feeReferenceStudentRoll = 'NUST-CS-2023-042';
export const feeReferenceVouchers = [
  { id: 'reference-vch-9821', voucherNo: 'VCH-9821', feeCategory: 'Semester Tuition Fee', semester: 'Fall 2025', amount: 85000, dueDate: '2025-08-15', paymentStatus: 'Paid', paymentMethod: '1Link Online Bank Transfer', paymentDate: '' },
  { id: 'reference-vch-9840', voucherNo: 'VCH-9840', feeCategory: 'Exam & Lab Access Fee', semester: 'Spring 2026', amount: 15000, dueDate: '2025-05-01', paymentStatus: 'Paid', paymentMethod: 'KuickPay', paymentDate: '' },
];
export function studentFeeView(student, fees, demoEnabled) {
  const demo = Boolean(demoEnabled && !fees.length && student?.roll === feeReferenceStudentRoll);
  const vouchers = demo ? feeReferenceVouchers : student ? fees.filter((voucher) => voucher.studentId === student.id) : [];
  return { student, vouchers, demo, paid: vouchers.filter((voucher) => voucher.paymentStatus === 'Paid').reduce((sum, voucher) => sum + voucher.amount, 0), pending: vouchers.filter((voucher) => voucher.paymentStatus !== 'Paid').reduce((sum, voucher) => sum + voucher.amount, 0) };
}
