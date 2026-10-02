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
      perfectAttendanceBonus: 2000,
      extraClassBonus: 400,
      examDutyBonus: 300,
      missedClassDeductionRules: [],
      absentDayDeductionRules: [],
      substituteBonusRules: []
    };
  }

  // Find the applicable version for this month (effectiveDate <= end of month)
  let activePolicy = policy;
  if (policy.versions && policy.versions.length > 0) {
    const applicableVersions = policy.versions.filter(v => new Date(v.effectiveDate) <= endDate);
    if (applicableVersions.length > 0) {
      applicableVersions.sort((a,b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
      activePolicy = applicableVersions[0];
    }
  }

  // Helper to evaluate dynamic rules
  const evaluateRule = (rules, count, salary, dailySalary, distinctDays = count) => {
    if (!rules || rules.length === 0) return 0;
    const rule = rules.find(r => count >= r.min && (r.max === null || r.max === undefined || count <= r.max));
    if (!rule) return 0;
    
    if (rule.type === 'Fixed Amount') return rule.amount;
    if (rule.type === 'Percentage') return (salary * rule.amount) / 100;
    if (rule.type === 'Per Class') return count * rule.amount;
    if (rule.type === 'Per Day') return distinctDays * rule.amount;
    return 0;
  };

  // 2. Load all salary profiles for this campus
  const salaryProfiles = await TeacherSalaryProfile.find({ campusId, isActive: true }).lean();
  if (!salaryProfiles.length) {
    return { generated: 0, skipped: 0, total: 0, message: "No active salary profiles found" };
  }

  // Pre-fetch all supporting data in bulk to eliminate N*9 query bottle-necks
  const [
    existingPayrolls,
    allTeacherProfiles,
    allAttendances,
    allSubDuties,
    allAdjustments,
    allSessions,
  ] = await Promise.all([
    MonthlyPayroll.find({ campusId, month }).lean(),
    TeacherProfile.find({ campusId }).select("_id user").lean(),
    TeacherAttendance.find({
      campusId,
      date: { $gte: startDate, $lte: endDate },
    }).lean(),
    SubstituteAssignment.find({
      campusId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ["Assigned", "Completed"] },
    }).lean(),
    PayrollAdjustment.find({
      campusId,
      targetMonth: month,
      status: "Pending",
    }).lean(),
    TeacherClassSession.find({
      campusId,
      date: { $gte: startDate, $lte: endDate },
    }).lean(),
  ]);

  // Index supporting data into Maps
  const existingPayrollMap = new Map();
  existingPayrolls.forEach((ep) => {
    existingPayrollMap.set(String(ep.teacherProfileId), ep);
  });

  const profileToUserMap = new Map();
  allTeacherProfiles.forEach((tp) => {
    if (tp.user) profileToUserMap.set(String(tp._id), String(tp.user));
  });

  const attendanceMap = new Map();
  allAttendances.forEach((att) => {
    const key = String(att.teacherProfileId);
    if (!attendanceMap.has(key)) attendanceMap.set(key, []);
    attendanceMap.get(key).push(att);
  });

  const subDutyMap = new Map();
  allSubDuties.forEach((sd) => {
    const key = String(sd.substituteTeacherId);
    if (!subDutyMap.has(key)) subDutyMap.set(key, []);
    subDutyMap.get(key).push(sd);
  });

  const adjustmentMap = new Map();
  allAdjustments.forEach((adj) => {
    const key = String(adj.teacherProfileId);
    if (!adjustmentMap.has(key)) adjustmentMap.set(key, []);
    adjustmentMap.get(key).push(adj);
  });

  const originalSessionMap = new Map();
  const actualSessionMap = new Map();
  allSessions.forEach((sess) => {
    if (sess.originalTeacherId) {
      const origKey = String(sess.originalTeacherId);
      if (!originalSessionMap.has(origKey)) originalSessionMap.set(origKey, []);
      originalSessionMap.get(origKey).push(sess);
    }
    if (sess.actualTeacherId) {
      const actKey = String(sess.actualTeacherId);
      if (!actualSessionMap.has(actKey)) actualSessionMap.set(actKey, []);
      actualSessionMap.get(actKey).push(sess);
    }
  });

  let generated = 0;
  let skipped = 0;

  for (const profile of salaryProfiles) {
    const teacherId = profile.teacherProfileId;
    const teacherIdStr = String(teacherId);

    // PAY-02: Check if payroll already exists and is not Draft
    const existing = existingPayrollMap.get(teacherIdStr);
    if (existing && existing.status !== "Draft") {
      skipped++;
      continue;
    }

    // 3. PAY-04: dailySalary
    const dailySalary = profile.baseSalary / (activePolicy.workingDaysPerMonth || 26);

    // 4. Fetch attendance for this teacher from pre-fetched map
    const linkedUserId = profileToUserMap.get(teacherIdStr);
    const attList = [
      ...(attendanceMap.get(teacherIdStr) || []),
      ...(linkedUserId ? (attendanceMap.get(linkedUserId) || []) : []),
    ];

    // Filter duplicates by _id
    const seenAttIds = new Set();
    const uniqueAtts = attList.filter((a) => {
      const idStr = String(a._id);
      if (seenAttIds.has(idStr)) return false;
      seenAttIds.add(idStr);
      return true;
    });

    const presentDays = uniqueAtts.filter((a) => a.status?.toLowerCase() === "present").length;
    const absentDays = uniqueAtts.filter((a) => a.status?.toLowerCase() === "absent").length;
    const lateCount = uniqueAtts.filter((a) => a.status?.toLowerCase() === "late").length;
    const leaveDays = uniqueAtts.filter((a) => a.status?.toLowerCase() === "on leave").length;

    // 5. Fetch substitute duties where this teacher WAS the substitute
    const subDuties = subDutyMap.get(teacherIdStr) || [];
    const substituteDuties = subDuties.length;

    // 6. Build attendance summary snapshot
    const attendanceSummary = {
      totalWorkingDays: activePolicy.workingDaysPerMonth || 26,
      presentDays,
      absentDays,
      lateCount,
      leaveDays,
      substituteDuties,
    };

    // 7. Build deduction line items
    const deductions = [];

    // Absent deduction
    let absentDeduction = 0;
    if (activePolicy.absentDayDeductionRules && activePolicy.absentDayDeductionRules.length > 0) {
      absentDeduction = evaluateRule(activePolicy.absentDayDeductionRules, absentDays, profile.baseSalary, dailySalary);
    } else if (absentDays > 0) {
      absentDeduction = absentDays * dailySalary * (activePolicy.unpaidAbsentMultiplier || 1.0);
    }
    
    if (absentDeduction > 0) {
      deductions.push({
        reason: `${absentDays} absent day(s)`,
        category: "Absent",
        days: absentDays,
        rate: absentDeduction / absentDays,
        amount: Math.round(absentDeduction),
      });
    }

    // Leave deduction
    if (leaveDays > 0) {
      const amount = leaveDays * dailySalary * (activePolicy.unpaidLeaveMultiplier || 1.0);
      deductions.push({
        reason: `${leaveDays} leave day(s)`,
        category: "Leave",
        days: leaveDays,
        rate: dailySalary * (activePolicy.unpaidLeaveMultiplier || 1.0),
        amount: Math.round(amount),
      });
    }

    // Late → half-day penalty
    const lateCountForHalfDay = activePolicy.lateCountForHalfDay || 3;
    const lateHalfDayPenalty = activePolicy.lateHalfDayPenalty || 0.5;
    if (lateCount > 0 && lateCountForHalfDay > 0) {
      const halfDaysFromLate = Math.floor(lateCount / lateCountForHalfDay);
      if (halfDaysFromLate > 0) {
        const amount = halfDaysFromLate * dailySalary * lateHalfDayPenalty;
        deductions.push({
          reason: `${lateCount} late(s) → ${halfDaysFromLate} half-day penalty`,
          category: "Late",
          days: halfDaysFromLate,
          rate: dailySalary * lateHalfDayPenalty,
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
    let substituteBonus = 0;
    if (substituteDuties > 0) {
      if (activePolicy.substituteBonusRules && activePolicy.substituteBonusRules.length > 0) {
        const substituteDistinctDays = new Set(subDuties.map(s => moment(s.date).format("YYYY-MM-DD"))).size;
        substituteBonus = evaluateRule(activePolicy.substituteBonusRules, substituteDuties, profile.baseSalary, dailySalary, substituteDistinctDays);
      } else if (activePolicy.substituteBonusPerClass) {
        substituteBonus = substituteDuties * activePolicy.substituteBonusPerClass;
      }
      
      if (substituteBonus > 0) {
        bonuses.push({
          reason: `${substituteDuties} substitute class(es)`,
          category: "Substitute",
          count: substituteDuties,
          rate: substituteBonus / substituteDuties,
          amount: Math.round(substituteBonus),
          note: `SubAssignments: ${subDuties.map((s) => s._id).join(",")}`,
        });
      }
    }

    // Perfect attendance bonus (no absent, no leave, no late)
    if (absentDays === 0 && leaveDays === 0 && lateCount === 0 && presentDays > 0) {
      bonuses.push({
        reason: "Perfect attendance",
        category: "Perfect Attendance",
        amount: activePolicy.perfectAttendanceBonus || 2000,
      });
    }

    // 8b. Incorporate pending carry-forward PayrollAdjustments from map
    const pendingAdjustments = adjustmentMap.get(teacherIdStr) || [];
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

    // 8c. Dynamic Missed Classes Deductions (Unsubstituted) from map
    const teacherUserKeys = [teacherIdStr, ...(linkedUserId ? [linkedUserId] : [])];
    const teacherSessions = teacherUserKeys.flatMap((k) => originalSessionMap.get(k) || []);
    
    const trulyMissedClasses = teacherSessions.filter(
      (s) =>
        ["Missed", "Absent"].includes(s.status) &&
        !s.isSubstituted &&
        !s.substituteAssignmentId
    );
    
    const missedClassCount = trulyMissedClasses.length;
    let missedClassDeductionAmount = 0;
    
    if (missedClassCount > 0 && activePolicy.missedClassDeductionRules && activePolicy.missedClassDeductionRules.length > 0) {
      const missedDistinctDays = new Set(trulyMissedClasses.map(s => moment(s.date).format("YYYY-MM-DD"))).size;
      missedClassDeductionAmount = evaluateRule(activePolicy.missedClassDeductionRules, missedClassCount, profile.baseSalary, dailySalary, missedDistinctDays);
      
      if (missedClassDeductionAmount > 0) {
        deductions.push({
          reason: `${missedClassCount} genuinely missed class(es) (no substitute)`,
          category: "Absent",
          days: missedClassCount,
          rate: missedClassDeductionAmount / missedClassCount,
          amount: Math.round(missedClassDeductionAmount),
          note: `MissedSessions: ${trulyMissedClasses.map((s) => s._id).join(",")}`,
        });
      }
    }

    // 8d. Fallback: manual approved deductions / bonuses on specific sessions
    const sessionDeductions = teacherSessions.filter(
      (s) =>
        ["Missed", "Absent"].includes(s.status) &&
        s.adjustmentReview?.status === "Approved" &&
        s.deductionValue > 0
    );

    for (const sess of sessionDeductions) {
      if (activePolicy.missedClassDeductionRules && activePolicy.missedClassDeductionRules.length > 0) {
        continue;
      }
      deductions.push({
        reason: `Approved Missed Period ${sess.period}: ${sess.subject} (${sess.className}) on ${moment.utc(sess.date).format("YYYY-MM-DD")}`,
        category: "Absent",
        amount: sess.deductionValue,
        note: `Session ID: ${sess._id}`,
      });
    }

    const actualSessions = teacherUserKeys.flatMap((k) => actualSessionMap.get(k) || []);
    const sessionBonuses = actualSessions.filter(
      (s) =>
        s.isSubstituted &&
        s.status === "Completed" &&
        s.adjustmentReview?.status === "Approved" &&
        s.bonusValue > 0
    );

    for (const sess of sessionBonuses) {
      if (activePolicy.substituteBonusRules && activePolicy.substituteBonusRules.length > 0) {
        continue;
      }
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
    const grossSalary = profile.baseSalary + allowancesTotal;
    const deductionsTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
    const bonusesTotal = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const netSalary = grossSalary - deductionsTotal + bonusesTotal;

    // 10. Upsert
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
