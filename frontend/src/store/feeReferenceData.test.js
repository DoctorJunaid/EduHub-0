import test from "node:test";
import assert from "node:assert/strict";
import { studentFeeView, feeReferenceStudentRoll } from "./feeReferenceData.js";
const student = { id: "student-1", roll: feeReferenceStudentRoll };
test("reference preview is explicit, scoped to the matching student, and can be disabled", () => {
  const view = studentFeeView(student, [], true);
  assert.equal(view.demo, true);
  assert.equal(view.paid, 100000);
  assert.equal(view.pending, 0);
  assert.deepEqual(
    view.vouchers.map((row) => row.voucherNo),
    ["VCH-9821", "VCH-9840"],
  );
  assert.equal(studentFeeView(student, [], false).vouchers.length, 0);
  assert.equal(studentFeeView(null, [], true).vouchers.length, 0);
  assert.equal(
    studentFeeView({ id: "other", roll: "OTHER" }, [], true).vouchers.length,
    0,
  );
});
test("real shared records always replace demo and remain personal, with correct outstanding totals", () => {
  const records = [
    { id: "1", studentId: "student-1", paymentStatus: "Paid", amount: 1200 },
    { id: "2", studentId: "student-1", paymentStatus: "Pending", amount: 500 },
    { id: "3", studentId: "student-1", paymentStatus: "Overdue", amount: 300 },
    { id: "4", studentId: "other", paymentStatus: "Paid", amount: 9000 },
  ];
  const view = studentFeeView(student, records, true);
  assert.equal(view.demo, false);
  assert.equal(view.vouchers.length, 3);
  assert.equal(view.paid, 1200);
  assert.equal(view.pending, 800);
  assert.deepEqual(studentFeeView(student, [records[3]], true).vouchers, []);
  assert.equal(records.length, 4);
});
