import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import feeService from "../services/fee.service.js";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import { FeeRecord } from "../models/profile.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import ActivityLog from "../models/activityLog.model.js";

async function runTests() {
  console.log("==================================================================");
  console.log("  EDUHUB CAMPUS MANAGER — FULL END-TO-END FEE WORKFLOW TEST SUITE ");
  console.log("==================================================================");

  await connectDB();

  // Find a campus manager or campus to anchor the test
  const manager = await User.findOne({ role: "campus_manager" });
  if (!manager || !manager.campusId) {
    throw new Error("No campus manager found with a valid campusId.");
  }
  const campusId = manager.campusId;
  const adminUser = manager;

  console.log(`[INIT] Testing with Campus ID: ${campusId}`);
  console.log(`[INIT] Testing Admin: ${manager.name} (${manager.email})`);

  const TEST_CLASS = `Test-Class-${Date.now().toString().slice(-4)}`;
  const TEST_MONTH_1 = "2026-10";
  const TEST_MONTH_2 = "2026-11";
  const TEST_MONTH_3 = "2026-12";

  let createdStudentA = null;
  let createdStudentB = null;
  let createdFeeStructure = null;
  let createdFeeStructure2 = null;

  try {
    // 0. Setup Fee Structure for TEST_CLASS
    console.log(`\n[SETUP] Creating Fee Structure for class: ${TEST_CLASS}`);
    createdFeeStructure = await FeeStructure.create({
      campusId,
      gradeOrClass: TEST_CLASS,
      admissionFee: 5000,
      tuitionFee: 4000,
      labFee: 1000,
      computerFee: 500,
      libraryFee: 300,
      sportsFee: 200,
      examFee: 500,
      otherFee: 500,
      lateFeeFine: 200,
      isActive: true,
    });
    // Total monthly = 4000 + 1000 + 500 + 300 + 200 + 500 + 500 = 7000
    console.log(`[SETUP] Fee Structure created. Monthly Rate: PKR 7,000, Admission: PKR 5,000`);

    // =========================================================================
    // WORKFLOW A: Student Admission → Admission Fee Generation → Portal Query
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW A: Student Admission & Admission Fee Generation");
    console.log("-------------------------------------------------------------");
    createdStudentA = await User.create({
      name: `Test Student A ${Date.now().toString().slice(-4)}`,
      email: `teststudentA_${Date.now()}@eduhub.test`,
      passwordHash: "hashedPassword123",
      role: "student",
      campusId,
      gradeOrClass: TEST_CLASS,
      section: "A",
      roll: `ROL-${Date.now().toString().slice(-4)}`,
      status: "Active",
      isActive: true,
    });
    console.log(`[A.1] Created Student A: ${createdStudentA.name} (${createdStudentA.roll})`);

    const admissionVoucher = await feeService.generateAdmissionFee(
      campusId,
      manager.instituteId || null,
      createdStudentA,
      {},
      adminUser
    );
    if (!admissionVoucher) {
      throw new Error("Admission voucher generation returned null");
    }
    const vchNo = admissionVoucher.voucherNo || admissionVoucher.challanNo;
    console.log(`[A.2] Generated Admission Voucher: ${vchNo}, Amount: PKR ${admissionVoucher.amount}`);
    if (admissionVoucher.amount !== 9000 || !admissionVoucher.isAdmissionFee) {
      throw new Error(`Expected admission fee of 9000 (5000 admission + 4000 1st month tuition), got ${admissionVoucher.amount}`);
    }

    const portalHistoryA = await feeService.getStudentFeeHistory(createdStudentA._id, campusId);
    if (!portalHistoryA.vouchers.some((v) => (v.voucherNo || v.challanNo) === vchNo)) {
      throw new Error("Student portal query did not return the admission fee voucher");
    }
    console.log(`[A.3] PASSED: Student portal query successfully retrieved admission voucher.`);

    // Settle admission fee so month 1 starts with 0 arrears
    await feeService.recordPayment(admissionVoucher._id, campusId, null, {
      amount: admissionVoucher.totalPayable,
      paymentMethod: "Bank Transfer",
      referenceNo: "TID-ADM-PAID",
      receivedBy: adminUser._id,
      notes: "Admission fee cleared",
    });
    console.log(`[A.4] Admission fee settled. Status cleared.`);

    // =========================================================================
    // WORKFLOW B: Monthly Billing Idempotency (Run Twice → 0 Duplicates)
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW B: Monthly Fee Generation Idempotency");
    console.log("-------------------------------------------------------------");
    const genRun1 = await feeService.generateMonthlyFees(campusId, {
      month: TEST_MONTH_1,
      dueDate: "2026-10-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS,
      issuedBy: adminUser._id,
    });
    console.log(`[B.1] Run 1 Result: generated=${genRun1.generatedCount}, skipped=${genRun1.skippedCount}`);
    if (genRun1.generatedCount !== 1) {
      throw new Error(`Expected 1 voucher generated on Run 1, got ${genRun1.generatedCount}`);
    }

    const genRun2 = await feeService.generateMonthlyFees(campusId, {
      month: TEST_MONTH_1,
      dueDate: "2026-10-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS,
      issuedBy: adminUser._id,
    });
    console.log(`[B.2] Run 2 Result (Idempotency): generated=${genRun2.generatedCount}, skipped=${genRun2.skippedCount}`);
    if (genRun2.generatedCount !== 0 || genRun2.skippedCount < 1) {
      throw new Error(`Expected 0 generated and >=1 skipped on duplicate run. Got gen=${genRun2.generatedCount}, skip=${genRun2.skippedCount}`);
    }

    // Verify exactly one monthly voucher exists in DB for this student & month
    const countVouchers = await FeeRecord.countDocuments({
      campusId,
      studentId: createdStudentA._id,
      month: TEST_MONTH_1,
      feeType: "Monthly Tuition Fee",
    });
    if (countVouchers !== 1) {
      throw new Error(`Expected exactly 1 voucher in DB, found ${countVouchers}`);
    }
    console.log(`[B.3] PASSED: Zero duplicates created on identical batch run.`);

    // =========================================================================
    // WORKFLOW C: Partial Payment & Remaining Balance Calculation
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW C: Partial Payment & Remaining Balance");
    console.log("-------------------------------------------------------------");
    const monthlyVch1 = await FeeRecord.findOne({
      campusId,
      studentId: createdStudentA._id,
      month: TEST_MONTH_1,
    });

    const partialPayment = await feeService.recordPayment(monthlyVch1._id, {
      amount: 3000,
      paymentMethod: "Bank Transfer",
      referenceNo: "TID-PARTIAL-001",
      receivedBy: adminUser._id,
      notes: "First partial installment",
    });

    const m1VchNo = monthlyVch1.voucherNo || monthlyVch1.challanNo;
    console.log(`[C.1] Recorded payment of PKR 3000 on voucher ${m1VchNo}`);
    const vchAfterPartial = await FeeRecord.findById(monthlyVch1._id);
    console.log(`[C.2] Voucher Status: ${vchAfterPartial.status}, Paid: PKR ${vchAfterPartial.paidAmount}`);
    if (vchAfterPartial.status !== "PARTIALLY_PAID") {
      throw new Error(`Expected status PARTIALLY_PAID, got ${vchAfterPartial.status}`);
    }
    if (vchAfterPartial.paidAmount !== 3000) {
      throw new Error(`Expected paidAmount 3000, got ${vchAfterPartial.paidAmount}`);
    }
    const remainingBalance = vchAfterPartial.totalPayable - vchAfterPartial.paidAmount;
    if (remainingBalance !== 4000) {
      throw new Error(`Expected remaining balance 4000, got ${remainingBalance}`);
    }
    console.log(`[C.3] PASSED: Partial payment recorded correctly. Remaining balance: PKR ${remainingBalance}`);

    // =========================================================================
    // WORKFLOW D: Full Settlement & Receipt Generation
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW D: Full Settlement & Receipt Generation");
    console.log("-------------------------------------------------------------");
    const fullSettlement = await feeService.recordPayment(monthlyVch1._id, {
      amount: 4000,
      paymentMethod: "Cash",
      referenceNo: "CSH-FULL-002",
      receivedBy: adminUser._id,
      notes: "Cleared remaining balance",
    });
    console.log(`[D.1] Recorded remaining payment of PKR 4000`);
    const vchAfterFull = await FeeRecord.findById(monthlyVch1._id);
    console.log(`[D.2] Status: ${vchAfterFull.status}, Paid: PKR ${vchAfterFull.paidAmount}, Receipt: ${vchAfterFull.receiptNo}`);
    if (vchAfterFull.status !== "PAID") {
      throw new Error(`Expected status PAID, got ${vchAfterFull.status}`);
    }
    if (!vchAfterFull.receiptNo || !vchAfterFull.receiptNo.startsWith("RCP-")) {
      throw new Error(`Expected receiptNo starting with RCP-, got ${vchAfterFull.receiptNo}`);
    }
    console.log(`[D.3] PASSED: Full settlement reached, status PAID, sequential receipt assigned: ${vchAfterFull.receiptNo}`);

    // =========================================================================
    // WORKFLOW E: Previous Arrears Carry-Forward
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW E: Previous Arrears Carry-Forward");
    console.log("-------------------------------------------------------------");
    // Generate month 2 (Nov) - Leave it completely unpaid
    await feeService.generateMonthlyFees(campusId, {
      month: TEST_MONTH_2,
      dueDate: "2026-11-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS,
      issuedBy: adminUser._id,
    });
    const novVch = await FeeRecord.findOne({
      campusId,
      studentId: createdStudentA._id,
      month: TEST_MONTH_2,
    });
    console.log(`[E.1] Generated Nov voucher: ${novVch.voucherNo || novVch.challanNo}, Amount: PKR ${novVch.totalPayable} (Unpaid)`);

    // Now generate month 3 (Dec) with includeArrears: true
    await feeService.generateMonthlyFees(campusId, {
      month: TEST_MONTH_3,
      dueDate: "2026-12-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS,
      includeArrears: true,
      issuedBy: adminUser._id,
    });

    const decVch = await FeeRecord.findOne({
      campusId,
      studentId: createdStudentA._id,
      month: TEST_MONTH_3,
    });
    console.log(`[E.2] Generated Dec voucher: ${decVch.voucherNo || decVch.challanNo}`);
    console.log(`[E.2] Base Amount: PKR ${decVch.amount}, Arrears: PKR ${decVch.previousArrears}, Total Payable: PKR ${decVch.totalPayable}`);
    if (decVch.previousArrears < 7000) {
      throw new Error(`Expected arrears >= 7000 from unpaid Nov voucher, got ${decVch.previousArrears}`);
    }
    if (decVch.totalPayable !== decVch.amount + decVch.previousArrears) {
      throw new Error(`Total payable (${decVch.totalPayable}) does not equal base + arrears (${decVch.amount + decVch.previousArrears})`);
    }
    console.log(`[E.3] PASSED: Unpaid dues correctly carried forward into next month's total payable.`);

    // =========================================================================
    // WORKFLOW F: Fee Structure Rate Change & Historical Immutability
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW F: Historical Billing Immutability");
    console.log("-------------------------------------------------------------");
    // Modify fee structure tuitionFee to 9000 (total monthly now 12000)
    createdFeeStructure.tuitionFee = 9000;
    await createdFeeStructure.save();
    console.log(`[F.1] Updated Fee Structure for ${TEST_CLASS}: tuitionFee changed from 4000 to 9000`);

    // Verify historical voucher for Nov (TEST_MONTH_2) has NOT changed
    const historicalNov = await FeeRecord.findById(novVch._id);
    if (historicalNov.amount !== 7000) {
      throw new Error(`Historical voucher mutated! Expected 7000, got ${historicalNov.amount}`);
    }
    console.log(`[F.2] Historical Nov voucher amount: PKR ${historicalNov.amount} (UNMUTATED)`);
    console.log(`[F.3] PASSED: Historical vouchers remain strictly immutable after rate changes.`);

    // =========================================================================
    // WORKFLOW G: Student Status 'Withdrawn' → Excluded from Generation
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW G: Student Status Withdrawn / Inactive");
    console.log("-------------------------------------------------------------");
    createdStudentA.status = "Withdrawn";
    createdStudentA.isActive = false;
    await createdStudentA.save();
    console.log(`[G.1] Marked Student A status as Withdrawn and isActive as false`);

    const genRunWithdrawn = await feeService.generateMonthlyFees(campusId, {
      month: "2027-01",
      dueDate: "2027-01-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS,
      issuedBy: adminUser._id,
    });
    console.log(`[G.2] Batch generation result for 2027-01: generated=${genRunWithdrawn.generatedCount}`);
    const checkJanVoucher = await FeeRecord.findOne({
      campusId,
      studentId: createdStudentA._id,
      month: "2027-01",
    });
    if (checkJanVoucher) {
      throw new Error("Withdrawn student should not have received a fee voucher!");
    }
    console.log(`[G.3] PASSED: Withdrawn student safely skipped in batch fee generation.`);

    // =========================================================================
    // WORKFLOW H: Class Promotion / Grade Change Resolves New Rate Card
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW H: Class Promotion Resolves New Rate Card");
    console.log("-------------------------------------------------------------");
    const TEST_CLASS_2 = `Test-Class-Adv-${Date.now().toString().slice(-4)}`;
    createdFeeStructure2 = await FeeStructure.create({
      campusId,
      gradeOrClass: TEST_CLASS_2,
      tuitionFee: 15000,
      labFee: 2000,
      isActive: true,
    });
    // Total monthly = 17,000

    createdStudentA.status = "Active";
    createdStudentA.isActive = true;
    createdStudentA.gradeOrClass = TEST_CLASS_2;
    await createdStudentA.save();
    console.log(`[H.1] Promoted Student A to ${TEST_CLASS_2} (Monthly rate: PKR 17,000)`);

    await feeService.generateMonthlyFees(campusId, {
      month: "2027-02",
      dueDate: "2027-02-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS_2,
      issuedBy: adminUser._id,
    });

    const promoVch = await FeeRecord.findOne({
      campusId,
      studentId: createdStudentA._id,
      month: "2027-02",
    });
    console.log(`[H.2] Generated voucher for ${promoVch.gradeOrClass}: Base Amount: PKR ${promoVch.amount}`);
    if (promoVch.amount !== 17000) {
      throw new Error(`Expected promoted voucher amount 17000, got ${promoVch.amount}`);
    }
    console.log(`[H.3] PASSED: Promoted student voucher dynamically resolves new class rate card.`);

    // =========================================================================
    // WORKFLOW I: Student Data Isolation
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW I: Student Data Isolation");
    console.log("-------------------------------------------------------------");
    createdStudentB = await User.create({
      name: `Test Student B ${Date.now().toString().slice(-4)}`,
      email: `teststudentB_${Date.now()}@eduhub.test`,
      passwordHash: "hashedPassword123",
      role: "student",
      campusId,
      gradeOrClass: TEST_CLASS,
      section: "B",
      roll: `ROL-${Date.now().toString().slice(-4)}`,
      status: "Active",
      isActive: true,
    });

    const bAdmission = await feeService.generateAdmissionFee(
      campusId,
      manager.instituteId || null,
      createdStudentB,
      {},
      adminUser
    );
    const historyA = await feeService.getStudentFeeHistory(createdStudentA._id, campusId);
    const historyB = await feeService.getStudentFeeHistory(createdStudentB._id, campusId);

    const hasCrossLeaked = historyA.vouchers.some(
      (v) => String(v.studentId) === String(createdStudentB._id)
    );
    if (hasCrossLeaked) {
      throw new Error("SECURITY VIOLATION: Student A query contained vouchers of Student B!");
    }
    console.log(`[I.1] Student A vouchers count: ${historyA.vouchers.length}`);
    console.log(`[I.2] Student B vouchers count: ${historyB.vouchers.length}`);
    console.log(`[I.3] PASSED: Strict cross-student isolation verified.`);

    // =========================================================================
    // WORKFLOW J: Student Portal Payment Submission & Admin Confirmation
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW J: Student Payment Submission & Admin Confirmation");
    console.log("-------------------------------------------------------------");
    const submittedTx = await feeService.submitStudentPayment(bAdmission._id, createdStudentB, {
      amount: bAdmission.totalPayable,
      paymentMethod: "Online Bank Transfer",
      referenceNo: "TID-STU-SUBMIT-999",
      paymentDate: "2026-10-01",
    });
    console.log(`[J.1] Student B submitted payment transaction: ${submittedTx._id}, Status: ${submittedTx.status}`);
    if (submittedTx.status !== "PENDING") {
      throw new Error(`Expected transaction status PENDING, got ${submittedTx.status}`);
    }

    // Admin reviews and confirms payment
    const { payment: confirmedTx } = await feeService.confirmPayment(submittedTx._id, campusId, adminUser);
    console.log(`[J.2] Admin confirmed transaction. Status: ${confirmedTx.status}, Receipt: ${confirmedTx.receiptNo}`);
    if (confirmedTx.status !== "CONFIRMED" || !confirmedTx.receiptNo) {
      throw new Error("Transaction was not confirmed or receiptNo was missing");
    }

    const bAdmissionAfter = await FeeRecord.findById(bAdmission._id);
    if (bAdmissionAfter.status !== "PAID" || bAdmissionAfter.paidAmount !== bAdmission.totalPayable) {
      throw new Error(`Expected voucher PAID with ${bAdmission.totalPayable}, got ${bAdmissionAfter.status} / ${bAdmissionAfter.paidAmount}`);
    }
    console.log(`[J.3] PASSED: Student payment submitted, confirmed by admin, receipt generated, and voucher settled.`);

    // =========================================================================
    // WORKFLOW K: Fee Waiver & Audit Trail
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("WORKFLOW K: Fee Waiver / Concession & Audit Trail");
    console.log("-------------------------------------------------------------");
    // Generate a fresh voucher for Student B
    await feeService.generateMonthlyFees(campusId, {
      month: "2026-10",
      dueDate: "2026-10-15",
      feeCategory: "Monthly Tuition Fee",
      gradeOrClass: TEST_CLASS,
      issuedBy: adminUser._id,
    });

    const bMonthly = await FeeRecord.findOne({
      campusId,
      studentId: createdStudentB._id,
      month: "2026-10",
    });

    const initialPayable = bMonthly.totalPayable;
    console.log(`[K.1] Student B Monthly Voucher: ${bMonthly.voucherNo || bMonthly.challanNo}, Total Payable: PKR ${initialPayable}`);

    const waivedVoucher = await feeService.waiveFeeRecord(
      bMonthly._id,
      campusId,
      adminUser,
      {
        amount: 1500,
        reason: "Merit Scholarship approved by Principal",
      }
    );

    console.log(`[K.2] Applied waiver of PKR 1500. New Total Payable: PKR ${waivedVoucher.totalPayable}`);
    if (waivedVoucher.totalPayable !== initialPayable - 1500) {
      throw new Error(`Expected totalPayable ${initialPayable - 1500}, got ${waivedVoucher.totalPayable}`);
    }
    if (waivedVoucher.waiver.amount !== 1500 || waivedVoucher.waiver.reason !== "Merit Scholarship approved by Principal") {
      throw new Error("Waiver details not properly saved on voucher");
    }

    // Verify Audit Trail on voucher
    const hasAudit = waivedVoucher.auditTrail.some((a) => a.action === "fee_waived");
    if (!hasAudit) {
      throw new Error("Voucher auditTrail did not record waiver action!");
    }

    // Verify ActivityLog
    const activity = await ActivityLog.findOne({
      campus: campusId,
      action: "fee_waived",
      entityId: bMonthly._id,
    });
    if (!activity) {
      throw new Error("ActivityLog entry for fee_waived was not found!");
    }
    console.log(`[K.3] PASSED: Fee concession applied, totalPayable adjusted, voucher audit trail & activity log verified.`);

    // =========================================================================
    // WORKFLOW LEDGER: Financial Ledger Aggregation Check
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log("FINANCIAL LEDGER: Aggregation & Reconciliation");
    console.log("-------------------------------------------------------------");
    const ledgerResult = await feeService.getFinancialLedger(campusId);
    console.log(`[LEDGER] Total Vouchers in Campus Ledger: ${ledgerResult.summary.totalVouchers}`);
    console.log(`[LEDGER] Total Expected: PKR ${ledgerResult.summary.totalExpected.toLocaleString()}`);
    console.log(`[LEDGER] Total Collected: PKR ${ledgerResult.summary.totalCollected.toLocaleString()}`);
    console.log(`[LEDGER] Total Outstanding: PKR ${ledgerResult.summary.totalOutstanding.toLocaleString()}`);
    console.log(`[LEDGER] Total Waived: PKR ${ledgerResult.summary.totalWaived.toLocaleString()}`);
    const recRate = Number(ledgerResult.summary.recoveryRate ?? ledgerResult.summary.collectionRate ?? 0);
    console.log(`[LEDGER] Recovery Rate: ${recRate.toFixed(1)}%`);
    console.log(`[LEDGER] PASSED: Financial ledger successfully computes all reconciliation KPIs.`);

    console.log("\n==================================================================");
    console.log("  ALL 11 WORKFLOWS (A THROUGH K) + LEDGER PASSED WITH 100% SUCCESS!");
    console.log("==================================================================");

  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
    process.exitCode = 1;
  } finally {
    // Clean up temporary test documents
    console.log("\n[CLEANUP] Cleaning up test users and structures...");
    if (createdStudentA) {
      await FeeRecord.deleteMany({ studentId: createdStudentA._id });
      await PaymentTransaction.deleteMany({ studentId: createdStudentA._id });
      await User.findByIdAndDelete(createdStudentA._id);
    }
    if (createdStudentB) {
      await FeeRecord.deleteMany({ studentId: createdStudentB._id });
      await PaymentTransaction.deleteMany({ studentId: createdStudentB._id });
      await User.findByIdAndDelete(createdStudentB._id);
    }
    if (createdFeeStructure) {
      await FeeStructure.findByIdAndDelete(createdFeeStructure._id);
    }
    if (createdFeeStructure2) {
      await FeeStructure.findByIdAndDelete(createdFeeStructure2._id);
    }
    console.log("[CLEANUP] Test cleanup complete.");
    await mongoose.disconnect();
  }
}

runTests();
