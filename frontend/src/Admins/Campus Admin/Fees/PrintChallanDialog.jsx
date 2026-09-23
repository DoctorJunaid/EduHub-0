import { useRef } from "react";
import { Printer, Download, X, Building2, CheckCircle2, AlertCircle } from "lucide-react";
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

export default function PrintChallanDialog({ voucher, onClose }) {
  const sheetRef = useRef(null);
  const { isSchool } = useInstitution();

  if (!voucher) return null;

  const handlePrint = () => {
    if (sheetRef.current) {
      printElement(sheetRef.current, `${voucher.voucherNo}_Fee_Challan`);
    }
  };

  const studentName = voucher.student?.name || "Student";
  const studentRoll = voucher.student?.roll || voucher.studentId || "—";
  const studentProgram =
    voucher.student?.program || voucher.student?.gradeOrClass || "General";
  const semesterLabel = isSchool ? "Grade / Term" : "Semester / Term";
  const semesterValue = voucher.semester || (isSchool ? "Annual Term" : "Fall 2025");
  const issueDate = voucher.createdAt
    ? new Date(voucher.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const copies = [
    { name: "Bank Copy", desc: "For Bank records" },
    { name: "Campus Accounts Copy", desc: "For Campus Accounts office" },
    { name: "Student Copy", desc: "To be retained by Student" },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[1080px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 rounded-2xl border border-zinc-200 shadow-2xl bg-white flex flex-col gap-0"
        aria-describedby="challan-dialog-desc"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                Official Fee Challan Voucher
              </DialogTitle>
              <DialogDescription id="challan-dialog-desc" className="text-xs text-zinc-500 mt-1">
                Printable 3-part bank deposit slip for Voucher #{voucher.voucherNo}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold"
            >
              <Printer size={14} />
              Print Challan
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>
          </div>
        </div>

        {/* Printable 3-Part Bank Slip Canvas */}
        <div className="px-7 py-6">
          <div
            ref={sheetRef}
            className="fee-challan-canvas"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              background: "#ffffff",
              padding: "0",
            }}
          >
          {copies.map((copy, index) => (
            <div
              key={copy.name}
              className="challan-slip-copy"
              style={{
                border: "1px solid #d4d4d8",
                borderRadius: "8px",
                padding: "14px",
                background: "#fafafa",
                fontSize: "11px",
                lineHeight: "1.4",
                color: "#18181b",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Slip Header */}
              <div>
                <div
                  style={{
                    textAlign: "center",
                    borderBottom: "1.5px dashed #a1a1aa",
                    paddingBottom: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      margin: 0,
                      color: "#09090b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    EduHub Education System
                  </h3>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      color: "#4f46e5",
                      marginTop: "2px",
                    }}
                  >
                    {copy.name}
                  </div>
                  <div style={{ fontSize: "9px", color: "#71717a" }}>({copy.desc})</div>
                </div>

                {/* Voucher Meta Info */}
                <table
                  style={{
                    width: "100%",
                    fontSize: "10px",
                    marginBottom: "10px",
                    borderCollapse: "collapse",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ color: "#71717a", padding: "2px 0" }}>Voucher No:</td>
                      <td style={{ fontWeight: "700", textAlign: "right", color: "#09090b" }}>
                        {voucher.voucherNo}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "#71717a", padding: "2px 0" }}>Issue Date:</td>
                      <td style={{ textAlign: "right" }}>{issueDate}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#71717a", padding: "2px 0" }}>Due Date:</td>
                      <td style={{ fontWeight: "700", color: "#dc2626", textAlign: "right" }}>
                        {voucher.dueDate}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Student Profile Info */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    borderRadius: "6px",
                    padding: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ marginBottom: "3px" }}>
                    <span style={{ color: "#71717a", fontSize: "10px" }}>Student Name: </span>
                    <strong style={{ fontSize: "11px", color: "#09090b" }}>{studentName}</strong>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span style={{ color: "#71717a", fontSize: "10px" }}>Roll / Reg No: </span>
                    <strong>{studentRoll}</strong>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span style={{ color: "#71717a", fontSize: "10px" }}>Program / Grade: </span>
                    <span>{studentProgram}</span>
                  </div>
                  <div>
                    <span style={{ color: "#71717a", fontSize: "10px" }}>{semesterLabel}: </span>
                    <span>{semesterValue}</span>
                  </div>
                </div>

                {/* Fee Particulars Table */}
                <table
                  style={{
                    width: "100%",
                    fontSize: "10px",
                    borderCollapse: "collapse",
                    marginBottom: "12px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #27272a", background: "#f4f4f5" }}>
                      <th style={{ textAlign: "left", padding: "5px 4px", fontSize: "10px" }}>
                        Fee Particular
                      </th>
                      <th style={{ textAlign: "right", padding: "5px 4px", fontSize: "10px" }}>
                        Amount (PKR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(voucher.breakdown) && voucher.breakdown.length > 0 ? (
                      voucher.breakdown.map((item, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                          <td style={{ padding: "4px" }}>{item.title}</td>
                          <td style={{ textAlign: "right", padding: "4px", fontWeight: "600" }}>
                            {formatPKR(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
                        <td style={{ padding: "5px 4px" }}>
                          <div>{voucher.feeCategory || "Tuition Fee"}</div>
                          {(voucher.description || voucher.notes) && (
                            <div style={{ fontSize: "8.5px", color: "#71717a", marginTop: "2px", lineHeight: "1.3" }}>
                              {voucher.description || voucher.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right", padding: "5px 4px", fontWeight: "600" }}>
                          {formatPKR(voucher.amount)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: "1.5px solid #09090b", fontWeight: "800" }}>
                      <td style={{ padding: "6px 4px" }}>TOTAL PAYABLE:</td>
                      <td style={{ textAlign: "right", padding: "6px 4px", fontSize: "12px", color: "#09090b" }}>
                        {formatPKR(voucher.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {(voucher.description || voucher.notes) && Array.isArray(voucher.breakdown) && voucher.breakdown.length > 0 && (
                  <div style={{ fontSize: "9px", color: "#52525b", margin: "4px 0 8px 0", background: "#ffffff", border: "1px dashed #d4d4d8", padding: "4px 6px", borderRadius: "4px" }}>
                    <strong>Note:</strong> {voucher.description || voucher.notes}
                  </div>
                )}

                {/* Status Stamp */}
                <div style={{ textAlign: "center", margin: "10px 0" }}>
                  {voucher.paymentStatus === "Paid" ? (
                    <div
                      style={{
                        display: "inline-block",
                        border: "2px solid #16a34a",
                        color: "#16a34a",
                        padding: "3px 12px",
                        borderRadius: "4px",
                        fontWeight: "800",
                        fontSize: "11px",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    >
                      ✓ PAID — {voucher.paymentDate || "SETTLED"}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "inline-block",
                        border: "1.5px solid #ca8a04",
                        color: "#854d0e",
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: "700",
                        fontSize: "10px",
                        background: "#fefce8",
                      }}
                    >
                      PAYABLE BEFORE DUE DATE
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: "9px",
                    color: "#71717a",
                    lineHeight: "1.3",
                    margin: "8px 0",
                  }}
                >
                  * Fee once deposited is non-refundable. Payment can be submitted via online banking,
                  1Link, KuickPay, or designated campus fee accounts.
                </p>
              </div>

              {/* Signatures */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "24px",
                  borderTop: "1px solid #e4e4e7",
                  marginTop: "16px",
                  fontSize: "9px",
                  color: "#71717a",
                }}
              >
                <span>Depositor / Student</span>
                <span>Authorized Bank / Cashier</span>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-zinc-200 bg-zinc-50 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 px-5 text-sm font-semibold">
            Close
          </Button>
          <Button type="button" onClick={handlePrint} className="h-10 px-6 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 inline-flex items-center gap-2 shadow-sm">
            <Printer size={15} />
            Print All Copies
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
