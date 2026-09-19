import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
} from "@/components/ui/dropdown-menu";
import { formatPKR } from "@/lib/currency";
import FeeStatusBadge from "./FeeStatusBadge";

export default function FeeTable({ rows, onAction }) {
  const columnDefs = [
    { label: "Student / Voucher", width: "23%", align: "left" },
    { label: "Fee Category", width: "17%", align: "left" },
    { label: "Amount (PKR)", width: "14%", align: "left" },
    { label: "Due Date", width: "12%", align: "left" },
    { label: "Payment Status", width: "12%", align: "center" },
    { label: "Payment Date", width: "10%", align: "left" },
    { label: "Actions", width: "12%", align: "right" },
  ];

  return (
    <Table aria-label="Fee vouchers">
      <TableHeader>
        <TableRow>
          {columnDefs.map(({ label, width, align }) => (
            <TableHead scope="col" key={label} style={{ width, textAlign: align }}>
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((voucher) => (
          <TableRow key={voucher.id}>
            <TableCell style={{ width: "23%" }}>
              <div className="fee-person">
                <Avatar>
                  <AvatarFallback>
                    {voucher.student.initials || voucher.student.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{voucher.student.name}</strong>
                  <small style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#71717a" }}>{voucher.voucherNo}</small>
                </div>
              </div>
            </TableCell>
            <TableCell style={{ width: "17%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {voucher.feeCategory}
              <small>{voucher.semester || "—"}</small>
            </TableCell>
            <TableCell style={{ width: "14%" }}>
              <strong>{formatPKR(voucher.amount)}</strong>
            </TableCell>
            <TableCell style={{ width: "12%", whiteSpace: "nowrap" }}>{voucher.dueDate}</TableCell>
            <TableCell style={{ width: "12%", textAlign: "center", whiteSpace: "nowrap" }}>
              <FeeStatusBadge status={voucher.paymentStatus} />
            </TableCell>
            <TableCell style={{ width: "10%", whiteSpace: "nowrap" }}>{voucher.paymentDate || "—"}</TableCell>
            <TableCell style={{ width: "12%", textAlign: "right" }}>
              <div className="fee-actions">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="table-icon-btn"
                      style={{ width: "24px", height: "26px" }}
                      aria-label={`Actions for voucher ${voucher.voucherNo}`}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => onAction("view", voucher.id)}
                    >
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onAction("edit", voucher.id)}
                    >
                      Edit voucher
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={voucher.paymentStatus === "Paid"}
                      onSelect={() => onAction("paid", voucher.id)}
                    >
                      Mark Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      style={{ color: "#ef4444" }}
                      onSelect={() => onAction("delete", voucher.id)}
                    >
                      Delete voucher
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  className="fee-mark-paid"
                  disabled={voucher.paymentStatus === "Paid"}
                  onClick={() => onAction("paid", voucher.id)}
                  aria-label={`Mark voucher ${voucher.voucherNo} paid`}
                >
                  {voucher.paymentStatus === "Paid" ? "Paid" : "Mark Paid"}
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {!rows.length && (
          <TableRow>
            <TableCell colSpan={7} className="tt-empty">
              No vouchers match the current filters. Add a fee voucher to get
              started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
