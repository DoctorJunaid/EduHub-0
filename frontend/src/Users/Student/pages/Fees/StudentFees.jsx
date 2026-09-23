import { useState } from "react";
import { useSelector } from "react-redux";
import { WalletCards, Clock3, Link2, FileText } from "lucide-react";
import SummaryCard from "@/components/common/SummaryCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { formatFeeAmount } from "@/store/feeReferenceData";
import StudentChallanDialog from "../../components/StudentChallanDialog";
import { selectStudentFees } from "./studentFeeSelectors";
import "./StudentFees.css";
import SubmitPaymentDialog from "./SubmitPaymentDialog";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";

function PrintChallan({ voucher, student, demo }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Print Challan ${voucher.voucherNo}`}
        >
          Print Challan
        </Button>
      </DialogTrigger>
      {open && (
        <StudentChallanDialog voucher={voucher} student={student} demo={demo} />
      )}
    </Dialog>
  );
}
export default function StudentFees() {
  const { student, vouchers, paid, pending, demo } = useSelector(selectStudentFees);
  const [paymentVoucher, setPaymentVoucher] = useState(null);

  const handleSubmitPayment = async (data) => {
    try {
      await axiosInstance.post(`/api/student/fees/${paymentVoucher._id || paymentVoucher.id}/submit-payment`, data);
      toast.success("Payment submitted successfully. Pending admin confirmation.");
      setPaymentVoucher(null);
      // Wait a moment and then reload or we just let them know.
      // Ideally we'd dispatch fetch fees again, but for now this works.
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment.");
    }
  };

  const stats = [
    {
      label: "Total Paid Fees",
      icon: WalletCards,
      value: student ? formatFeeAmount(paid) : "—",
      description: "Cleared invoices",
    },
    {
      label: "Pending Dues",
      icon: Clock3,
      value: student ? formatFeeAmount(pending) : "—",
      description: "All outstanding vouchers",
    },
    {
      label: "Payment Gateway",
      icon: Link2,
      value: demo ? "1Link / KuickPay" : "Not connected",
      description: demo
        ? "Reference only - Not connected"
        : "Online payments unavailable",
    },
    {
      label: "Billing Account",
      icon: FileText,
      value: student?.roll || "—",
      description: "Student Reference ID",
    },
  ];
  return (
    <section className="student-fees-page">
      <div className="sf-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sf-stat" />
        ))}
      </div>
      {demo && (
        <p className="sf-demo-note">
          Demo / reference vouchers only. These are not issued invoices or
          payment receipts. Online payments are not connected.
        </p>
      )}
      <Card className="sf-history">
        <div className="sf-history-heading">
          <h2>
            <span>
              <FileText aria-hidden="true" />
            </span>
            Fee Vouchers &amp; Payment History
          </h2>
          <p>All amounts in Pakistani Rupees (PKR)</p>
        </div>
        <Table aria-label="Fee vouchers and payment history">
          <TableHeader>
            <TableRow>
              {[
                "Voucher No & Type",
                "Term / Month",
                "Amount (PKR)",
                "Due Date",
                "Status",
                "Payment Method",
                "Action",
              ].map((label) => (
                <TableHead scope="col" key={label}>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((voucher) => (
              <TableRow key={voucher.id}>
                <TableCell>
                  <strong>{voucher.voucherNo}</strong>
                  <small>{voucher.feeCategory}</small>
                </TableCell>
                <TableCell>{voucher.semester || "Not recorded"}</TableCell>
                <TableCell>{formatFeeAmount(voucher.amount)}</TableCell>
                <TableCell>
                  <time dateTime={voucher.dueDate}>{voucher.dueDate}</time>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`sf-status sf-status-${voucher.paymentStatus.toLowerCase()}`}
                  >
                    {voucher.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>{voucher.paymentMethod || "Not recorded"}</TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <PrintChallan
                      voucher={voucher}
                      student={student}
                      demo={demo}
                    />
                    {!demo && voucher.paymentStatus !== "Paid" && voucher.paymentStatus !== "Pending Confirmation" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setPaymentVoucher(voucher)}
                      >
                        Submit Payment
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!vouchers.length && (
              <TableRow>
                <TableCell colSpan={7} className="sf-empty">
                  {student
                    ? "No fee vouchers available yet."
                    : "Fee vouchers will appear when your student record is linked."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      {paymentVoucher && (
        <SubmitPaymentDialog
          voucher={paymentVoucher}
          onClose={() => setPaymentVoucher(null)}
          onSubmit={handleSubmitPayment}
        />
      )}
    </section>
  );
}
