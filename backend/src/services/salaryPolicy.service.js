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

  // Update only allowed fields
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
    "examDutyBonus"
  ];

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      policy[field] = payload[field];
    }
  });

  await policy.save();
  return policy;
};
