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
  return (
    <Table aria-label="Fee vouchers">
      <TableHeader>
        <TableRow>
          {[
            "Student / Voucher",
            "Fee Category",
            "Amount (PKR)",
            "Due Date",
            "Payment Status",
            "Payment Date",
            "Actions",
          ].map((label) => (
            <TableHead scope="col" key={label}>
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((voucher) => (
          <TableRow key={voucher.id}>
            <TableCell>
              <div className="fee-person">
                <Avatar>
                  <AvatarFallback>
                    {voucher.student.initials || voucher.student.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <strong>{voucher.student.name}</strong>
                  <small>{voucher.voucherNo}</small>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {voucher.feeCategory}
              <small>{voucher.semester || "—"}</small>
            </TableCell>
            <TableCell>
              <strong>{formatPKR(voucher.amount)}</strong>
            </TableCell>
            <TableCell>{voucher.dueDate}</TableCell>
            <TableCell>
              <FeeStatusBadge status={voucher.paymentStatus} />
            </TableCell>
            <TableCell>{voucher.paymentDate || "—"}</TableCell>
            <TableCell>
              <div className="fee-actions">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label={`Actions for voucher ${voucher.voucherNo}`}
                    >
                      <MoreHorizontal size={15} />
                    </Button>
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
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="fee-mark-paid"
                  variant="outline"
                  disabled={voucher.paymentStatus === "Paid"}
                  onClick={() => onAction("paid", voucher.id)}
                  aria-label={`Mark voucher ${voucher.voucherNo} paid`}
                >
                  {voucher.paymentStatus === "Paid" ? "Paid" : "Mark Paid"}
                </Button>
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
