import { useRef } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { printElement } from "@/lib/print";
import { formatPKR } from "@/lib/currency";

export default function StudentChallanDialog({ voucher, student, demo = false }) {
  const sheet = useRef(null);

  const totalPayable = voucher.totalPayable > 0 ? voucher.totalPayable : voucher.amount;
  const breakdown = voucher.breakdown?.length
    ? voucher.breakdown
    : [
        { title: voucher.feeCategory || voucher.feeType || "Monthly Tuition Fee", amount: voucher.amount || 5000 },
        ...(voucher.previousArrears > 0 ? [{ title: "Previous Unpaid Arrears", amount: voucher.previousArrears }] : []),
      ];

  const copies = ["Bank Copy (Cashier)", "Institute Copy (Accounts)", "Student Copy"];

  return (
    <DialogContent className="student-challan-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Official Bank Fee Challan
        </DialogTitle>
        <DialogDescription>
          Print or download official 3-copy fee challan slip for bank deposit at any HBL / Allied Bank / NBP branch.
        </DialogDescription>
      </DialogHeader>

      <div ref={sheet} className="challan-print-container p-4 bg-white text-zinc-900 rounded-lg border border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200 text-xs">
          {copies.map((copyName, idx) => (
            <div key={copyName} className={`flex flex-col gap-2.5 ${idx > 0 ? "md:pl-4 pt-4 md:pt-0" : ""}`}>
              {/* Header */}
              <div className="text-center pb-2 border-b border-zinc-200">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-100 rounded text-zinc-700">
                  {copyName}
                </span>
                <h3 className="font-extrabold text-sm tracking-tight mt-1 text-zinc-900">EDUHUB SYSTEM</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Habib Bank Limited · A/C: 0142-79018420-03</p>
              </div>

              {/* Voucher Meta */}
              <div className="grid grid-cols-2 gap-1 text-[11px] bg-zinc-50 p-2 rounded border border-zinc-100">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Voucher No</span>
                  <strong className="font-mono text-zinc-900 font-bold">{voucher.voucherNo || "VCH-09281"}</strong>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Due Date</span>
                  <strong className="text-rose-700 font-bold">
                    {voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString() : "15th of Month"}
                  </strong>
                </div>
                <div className="col-span-2 pt-1 border-t border-zinc-200/60 mt-1">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Student Name &amp; Roll No</span>
                  <strong className="text-zinc-900">
                    {student?.name || "Danyal Mirza"} ({student?.roll || "STU-9A"})
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Class &amp; Sec</span>
                  <span>{student?.gradeOrClass || "Class 9"} - {student?.section || "A"}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Billing Month</span>
                  <span>{voucher.month || voucher.semester || "Current"}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-zinc-200 rounded overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold">
                    <tr>
                      <th className="p-1.5">Particulars</th>
                      <th className="p-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {breakdown.map((item, i) => (
                      <tr key={i}>
                        <td className="p-1.5 text-zinc-600">{item.title}</td>
                        <td className="p-1.5 text-right font-medium text-zinc-900">{formatPKR(item.amount)}</td>
                      </tr>
                    ))}
                    {voucher.waiver?.amount > 0 && (
                      <tr className="text-purple-700 font-medium">
                        <td className="p-1.5">Waiver / Scholarship</td>
                        <td className="p-1.5 text-right">-{formatPKR(voucher.waiver.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t-2 border-zinc-300 font-bold">
                    <tr>
                      <td className="p-1.5 text-zinc-900">Total Payable</td>
                      <td className="p-1.5 text-right text-emerald-800 font-extrabold text-xs">
                        {formatPKR(totalPayable)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Instructions & Signatures */}
              <div className="text-[9px] text-zinc-500 mt-auto pt-2 border-t border-zinc-200 flex flex-col gap-1">
                <p>• Late fee fine of PKR 200 applicable after due date.</p>
                <div className="flex justify-between pt-4 text-center text-zinc-700 font-semibold text-[9px]">
                  <div className="border-t border-zinc-400 pt-1 w-20">Cashier Stamp</div>
                  <div className="border-t border-zinc-400 pt-1 w-20">Officer Signature</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="flex gap-2">
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
        <Button
          onClick={() => printElement(sheet.current, `${voucher.voucherNo} - Fee Challan`)}
          className="gap-1.5"
        >
          <Printer className="w-4 h-4" />
          Print 3-Copy Challan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

