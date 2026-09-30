import { SalaryPolicy } from "../models/salaryPolicy.model.js";

export const getPolicy = async (campusId) => {
  let policy = await SalaryPolicy.findOne({ campusId });
  
  if (!policy) {
    policy = await SalaryPolicy.create({ campusId });
  }
  
  return policy;
};

export const updatePolicy = async (campusId, payload) => {
  let policy = await SalaryPolicy.findOne({ campusId });
  
  if (!policy) {
    policy = new SalaryPolicy({ campusId });
  }

  // If payload contains version data, add a new version
  if (payload.newVersion) {
    policy.versions.push({
      versionName: payload.newVersion.versionName || "New Version",
      effectiveDate: payload.newVersion.effectiveDate || Date.now(),
      missedClassDeductionRules: payload.newVersion.missedClassDeductionRules || [],
      absentDayDeductionRules: payload.newVersion.absentDayDeductionRules || [],
      substituteBonusRules: payload.newVersion.substituteBonusRules || [],
      workingDaysPerMonth: payload.newVersion.workingDaysPerMonth ?? policy.workingDaysPerMonth,
      unpaidAbsentMultiplier: payload.newVersion.unpaidAbsentMultiplier ?? policy.unpaidAbsentMultiplier,
      unpaidLeaveMultiplier: payload.newVersion.unpaidLeaveMultiplier ?? policy.unpaidLeaveMultiplier,
      halfDayMultiplier: payload.newVersion.halfDayMultiplier ?? policy.halfDayMultiplier,
      lateCountForHalfDay: payload.newVersion.lateCountForHalfDay ?? policy.lateCountForHalfDay,
      lateHalfDayPenalty: payload.newVersion.lateHalfDayPenalty ?? policy.lateHalfDayPenalty,
      earlyLeaveMultiplier: payload.newVersion.earlyLeaveMultiplier ?? policy.earlyLeaveMultiplier,
      perfectAttendanceBonus: payload.newVersion.perfectAttendanceBonus ?? policy.perfectAttendanceBonus,
      extraClassBonus: payload.newVersion.extraClassBonus ?? policy.extraClassBonus,
      examDutyBonus: payload.newVersion.examDutyBonus ?? policy.examDutyBonus,
    });
    // set as active
    policy.activeVersionId = policy.versions[policy.versions.length - 1]._id;
  }

  // Update legacy allowed fields if provided directly
  const allowedFields = [
    "workingDaysPerMonth",
    "unpaidAbsentMultiplier",
    "unpaidLeaveMultiplier",
    "halfDayMultiplier",
    "lateCountForHalfDay",
    "lateHalfDayPenalty",
    "earlyLeaveMultiplier",
    "substituteBonusPerClass",
    "perfectAttendanceBonus",
    "extraClassBonus",
    "examDutyBonus",
    "activeVersionId"
  ];

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      policy[field] = payload[field];
    }
  });

  await policy.save();
  return policy;
};
