import { useRef } from "react";
import { Printer, Receipt, Building2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/currency";
import { printElement } from "@/lib/print";
import { useInstitution } from "@/context/InstitutionContext";

export default function PaymentReceiptDialog({ voucher, payment, onClose }) {
  const sheetRef = useRef(null);
  const { isSchool } = useInstitution();

  if (!voucher) return null;

  const receiptNo =
    payment?.receiptNo ||
    voucher?.receiptNo ||
    `RCP-${String(voucher._id || voucher.id)
      .slice(-6)
      .toUpperCase()}`;
  const student = voucher.student || {};
  const studentName = student.name || "Student";
  const studentRoll = student.roll || voucher.studentId || "—";
  const studentClass =
    student.gradeOrClass ||
    student.program ||
    voucher.gradeOrClass ||
    "General";

  const paymentAmount = payment?.amount || voucher.paidAmount || voucher.amount;
  const totalBilled =
    voucher.totalPayable > 0 ? voucher.totalPayable : voucher.amount;
  const remainingBalance = Math.max(0, totalBilled - (voucher.paidAmount || 0));
  const paymentDate = payment?.paymentDate
    ? new Date(payment.paymentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : voucher.paymentDate || new Date().toISOString().split("T")[0];
  const paymentMethod =
    payment?.paymentMethod || voucher.paymentMethod || "Cash";
  const referenceNo = payment?.referenceNo || voucher.referenceNo || "—";

  const handlePrint = () => {
    if (sheetRef.current) {
      printElement(sheetRef.current, `${receiptNo}_Payment_Receipt`);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[760px] lg:max-w-[840px] max-h-[calc(100vh-2rem)] overflow-hidden p-0 rounded-2xl border border-zinc-200 shadow-2xl bg-white flex flex-col gap-0"
        aria-describedby="receipt-dialog-desc"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6 border-b border-zinc-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
              <Receipt className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                Official Payment Receipt
              </DialogTitle>
              <DialogDescription
                id="receipt-dialog-desc"
                className="text-xs text-zinc-500 mt-1"
              >
                Acknowledgement of Fee Payment &middot; {receiptNo}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold"
            >
              <Printer size={14} />
              Print
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close payment receipt dialog"
              className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <div
            ref={sheetRef}
            className="bg-white border border-zinc-200 rounded-xl p-5 text-zinc-900 font-sans sm:p-7 md:p-8 print:p-8"
          >
            {/* Header */}
            <div className="border-b-2 border-zinc-900 pb-5 mb-5 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:justify-between min-[480px]:items-start">
              <div>
                <h2 className="text-lg font-bold tracking-tight uppercase text-zinc-900">
                  EduHub Campus Manager
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Official Accounts &amp; Finance Department
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded">
                  PAYMENT CONFIRMED
                </span>
              </div>
              <div className="text-left min-[480px]:text-right">
                <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
                  Receipt Number
                </span>
                <strong className="text-sm font-mono font-bold text-zinc-900">
                  {receiptNo}
                </strong>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  {paymentDate}
                </span>
              </div>
            </div>

            {/* Student & Voucher Details */}
            <div className="grid grid-cols-1 gap-5 bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-xs mb-5 sm:grid-cols-2 sm:p-5">
              <div className="min-w-0">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Student Name
                </span>
                <strong className="text-zinc-900 text-sm block">
                  {studentName}
                </strong>
                <span className="text-zinc-600 block mt-0.5">
                  Roll: {studentRoll}
                </span>
                <span className="text-zinc-600 block">
                  {isSchool ? "Class / Grade" : "Program"}: {studentClass}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Challan / Voucher
                </span>
                <strong className="text-zinc-900 text-sm block font-mono">
                  {voucher.voucherNo}
                </strong>
                <span className="text-zinc-600 block mt-0.5">
                  Category: {voucher.feeCategory}
                </span>
                <span className="text-zinc-600 block">
                  Term / Month: {voucher.semester || voucher.month}
                </span>
              </div>
            </div>

            {/* Payment Breakdown Table */}
            <table className="w-full text-xs mb-5 border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-semibold text-[10px] uppercase">
                  <th className="py-2.5 text-left">
                    Description / Particulars
                  </th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-3 font-medium text-zinc-800 break-words">
                    {voucher.feeCategory} ({voucher.semester || voucher.month})
                  </td>
                  <td className="py-3 text-right text-zinc-700 whitespace-nowrap">
                    {formatPKR(voucher.amount)}
                  </td>
                </tr>
                {voucher.previousArrears > 0 && (
                  <tr>
                    <td className="py-2 text-zinc-600">
                      Previous Outstanding Arrears
                    </td>
                    <td className="py-2 text-right text-zinc-700">
                      {formatPKR(voucher.previousArrears)}
                    </td>
                  </tr>
                )}
                {voucher.waiver?.amount > 0 && (
                  <tr>
                    <td className="py-2 text-purple-700">
                      Fee Waiver / Concession ({voucher.waiver.reason})
                    </td>
                    <td className="py-2 text-right text-purple-700">
                      -{formatPKR(voucher.waiver.amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-zinc-900 font-bold text-sm bg-zinc-50">
                  <td className="py-2.5 px-2 text-zinc-900">
                    Total Amount Paid In This Receipt
                  </td>
                  <td className="py-2.5 px-2 text-right text-emerald-700 font-mono">
                    {formatPKR(paymentAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Method & Meta */}
            <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 text-[11px] text-zinc-600 mb-7 sm:grid-cols-2">
              <div className="min-w-0 break-words">
                <p>
                  <strong>Payment Mode:</strong> {paymentMethod}
                </p>
                <p>
                  <strong>Reference / TID:</strong> {referenceNo}
                </p>
              </div>
              <div className="min-w-0 break-words sm:text-right">
                <p>
                  <strong>Remaining Dues:</strong> {formatPKR(remainingBalance)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {remainingBalance === 0 ? "Fully Cleared" : "Partially Paid"}
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 gap-7 pt-9 border-t border-dashed border-zinc-300 text-center text-[10px] text-zinc-500 sm:grid-cols-2 sm:gap-8">
              <div>
                <div className="border-b border-zinc-400 w-32 mx-auto mb-1"></div>
                <span>Student / Depositor</span>
              </div>
              <div>
                <div className="border-b border-zinc-400 w-32 mx-auto mb-1"></div>
                <span>Accounts Officer / Cashier</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-end gap-3 px-6 py-5 border-t border-zinc-200 bg-zinc-50 sm:flex-row sm:items-center sm:px-8 sm:py-6 sm:gap-4 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 w-full px-6 text-sm font-semibold sm:w-auto"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="h-11 w-full px-7 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 inline-flex items-center gap-2 shadow-sm sm:w-auto"
          >
            <Printer size={15} />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
