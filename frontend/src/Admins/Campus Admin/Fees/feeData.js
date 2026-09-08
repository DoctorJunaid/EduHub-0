import { validDate } from "../../../lib/dates.js";
export const paymentStatuses = ["Paid", "Pending", "Overdue"];
export function validateVoucher(record) {
  for (const key of ["studentId", "voucherNo", "feeCategory"])
    if (typeof record[key] !== "string" || !record[key].trim())
      return "Student, voucher number, and fee category are required.";
  if (typeof record.semester !== "string") return "Enter a valid semester.";
  if (!Number.isFinite(record.amount) || record.amount <= 0)
    return "Amount must be a positive number.";
  if (!validDate(record.dueDate)) return "Enter a valid due date.";
  if (!paymentStatuses.includes(record.paymentStatus))
    return "Select Paid, Pending, or Overdue.";
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
  const people = new Map(students.map((student) => [student.id, student]));
  return records.map((record) => ({
    ...record,
    student: people.get(record.studentId) ?? {
      id: record.studentId,
      name: "Student unavailable",
      roll: record.studentId,
      initials: "?",
    },
  }));
}
export function filterVouchers(rows, filters) {
  const query = (filters.search ?? "").trim().toLowerCase();
  return rows.filter(
    (row) =>
      (!query ||
        [row.student.name, row.voucherNo, row.feeCategory].some((value) =>
          value.toLowerCase().includes(query),
        )) &&
      (!filters.feeCategory || row.feeCategory === filters.feeCategory) &&
      (!filters.paymentStatus || row.paymentStatus === filters.paymentStatus) &&
      (!filters.semester || row.semester === filters.semester) &&
      (!filters.dueDate || row.dueDate === filters.dueDate),
  );
}
export function collectionSummary(rows) {
  const totals = { Paid: 0, Pending: 0, Overdue: 0 };
  for (const row of rows) totals[row.paymentStatus] += row.amount;
  const total = totals.Paid + totals.Pending + totals.Overdue;
  return {
    ...totals,
    total,
    rate: total > 0 ? (totals.Paid / total) * 100 : 0,
  };
}
export const feeExport = (rows) => ({
  headers: [
    "Student Name",
    "Voucher Number",
    "Fee Category",
    "Semester",
    "Amount (PKR)",
    "Due Date",
    "Payment Status",
    "Payment Date",
  ],
  rows: rows.map((row) => [
    row.student.name,
    row.voucherNo,
    row.feeCategory,
    row.semester,
    row.amount,
    row.dueDate,
    row.paymentStatus,
    row.paymentDate,
  ]),
});
