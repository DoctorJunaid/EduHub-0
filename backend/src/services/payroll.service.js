import { MonthlyPayroll } from "../models/monthlyPayroll.model.js";
import { TeacherSalaryProfile } from "../models/teacherSalaryProfile.model.js";
import { SalaryPolicy } from "../models/salaryPolicy.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import { TeacherProfile } from "../models/profile.model.js";
import { PayrollAdjustment } from "../models/payrollAdjustment.model.js";
import TeacherClassSession from "../models/teacherClassSession.model.js";
import moment from "moment";
import PDFDocument from "pdfkit";

/**
 * Generate monthly payroll for all teachers in a campus.
 * PAY-02: Only upserts if existing record status === "Draft" (or new).
 */
export const generatePayroll = async (campusId, userId, { month }) => {
  // month = "2026-09"
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  // Date range for the month
  const startDate = moment(`${month}-01`).startOf("month").toDate();
  const endDate = moment(`${month}-01`).endOf("month").toDate();

  // 1. Load salary policy for this campus (or defaults)
  let policy = await SalaryPolicy.findOne({ campusId }).lean();
  if (!policy) {
    // Use schema defaults
    policy = {
      workingDaysPerMonth: 26,
      unpaidAbsentMultiplier: 1.0,
      unpaidLeaveMultiplier: 1.0,
      halfDayMultiplier: 0.5,
      lateCountForHalfDay: 3,
      lateHalfDayPenalty: 0.5,
      earlyLeaveMultiplier: 0.5,
      substituteBonusPerClass: 500,
      perfectAttendanceBonus: 2000,
      extraClassBonus: 400,
      examDutyBonus: 300,
    };
  }

  // 2. Load all salary profiles for this campus
  const salaryProfiles = await TeacherSalaryProfile.find({ campusId, isActive: true }).lean();
  if (!salaryProfiles.length) {
    return { generated: 0, skipped: 0, message: "No active salary profiles found" };
  }

  let generated = 0;
  let skipped = 0;

  for (const profile of salaryProfiles) {
    const teacherId = profile.teacherProfileId;

    // PAY-02: Check if payroll already exists and is not Draft
    const existing = await MonthlyPayroll.findOne({ teacherProfileId: teacherId, month }).lean();
    if (existing && existing.status !== "Draft") {
      skipped++;
      continue;
    }

    // 3. PAY-04: dailySalary
    const dailySalary = profile.baseSalary / policy.workingDaysPerMonth;

    // 4. Fetch attendance for this teacher for the month
    // NOTE: TeacherAttendance.teacherProfileId refs "User" (not TeacherProfile),
    // so attendance records store the User._id in that field.
    // We fetch the linked User._id from TeacherProfile and query by that.
    const teacherProfile = await TeacherProfile.findById(teacherId).select("user").lean();
    // User._id is the primary key stored in attendance; TeacherProfile._id as fallback
    const attendanceTeacherIds = teacherProfile?.user
      ? [teacherProfile.user, teacherId]
      : [teacherId];

    const attendanceRecords = await TeacherAttendance.find({
      campusId,
      teacherProfileId: { $in: attendanceTeacherIds },
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Compare case-insensitively to handle both "Present" and "present" enum values
    const presentDays = attendanceRecords.filter((a) => a.status?.toLowerCase() === "present").length;
    const absentDays = attendanceRecords.filter((a) => a.status?.toLowerCase() === "absent").length;
    const lateCount = attendanceRecords.filter((a) => a.status?.toLowerCase() === "late").length;
    const leaveDays = attendanceRecords.filter((a) => a.status?.toLowerCase() === "on leave").length;

    // 5. Fetch substitute duties where this teacher WAS the substitute
    const subDuties = await SubstituteAssignment.find({
      campusId,
      substituteTeacherId: teacherId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ["Assigned", "Completed"] },
    }).lean();

    const substituteDuties = subDuties.length;

    // 6. Build attendance summary snapshot
    const attendanceSummary = {
      totalWorkingDays: policy.workingDaysPerMonth,
      presentDays,
      absentDays,
      lateCount,
      leaveDays,
      substituteDuties,
    };

    // 7. Build deduction line items
    const deductions = [];

    // Absent deduction
    if (absentDays > 0) {
      const amount = absentDays * dailySalary * policy.unpaidAbsentMultiplier;
      deductions.push({
        reason: `${absentDays} absent day(s)`,
        category: "Absent",
        days: absentDays,
        rate: dailySalary * policy.unpaidAbsentMultiplier,
        amount: Math.round(amount),
      });
    }

    // Leave deduction
    if (leaveDays > 0) {
      const amount = leaveDays * dailySalary * policy.unpaidLeaveMultiplier;
      deductions.push({
        reason: `${leaveDays} leave day(s)`,
        category: "Leave",
        days: leaveDays,
        rate: dailySalary * policy.unpaidLeaveMultiplier,
        amount: Math.round(amount),
      });
    }

    // Late → half-day penalty
    if (lateCount > 0 && policy.lateCountForHalfDay > 0) {
      const halfDaysFromLate = Math.floor(lateCount / policy.lateCountForHalfDay);
      if (halfDaysFromLate > 0) {
        const amount = halfDaysFromLate * dailySalary * policy.lateHalfDayPenalty;
        deductions.push({
          reason: `${lateCount} late(s) → ${halfDaysFromLate} half-day penalty`,
          category: "Late",
          days: halfDaysFromLate,
          rate: dailySalary * policy.lateHalfDayPenalty,
          amount: Math.round(amount),
        });
      }
    }

    // Tax deduction (from salary profile)
    if (profile.taxDeduction > 0) {
      deductions.push({
        reason: "Tax deduction",
        category: "Tax",
        amount: profile.taxDeduction,
      });
    }

    // Other deduction (from salary profile)
    if (profile.otherDeduction > 0) {
      deductions.push({
        reason: "Other deduction",
        category: "Other",
        amount: profile.otherDeduction,
      });
    }

    // 8. Build bonus line items
    const bonuses = [];

    // Substitute bonus
    if (substituteDuties > 0) {
      const amount = substituteDuties * policy.substituteBonusPerClass;
      bonuses.push({
        reason: `${substituteDuties} substitute class(es)`,
        category: "Substitute",
        count: substituteDuties,
        rate: policy.substituteBonusPerClass,
        amount,
      });
    }

    // Perfect attendance bonus (no absent, no leave, no late)
    if (absentDays === 0 && leaveDays === 0 && lateCount === 0 && presentDays > 0) {
      bonuses.push({
        reason: "Perfect attendance",
        category: "Perfect Attendance",
        amount: policy.perfectAttendanceBonus,
      });
    }

    // 8b. Incorporate pending carry-forward PayrollAdjustments for this teacher & month
    const pendingAdjustments = await PayrollAdjustment.find({
      campusId,
      teacherProfileId: teacherId,
      targetMonth: month,
      status: "Pending",
    });

    for (const adj of pendingAdjustments) {
      if (adj.type === "Deduction") {
        deductions.push({
          reason: `Carry-forward: ${adj.description || "Approved deduction adjustment"}`,
          category: "Absent",
          amount: adj.amount,
        });
      } else if (adj.type === "Bonus") {
        bonuses.push({
          reason: `Carry-forward: ${adj.description || "Approved substitute bonus"}`,
          category: "Substitute",
          amount: adj.amount,
        });
      }
    }

    // 8c. Incorporate approved missed class deductions and substitute bonuses from TeacherClassSession
    const teacherUserIds = attendanceTeacherIds;
    const sessionDeductions = await TeacherClassSession.find({
      campusId,
      date: { $gte: startDate, $lte: endDate },
      originalTeacherId: { $in: teacherUserIds },
      status: { $in: ["Missed", "Absent"] },
      "adjustmentReview.status": "Approved",
      deductionValue: { $gt: 0 },
    }).lean();

    for (const sess of sessionDeductions) {
      deductions.push({
        reason: `Approved Missed Period ${sess.period}: ${sess.subject} (${sess.className}) on ${moment.utc(sess.date).format("YYYY-MM-DD")}`,
        category: "Absent",
        amount: sess.deductionValue,
        note: `Session ID: ${sess._id}`,
      });
    }

    const sessionBonuses = await TeacherClassSession.find({
      campusId,
      date: { $gte: startDate, $lte: endDate },
      actualTeacherId: { $in: teacherUserIds },
      isSubstituted: true,
      status: "Completed",
      "adjustmentReview.status": "Approved",
      bonusValue: { $gt: 0 },
    }).lean();

    for (const sess of sessionBonuses) {
      bonuses.push({
        reason: `Approved Substitute Period ${sess.period}: ${sess.subject} (${sess.className}) on ${moment.utc(sess.date).format("YYYY-MM-DD")}`,
        category: "Substitute",
        amount: sess.bonusValue,
        count: 1,
        rate: sess.bonusValue,
        note: `Session ID: ${sess._id}`,
      });
    }

    // 9. Compute totals
    const allowancesTotal = (profile.allowances || []).reduce((sum, a) => sum + (a.amount || 0), 0);
    const grossSalary = profile.baseSalary + allowancesTotal; // PAY-05
    const deductionsTotal = deductions.reduce((sum, d) => sum + d.amount, 0); // PAY-06
    const bonusesTotal = bonuses.reduce((sum, b) => sum + b.amount, 0); // PAY-07
    const netSalary = grossSalary - deductionsTotal + bonusesTotal; // PAY-08

    // 10. Upsert (PAY-01, PAY-02)
    const payrollRecord = await MonthlyPayroll.findOneAndUpdate(
      { teacherProfileId: teacherId, month },
      {
        $set: {
          campusId,
          teacherProfileId: teacherId,
          month,
          year,
          baseSalary: profile.baseSalary,
          allowancesTotal,
          grossSalary,
          deductions,
          bonuses,
          deductionsTotal,
          bonusesTotal,
          netSalary,
          attendanceSummary,
          status: "Draft",
          generatedBy: userId,
        },
      },
      { upsert: true, new: true }
    );

    if (pendingAdjustments.length > 0 && payrollRecord) {
      await PayrollAdjustment.updateMany(
        { _id: { $in: pendingAdjustments.map((a) => a._id) } },
        { $set: { status: "Applied", appliedPayrollId: payrollRecord._id } }
      );
    }

    if (payrollRecord) {
      const sessionIdsToMark = [
        ...sessionDeductions.map((s) => s._id),
        ...sessionBonuses.map((s) => s._id),
      ];
      if (sessionIdsToMark.length > 0) {
        await TeacherClassSession.updateMany(
          { _id: { $in: sessionIdsToMark } },
          { $set: { appliedToPayrollId: payrollRecord._id, appliedAt: new Date() } }
        );
      }
    }

    generated++;
  }

  return { generated, skipped, total: salaryProfiles.length };
};

/**
 * List payroll records for a campus with filters and pagination.
 */
export const listPayroll = async (campusId, { month, status, page = 1, limit = 20 }) => {
  const filter = { campusId };
  if (month) filter.month = month;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    MonthlyPayroll.find(filter)
      .populate({ path: "teacherProfileId", select: "user employeeId department designation", populate: { path: "user", select: "name email" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    MonthlyPayroll.countDocuments(filter),
  ]);

  return { records, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

/**
 * Get a single payroll record.
 */
export const getPayroll = async (id, campusId, userId) => {
  const filter = { _id: id, campusId };
  if (userId) {
    const teacherProfile = await TeacherProfile.findOne({ user: userId }).select("_id").lean();
    if (!teacherProfile) return null;
    filter.teacherProfileId = teacherProfile._id;
  }
  return MonthlyPayroll.findOne(filter)
    .populate({ path: "teacherProfileId", select: "user employeeId department designation", populate: { path: "user", select: "name email" } })
    .lean();
};

const workflowError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureAmount = (lineItem) => {
  const amount = Number(lineItem?.amount);
  if (!lineItem?.reason || !Number.isFinite(amount) || amount <= 0) {
    throw workflowError("Each line item requires a reason and a positive amount", 400);
  }
  return { ...lineItem, amount };
};

const recomputeTotals = (payroll) => {
  payroll.deductionsTotal = payroll.deductions.reduce((sum, item) => sum + item.amount, 0);
  payroll.bonusesTotal = payroll.bonuses.reduce((sum, item) => sum + item.amount, 0);
  payroll.netSalary = payroll.grossSalary - payroll.deductionsTotal + payroll.bonusesTotal;
};

const findPayrollForCampus = (id, campusId) => MonthlyPayroll.findOne({ _id: id, campusId });

export const updatePayroll = async (id, campusId, payload = {}) => {
  const payroll = await findPayrollForCampus(id, campusId);
  if (!payroll) throw workflowError("Payroll record not found", 404);
  if (payroll.status !== "Draft") throw workflowError("Only Draft payrolls can be edited", 403);

  if (Array.isArray(payload.deductions)) payroll.deductions = payload.deductions.map(ensureAmount);
  else if (payload.deduction) payroll.deductions.push(ensureAmount(payload.deduction));
  if (Array.isArray(payload.bonuses)) payroll.bonuses = payload.bonuses.map(ensureAmount);
  else if (payload.bonus) payroll.bonuses.push(ensureAmount(payload.bonus));

  recomputeTotals(payroll);
  await payroll.save();
  return getPayroll(id, campusId);
};

export const approvePayroll = async (id, campusId, userId) => {
  const payroll = await findPayrollForCampus(id, campusId);
  if (!payroll) throw workflowError("Payroll record not found", 404);
  if (payroll.status !== "Draft") throw workflowError("Only Draft payrolls can be approved", 403);
  payroll.status = "Approved";
  payroll.approvedBy = userId;
  await payroll.save();
  return getPayroll(id, campusId);
};

export const markPaid = async (id, campusId) => {
  const payroll = await findPayrollForCampus(id, campusId);
  if (!payroll) throw workflowError("Payroll record not found", 404);
  if (payroll.status !== "Approved") throw workflowError("Only Approved payrolls can be marked Paid", 403);
  payroll.status = "Paid";
  payroll.paidOn = new Date();
  await payroll.save();
  return getPayroll(id, campusId);
};

export const listMyPayslips = async (campusId, userId, filters = {}) => {
  const teacherProfile = await TeacherProfile.findOne({ user: userId }).select("_id").lean();
  if (!teacherProfile) return { records: [], total: 0, page: 1, limit: 20 };
  return listPayroll(campusId, { ...filters, teacherProfileId: teacherProfile._id });
};

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export const exportPayslip = async (id, campusId, format = "csv", userId) => {
  const payroll = await getPayroll(id, campusId, userId);
  if (!payroll) throw workflowError("Payroll record not found", 404);
  const teacherName = payroll.teacherProfileId?.user?.name || payroll.teacherProfileId?.employeeId || "Teacher";

  if (format === "pdf") {
    const content = await new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48 });
      const chunks = [];
      document.on("data", (chunk) => chunks.push(chunk));
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.on("error", reject);
      document.fontSize(20).text("EduHub Payslip");
      document.moveDown().fontSize(11)
        .text(`Teacher: ${teacherName}`)
        .text(`Month: ${payroll.month}`)
        .text(`Status: ${payroll.status}`);
      document.moveDown().fontSize(13).text("Summary");
      [
        ["Base Salary", payroll.baseSalary], ["Allowances", payroll.allowancesTotal],
        ["Gross Salary", payroll.grossSalary], ["Deductions", payroll.deductionsTotal],
        ["Bonuses", payroll.bonusesTotal], ["Net Salary", payroll.netSalary],
      ].forEach(([label, value]) => document.fontSize(11).text(`${label}: PKR ${Number(value || 0).toLocaleString("en-PK")}`));
      document.moveDown().fontSize(13).text("Line Items");
      [...payroll.deductions.map((item) => ["Deduction", item]), ...payroll.bonuses.map((item) => ["Bonus", item])]
        .forEach(([type, item]) => document.fontSize(10).text(`${type}: ${item.reason} - PKR ${Number(item.amount || 0).toLocaleString("en-PK")}`));
      document.end();
    });
    return {
      content,
      contentType: "application/pdf",
      filename: `payslip-${payroll.month}.pdf`,
    };
  }

  const rows = [
    ["Type", "Category", "Reason", "Amount"],
    ...payroll.deductions.map((item) => ["Deduction", item.category, item.reason, item.amount]),
    ...payroll.bonuses.map((item) => ["Bonus", item.category, item.reason, item.amount]),
    ["Summary", "Gross", "", payroll.grossSalary], ["Summary", "Net", "", payroll.netSalary],
  ];
  return {
    content: rows.map((row) => row.map(csvValue).join(",")).join("\n"),
    contentType: "text/csv; charset=utf-8",
    filename: `payslip-${payroll.month}.csv`,
  };
};
