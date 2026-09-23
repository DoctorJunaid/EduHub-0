import { validDate } from "../../../lib/dates.js";
export const paymentStatuses = [
  "Paid",
  "Pending",
  "Partially Paid",
  "Overdue",
  "Waived",
  "Cancelled",
];

export function validateVoucher(record) {
  for (const key of ["studentId", "voucherNo", "feeCategory"])
    if (typeof record[key] !== "string" || !record[key].trim())
      return "Student, voucher number, and fee category are required.";
  if (typeof record.semester !== "string") return "Enter a valid semester.";
  if (!Number.isFinite(record.amount) || record.amount <= 0)
    return "Amount must be a positive number.";
  if (!validDate(record.dueDate)) return "Enter a valid due date.";
  if (!paymentStatuses.includes(record.paymentStatus))
    return "Select a valid payment status.";
  if (
    typeof record.paymentDate !== "string" ||
    (record.paymentDate && !validDate(record.paymentDate))
  )
    return "Enter a valid payment date.";
  if (record.paymentStatus === "Paid" && !record.paymentDate)
    return "A payment date is required for Paid vouchers.";
  return "";
}

export function joinVouchers(records, students) {
  const people = new Map(students.map((student) => [String(student.id || student._id), student]));
  return records.map((record) => {
    const fromMap = people.get(String(record.studentId));
    const student = fromMap || (record.student?.name ? record.student : null) || {
      id: record.studentId,
      name: "Student unavailable",
      roll: record.studentId,
      initials: "?",
    };
    return {
      ...record,
      student,
    };
  });
}

export function filterVouchers(rows, filters) {
  const query = (filters.search ?? "").trim().toLowerCase();
  return rows.filter(
    (row) =>
      (!query ||
        [row.student.name, row.voucherNo, row.feeCategory, row.receiptNo || ""].some((value) =>
          value.toLowerCase().includes(query),
        )) &&
      (!filters.feeCategory || row.feeCategory === filters.feeCategory) &&
      (!filters.paymentStatus || row.paymentStatus === filters.paymentStatus) &&
      (!filters.semester || row.semester === filters.semester) &&
      (!filters.dueDate || row.dueDate === filters.dueDate),
  );
}

export function collectionSummary(rows) {
  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let waived = 0;
  let totalBilled = 0;

  for (const row of rows) {
    const effAmount = row.totalPayable > 0 ? row.totalPayable : row.amount || 0;
    const paidAmt = row.paidAmount || 0;
    const rem = Math.max(0, effAmount - paidAmt);

    totalBilled += effAmount;
    paid += paidAmt;

    if (row.paymentStatus === "Waived") {
      waived += rem;
    } else if (row.paymentStatus === "Overdue") {
      overdue += rem;
    } else if (rem > 0) {
      pending += rem;
    }
  }

  return {
    Paid: paid,
    Pending: pending,
    Overdue: overdue,
    Waived: waived,
    total: totalBilled,
    rate: totalBilled > 0 ? (paid / totalBilled) * 100 : 0,
  };
}

export const feeExport = (rows) => ({
  headers: [
    "Student Name",
    "Roll Number",
    "Voucher Number",
    "Receipt Number",
    "Fee Category",
    "Semester / Term",
    "Base Amount (PKR)",
    "Previous Arrears (PKR)",
    "Total Payable (PKR)",
    "Paid Amount (PKR)",
    "Remaining Balance (PKR)",
    "Due Date",
    "Payment Status",
    "Payment Date",
  ],
  rows: rows.map((row) => [
    row.student.name,
    row.student.roll || row.studentId,
    row.voucherNo,
    row.receiptNo || "—",
    row.feeCategory,
    row.semester,
    row.amount,
    row.previousArrears || 0,
    row.totalPayable || row.amount,
    row.paidAmount || 0,
    Math.max(0, (row.totalPayable || row.amount) - (row.paidAmount || 0)),
    row.dueDate,
    row.paymentStatus,
    row.paymentDate || "—",
  ]),
});
