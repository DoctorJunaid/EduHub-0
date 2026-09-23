import { MoreHorizontal, Receipt, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatPKR } from "@/lib/currency";
import FeeStatusBadge from "./FeeStatusBadge";

export default function FeeTable({ rows, onAction }) {
  return (
    <Table aria-label="Fee vouchers table">
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: "24%" }}>Student &amp; Voucher</TableHead>
          <TableHead style={{ width: "16%" }}>Category &amp; Term</TableHead>
          <TableHead style={{ width: "15%" }}>Total Payable</TableHead>
          <TableHead style={{ width: "12%" }}>Due Date</TableHead>
          <TableHead className="text-center" style={{ width: "11%" }}>Payment Status</TableHead>
          <TableHead style={{ width: "10%" }}>Paid Date</TableHead>
          <TableHead className="text-center" style={{ width: "12%" }}>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((voucher) => {
          const totalBilled = voucher.totalPayable > 0 ? voucher.totalPayable : voucher.amount;
          const isPaid = voucher.paymentStatus === "Paid";
          const isPartiallyPaid = voucher.paymentStatus === "Partially Paid";
          const isWaivedOrCancelled = voucher.paymentStatus === "Waived" || voucher.paymentStatus === "Cancelled";

          return (
            <TableRow key={voucher.id}>
              {/* Student & Voucher */}
              <TableCell style={{ width: "24%", overflow: "hidden" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: 0, overflow: "hidden" }}
                  onClick={() => onAction("view", voucher.id)}
                >
                  <Avatar style={{ width: "28px", height: "28px", fontSize: "11px", fontWeight: "600", background: "#f4f4f5", color: "#09090b", flexShrink: 0 }}>
                    <AvatarFallback>{voucher.student?.initials || voucher.student?.name?.[0] || "S"}</AvatarFallback>
                  </Avatar>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                    <strong style={{ fontSize: "13px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                      {voucher.student?.name}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block", fontFamily: "monospace" }}>
                      {voucher.voucherNo}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Category & Term */}
              <TableCell style={{ width: "16%", overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                  <strong style={{ fontSize: "12px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                    {voucher.feeCategory}
                  </strong>
                  <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}>
                    {voucher.semester || "Regular Term"}
                  </span>
                </div>
              </TableCell>

              {/* Amount & Arrears */}
              <TableCell style={{ width: "15%", overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                  <strong style={{ fontSize: "13px", fontWeight: "700", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                    {formatPKR(totalBilled)}
                  </strong>
                  {voucher.paidAmount > 0 && !isPaid ? (
                    <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}>
                      Paid: {formatPKR(voucher.paidAmount)} &middot; Bal: {formatPKR(voucher.remainingAmount)}
                    </span>
                  ) : voucher.previousArrears > 0 ? (
                    <span style={{ fontSize: "10px", color: "#b45309", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}>
                      Inc. Arrears: {formatPKR(voucher.previousArrears)}
                    </span>
                  ) : null}
                </div>
              </TableCell>

              {/* Due Date */}
              <TableCell style={{ width: "12%", overflow: "hidden" }}>
                <span style={{ fontSize: "12px", color: "#52525b", whiteSpace: "nowrap" }}>
                  {voucher.dueDate}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell className="text-center" style={{ width: "11%", overflow: "hidden" }}>
                <FeeStatusBadge status={voucher.paymentStatus} />
              </TableCell>

              {/* Paid Date */}
              <TableCell style={{ width: "10%", overflow: "hidden" }}>
                <span style={{ fontSize: "12px", color: voucher.paymentDate ? "#52525b" : "#d4d4d8", whiteSpace: "nowrap" }}>
                  {voucher.paymentDate || "—"}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-center" style={{ width: "12%", overflow: "hidden" }}>
                <div className="campus-action-icons" style={{ justifyContent: "center" }}>
                  {isPaid ? (
                    <button
                      type="button"
                      onClick={() => onAction("receipt", voucher.id)}
                      className="toolbar-btn toolbar-btn-outline"
                      style={{ height: "26px", minHeight: "26px", fontSize: "11px", padding: "0 8px", cursor: "pointer" }}
                      title="View Official Receipt"
                    >
                      <Receipt size={12} style={{ color: "#16a34a" }} />
                      Receipt
                    </button>
                  ) : !isWaivedOrCancelled ? (
                    <button
                      type="button"
                      onClick={() => onAction("paid", voucher.id)}
                      className={`toolbar-btn ${isPartiallyPaid ? "toolbar-btn-outline" : "toolbar-btn-primary"}`}
                      style={{ height: "26px", minHeight: "26px", fontSize: "11px", padding: "0 8px", cursor: "pointer" }}
                      title={isPartiallyPaid ? "Pay Remaining Balance" : "Record Payment"}
                    >
                      <CreditCard size={12} />
                      {isPartiallyPaid ? "Pay Bal" : "Record Pay"}
                    </button>
                  ) : null}

                  {/* Dropdown for Secondary Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="campus-icon-btn"
                        title="More Actions"
                        style={{ cursor: "pointer" }}
                        aria-label={`More actions for voucher ${voucher.voucherNo}`}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onSelect={() => onAction("view", voucher.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onAction("print", voucher.id)}>
                        Print Challan
                      </DropdownMenuItem>
                      {(voucher.paidAmount > 0 || isPaid) && (
                        <DropdownMenuItem onSelect={() => onAction("receipt", voucher.id)}>
                          Print Official Receipt
                        </DropdownMenuItem>
                      )}
                      {!isPaid && !isWaivedOrCancelled && (
                        <>
                          <DropdownMenuItem onSelect={() => onAction("paid", voucher.id)}>
                            Record Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onAction("waive", voucher.id)}>
                            Waive / Concession
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onAction("edit", voucher.id)}>
                        Edit Voucher
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                        onSelect={() => onAction("delete", voucher.id)}
                      >
                        Delete Voucher
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} style={{ textAlign: "center", padding: "28px", color: "#71717a", fontSize: "12px" }}>
              No fee vouchers match your search and filter criteria.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
