import { useRef } from "react";
import { Printer, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
        className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl bg-white flex flex-col"
        style={{
          width: "calc(100vw - 2rem)",
          maxWidth: "960px",
          padding: 0,
          gap: 0,
        }}
        aria-describedby="receipt-dialog-desc"
        showCloseButton={false}
      >
        <div
          className="flex items-center justify-between border-b border-zinc-200 bg-white flex-shrink-0"
          style={{ padding: "20px clamp(20px, 4vw, 32px)", gap: "16px" }}
        >
          <div className="flex items-center min-w-0" style={{ gap: "14px" }}>
            <div className="size-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
              <Receipt className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                Official Payment Receipt
              </DialogTitle>
              <DialogDescription
                id="receipt-dialog-desc"
                className="text-xs text-zinc-500"
                style={{ marginTop: "4px" }}
              >
                Acknowledgement of Fee Payment &middot; {receiptNo}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center flex-shrink-0" style={{ gap: "8px" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="inline-flex items-center text-xs font-semibold"
              style={{ height: "36px", padding: "0 14px", gap: "6px" }}
            >
              <Printer size={14} />
              Print
            </Button>
            <Button
              type="button"
              onClick={onClose}
              aria-label="Close payment receipt dialog"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              style={{ width: "32px", height: "32px" }}
            >
              <span className="text-xl leading-none">&times;</span>
            </Button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ padding: "clamp(16px, 3vw, 24px)" }}
        >
          <div
            ref={sheetRef}
            className="bg-white border border-zinc-200 rounded-xl text-zinc-900 font-sans"
            style={{ padding: "clamp(16px, 4vw, 32px)" }}
          >
            {/* Header */}
            <div
              className="border-b-2 border-zinc-900 flex flex-col min-[480px]:flex-row min-[480px]:justify-between min-[480px]:items-start"
              style={{ paddingBottom: "20px", marginBottom: "20px", gap: "16px" }}
            >
              <div>
                <h2 className="text-lg font-bold tracking-tight uppercase text-zinc-900">
                  EduHub Campus Manager
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Official Accounts &amp; Finance Department
                </p>
                <span
                  className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded"
                  style={{ marginTop: "6px", padding: "3px 8px" }}
                >
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
                <span className="text-xs text-zinc-500 block" style={{ marginTop: "3px" }}>
                  {paymentDate}
                </span>
              </div>
            </div>

            {/* Student & Voucher Details */}
            <div
              className="grid grid-cols-1 bg-zinc-50 rounded-lg border border-zinc-200 text-xs sm:grid-cols-2"
              style={{ padding: "20px", gap: "20px", marginBottom: "20px" }}
            >
              <div className="min-w-0">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Student Name
                </span>
                <strong className="text-zinc-900 text-sm block">
                  {studentName}
                </strong>
                <span className="text-zinc-600 block" style={{ marginTop: "3px" }}>
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
                <span className="text-zinc-600 block" style={{ marginTop: "3px" }}>
                  Category: {voucher.feeCategory}
                </span>
                <span className="text-zinc-600 block">
                  Term / Month: {voucher.semester || voucher.month}
                </span>
              </div>
            </div>

            {/* Payment Breakdown Table */}
            <table className="w-full text-xs border-collapse" style={{ marginBottom: "20px" }}>
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-semibold text-[10px] uppercase">
                  <th className="text-left" style={{ padding: "12px 0" }}>
                    Description / Particulars
                  </th>
                  <th className="text-right" style={{ padding: "12px 0" }}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="font-medium text-zinc-800 break-words" style={{ padding: "14px 0" }}>
                    {voucher.feeCategory} ({voucher.semester || voucher.month})
                  </td>
                  <td className="text-right text-zinc-700 whitespace-nowrap" style={{ padding: "14px 0" }}>
                    {formatPKR(voucher.amount)}
                  </td>
                </tr>
                {voucher.previousArrears > 0 && (
                  <tr>
                    <td className="text-zinc-600" style={{ padding: "12px 0" }}>
                      Previous Outstanding Arrears
                    </td>
                    <td className="text-right text-zinc-700" style={{ padding: "12px 0" }}>
                      {formatPKR(voucher.previousArrears)}
                    </td>
                  </tr>
                )}
                {voucher.waiver?.amount > 0 && (
                  <tr>
                    <td className="text-purple-700" style={{ padding: "12px 0" }}>
                      Fee Waiver / Concession ({voucher.waiver.reason})
                    </td>
                    <td className="text-right text-purple-700" style={{ padding: "12px 0" }}>
                      -{formatPKR(voucher.waiver.amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-zinc-900 font-bold text-sm bg-zinc-50">
                  <td className="text-zinc-900" style={{ padding: "14px 8px" }}>
                    Total Amount Paid In This Receipt
                  </td>
                  <td className="text-right text-emerald-700 font-mono" style={{ padding: "14px 8px" }}>
                    {formatPKR(paymentAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Method & Meta */}
            <div
              className="grid grid-cols-1 border-t border-zinc-200 text-[11px] text-zinc-600 sm:grid-cols-2"
              style={{ paddingTop: "18px", marginBottom: "28px", gap: "16px", lineHeight: 1.7 }}
            >
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
            <div
              className="grid grid-cols-1 border-t border-dashed border-zinc-300 text-center text-[10px] text-zinc-500 sm:grid-cols-2"
              style={{ paddingTop: "36px", gap: "32px" }}
            >
              <div>
                <div className="border-b border-zinc-400 w-32 mx-auto" style={{ marginBottom: "8px" }}></div>
                <span>Student / Depositor</span>
              </div>
              <div>
                <div className="border-b border-zinc-400 w-32 mx-auto" style={{ marginBottom: "8px" }}></div>
                <span>Accounts Officer / Cashier</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col-reverse items-stretch justify-end border-t border-zinc-200 bg-zinc-50 sm:flex-row sm:items-center flex-shrink-0"
          style={{ padding: "20px clamp(20px, 4vw, 32px)", gap: "12px" }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full text-sm font-semibold sm:w-auto"
            style={{ height: "44px", padding: "0 24px" }}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="w-full text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 inline-flex items-center shadow-sm sm:w-auto"
            style={{ height: "44px", padding: "0 28px", gap: "8px" }}
          >
            <Printer size={15} />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
