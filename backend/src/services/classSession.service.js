import mongoose from "mongoose";
import moment from "moment";
import TeacherClassSession from "../models/teacherClassSession.model.js";
import TeachingCreditConfig from "../models/teachingCreditConfig.model.js";
import Timetable from "../models/timetable.model.js";
import { ClassSchedule, TeacherProfile } from "../models/profile.model.js";
import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import TeacherSalaryProfile from "../models/teacherSalaryProfile.model.js";
import User from "../models/user.model.js";
import Alert from "../models/alert.model.js";
import { writeAuditLog } from "./auditLog.service.js";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Normalizes input date to UTC midnight.
 */
export function normalizeSessionDate(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    );
  }
  const m = moment.utc(dateInput);
  return m.startOf("day").toDate();
}

/**
 * Get or initialize campus teaching credit config.
 */
export async function getEffectiveTeachingConfig(campusId) {
  let config = await TeachingCreditConfig.findOne({ campusId }).lean();
  if (!config) {
    config = await TeachingCreditConfig.create({
      campusId,
      creditPerCompletedPeriod: 1.0,
      creditForSubstitution: 1.0,
      bonusPerSubstituteClass: 500,
      requireApprovalForSubstituteBonus: true,
      requireApprovalForMissedDeduction: true,
      deductionMode: "Formula",
      perMissedClassDeduction: 0,
      missedClassFormulaMultiplier: 1.0,
      expectedPeriodsPerDay: 5,
      workingDaysPerMonth: 26,
      graceLateMinutes: 15,
      approvedLeaveDeducts: false,
      cancelledClassDeducts: false,
      payrollCutoffDay: 28,
    });
  }
  return config;
}

/**
 * Helper to resolve teacher User record whether passed a User ID or TeacherProfile ID.
 */
export async function resolveTeacherUser(id) {
  if (!id) return null;
  const user = await User.findById(id).select("_id name email campusId role").lean();
  if (user) return user;

  const profile = await TeacherProfile.findById(id).populate("user", "_id name email campusId role").lean();
  if (profile?.user) return profile.user;

  return null;
}

/**
 * Compute deduction for a missed period based on teacher salary profile and config.
 */
export async function calculatePeriodDeduction(campusId, teacherUserId, config) {
  if (config.deductionMode === "FixedAmount" && config.perMissedClassDeduction > 0) {
    return config.perMissedClassDeduction;
  }

  // Find teacher's salary profile
  let teacherProfile = await TeacherProfile.findOne({ user: teacherUserId }).lean();
  let teacherProfileId = teacherProfile?._id || teacherUserId;

  let salaryProfile = await TeacherSalaryProfile.findOne({
    campusId,
    $or: [{ teacherProfileId }, { teacherProfileId: teacherUserId }],
  }).lean();

  const baseSalary = salaryProfile?.baseSalary || 30000;
  const workingDays = config.workingDaysPerMonth || 26;
  const periodsPerDay = config.expectedPeriodsPerDay || 5;
  const multiplier = config.missedClassFormulaMultiplier || 1.0;

  const dailySalary = baseSalary / workingDays;
  const perPeriodSalary = dailySalary / periodsPerDay;
  const deduction = Math.round(perPeriodSalary * multiplier);
  return Math.max(0, deduction);
}

/**
 * Generates daily class sessions from Timetable templates for a campus and date.
 * If sessions already exist for that date, existing ones are preserved.
 */
export async function generateDailySessions(campusId, dateInput, options = {}) {
  const targetDate = normalizeSessionDate(dateInput);
  const endOfDay = moment.utc(targetDate).endOf("day").toDate();
  const dayOfWeekIndex = moment.utc(targetDate).isoWeekday(); // 1 = Monday, 7 = Sunday
  const dayOfWeekName = WEEKDAYS[dayOfWeekIndex - 1] || "Monday";

  const config = await getEffectiveTeachingConfig(campusId);

  // 1. Fetch active Timetable slots that occur on this weekday
  let timetableSlots = await Timetable.find({
    campusId,
    status: { $ne: "Cancelled" },
    isBreak: false,
    days: dayOfWeekIndex,
  })
    .populate("gradeId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .populate("teacherId", "name email")
    .sort({ startTime: 1 })
    .lean();

  // Fallback to legacy ClassSchedule if no Timetable slots exist
  if (!timetableSlots.length) {
    const legacySchedules = await ClassSchedule.find({
      campusId,
      dayOfWeek: dayOfWeekName,
      isBreak: false,
    })
      .populate("teacherId", "name email")
      .sort({ startTime: 1 })
      .lean();

    if (legacySchedules.length) {
      timetableSlots = legacySchedules.map((leg) => ({
        _id: leg._id,
        timetableId: leg._id,
        campusId: leg.campusId,
        days: [dayOfWeekIndex],
        startTime: leg.startTime,
        endTime: leg.endTime,
        program: leg.className || leg.gradeOrClass || "Class",
        section: leg.section || "A",
        subject: leg.subject || leg.title || "Subject",
        room: leg.roomNumber || leg.room || "Room 101",
        teacherId: leg.teacherId?._id ? leg.teacherId : leg.teacherProfileId,
      }));
    }
  }

  // 2. Fetch daily Teacher Attendance records for this campus & date
  const attendances = await TeacherAttendance.find({
    campusId,
    date: { $gte: targetDate, $lte: endOfDay },
  }).lean();

  const attendanceMap = new Map();
  attendances.forEach((att) => {
    const status = att.status ? att.status.toLowerCase() : "";
    attendanceMap.set(String(att.teacherProfileId), status);
  });

  // 3. Fetch Substitute Assignments for this campus & date
  const substitutes = await SubstituteAssignment.find({
    campusId,
    date: { $gte: targetDate, $lte: endOfDay },
    status: { $in: ["Assigned", "Completed", "Pending Approval"] },
  }).lean();

  const sessions = [];

  for (let idx = 0; idx < timetableSlots.length; idx++) {
    const slot = timetableSlots[idx];
    const periodNumber = idx + 1;

    let teacherUser = null;
    if (slot.teacherId?._id) {
      teacherUser = slot.teacherId;
    } else if (slot.teacherId) {
      teacherUser = await resolveTeacherUser(slot.teacherId);
    }

    if (!teacherUser?._id) {
      continue;
    }

    const teacherUserId = teacherUser._id;
    const className = slot.gradeId?.name || slot.program || slot.className || "Class";
    const sectionName = slot.sectionId?.name || slot.section || "A";
    const subjectName = slot.subjectId?.name || slot.subject || "Subject";
    const roomName = slot.room || "Room 101";

    // Check if session record already exists
    let existingSession = await TeacherClassSession.findOne({
      campusId,
      date: targetDate,
      period: periodNumber,
      originalTeacherId: teacherUserId,
      className,
      section: sectionName,
    });

    if (existingSession) {
      sessions.push(existingSession);
      continue;
    }

    // Determine substitution coverage
    const matchedSub = substitutes.find(
      (sub) =>
        (String(sub.originalTeacherId) === String(teacherUserId) ||
          sub.className?.toLowerCase() === className.toLowerCase()) &&
        (sub.period === periodNumber || sub.startTime === slot.startTime)
    );

    let actualTeacherId = teacherUserId;
    let isSubstituted = false;
    let substituteAssignmentId = null;
    let sessionStatus = "Scheduled";
    let attendanceStatus = "Unrecorded";
    let creditValue = config.creditPerCompletedPeriod || 1.0;
    let bonusValue = 0;
    let deductionValue = 0;
    let remarks = "";

    // Check teacher attendance status on this day
    const teacherAtt = attendanceMap.get(String(teacherUserId));
    if (teacherAtt === "on leave" || teacherAtt === "excused") {
      attendanceStatus = "On Leave";
      sessionStatus = config.approvedLeaveDeducts ? "Missed" : "Cancelled";
      creditValue = 0;
      deductionValue = 0;
      remarks = "Teacher on approved leave";
    } else if (teacherAtt === "absent") {
      attendanceStatus = "Absent";
      sessionStatus = "Absent";
      creditValue = 0;
      deductionValue = await calculatePeriodDeduction(campusId, teacherUserId, config);
      remarks = "Teacher marked absent for the day";
    } else if (teacherAtt === "present" || teacherAtt === "late") {
      attendanceStatus = teacherAtt === "late" ? "Late" : "Present";
    }

    if (matchedSub) {
      const subUser = await resolveTeacherUser(matchedSub.substituteTeacherId);
      if (subUser) {
        actualTeacherId = subUser._id;
        isSubstituted = true;
        substituteAssignmentId = matchedSub._id;
        sessionStatus = matchedSub.status === "Completed" ? "Completed" : "Substituted";
        creditValue = config.creditForSubstitution || 1.0;
        bonusValue = matchedSub.bonusAmount || config.bonusPerSubstituteClass || 500;
        remarks = `Substituted by ${subUser.name || "Colleague"}`;
      }
    }

    const newSession = new TeacherClassSession({
      campusId,
      timetableId: slot._id,
      academicSession: "2026-2027",
      date: targetDate,
      dayOfWeek: dayOfWeekName,
      period: periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      gradeId: slot.gradeId?._id || slot.gradeId || null,
      sectionId: slot.sectionId?._id || slot.sectionId || null,
      subjectId: slot.subjectId?._id || slot.subjectId || null,
      className,
      section: sectionName,
      subject: subjectName,
      room: roomName,
      originalTeacherId: teacherUserId,
      actualTeacherId,
      isSubstituted,
      substituteAssignmentId,
      status: sessionStatus,
      attendanceStatus,
      creditValue,
      bonusValue,
      deductionValue,
      remarks,
    });

    if (sessionStatus === "Missed" || sessionStatus === "Absent") {
      newSession.adjustmentReview = {
        status: config.requireApprovalForMissedDeduction ? "Pending Review" : "Approved",
        proposedDeduction: deductionValue,
        proposedBonus: 0,
      };
    } else if (isSubstituted && bonusValue > 0) {
      newSession.adjustmentReview = {
        status: config.requireApprovalForSubstituteBonus ? "Pending Review" : "Approved",
        proposedDeduction: 0,
        proposedBonus: bonusValue,
      };
    }

    await newSession.save();
    sessions.push(newSession);
  }

  return sessions;
}

/**
 * List daily class sessions for a teacher (as original or substitute) with filters.
 */
export async function listTeacherSessions(campusId, teacherUserId, filters = {}) {
  const query = {
    campusId,
    $or: [{ originalTeacherId: teacherUserId }, { actualTeacherId: teacherUserId }],
  };

  if (filters.date) {
    const targetDate = normalizeSessionDate(filters.date);
    const endOfDay = moment.utc(targetDate).endOf("day").toDate();
    query.date = { $gte: targetDate, $lte: endOfDay };
    // Auto-generate sessions for this date if none exist yet
    await generateDailySessions(campusId, targetDate);
  } else if (filters.month) {
    const startMonth = moment.utc(`${filters.month}-01`).startOf("month").toDate();
    const endMonth = moment.utc(`${filters.month}-01`).endOf("month").toDate();
    query.date = { $gte: startMonth, $lte: endMonth };
  } else if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = normalizeSessionDate(filters.startDate);
    if (filters.endDate) query.date.$lte = moment.utc(filters.endDate).endOf("day").toDate();
  } else {
    // Default to today
    const today = normalizeSessionDate(new Date());
    await generateDailySessions(campusId, today);
    query.date = { $gte: today, $lte: moment.utc(today).endOf("day").toDate() };
  }

  if (filters.status && filters.status !== "All") {
    query.status = filters.status;
  }
  if (filters.className) {
    query.className = new RegExp(filters.className, "i");
  }
  if (filters.subject) {
    query.subject = new RegExp(filters.subject, "i");
  }

  const sessions = await TeacherClassSession.find(query)
    .populate("originalTeacherId", "name email role department")
    .populate("actualTeacherId", "name email role department")
    .populate("substituteAssignmentId")
    .sort({ date: 1, startTime: 1, period: 1 })
    .lean();

  return sessions.map((sess) => {
    const isOriginal = String(sess.originalTeacherId?._id || sess.originalTeacherId) === String(teacherUserId);
    const isActual = String(sess.actualTeacherId?._id || sess.actualTeacherId) === String(teacherUserId);
    const isSubstitutedOut = isOriginal && sess.isSubstituted && !isActual;
    const isSubstituteDuty = isActual && sess.isSubstituted && !isOriginal;

    return {
      ...sess,
      isOriginal,
      isActual,
      isSubstitutedOut,
      isSubstituteDuty,
    };
  });
}

/**
 * Mark a class session status (Completed, Missed, Cancelled).
 */
export async function markSessionStatus(sessionId, campusId, actor, { status, remarks = "" }) {
  const session = await TeacherClassSession.findOne({ _id: sessionId, campusId });
  if (!session) {
    const err = new Error("Class session record not found.");
    err.statusCode = 404;
    throw err;
  }

  const config = await getEffectiveTeachingConfig(campusId);
  const previousStatus = session.status;
  const previousCredit = session.creditValue;
  const previousDeduction = session.deductionValue;
  const previousBonus = session.bonusValue;

  session.status = status;
  session.remarks = remarks || session.remarks;
  session.markedBy = actor._id;
  session.markedAt = new Date();

  if (status === "Completed") {
    session.attendanceStatus = "Present";
    session.creditValue = session.isSubstituted
      ? config.creditForSubstitution
      : config.creditPerCompletedPeriod;
    session.deductionValue = 0;

    if (session.isSubstituted) {
      session.bonusValue = config.bonusPerSubstituteClass;
      session.adjustmentReview = {
        status: config.requireApprovalForSubstituteBonus ? "Pending Review" : "Approved",
        proposedBonus: session.bonusValue,
        proposedDeduction: 0,
        reviewRemark: "Class completed by substitute teacher",
      };

      if (session.substituteAssignmentId) {
        await SubstituteAssignment.findByIdAndUpdate(session.substituteAssignmentId, {
          status: "Completed",
        });
      }
    } else {
      session.adjustmentReview.status = "None";
    }
  } else if (status === "Missed" || status === "Absent") {
    session.attendanceStatus = status === "Absent" ? "Absent" : "Absent";
    session.creditValue = 0;
    session.bonusValue = 0;

    const deduction = await calculatePeriodDeduction(campusId, session.originalTeacherId, config);
    session.deductionValue = deduction;
    session.adjustmentReview = {
      status: config.requireApprovalForMissedDeduction ? "Pending Review" : "Approved",
      proposedDeduction: deduction,
      proposedBonus: 0,
      reviewRemark: remarks || "Class missed by assigned teacher",
    };

    // Alert Campus Manager
    await Alert.create({
      instituteId: actor.instituteId || session.campusId,
      campusId,
      severity: "Warning",
      title: "Class Period Missed",
      message: `Teacher missed scheduled period ${session.period} (${session.subject}, ${session.className}). Proposed deduction: PKR ${deduction}.`,
      createdBy: actor._id,
    });
  } else if (status === "Cancelled") {
    session.creditValue = 0;
    session.deductionValue = 0;
    session.bonusValue = 0;
    session.adjustmentReview.status = "None";
  }

  await session.save();

  await writeAuditLog({
    campusId,
    entityType: "TeacherClassSession",
    entityId: session._id,
    action: "updated",
    performedBy: actor,
    changes: {
      before: { status: previousStatus, credit: previousCredit, deduction: previousDeduction, bonus: previousBonus },
      after: { status: session.status, credit: session.creditValue, deduction: session.deductionValue, bonus: session.bonusValue },
    },
    reason: remarks || `Session status updated to ${status}`,
  });

  return session;
}

/**
 * Teacher submits a dispute/review request for a missed or absent class.
 */
export async function requestDispute(sessionId, campusId, teacherUser, { reason }) {
  const session = await TeacherClassSession.findOne({ _id: sessionId, campusId });
  if (!session) {
    const err = new Error("Class session not found.");
    err.statusCode = 404;
    throw err;
  }

  const teacherUserId = String(teacherUser._id);
  const origTeacherId = String(session.originalTeacherId);
  const actualTeacherId = String(session.actualTeacherId);

  if (teacherUserId !== origTeacherId && teacherUserId !== actualTeacherId) {
    const err = new Error("Only the assigned teacher can dispute this class record.");
    err.statusCode = 403;
    throw err;
  }

  session.dispute = {
    isDisputed: true,
    disputeReason: reason.trim(),
    disputedAt: new Date(),
    disputeStatus: "Pending",
    resolutionRemark: "",
    resolvedBy: null,
    resolvedAt: null,
  };
  session.adjustmentReview.status = "Pending Review";
  await session.save();

  await writeAuditLog({
    campusId,
    entityType: "TeacherClassSession",
    entityId: session._id,
    action: "disputed",
    performedBy: teacherUser,
    changes: {
      before: { disputeStatus: "None" },
      after: { disputeStatus: "Pending", reason: reason.trim() },
    },
    reason: `Teacher requested review: ${reason.trim()}`,
  });

  await Alert.create({
    instituteId: teacherUser.instituteId || session.campusId,
    campusId,
    severity: "Info",
    title: "Teaching Record Dispute Submitted",
    message: `${teacherUser.name} submitted a dispute for ${session.subject} on ${moment.utc(session.date).format("YYYY-MM-DD")}: "${reason.trim()}"`,
    createdBy: teacherUser._id,
  });

  return session;
}

/**
 * Campus Manager resolves a teacher dispute.
 */
export async function resolveDispute(
  sessionId,
  campusId,
  managerUser,
  { decision, resolutionRemark = "", adjustedStatus = "Approved Adjustment", adjustedDeduction = 0 }
) {
  const session = await TeacherClassSession.findOne({ _id: sessionId, campusId });
  if (!session) {
    const err = new Error("Class session not found.");
    err.statusCode = 404;
    throw err;
  }

  const isApproved = decision === "Approve" || decision === "Approved";
  session.dispute.disputeStatus = isApproved ? "Approved" : "Rejected";
  session.dispute.resolutionRemark = resolutionRemark.trim();
  session.dispute.resolvedBy = managerUser._id;
  session.dispute.resolvedAt = new Date();

  const config = await getEffectiveTeachingConfig(campusId);

  if (isApproved) {
    session.status = adjustedStatus || "Approved Adjustment";
    session.creditValue = config.creditPerCompletedPeriod || 1.0;
    session.deductionValue = Number(adjustedDeduction) || 0;
    session.adjustmentReview.status = "Approved";
    session.adjustmentReview.reviewedBy = managerUser._id;
    session.adjustmentReview.reviewedAt = new Date();
    session.adjustmentReview.reviewRemark = resolutionRemark || "Dispute approved by campus manager";
  } else {
    session.dispute.disputeStatus = "Rejected";
    session.adjustmentReview.status = "Approved"; // Keep the deduction confirmed
    session.adjustmentReview.reviewedBy = managerUser._id;
    session.adjustmentReview.reviewedAt = new Date();
    session.adjustmentReview.reviewRemark = resolutionRemark || "Dispute rejected by manager";
  }

  await session.save();

  await writeAuditLog({
    campusId,
    entityType: "TeacherClassSession",
    entityId: session._id,
    action: "resolved",
    performedBy: managerUser,
    changes: {
      before: { disputeStatus: "Pending" },
      after: {
        disputeStatus: session.dispute.disputeStatus,
        status: session.status,
        deductionValue: session.deductionValue,
      },
    },
    reason: resolutionRemark || `Dispute ${session.dispute.disputeStatus}`,
  });

  return session;
}

/**
 * Campus Manager reviews/approves/rejects/adjusts a proposed deduction or bonus.
 */
export async function reviewSessionAdjustment(
  sessionId,
  campusId,
  managerUser,
  { action, remark = "", adjustedAmount }
) {
  const session = await TeacherClassSession.findOne({ _id: sessionId, campusId });
  if (!session) {
    const err = new Error("Class session not found.");
    err.statusCode = 404;
    throw err;
  }

  const prevReview = session.adjustmentReview.status;
  const isApproved = action === "Approve" || action === "Approved";
  const isRejected = action === "Reject" || action === "Rejected";
  const isAdjusted = action === "Adjust";

  session.adjustmentReview.reviewedBy = managerUser._id;
  session.adjustmentReview.reviewedAt = new Date();
  session.adjustmentReview.reviewRemark = remark.trim() || `${action} by Campus Manager`;

  if (isApproved) {
    session.adjustmentReview.status = "Approved";
    if (session.adjustmentReview.proposedDeduction > 0) {
      session.deductionValue = session.adjustmentReview.proposedDeduction;
    }
    if (session.adjustmentReview.proposedBonus > 0) {
      session.bonusValue = session.adjustmentReview.proposedBonus;
    }
  } else if (isAdjusted) {
    session.adjustmentReview.status = "Approved";
    const amount = Number(adjustedAmount);
    if (session.adjustmentReview.proposedDeduction > 0) {
      session.deductionValue = amount;
      session.adjustmentReview.proposedDeduction = amount;
    }
    if (session.adjustmentReview.proposedBonus > 0) {
      session.bonusValue = amount;
      session.adjustmentReview.proposedBonus = amount;
    }
  } else if (isRejected) {
    session.adjustmentReview.status = "Rejected";
    if (session.adjustmentReview.proposedDeduction > 0) {
      session.deductionValue = 0;
    }
    if (session.adjustmentReview.proposedBonus > 0) {
      session.bonusValue = 0;
    }
  }

  await session.save();

  await writeAuditLog({
    campusId,
    entityType: "SalaryAdjustmentReview",
    entityId: session._id,
    action: isApproved ? "approved" : isRejected ? "rejected" : "updated",
    performedBy: managerUser,
    changes: {
      before: { reviewStatus: prevReview },
      after: {
        reviewStatus: session.adjustmentReview.status,
        deductionValue: session.deductionValue,
        bonusValue: session.bonusValue,
      },
    },
    reason: remark || `Manager executed ${action}`,
  });

  return session;
}

/**
 * Assign substitute directly to a session and link with SubstituteAssignment.
 */
export async function assignSubstituteToSession(
  sessionId,
  campusId,
  managerUser,
  { substituteTeacherId, reason = "Teacher Absent", notes = "" }
) {
  const session = await TeacherClassSession.findOne({ _id: sessionId, campusId });
  if (!session) {
    const err = new Error("Class session not found.");
    err.statusCode = 404;
    throw err;
  }

  if (String(session.originalTeacherId) === String(substituteTeacherId)) {
    const err = new Error("Teacher cannot be assigned as a substitute for their own class.");
    err.statusCode = 400;
    throw err;
  }

  const subUser = await resolveTeacherUser(substituteTeacherId);
  if (!subUser) {
    const err = new Error("Selected substitute teacher does not exist.");
    err.statusCode = 404;
    throw err;
  }

  const config = await getEffectiveTeachingConfig(campusId);

  // Create or link SubstituteAssignment record
  const subAssignment = new SubstituteAssignment({
    campusId,
    date: session.date,
    period: session.period,
    startTime: session.startTime,
    endTime: session.endTime,
    className: session.className,
    section: session.section,
    subject: session.subject,
    originalTeacherId: session.originalTeacherId,
    substituteTeacherId: subUser._id,
    reason: reason || "Teacher Absent",
    status: "Assigned",
    notes: notes || "",
    assignedBy: managerUser._id,
    bonusEligible: true,
    bonusAmount: config.bonusPerSubstituteClass || 500,
  });

  await subAssignment.save();

  session.actualTeacherId = subUser._id;
  session.isSubstituted = true;
  session.substituteAssignmentId = subAssignment._id;
  session.status = "Substituted";
  session.creditValue = config.creditForSubstitution || 1.0;
  session.bonusValue = config.bonusPerSubstituteClass || 500;
  session.remarks = notes || `Substituted by ${subUser.name}`;
  session.adjustmentReview = {
    status: config.requireApprovalForSubstituteBonus ? "Pending Review" : "Approved",
    proposedBonus: session.bonusValue,
    proposedDeduction: 0,
    reviewRemark: `Substitute assigned: ${notes}`,
  };

  await session.save();

  await writeAuditLog({
    campusId,
    entityType: "SubstituteAssignment",
    entityId: subAssignment._id,
    action: "created",
    performedBy: managerUser,
    changes: {
      before: null,
      after: {
        originalTeacherId: session.originalTeacherId,
        substituteTeacherId: subUser._id,
        sessionId: session._id,
      },
    },
    reason: `Assigned substitute for period ${session.period} on ${moment.utc(session.date).format("YYYY-MM-DD")}`,
  });

  await Alert.create({
    instituteId: managerUser.instituteId || session.campusId,
    campusId,
    severity: "Info",
    title: "Substitute Duty Assigned",
    message: `${subUser.name} has been assigned to substitute ${session.subject} (Period ${session.period}) on ${moment.utc(session.date).format("YYYY-MM-DD")}.`,
    createdBy: managerUser._id,
  });

  return session;
}

/**
 * Get monthly summary metrics for a teacher.
 */
export async function getTeacherMonthlySummary(campusId, teacherUserId, monthInput) {
  const monthStr = monthInput || moment().format("YYYY-MM");
  const startMonth = moment.utc(`${monthStr}-01`).startOf("month").toDate();
  const endMonth = moment.utc(`${monthStr}-01`).endOf("month").toDate();

  const sessions = await TeacherClassSession.find({
    campusId,
    date: { $gte: startMonth, $lte: endMonth },
    $or: [{ originalTeacherId: teacherUserId }, { actualTeacherId: teacherUserId }],
  }).lean();

  let scheduledCount = 0;
  let completedCount = 0;
  let missedCount = 0;
  let absentCount = 0;
  let substitutedOutCount = 0;
  let substituteDutiesTaken = 0;
  let cancelledCount = 0;

  let regularCredits = 0;
  let substituteCredits = 0;
  let totalBonusEarned = 0;
  let pendingBonusAmount = 0;
  let approvedDeductionsTotal = 0;
  let pendingDeductionsTotal = 0;
  let pendingReviewsCount = 0;

  sessions.forEach((sess) => {
    const isOriginal = String(sess.originalTeacherId) === String(teacherUserId);
    const isActual = String(sess.actualTeacherId) === String(teacherUserId);

    if (isOriginal && !sess.isSubstituted) {
      scheduledCount++;
    } else if (isOriginal && sess.isSubstituted && !isActual) {
      substitutedOutCount++;
    }

    if (isActual && sess.isSubstituted && !isOriginal) {
      substituteDutiesTaken++;
    }

    if (sess.status === "Completed") {
      if (isActual) {
        completedCount++;
        if (sess.isSubstituted && !isOriginal) {
          substituteCredits += sess.creditValue || 1;
          if (sess.adjustmentReview?.status === "Approved") {
            totalBonusEarned += sess.bonusValue || 0;
          } else if (sess.adjustmentReview?.status === "Pending Review") {
            pendingBonusAmount += sess.adjustmentReview.proposedBonus || sess.bonusValue || 0;
            pendingReviewsCount++;
          }
        } else {
          regularCredits += sess.creditValue || 1;
        }
      }
    } else if (sess.status === "Missed") {
      if (isOriginal) {
        missedCount++;
        if (sess.adjustmentReview?.status === "Approved") {
          approvedDeductionsTotal += sess.deductionValue || 0;
        } else if (sess.adjustmentReview?.status === "Pending Review") {
          pendingDeductionsTotal += sess.adjustmentReview.proposedDeduction || sess.deductionValue || 0;
          pendingReviewsCount++;
        }
      }
    } else if (sess.status === "Absent") {
      if (isOriginal) {
        absentCount++;
        if (sess.adjustmentReview?.status === "Approved") {
          approvedDeductionsTotal += sess.deductionValue || 0;
        } else if (sess.adjustmentReview?.status === "Pending Review") {
          pendingDeductionsTotal += sess.adjustmentReview.proposedDeduction || sess.deductionValue || 0;
          pendingReviewsCount++;
        }
      }
    } else if (sess.status === "Cancelled") {
      cancelledCount++;
    }

    if (sess.dispute?.isDisputed && sess.dispute?.disputeStatus === "Pending") {
      pendingReviewsCount++;
    }
  });

  const totalCredits = regularCredits + substituteCredits;
  const netSalaryAdjustment = totalBonusEarned - approvedDeductionsTotal;

  // Fetch teacher salary profile
  let teacherProfile = await TeacherProfile.findOne({ user: teacherUserId }).lean();
  let teacherProfileId = teacherProfile?._id || teacherUserId;
  let salaryProfile = await TeacherSalaryProfile.findOne({
    campusId,
    $or: [{ teacherProfileId }, { teacherProfileId: teacherUserId }],
  }).lean();

  const baseSalary = salaryProfile?.baseSalary || 0;
  const allowancesTotal = (salaryProfile?.allowances || []).reduce((sum, a) => sum + (a.amount || 0), 0);
  const grossSalary = baseSalary + allowancesTotal;
  const estimatedNetSalary = grossSalary + netSalaryAdjustment;

  return {
    month: monthStr,
    scheduledCount,
    completedCount,
    missedCount,
    absentCount,
    substitutedOutCount,
    substituteDutiesTaken,
    cancelledCount,
    regularCredits,
    substituteCredits,
    totalCredits,
    totalBonusEarned,
    pendingBonusAmount,
    approvedDeductionsTotal,
    pendingDeductionsTotal,
    pendingReviewsCount,
    netSalaryAdjustment,
    baseSalary,
    grossSalary,
    estimatedNetSalary,
  };
}

/**
 * Get teaching records summary for all teachers in a campus (Campus Manager Overview).
 */
export async function getCampusTeachingPerformance(campusId, filters = {}) {
  const monthStr = filters.month || moment().format("YYYY-MM");
  const startMonth = moment.utc(`${monthStr}-01`).startOf("month").toDate();
  const endMonth = moment.utc(`${monthStr}-01`).endOf("month").toDate();

  const teachers = await User.find({
    campusId,
    role: { $in: ["teacher", "faculty"] },
    status: { $ne: "Inactive" },
  })
    .select("_id name email department designation phone")
    .sort({ name: 1 })
    .lean();

  const sessions = await TeacherClassSession.find({
    campusId,
    date: { $gte: startMonth, $lte: endMonth },
  }).lean();

  const teacherMap = new Map();
  teachers.forEach((t) => {
    teacherMap.set(String(t._id), {
      teacherId: t._id,
      name: t.name,
      email: t.email,
      department: t.department || "Academics",
      designation: t.designation || "Faculty",
      scheduled: 0,
      completed: 0,
      missed: 0,
      absent: 0,
      substitutedOut: 0,
      substitutionsTaken: 0,
      credits: 0,
      bonusesEarned: 0,
      deductionsApproved: 0,
      pendingReviews: 0,
    });
  });

  sessions.forEach((s) => {
    const origId = String(s.originalTeacherId);
    const actId = String(s.actualTeacherId);

    const origStats = teacherMap.get(origId);
    const actStats = teacherMap.get(actId);

    if (origStats) {
      if (!s.isSubstituted) {
        origStats.scheduled++;
      } else {
        origStats.substitutedOut++;
      }

      if (s.status === "Missed") {
        origStats.missed++;
        if (s.adjustmentReview?.status === "Approved") {
          origStats.deductionsApproved += s.deductionValue || 0;
        } else if (s.adjustmentReview?.status === "Pending Review") {
          origStats.pendingReviews++;
        }
      } else if (s.status === "Absent") {
        origStats.absent++;
        if (s.adjustmentReview?.status === "Approved") {
          origStats.deductionsApproved += s.deductionValue || 0;
        } else if (s.adjustmentReview?.status === "Pending Review") {
          origStats.pendingReviews++;
        }
      }
      if (s.dispute?.isDisputed && s.dispute?.disputeStatus === "Pending") {
        origStats.pendingReviews++;
      }
    }

    if (actStats) {
      if (s.isSubstituted && origId !== actId) {
        actStats.substitutionsTaken++;
      }
      if (s.status === "Completed") {
        actStats.completed++;
        actStats.credits += s.creditValue || 1;
        if (s.isSubstituted && origId !== actId) {
          if (s.adjustmentReview?.status === "Approved") {
            actStats.bonusesEarned += s.bonusValue || 0;
          } else if (s.adjustmentReview?.status === "Pending Review") {
            actStats.pendingReviews++;
          }
        }
      }
    }
  });

  const teacherSummaries = Array.from(teacherMap.values());

  const totals = teacherSummaries.reduce(
    (acc, curr) => ({
      scheduled: acc.scheduled + curr.scheduled,
      completed: acc.completed + curr.completed,
      missed: acc.missed + curr.missed,
      absent: acc.absent + curr.absent,
      substitutionsTaken: acc.substitutionsTaken + curr.substitutionsTaken,
      credits: acc.credits + curr.credits,
      bonusesEarned: acc.bonusesEarned + curr.bonusesEarned,
      deductionsApproved: acc.deductionsApproved + curr.deductionsApproved,
      pendingReviews: acc.pendingReviews + curr.pendingReviews,
    }),
    {
      scheduled: 0,
      completed: 0,
      missed: 0,
      absent: 0,
      substitutionsTaken: 0,
      credits: 0,
      bonusesEarned: 0,
      deductionsApproved: 0,
      pendingReviews: 0,
    }
  );

  return {
    month: monthStr,
    totalTeachers: teachers.length,
    totals,
    teachers: teacherSummaries,
  };
}

/**
 * Get unified list for Campus Manager Salary Review Center.
 * Returns items where adjustmentReview.status === 'Pending Review' or dispute.disputeStatus === 'Pending'.
 */
export async function getSalaryReviewCenterItems(campusId, filters = {}) {
  const query = { campusId };

  if (filters.status && filters.status !== "All") {
    if (filters.status === "Pending") {
      query.$or = [
        { "adjustmentReview.status": "Pending Review" },
        { "dispute.disputeStatus": "Pending" },
      ];
    } else {
      query["adjustmentReview.status"] = filters.status;
    }
  } else {
    query.$or = [
      { "adjustmentReview.status": "Pending Review" },
      { "dispute.disputeStatus": "Pending" },
      { "adjustmentReview.status": "Approved" },
      { "adjustmentReview.status": "Rejected" },
    ];
  }

  if (filters.month) {
    const startMonth = moment.utc(`${filters.month}-01`).startOf("month").toDate();
    const endMonth = moment.utc(`${filters.month}-01`).endOf("month").toDate();
    query.date = { $gte: startMonth, $lte: endMonth };
  }

  const items = await TeacherClassSession.find(query)
    .populate("originalTeacherId", "name email department designation")
    .populate("actualTeacherId", "name email department designation")
    .sort({ date: -1, period: 1 })
    .lean();

  return items.map((item) => {
    let type = "Deduction";
    let amount = item.adjustmentReview?.proposedDeduction || item.deductionValue || 0;
    let teacher = item.originalTeacherId;

    if (item.isSubstituted && item.actualTeacherId?._id !== item.originalTeacherId?._id) {
      if (item.adjustmentReview?.proposedBonus > 0 || item.bonusValue > 0) {
        type = "Bonus";
        amount = item.adjustmentReview?.proposedBonus || item.bonusValue || 0;
        teacher = item.actualTeacherId;
      }
    }

    if (item.dispute?.isDisputed) {
      type = "Teacher Dispute";
    }

    return {
      _id: item._id,
      date: item.date,
      dayOfWeek: item.dayOfWeek,
      period: item.period,
      startTime: item.startTime,
      endTime: item.endTime,
      className: item.className,
      section: item.section,
      subject: item.subject,
      type,
      teacher,
      originalTeacher: item.originalTeacherId,
      actualTeacher: item.actualTeacherId,
      status: item.status,
      reviewStatus: item.adjustmentReview?.status || "None",
      disputeStatus: item.dispute?.disputeStatus || "None",
      disputeReason: item.dispute?.disputeReason || "",
      amount,
      proposedDeduction: item.adjustmentReview?.proposedDeduction || item.deductionValue,
      proposedBonus: item.adjustmentReview?.proposedBonus || item.bonusValue,
      remarks: item.remarks,
      reviewRemark: item.adjustmentReview?.reviewRemark,
      isSubstituted: item.isSubstituted,
    };
  });
}

/**
 * Get detailed class session timeline for a single teacher.
 */
export async function getTeacherSessionTimeline(campusId, teacherUserId, filters = {}) {
  const query = {
    campusId,
    $or: [{ originalTeacherId: teacherUserId }, { actualTeacherId: teacherUserId }],
  };

  if (filters.month) {
    const start = moment.utc(`${filters.month}-01`).startOf("month").toDate();
    const end = moment.utc(`${filters.month}-01`).endOf("month").toDate();
    query.date = { $gte: start, $lte: end };
  } else if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = normalizeSessionDate(filters.startDate);
    if (filters.endDate) query.date.$lte = moment.utc(filters.endDate).endOf("day").toDate();
  }

  const timeline = await TeacherClassSession.find(query)
    .populate("originalTeacherId", "name email department designation")
    .populate("actualTeacherId", "name email department designation")
    .populate("substituteAssignmentId")
    .sort({ date: -1, period: 1 })
    .lean();

  return timeline;
}

const classSessionService = {
  generateDailySessions,
  listTeacherSessions,
  markSessionStatus,
  requestDispute,
  resolveDispute,
  reviewSessionAdjustment,
  assignSubstituteToSession,
  getTeacherMonthlySummary,
  getCampusTeachingPerformance,
  getSalaryReviewCenterItems,
  getTeacherSessionTimeline,
  getEffectiveTeachingConfig,
};

export default classSessionService;
