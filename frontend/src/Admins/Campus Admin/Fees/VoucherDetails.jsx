import { Coins, FileText, User, Calendar, CheckCircle2, Printer } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import FeeStatusBadge from "./FeeStatusBadge";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import { Button } from "@/components/ui/Button";

export default function VoucherDetails({ voucher, onClose, onPrint }) {
  const { isSchool } = useInstitution();
  if (!voucher) return null;

  return (
    <FullPageFormShell
      title={`Fee Voucher #${voucher.voucherNo}`}
      subtitle={`Billing details and payment record for ${voucher.student?.name || "Student"}.`}
      parentName="Fee Management"
      icon={<Coins size={22} />}
      onBack={onClose}
      maxWidth={850}
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Student Name
            </span>
            <strong className="text-[15px] text-foreground">{voucher.student.name}</strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Voucher Serial No.
            </span>
            <strong className="text-[15px] text-foreground">{voucher.voucherNo}</strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Fee Category
            </span>
            <strong className="text-[15px] text-foreground">{voucher.feeCategory}</strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              {isSchool ? "Term / Period" : "Semester"}
            </span>
            <strong className="text-[15px] text-foreground">
              {isSchool ? (voucher.semester?.replace(/Semester/i, "Term") || "Annual Term") : (voucher.semester || "—")}
            </strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Total Amount
            </span>
            <strong className="text-lg text-foreground">{formatPKR(voucher.amount)}</strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Payment Due Date
            </span>
            <strong className="text-[15px] text-foreground">{voucher.dueDate}</strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Settlement / Payment Date
            </span>
            <strong className="text-[15px] text-foreground">{voucher.paymentDate || "Unpaid"}</strong>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
              Payment Status
            </span>
            <FeeStatusBadge status={voucher.paymentStatus} />
          </div>
        </div>

        {/* Voucher Description & Line Items Particulars */}
        {(voucher.description || voucher.notes || (Array.isArray(voucher.breakdown) && voucher.breakdown.length > 0)) && (
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground block mb-2">
              Voucher Description & Fee Particulars
            </span>
            {(voucher.description || voucher.notes) && (
              <p className="m-0 mb-3 text-sm text-foreground/80 leading-relaxed">
                {voucher.description || voucher.notes}
              </p>
            )}
            {Array.isArray(voucher.breakdown) && voucher.breakdown.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border">
                {voucher.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.title}</span>
                    <strong className="text-foreground">{formatPKR(item.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 border-t border-border pt-4 mt-2">
          <Button variant="outline" onClick={onClose}>
            Back to Fee Management
          </Button>
          {onPrint && (
            <Button onClick={() => onPrint(voucher)}>
              <Printer className="size-4" />
              Print Bank Challan
            </Button>
          )}
        </div>
      </div>
    </FullPageFormShell>
  );
}
