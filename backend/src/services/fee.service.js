import mongoose from "mongoose";
import { FeeRecord } from "../models/profile.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import User from "../models/user.model.js";
import Alert from "../models/alert.model.js";
import ActivityLog, { logActivity } from "../models/activityLog.model.js";
import AuditLog from "../models/auditLog.model.js";

class FeeService {
  /**
   * Helper: Generate standardized unique voucher numbers
   */
  generateChallanNo(prefix = "VCH") {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${yearMonth}-${rand}`;
  }

  /**
   * Helper: Generate standardized unique official receipt numbers
   */
  generateReceiptNo() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RCP-${yearMonth}-${rand}`;
  }

  /**
   * Safe Idempotent Monthly Fee Generation
   */
  async generateMonthlyFees(campusId, instituteId, options = {}, adminUser = null) {
    if (instituteId && typeof instituteId === "object" && !mongoose.Types.ObjectId.isValid(instituteId)) {
      adminUser = options;
      options = instituteId;
      instituteId = null;
    }
    const month = options.month || new Date().toISOString().slice(0, 7);
    const dueDate = options.dueDate
      ? new Date(options.dueDate)
      : new Date(Date.now() + 14 * 86400000);
    const feeCategory = (options.feeCategory || "Monthly Tuition Fee").trim();
    const description = options.description || `Regular Monthly Tuition Fee and Composite Dues for ${month}`;
    const targetGrade = options.gradeOrClass && options.gradeOrClass !== "all" ? options.gradeOrClass.trim() : null;
    const defaultAmount = Number(options.defaultAmount) || 5000;
    const includeArrears = options.includeArrears !== false;

    // 1. Fetch eligible students (Active students only)
    const studentQuery = {
      campusId,
      role: "student",
      isActive: { $ne: false },
      status: { $in: ["Active", "active"] },
    };

    if (targetGrade) {
      studentQuery.$or = [
        { gradeOrClass: new RegExp(`^${targetGrade}$`, "i") },
        { program: new RegExp(`^${targetGrade}$`, "i") },
      ];
    }

    const students = await User.find(studentQuery).lean();
    if (!students.length) {
      return {
        generatedCount: 0,
        skippedCount: 0,
        totalEligible: 0,
        message: "No active eligible students found for the selected grade/criteria.",
        records: [],
      };
    }

    // 2. Fetch Fee Structures for campus
    const feeStructures = await FeeStructure.find({ campusId, isActive: { $ne: false } }).lean();
    const structureMap = new Map(
      feeStructures.map((fs) => [(fs.gradeOrClass || "").trim().toLowerCase(), fs])
    );

    // 3. Find existing fee records for this month & feeCategory to guarantee idempotency
    const existingRecords = await FeeRecord.find({
      campusId,
      month,
      feeType: new RegExp(`^${feeCategory}$`, "i"),
      "omitted.isOmitted": { $ne: true },
    }).select("studentId").lean();

    const billedStudentIds = new Set(existingRecords.map((r) => String(r.studentId)));

    // 4. Calculate previous arrears for unbilled students
    const unbilledStudents = students.filter((s) => !billedStudentIds.has(String(s._id)));
    const unbilledStudentIds = unbilledStudents.map((s) => s._id);

    // Find all outstanding vouchers for these students
    const pastUnpaidVouchers = await FeeRecord.find({
      campusId,
      studentId: { $in: unbilledStudentIds },
      status: { $in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE", "pending", "overdue"] },
      month: { $ne: month },
      "omitted.isOmitted": { $ne: true },
    }).lean();

    // Map studentId -> total unpaid arrears
    const arrearsMap = new Map();
    if (includeArrears) {
      for (const v of pastUnpaidVouchers) {
        const sid = String(v.studentId);
        const rem = Math.max(0, (v.amount || 0) - (v.paidAmount || 0));
        arrearsMap.set(sid, (arrearsMap.get(sid) || 0) + rem);
      }
    }

    // 5. Generate vouchers
    const toCreate = [];
    let skippedCount = billedStudentIds.size;

    for (const student of students) {
      const studentIdStr = String(student._id);
      if (billedStudentIds.has(studentIdStr)) {
        continue;
      }

      const studentGrade = (student.gradeOrClass || student.program || "").trim().toLowerCase();
      const matchedStructure = structureMap.get(studentGrade);

      let amount = defaultAmount;
      let breakdown = [{ title: feeCategory, amount: defaultAmount }];

      if (student.baseFee && student.baseFee > 0) {
        amount = student.baseFee;
        breakdown = [{ title: "Monthly Tuition Fee", amount: student.baseFee }];
      } else if (matchedStructure) {
        const tuition = Number(matchedStructure.tuitionFee || 0);
        const lab = Number(matchedStructure.labFee || 0);
        const computer = Number(matchedStructure.computerFee || 0);
        const library = Number(matchedStructure.libraryFee || 0);
        const sports = Number(matchedStructure.sportsFee || 0);
        const exam = Number(matchedStructure.examFee || 0);
        const other = Number(matchedStructure.otherFee || 0);
        const total = tuition + lab + computer + library + sports + exam + other;

        if (total > 0) {
          amount = total;
          breakdown = [];
          if (tuition > 0) breakdown.push({ title: "Tuition Fee", amount: tuition });
          if (lab > 0) breakdown.push({ title: "Laboratory Access Fund", amount: lab });
          if (computer > 0) breakdown.push({ title: "Computer Lab & ICT", amount: computer });
          if (library > 0) breakdown.push({ title: "Library & E-Resources", amount: library });
          if (sports > 0) breakdown.push({ title: "Sports & Physical Fund", amount: sports });
          if (exam > 0) breakdown.push({ title: "Examination Dues", amount: exam });
          if (other > 0) breakdown.push({ title: "General Services & Utility", amount: other });
        }
      }

      const arrears = arrearsMap.get(studentIdStr) || 0;
      const totalPayable = amount + arrears;
      const challanNo = this.generateChallanNo("VCH");
      const semester = student.gradeOrClass || student.program || month;

      toCreate.push({
        campusId,
        instituteId: instituteId || null,
        studentId: student._id,
        feeType: feeCategory,
        challanNo,
        month,
        semester,
        gradeOrClass: student.gradeOrClass || student.program || "",
        academicSession: options.academicSession || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        amount,
        paidAmount: 0,
        previousArrears: arrears,
        totalPayable,
        dueDate,
        paymentDate: null,
        status: "UNPAID",
        description: matchedStructure?.description || description,
        notes: matchedStructure?.description || description,
        breakdown,
        auditTrail: [
          {
            action: "generated",
            performedBy: adminUser?._id || null,
            timestamp: new Date(),
            details: `Monthly fee voucher generated for ${month}. Amount: Rs ${amount}. Previous Arrears: Rs ${arrears}.`,
          },
        ],
      });
    }

    let createdRecords = [];
    if (toCreate.length > 0) {
      const created = await FeeRecord.insertMany(toCreate);
      const createdIds = created.map((c) => c._id);
      createdRecords = await FeeRecord.find({ _id: { $in: createdIds } })
        .populate("studentId", "name roll email program gradeOrClass section guardian guardianPhone")
        .sort({ createdAt: -1 });

      // Create student in-app alerts
      try {
        const alerts = unbilledStudents.map((s) => ({
          instituteId: instituteId || s.instituteId,
          campusId,
          audience: "student",
          severity: "Info",
          title: `Fee Voucher Issued: ${feeCategory} (${month})`,
          message: `Your fee voucher for ${month} of PKR ${amount} has been issued. Due date is ${dueDate.toISOString().slice(0, 10)}.`,
          createdBy: adminUser?._id || null,
        }));
        await Alert.insertMany(alerts).catch(() => {});
      } catch (err) {
        // Non-blocking notification error
      }

      // Log activity
      logActivity({
        campus: campusId,
        action: "fee_generated",
        category: "fees",
        title: "Monthly Fees Generated",
        description: `Generated ${toCreate.length} vouchers for ${month} (${targetGrade || "All Classes"}). Skipped ${skippedCount} already billed.`,
        entityType: "fee",
        performedBy: adminUser?._id || null,
        metadata: { month, count: toCreate.length, targetGrade },
      });
    }

    return {
      generatedCount: toCreate.length,
      skippedCount,
      totalEligible: students.length,
      records: createdRecords,
    };
  }

  /**
   * Admission Fee Generation upon Student Admission
   */
  async generateAdmissionFee(campusId, instituteId, student, options = {}, adminUser = null) {
    // Check if called as (campusId, student, adminUser)
    if (instituteId && (instituteId.role === "student" || (!student && instituteId._id))) {
      adminUser = options;
      options = typeof student === "object" ? student : {};
      student = instituteId;
      instituteId = null;
    }
    if (student && (typeof student === "string" || mongoose.Types.ObjectId.isValid(student)) && !student.gradeOrClass) {
      student = await User.findById(student).lean();
    }
    if (!student || !student._id) return null;

    // Check if admission voucher already exists
    const existing = await FeeRecord.findOne({
      campusId,
      studentId: student._id,
      isAdmissionFee: true,
    });
    if (existing) return existing;

    const studentGrade = (student.gradeOrClass || student.program || "").trim().toLowerCase();
    const feeStructure = await FeeStructure.findOne({
      campusId,
      gradeOrClass: new RegExp(`^${studentGrade}$`, "i"),
    }).lean();

    const admissionAmount = Number(options.admissionFee || feeStructure?.admissionFee || 0);
    const tuitionAmount = Number(student.baseFee || feeStructure?.tuitionFee || 0);
    const totalAmount = admissionAmount + tuitionAmount;

    if (totalAmount <= 0) return null;

    const breakdown = [];
    if (admissionAmount > 0) breakdown.push({ title: "Admission Registration Fee", amount: admissionAmount });
    if (tuitionAmount > 0) breakdown.push({ title: "First Month Tuition Fee", amount: tuitionAmount });

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dueDate = options.dueDate ? new Date(options.dueDate) : new Date(Date.now() + 10 * 86400000);
    const challanNo = this.generateChallanNo("ADM");

    const record = await FeeRecord.create({
      campusId,
      instituteId: instituteId || null,
      studentId: student._id,
      feeType: "Admission & Composite Fee",
      challanNo,
      month,
      semester: student.gradeOrClass || student.program || "New Admission",
      gradeOrClass: student.gradeOrClass || student.program || "",
      academicSession: options.academicSession || `${now.getFullYear()}-${now.getFullYear() + 1}`,
      isAdmissionFee: true,
      amount: totalAmount,
      paidAmount: 0,
      previousArrears: 0,
      totalPayable: totalAmount,
      dueDate,
      paymentDate: null,
      status: "UNPAID",
      description: `Admission and enrollment dues for ${student.name}`,
      notes: "Official Admission Voucher",
      breakdown,
      auditTrail: [
        {
          action: "created",
          performedBy: adminUser?._id || null,
          timestamp: new Date(),
          details: `Admission voucher generated upon student registration. Amount: Rs ${totalAmount}`,
        },
      ],
    });

    logActivity({
      campus: campusId,
      action: "fee_created",
      category: "fees",
      title: "Admission Fee Voucher Created",
      description: `Admission fee of Rs ${totalAmount} generated for ${student.name}`,
      entityType: "fee",
      entityId: record._id,
      performedBy: adminUser?._id || null,
      metadata: { studentName: student.name, amount: totalAmount },
    });

    return record;
  }

  /**
   * Record Payment (Counter / Admin or direct collection)
   * Supports partial and full payment with receipt generation.
   */
  async recordPayment(feeRecordId, campusId, instituteId, data, actor = null) {
    if (campusId && typeof campusId === "object" && !mongoose.Types.ObjectId.isValid(campusId)) {
      actor = instituteId;
      data = campusId;
      campusId = null;
      instituteId = null;
    }
    const query = { _id: feeRecordId };
    if (campusId) query.campusId = campusId;
    const feeRecord = await FeeRecord.findOne(query);
    if (!feeRecord) throw new Error("Fee record not found.");

    campusId = campusId || feeRecord.campusId;
    instituteId = instituteId || feeRecord.instituteId;

    const amount = Number(data.amount || 0);
    if (amount <= 0) throw new Error("Payment amount must be greater than zero.");

    const effectiveTotal = feeRecord.totalPayable > 0 ? feeRecord.totalPayable : feeRecord.amount;
    const remaining = Math.max(0, effectiveTotal - (feeRecord.paidAmount || 0));

    if (amount > remaining) {
      throw new Error(`Payment amount (${amount}) exceeds remaining balance (${remaining}).`);
    }

    const receiptNo = data.receiptNo || this.generateReceiptNo();
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

    const payment = await PaymentTransaction.create({
      feeRecordId,
      studentId: feeRecord.studentId,
      campusId,
      instituteId: instituteId || feeRecord.instituteId,
      amount,
      paymentDate,
      paymentMethod: data.paymentMethod || "Cash",
      referenceNo: data.referenceNo || "",
      receiptNo,
      receiptUrl: data.receiptUrl || "",
      status: "CONFIRMED",
      submittedBy: actor?._id || data.submittedBy || null,
      confirmedBy: actor?._id || data.submittedBy || null,
      confirmationDate: new Date(),
      notes: data.notes || "Payment received at counter",
    });

    // Update fee record status
    await this.updateFeeRecordStatus(feeRecordId, campusId, receiptNo, actor);

    return {
      payment,
      feeRecord: await FeeRecord.findById(feeRecordId).populate(
        "studentId",
        "name roll email program gradeOrClass section"
      ),
    };
  }

  /**
   * Student portal submits payment proof
   */
  async submitStudentPayment(feeRecordId, studentUser, data) {
    const feeRecord = await FeeRecord.findOne({
      _id: feeRecordId,
      campusId: studentUser.campusId,
      studentId: studentUser._id,
    });
    if (!feeRecord) throw new Error("Fee record not found.");

    const amount = Number(data.amount || 0);
    if (amount <= 0) throw new Error("Payment amount must be greater than zero.");

    const effectiveTotal = feeRecord.totalPayable > 0 ? feeRecord.totalPayable : feeRecord.amount;
    const remaining = Math.max(0, effectiveTotal - (feeRecord.paidAmount || 0));

    if (amount > remaining) {
      throw new Error(`Payment amount (${amount}) exceeds remaining balance (${remaining}).`);
    }

    const payment = await PaymentTransaction.create({
      feeRecordId: feeRecord._id,
      studentId: studentUser._id,
      campusId: studentUser.campusId,
      instituteId: studentUser.instituteId || null,
      amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paymentMethod: data.paymentMethod || "Bank Transfer",
      referenceNo: data.referenceNo || "",
      receiptUrl: data.receiptUrl || "",
      status: "PENDING",
      submittedBy: studentUser._id,
      notes: data.notes || "Submitted by student via portal",
    });

    // Append to feeRecord audit trail
    feeRecord.auditTrail.push({
      action: "payment_submitted",
      performedBy: studentUser._id,
      timestamp: new Date(),
      details: `Student submitted payment proof of Rs ${amount} via ${data.paymentMethod || "Bank Transfer"}. Ref: ${data.referenceNo || "N/A"}.`,
    });
    await feeRecord.save();

    return payment;
  }

  /**
   * Admin confirms student payment proof
   */
  async confirmPayment(paymentId, campusId, adminUser, notes = "") {
    const payment = await PaymentTransaction.findOne({ _id: paymentId, campusId });
    if (!payment) throw new Error("Payment transaction not found.");
    if (payment.status !== "PENDING") throw new Error(`Payment is already ${payment.status}.`);

    const feeRecord = await FeeRecord.findOne({ _id: payment.feeRecordId, campusId });
    if (!feeRecord) throw new Error("Associated fee record not found.");

    const effectiveTotal = feeRecord.totalPayable > 0 ? feeRecord.totalPayable : feeRecord.amount;
    const remaining = Math.max(0, effectiveTotal - (feeRecord.paidAmount || 0));

    if (payment.amount > remaining) {
      throw new Error(`Payment amount (${payment.amount}) exceeds remaining balance (${remaining}).`);
    }

    const receiptNo = this.generateReceiptNo();
    payment.status = "CONFIRMED";
    payment.receiptNo = receiptNo;
    payment.confirmedBy = adminUser._id;
    payment.confirmationDate = new Date();
    if (notes) payment.notes = notes;
    await payment.save();

    const updatedRecord = await this.updateFeeRecordStatus(payment.feeRecordId, campusId, receiptNo, adminUser);

    // Notify student
    try {
      await Alert.create({
        instituteId: feeRecord.instituteId,
        campusId,
        audience: "student",
        severity: "Info",
        title: `Payment Confirmed: ${feeRecord.challanNo}`,
        message: `Your payment of PKR ${payment.amount} has been confirmed. Receipt No: ${receiptNo}.`,
        createdBy: adminUser._id,
      });
    } catch {}

    // Audit log
    await AuditLog.create({
      campusId,
      entityType: "PaymentTransaction",
      entityId: payment._id,
      action: "confirmed",
      performedBy: {
        userId: adminUser._id,
        name: adminUser.name || "Admin",
        email: adminUser.email || "",
        role: adminUser.role || "campus_admin",
      },
      reason: notes || "Payment confirmed by finance admin",
      metadata: { receiptNo, amount: payment.amount, feeRecordId: feeRecord._id },
    }).catch(() => {});

    return { payment, feeRecord: updatedRecord };
  }

  /**
   * Admin rejects student payment proof
   */
  async rejectPayment(paymentId, campusId, adminUser, reason = "") {
    const payment = await PaymentTransaction.findOne({ _id: paymentId, campusId });
    if (!payment) throw new Error("Payment transaction not found.");
    if (payment.status !== "PENDING") throw new Error(`Payment is already ${payment.status}.`);

    payment.status = "REJECTED";
    payment.rejectionReason = reason || "Payment verification failed.";
    payment.confirmedBy = adminUser._id;
    payment.confirmationDate = new Date();
    await payment.save();

    const feeRecord = await FeeRecord.findOne({ _id: payment.feeRecordId, campusId });
    if (feeRecord) {
      feeRecord.auditTrail.push({
        action: "payment_rejected",
        performedBy: adminUser._id,
        timestamp: new Date(),
        details: `Payment submission of Rs ${payment.amount} rejected. Reason: ${reason || "Verification failed"}`,
      });
      await feeRecord.save();

      // Notify student
      try {
        await Alert.create({
          instituteId: feeRecord.instituteId,
          campusId,
          audience: "student",
          severity: "Warning",
          title: `Payment Rejected: ${feeRecord.challanNo}`,
          message: `Your payment submission of PKR ${payment.amount} was rejected. Reason: ${reason || "Verification failed"}. Please re-submit valid proof.`,
          createdBy: adminUser._id,
        });
      } catch {}
    }

    return { payment, feeRecord };
  }

  /**
   * Internal status updater for FeeRecord
   */
  async updateFeeRecordStatus(feeRecordId, campusId, receiptNo = "", actor = null) {
    const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, campusId });
    if (!feeRecord) return null;

    const confirmedPayments = await PaymentTransaction.find({
      feeRecordId,
      campusId,
      status: "CONFIRMED",
    });

    const totalPaid = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    feeRecord.paidAmount = totalPaid;
    if (receiptNo) feeRecord.receiptNo = receiptNo;

    const effectiveTotal = feeRecord.totalPayable > 0 ? feeRecord.totalPayable : feeRecord.amount;

    const prevStatus = feeRecord.status;
    if (totalPaid >= effectiveTotal && effectiveTotal > 0) {
      feeRecord.status = "PAID";
      feeRecord.paymentDate = new Date();
    } else if (totalPaid > 0) {
      feeRecord.status = "PARTIALLY_PAID";
    } else {
      feeRecord.status = new Date() > feeRecord.dueDate ? "OVERDUE" : "UNPAID";
    }

    feeRecord.auditTrail.push({
      action: "status_updated",
      performedBy: actor?._id || null,
      timestamp: new Date(),
      details: `Paid amount updated to Rs ${totalPaid}. Status changed from ${prevStatus} to ${feeRecord.status}.`,
      previousValue: { status: prevStatus },
      newValue: { status: feeRecord.status, paidAmount: totalPaid },
    });

    await feeRecord.save();
    return feeRecord;
  }

  /**
   * Waive Fee Record (Full or Partial Waiver)
   */
  async waiveFeeRecord(id, campusId, adminUser, data = {}) {
    const feeRecord = await FeeRecord.findOne({ _id: id, campusId });
    if (!feeRecord) throw new Error("Fee record not found.");

    const waiverAmount = Number(data.amount || feeRecord.amount - (feeRecord.paidAmount || 0));
    const reason = (data.reason || "").trim();
    if (!reason) throw new Error("A reason is required to waive fee.");

    feeRecord.waiver = {
      amount: waiverAmount,
      reason,
      waivedBy: adminUser._id,
      waivedAt: new Date(),
    };

    const newTotalPayable = Math.max(0, (feeRecord.totalPayable || feeRecord.amount) - waiverAmount);
    feeRecord.totalPayable = newTotalPayable;

    if (newTotalPayable <= (feeRecord.paidAmount || 0)) {
      feeRecord.status = "WAIVED";
    }

    feeRecord.auditTrail.push({
      action: "fee_waived",
      performedBy: adminUser._id,
      timestamp: new Date(),
      details: `Fee voucher waived by Rs ${waiverAmount}. Reason: ${reason}.`,
    });

    await feeRecord.save();

    await ActivityLog.create({
      campus: campusId,
      action: "fee_waived",
      category: "fees",
      title: "Fee Waived",
      description: `Voucher ${feeRecord.challanNo} waived by Rs ${waiverAmount} (${reason})`,
      entityType: "fee",
      entityId: feeRecord._id,
      performedBy: adminUser._id,
    }).catch((err) => console.warn("ActivityLog write warning:", err.message));

    return feeRecord;
  }

  /**
   * Omit Fee Record (Marks as omitted / cancelled)
   */
  async omitFeeRecord(id, campusId, adminUser, reason = "") {
    const feeRecord = await FeeRecord.findOne({ _id: id, campusId });
    if (!feeRecord) throw new Error("Fee record not found.");

    const justification = reason.trim() || "Omitted by administration";

    feeRecord.omitted = {
      isOmitted: true,
      reason: justification,
      omittedBy: adminUser._id,
      omittedAt: new Date(),
    };
    feeRecord.status = "CANCELLED";

    feeRecord.auditTrail.push({
      action: "fee_omitted",
      performedBy: adminUser._id,
      timestamp: new Date(),
      details: `Fee voucher omitted/cancelled. Reason: ${justification}`,
    });

    await feeRecord.save();

    logActivity({
      campus: campusId,
      action: "fee_omitted",
      category: "fees",
      title: "Fee Omitted",
      description: `Voucher ${feeRecord.challanNo} omitted. Reason: ${justification}`,
      entityType: "fee",
      entityId: feeRecord._id,
      performedBy: adminUser._id,
    });

    return feeRecord;
  }

  /**
   * Financial Ledger & Summary Reports
   */
  async getFinancialLedger(campusId, filter = {}) {
    const query = { campusId };

    if (filter.month && filter.month !== "all") query.month = filter.month;
    if (filter.academicSession && filter.academicSession !== "all") query.academicSession = filter.academicSession;
    if (filter.feeType && filter.feeType !== "all") query.feeType = new RegExp(`^${filter.feeType.trim()}$`, "i");

    if (filter.status && filter.status !== "all") {
      const s = filter.status.toLowerCase();
      if (s === "paid") query.status = { $in: ["PAID", "paid"] };
      else if (s === "unpaid") query.status = { $in: ["UNPAID", "pending"] };
      else if (s === "partially_paid") query.status = { $in: ["PARTIALLY_PAID", "partially_paid"] };
      else if (s === "overdue") query.status = { $in: ["OVERDUE", "overdue"] };
      else if (s === "waived") query.status = "WAIVED";
      else query.status = s;
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      const studentMatches = await User.find({
        campusId,
        role: "student",
        $or: [
          { name: new RegExp(q, "i") },
          { roll: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
        ],
      }).select("_id").lean();

      query.$or = [
        { challanNo: new RegExp(q, "i") },
        { receiptNo: new RegExp(q, "i") },
        { feeType: new RegExp(q, "i") },
        { studentId: { $in: studentMatches.map((s) => s._id) } },
      ];
    }

    const records = await FeeRecord.find(query)
      .populate("studentId", "name roll email program gradeOrClass section guardian guardianPhone")
      .sort({ dueDate: 1, createdAt: -1 });

    // Calculate aggregated financial summary metrics
    const allCampusRecords = await FeeRecord.find({ campusId }).lean();
    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalWaived = 0;
    let currentMonthCollected = 0;
    let totalAdmissionFee = 0;

    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const r of allCampusRecords) {
      if (r.omitted?.isOmitted) continue;

      const amt = r.totalPayable > 0 ? r.totalPayable : r.amount || 0;
      const paid = r.paidAmount || 0;
      const rem = Math.max(0, amt - paid);

      totalExpected += amt;
      totalCollected += paid;
      totalOutstanding += rem;

      if (r.month === currentMonth) {
        currentMonthCollected += paid;
      }

      if (r.isAdmissionFee) {
        totalAdmissionFee += paid;
      }

      if (r.waiver?.amount > 0) {
        totalWaived += r.waiver.amount;
      } else if (r.status === "WAIVED") {
        totalWaived += amt;
      }

      if (r.status === "OVERDUE" || (rem > 0 && new Date() > new Date(r.dueDate))) {
        totalOverdue += rem;
      }
    }

    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    const roundedRate = Math.round(collectionRate * 10) / 10;

    return {
      records,
      summary: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        totalWaived,
        currentMonthCollected,
        totalAdmissionFee,
        collectionRate: roundedRate,
        recoveryRate: roundedRate,
        totalVouchers: allCampusRecords.length,
      },
    };
  }

  /**
   * Student Portal: Real-time fee vouchers & payment history
   */
  async getStudentFeeHistory(studentId, campusId) {
    const [vouchers, payments] = await Promise.all([
      FeeRecord.find({ campusId, studentId, "omitted.isOmitted": { $ne: true } })
        .sort({ dueDate: -1, createdAt: -1 })
        .lean(),
      PaymentTransaction.find({ campusId, studentId })
        .populate("feeRecordId", "challanNo feeType month")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    let totalBilled = 0;
    let totalPaid = 0;
    let pendingDues = 0;
    let overdueDues = 0;

    const now = new Date();

    for (const v of vouchers) {
      const amt = v.totalPayable > 0 ? v.totalPayable : v.amount || 0;
      const paid = v.paidAmount || 0;
      const rem = Math.max(0, amt - paid);

      totalBilled += amt;
      totalPaid += paid;
      if (rem > 0) {
        pendingDues += rem;
        if (now > new Date(v.dueDate)) {
          overdueDues += rem;
        }
      }
    }

    return {
      vouchers,
      payments,
      summary: {
        totalBilled,
        totalPaid,
        pendingDues,
        overdueDues,
      },
    };
  }
}

const feeService = new FeeService();
export default feeService;
