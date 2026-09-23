import mongoose from "mongoose";
import crypto from "crypto";
import moment from "moment";
import { AttendanceApproval } from "../models/attendanceApproval.model.js";
import { PayrollAdjustment } from "../models/payrollAdjustment.model.js";
import { MonthlyPayroll } from "../models/monthlyPayroll.model.js";
import { TeacherSalaryProfile } from "../models/teacherSalaryProfile.model.js";
import { SalaryPolicy } from "../models/salaryPolicy.model.js";
import { TeacherProfile } from "../models/profile.model.js";
import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import User from "../models/user.model.js";
import { writeAuditLog } from "./auditLog.service.js";

/**
 * Helper to resolve teacher profile ID from User ID or TeacherProfile ID.
 */
async function resolveTeacherProfileId(id) {
  if (!id) return null;
  const directProfile = await TeacherProfile.findById(id).lean();
  if (directProfile) return directProfile._id;

  const profileByUser = await TeacherProfile.findOne({ user: id }).lean();
  if (profileByUser) return profileByUser._id;

  // If no TeacherProfile exists for this user, create minimal profile
  try {
    const userDoc = await User.findById(id).lean();
    if (userDoc) {
      const newProfile = await TeacherProfile.create({
        user: id,
        campusId: userDoc.campusId,
        department: userDoc.department || "Academics",
        designation: userDoc.designation || "Faculty",
      });
      return newProfile._id;
    }
  } catch (err) {
    // Ignore and fallback
  }

  return id;
}

/**
 * Auto-generate a pending AttendanceApproval when a teacher is marked Absent.
 */
export const createPendingApprovalFromAbsence = async (
  campusId,
  attendanceRecord,
  markedByUser
) => {
  try {
    let attRecord = attendanceRecord;
    if (
      typeof attendanceRecord === "string" ||
      mongoose.isObjectIdOrHexString(attendanceRecord) ||
      (attendanceRecord && !attendanceRecord.teacherProfileId)
    ) {
      attRecord = await TeacherAttendance.findById(attendanceRecord).lean();
    }
    if (!attRecord) return null;

    const rawTeacherId = attRecord.teacherProfileId;
    const teacherProfileId = await resolveTeacherProfileId(rawTeacherId);
    const absentDate = moment.utc(attRecord.date).startOf("day").toDate();
    const endOfDay = moment.utc(attRecord.date).endOf("day").toDate();

    // Avoid duplicate pending approval for the same teacher and date
    const existing = await AttendanceApproval.findOne({
      campusId,
      absentTeacherId: teacherProfileId,
      absentDate: { $gte: absentDate, $lte: endOfDay },
      status: { $in: ["Pending", "Approved"] },
    });

    if (existing) {
      return existing;
    }

    // 1. Fetch Salary Profile
    let salaryProfile = await TeacherSalaryProfile.findOne({
      campusId,
      teacherProfileId,
    }).lean();

    const baseSalary = salaryProfile?.baseSalary || 20000;

    // 2. Fetch Salary Policy
    let salaryPolicy = await SalaryPolicy.findOne({ campusId }).lean();
    const workingDays = salaryPolicy?.workingDaysPerMonth || 26;
    const absentMultiplier = salaryPolicy?.unpaidAbsentMultiplier || 1.0;
    const substituteRate = salaryPolicy?.substituteBonusPerClass || 500;

    // 3. Compute Deduction Math
    const dailySalary = baseSalary / workingDays;
    const finalDeductionAmount = Math.round(dailySalary * absentMultiplier);
    const formulaText = `(${baseSalary} base / ${workingDays} working days) × ${absentMultiplier} multiplier = PKR ${finalDeductionAmount}`;

    // 4. Check for linked substitute assignments on this date
    const substituteAssignments = await SubstituteAssignment.find({
      campusId,
      originalTeacherId: { $in: [teacherProfileId, rawTeacherId] },
      date: { $gte: absentDate, $lte: endOfDay },
      status: { $in: ["Assigned", "Completed"] },
    })
      .populate("substituteTeacherId", "user employeeId department")
      .lean();

    const hasSubstitutes = substituteAssignments.length > 0;
    const dutyCount = substituteAssignments.length;
    const totalBonusAmount = dutyCount * substituteRate;
    const subFormula = hasSubstitutes
      ? `${dutyCount} covered class(es) × PKR ${substituteRate}/class = PKR ${totalBonusAmount}`
      : "No substitute duty recorded";

    const primarySubTeacherId = hasSubstitutes
      ? substituteAssignments[0].substituteTeacherId?._id || substituteAssignments[0].substituteTeacherId
      : null;

    // 5. Create Approval Document
    const approval = new AttendanceApproval({
      campusId,
      status: "Pending",
      absentDate,
      absentTeacherId: teacherProfileId,

      absenceProof: {
        attendanceId: attRecord._id,
        date: absentDate,
        status: attRecord.status || "Absent",
        markedBy: markedByUser?._id || attRecord.markedBy || null,
        markedAt: attRecord.createdAt || new Date(),
        remarks: attRecord.remarks || "",
        snapshot: {
          attendanceId: attRecord._id,
          teacherProfileId: rawTeacherId,
          status: attRecord.status,
          date: absentDate,
          markedBy: markedByUser?.name || "Attendance Manager",
        },
      },

      deductionProof: {
        salaryProfileId: salaryProfile?._id || null,
        salaryPolicyId: salaryPolicy?._id || null,
        baseSalary,
        workingDaysPerMonth: workingDays,
        dailySalary: Math.round(dailySalary * 100) / 100,
        multiplier: absentMultiplier,
        formula: formulaText,
        finalAmount: finalDeductionAmount,
      },

      substituteProof: {
        hasSubstitutes,
        substituteTeacherId: primarySubTeacherId,
        assignmentIds: substituteAssignments.map((s) => s._id),
        dutyCount,
        ratePerClass: substituteRate,
        formula: subFormula,
        finalAmount: totalBonusAmount,
        assignmentsSnapshot: substituteAssignments.map((s) => ({
          assignmentId: s._id,
          period: s.period,
          className: s.className,
          subject: s.subject,
          substituteTeacherId: s.substituteTeacherId,
          bonusAmount: s.bonusAmount || substituteRate,
        })),
      },

      stateHistory: [
        {
          fromStatus: "None",
          toStatus: "Pending",
          changedBy: {
            userId: markedByUser?._id || null,
            name: markedByUser?.name || "System",
            role: markedByUser?.role || "system",
          },
          timestamp: new Date(),
          reason: "Auto-generated from recorded absence",
        },
      ],
    });

    await approval.save();

    // 6. Write Immutable Audit Log
    await writeAuditLog({
      campusId,
      entityType: "AttendanceApproval",
      entityId: approval._id,
      action: "created",
      performedBy: markedByUser || { name: "System", role: "system" },
      changes: {
        before: null,
        after: {
          status: "Pending",
          absentTeacherId: teacherProfileId,
          deductionAmount: finalDeductionAmount,
          bonusAmount: totalBonusAmount,
        },
      },
      reason: `Recorded absence on ${moment.utc(absentDate).format("YYYY-MM-DD")}`,
    });

    return approval;
  } catch (err) {
    console.error("Failed to auto-create attendance approval:", err.message);
    return null;
  }
};

/**
 * Auto-cancel pending approval if attendance changes from Absent to Present/Late.
 */
export const cancelPendingApprovalOnAttendanceChange = async (
  campusId,
  teacherId,
  date,
  actor
) => {
  try {
    const teacherProfileId = await resolveTeacherProfileId(teacherId);
    const targetDate = moment.utc(date).startOf("day").toDate();
    const endOfDay = moment.utc(date).endOf("day").toDate();

    const pendingApproval = await AttendanceApproval.findOne({
      campusId,
      absentTeacherId: { $in: [teacherProfileId, teacherId] },
      absentDate: { $gte: targetDate, $lte: endOfDay },
      status: "Pending",
    });

    if (!pendingApproval) return null;

    pendingApproval.status = "Cancelled";
    pendingApproval.stateHistory.push({
      fromStatus: "Pending",
      toStatus: "Cancelled",
      changedBy: {
        userId: actor?._id || null,
        name: actor?.name || "System",
        role: actor?.role || "system",
      },
      timestamp: new Date(),
      reason: "Attendance status changed from Absent to Present/Late",
    });

    await pendingApproval.save();

    await writeAuditLog({
      campusId,
      entityType: "AttendanceApproval",
      entityId: pendingApproval._id,
      action: "cancelled",
      performedBy: actor || { name: "System", role: "system" },
      changes: {
        before: { status: "Pending" },
        after: { status: "Cancelled" },
      },
      reason: "Attendance record updated to non-absent",
    });

    return pendingApproval;
  } catch (err) {
    console.error("Error cancelling pending approval:", err.message);
    return null;
  }
};

/**
 * Process Admin Decision (Approve or Reject) with full decision proof and payroll attachment.
 */
export const processAdminDecision = async (
  arg1,
  arg2,
  actor,
  decisionTypeOrData,
  extra = {}
) => {
  const query = mongoose.isValidObjectId(arg1) && mongoose.isValidObjectId(arg2)
    ? {
        $or: [
          { _id: arg1, campusId: arg2 },
          { _id: arg2, campusId: arg1 },
        ],
      }
    : { _id: arg1 || arg2 };

  const approval = await AttendanceApproval.findOne(query);
  if (!approval) {
    const err = new Error("Approval record not found");
    err.statusCode = 404;
    throw err;
  }

  const campusId = approval.campusId;
  const approvalId = approval._id;

  if (approval.status !== "Pending") {
    const err = new Error(`Cannot decide on an approval with status "${approval.status}"`);
    err.statusCode = 400;
    throw err;
  }

  let decisionType = typeof decisionTypeOrData === "string" ? decisionTypeOrData : decisionTypeOrData?.decisionType;
  if (decisionType === "Approved") decisionType = "Approve";
  if (decisionType === "Rejected") decisionType = "Reject";

  if (!["Approve", "Reject"].includes(decisionType)) {
    const err = new Error("Decision type must be 'Approve' or 'Reject'");
    err.statusCode = 400;
    throw err;
  }

  const reason = extra.reason || (typeof decisionTypeOrData === "object" ? decisionTypeOrData.reason : "") || "";
  const notes = extra.notes || "";
  const ipAddress = extra.ipAddress || extra.ip || "";
  const userAgent = extra.userAgent || "";
  const screenSnapshot = extra.screenSnapshot || null;

  if (decisionType === "Reject" && !reason.trim()) {
    const err = new Error("A reason is required when rejecting a deduction approval");
    err.statusCode = 400;
    throw err;
  }

  // 1. Record Decision Proof Block
  approval.decision = {
    decidedBy: {
      userId: actor._id,
      name: actor.name,
      email: actor.email,
      role: actor.role,
    },
    decidedAt: new Date(),
    type: decisionType,
    reason: reason.trim(),
    notes: notes.trim(),
    ipAddress,
    userAgent,
    screenSnapshot: screenSnapshot || {
      approvalId: approval._id,
      absentTeacher: approval.absentTeacherId,
      date: approval.absentDate,
      deductionAmount: approval.deductionProof.finalAmount,
      bonusAmount: approval.substituteProof.finalAmount,
    },
  };

  const oldStatus = approval.status;

  // 2. Handle Rejection
  if (decisionType === "Reject") {
    approval.status = "Rejected";
    approval.stateHistory.push({
      fromStatus: oldStatus,
      toStatus: "Rejected",
      changedBy: {
        userId: actor._id,
        name: actor.name,
        role: actor.role,
      },
      timestamp: new Date(),
      reason: reason.trim(),
    });

    await approval.save();

    await writeAuditLog({
      campusId,
      entityType: "AttendanceApproval",
      entityId: approval._id,
      action: "rejected",
      performedBy: actor,
      ipAddress,
      userAgent,
      changes: {
        before: { status: "Pending" },
        after: { status: "Rejected", reason: reason.trim() },
      },
      reason: reason.trim(),
    });

    return approval;
  }

  // 3. Handle Approval & Application to Payroll
  approval.status = "Approved";
  approval.stateHistory.push({
    fromStatus: oldStatus,
    toStatus: "Approved",
    changedBy: {
      userId: actor._id,
      name: actor.name,
      role: actor.role,
    },
    timestamp: new Date(),
    reason: reason.trim() || "Approved by administrator",
  });

  const monthStr = moment.utc(approval.absentDate).format("YYYY-MM");
  const deductionAmount = approval.deductionProof.finalAmount;

  // Check absent teacher's payroll for this month
  const absentPayroll = await MonthlyPayroll.findOne({
    campusId,
    teacherProfileId: approval.absentTeacherId,
    month: monthStr,
  });

  let deductionPayrollId = null;
  let deductionLineItemIndex = null;
  let isCarriedForward = false;
  let adjustmentId = null;

  if (absentPayroll && absentPayroll.status === "Draft") {
    // Append deduction directly to Draft payroll
    absentPayroll.deductions.push({
      reason: `Absent — ${moment.utc(approval.absentDate).format("YYYY-MM-DD")} (Approval #${approval._id.toString().slice(-6)})`,
      category: "Absent",
      days: 1,
      rate: approval.deductionProof.dailySalary,
      amount: deductionAmount,
      note: `Proof: Attendance record #${approval.absenceProof.attendanceId}`,
    });

    absentPayroll.deductionsTotal = absentPayroll.deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    absentPayroll.netSalary = absentPayroll.grossSalary + absentPayroll.bonusesTotal - absentPayroll.deductionsTotal;
    await absentPayroll.save();

    deductionPayrollId = absentPayroll._id;
    deductionLineItemIndex = absentPayroll.deductions.length - 1;
  } else {
    // Payroll is already Approved, Paid, or not yet generated
    // Create carry-forward adjustment for next month if payroll was locked
    const nextMonthStr = moment.utc(approval.absentDate).add(1, "month").format("YYYY-MM");

    const adjustment = new PayrollAdjustment({
      campusId,
      teacherProfileId: approval.absentTeacherId,
      targetMonth: nextMonthStr,
      sourceMonth: monthStr,
      type: "Deduction",
      category: "Absent",
      amount: deductionAmount,
      reason: `Absent Deduction from ${monthStr} (Approval #${approval._id.toString().slice(-6)})`,
      note: `Proof: Attendance ID #${approval.absenceProof.attendanceId}`,
      sourceApprovalId: approval._id,
      status: "Pending",
      createdBy: actor._id,
    });

    await adjustment.save();
    isCarriedForward = true;
    adjustmentId = adjustment._id;

    await writeAuditLog({
      campusId,
      entityType: "PayrollAdjustment",
      entityId: adjustment._id,
      action: "carried_forward",
      performedBy: actor,
      ipAddress,
      userAgent,
      changes: {
        before: null,
        after: {
          targetMonth: nextMonthStr,
          amount: deductionAmount,
          type: "Deduction",
        },
      },
      reason: `Payroll for ${monthStr} is locked/settled. Carried forward to ${nextMonthStr}.`,
    });
  }

  // If substitute bonus exists, handle substitute payroll
  let bonusPayrollId = null;
  let bonusLineItemIndex = null;

  if (approval.substituteProof.hasSubstitutes && approval.substituteProof.finalAmount > 0) {
    const subTeacherId = approval.substituteProof.substituteTeacherId;
    const bonusAmount = approval.substituteProof.finalAmount;

    const subPayroll = await MonthlyPayroll.findOne({
      campusId,
      teacherProfileId: subTeacherId,
      month: monthStr,
    });

    if (subPayroll && subPayroll.status === "Draft") {
      subPayroll.bonuses.push({
        reason: `Substitute Duty — ${moment.utc(approval.absentDate).format("YYYY-MM-DD")} (Approval #${approval._id.toString().slice(-6)})`,
        category: "Substitute",
        count: approval.substituteProof.dutyCount,
        rate: approval.substituteProof.ratePerClass,
        amount: bonusAmount,
        note: `Proof: Assignments [${approval.substituteProof.assignmentIds.map((id) => id.toString().slice(-4)).join(", ")}]`,
      });

      subPayroll.bonusesTotal = subPayroll.bonuses.reduce((sum, b) => sum + (b.amount || 0), 0);
      subPayroll.netSalary = subPayroll.grossSalary + subPayroll.bonusesTotal - subPayroll.deductionsTotal;
      await subPayroll.save();

      bonusPayrollId = subPayroll._id;
      bonusLineItemIndex = subPayroll.bonuses.length - 1;
    } else if (subTeacherId) {
      const nextMonthStr = moment.utc(approval.absentDate).add(1, "month").format("YYYY-MM");
      const subAdjustment = new PayrollAdjustment({
        campusId,
        teacherProfileId: subTeacherId,
        targetMonth: nextMonthStr,
        sourceMonth: monthStr,
        type: "Bonus",
        category: "Substitute",
        amount: bonusAmount,
        reason: `Substitute Bonus from ${monthStr} (Approval #${approval._id.toString().slice(-6)})`,
        note: `Proof: Assignment Duties (${approval.substituteProof.dutyCount} classes)`,
        sourceApprovalId: approval._id,
        status: "Pending",
        createdBy: actor._id,
      });

      await subAdjustment.save();
    }
  }

  // 4. Compute Checksum (Layer 5)
  const checksumSource = `${approval._id}-${deductionPayrollId || adjustmentId}-${deductionAmount}-${Date.now()}`;
  const checksum = crypto.createHash("sha256").update(checksumSource).digest("hex");

  approval.application = {
    applied: true,
    appliedAt: new Date(),
    deductionPayrollId,
    deductionLineItemIndex,
    bonusPayrollId,
    bonusLineItemIndex,
    isCarriedForward,
    adjustmentId,
    checksum,
    checksumHash: checksum,
    targetMonth: monthStr,
  };

  await approval.save();

  await writeAuditLog({
    campusId,
    entityType: "AttendanceApproval",
    entityId: approval._id,
    action: "approved",
    performedBy: actor,
    ipAddress,
    userAgent,
    changes: {
      before: { status: "Pending" },
      after: {
        status: "Approved",
        applied: true,
        checksum,
        isCarriedForward,
      },
    },
    reason: reason.trim() || "Approved and applied to payroll",
  });

  return approval;
};

/**
 * List all attendance approvals for a campus with rich filtering and pagination.
 */
export const listApprovals = async (campusId, filters = {}) => {
  const query = { campusId };

  if (filters.status && filters.status !== "All") {
    query.status = filters.status;
  }

  if (filters.month) {
    const start = moment.utc(`${filters.month}-01`).startOf("month").toDate();
    const end = moment.utc(`${filters.month}-01`).endOf("month").toDate();
    query.absentDate = { $gte: start, $lte: end };
  } else if (filters.startDate || filters.endDate) {
    query.absentDate = {};
    if (filters.startDate) {
      query.absentDate.$gte = moment.utc(filters.startDate).startOf("day").toDate();
    }
    if (filters.endDate) {
      query.absentDate.$lte = moment.utc(filters.endDate).endOf("day").toDate();
    }
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    AttendanceApproval.find(query)
      .populate({
        path: "absentTeacherId",
        populate: { path: "user", select: "name email avatar department designation" },
      })
      .populate({
        path: "substituteProof.substituteTeacherId",
        populate: { path: "user", select: "name email avatar department designation" },
      })
      .populate("absenceProof.markedBy", "name email role")
      .sort({ absentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AttendanceApproval.countDocuments(query),
  ]);

  return { records, total, page, limit };
};

/**
 * Get detailed approval record with full proof metadata.
 */
export const getApprovalById = async (arg1, arg2) => {
  const query = mongoose.isValidObjectId(arg1) && mongoose.isValidObjectId(arg2)
    ? {
        $or: [
          { _id: arg1, campusId: arg2 },
          { _id: arg2, campusId: arg1 },
        ],
      }
    : { _id: arg1 || arg2 };

  const approval = await AttendanceApproval.findOne(query)
    .populate({
      path: "absentTeacherId",
      populate: { path: "user", select: "name email avatar department designation phone" },
    })
    .populate({
      path: "substituteProof.substituteTeacherId",
      populate: { path: "user", select: "name email avatar department designation phone" },
    })
    .populate("absenceProof.markedBy", "name email role")
    .populate("application.deductionPayrollId")
    .populate("application.bonusPayrollId")
    .populate("application.adjustmentId")
    .lean();

  if (!approval) {
    const err = new Error("Approval record not found");
    err.statusCode = 404;
    throw err;
  }

  return approval;
};
