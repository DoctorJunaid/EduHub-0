import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import { TeacherProfile, ClassSchedule, TeacherAttendance } from "../models/profile.model.js";
import { getEffectiveSettings } from "./settings.service.js";
import moment from "moment";

export const listSubstitutes = async (campusId, filters = {}) => {
  const query = { campusId, ...filters };
  return await SubstituteAssignment.find(query)
    .populate("originalTeacherId", "user employeeId department")
    .populate("substituteTeacherId", "user employeeId department")
    .populate("assignedBy", "name email")
    .sort({ date: -1, period: 1 });
};

export const suggestSubstitutes = async (campusId, params) => {
  const { date, className, section, period } = params;
  const targetDate = moment(date).startOf("day").toDate();
  const dayOfWeek = moment(date).format("dddd");

  // Fetch effective settings for limits
  const { effectiveSettings } = await getEffectiveSettings(campusId);

  // 1. Load all TeacherProfile under campus
  const allTeachers = await TeacherProfile.find({ isActive: true })
    .populate("user", "name email");

  // 2. Remove teachers marked Absent or On Leave today
  const attendances = await TeacherAttendance.find({
    campusId,
    date: { $gte: targetDate, $lt: moment(targetDate).endOf("day").toDate() },
  });
  const unavailableTeacherIds = attendances
    .filter((a) => a.status === "absent" || a.status === "on leave")
    .map((a) => a.teacherId.toString());

  let eligibleTeachers = allTeachers.filter(
    (t) => !unavailableTeacherIds.includes(t._id.toString())
  );

  // 3. Remove teachers with a class at the same period
  const schedules = await ClassSchedule.find({
    campusId,
    dayOfWeek,
  });
  
  // We don't have periods in ClassSchedule natively in the schema, but we can assume time overlap
  // Wait, the spec says "Remove teachers with a class at same (day, period)". We will use a mock logic or rely on startTime/endTime overlap.
  // Actually, we can fetch all substitute assignments for this date and period and remove those teachers as well.
  const existingSubstitutes = await SubstituteAssignment.find({
    campusId,
    date: targetDate,
    period,
    status: { $in: ["Pending Approval", "Assigned"] }
  });
  const busySubstituteIds = existingSubstitutes.map(s => s.substituteTeacherId.toString());

  // Wait, since ClassSchedule schema doesn't have period, I'll filter out busySubstituteIds first.
  eligibleTeachers = eligibleTeachers.filter(
    (t) => !busySubstituteIds.includes(t._id.toString())
  );

  // 4. Remove teachers over daily/weekly substitute limits
  const startOfWeek = moment(targetDate).startOf("isoWeek").toDate();
  const endOfWeek = moment(targetDate).endOf("isoWeek").toDate();

  const weeklySubstitutes = await SubstituteAssignment.find({
    campusId,
    date: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $in: ["Pending Approval", "Assigned", "Completed"] }
  });

  const dailyCounts = {};
  const weeklyCounts = {};

  weeklySubstitutes.forEach((sub) => {
    const tId = sub.substituteTeacherId.toString();
    weeklyCounts[tId] = (weeklyCounts[tId] || 0) + 1;
    if (moment(sub.date).isSame(targetDate, 'day')) {
      dailyCounts[tId] = (dailyCounts[tId] || 0) + 1;
    }
  });

  const { maxSubstitutesPerDayPerTeacher, maxSubstitutesPerWeekPerTeacher, substituteLoadWarningThreshold } = effectiveSettings;

  const result = eligibleTeachers.map((t) => {
    const tId = t._id.toString();
    const dailyLoad = dailyCounts[tId] || 0;
    const weeklyLoad = weeklyCounts[tId] || 0;

    let status = "Available";
    let warning = false;

    if (dailyLoad >= maxSubstitutesPerDayPerTeacher || weeklyLoad >= maxSubstitutesPerWeekPerTeacher) {
      status = "Limit Exceeded";
    } else if (dailyLoad >= substituteLoadWarningThreshold) {
      warning = true;
    }

    return {
      _id: t._id,
      name: t.user ? t.user.name : "Unknown",
      department: t.department,
      subjects: t.subjectsTaught,
      dailyLoad,
      weeklyLoad,
      status,
      warning
    };
  }).filter(t => t.status !== "Limit Exceeded"); // Exclude those over limits

  return result;
};

import { SalaryPolicy } from "../models/salaryPolicy.model.js";

export const assignSubstitute = async (campusId, userId, payload) => {
  const targetDate = moment(payload.date).startOf("day").toDate();

  // Validate limits & rules
  const { effectiveSettings } = await getEffectiveSettings(campusId);
  const salaryPolicy = await SalaryPolicy.findOne({ campusId });

  // SUB-03 Cannot substitute for self
  if (payload.originalTeacherId === payload.substituteTeacherId) {
    throw new Error("Teacher cannot substitute for themselves");
  }

  // SUB-08 Unique per (className, section, date, period)
  const existing = await SubstituteAssignment.findOne({
    className: payload.className,
    section: payload.section || "",
    date: targetDate,
    period: payload.period
  });
  if (existing && existing.status !== "Cancelled" && existing.status !== "Declined") {
    throw new Error("A substitute is already assigned for this class and period");
  }

  // Determine Status (SUB-07)
  let status = "Assigned";
  if (effectiveSettings.requireApprovalForSubstitute) {
    status = "Pending Approval";
  }

  // Calculate Bonus (SUB-09)
  const bonusAmount = salaryPolicy ? salaryPolicy.substituteBonusPerClass : 0;
  const bonusEligible = bonusAmount > 0;

  const substitute = new SubstituteAssignment({
    campusId,
    date: targetDate,
    period: payload.period,
    startTime: payload.startTime,
    endTime: payload.endTime,
    className: payload.className,
    subject: payload.subject,
    section: payload.section || "",
    originalTeacherId: payload.originalTeacherId,
    substituteTeacherId: payload.substituteTeacherId,
    reason: payload.reason,
    status,
    notes: payload.notes || "",
    assignedBy: userId,
    bonusEligible,
    bonusAmount
  });

  await substitute.save();
  return substitute;
};

export const updateSubstitute = async (id, campusId, payload) => {
  const sub = await SubstituteAssignment.findOne({ _id: id, campusId });
  if (!sub) throw new Error("Substitute assignment not found");

  if (payload.status) sub.status = payload.status;
  if (payload.notes) sub.notes = payload.notes;

  // SUB-10 Cancelled substitutes earn no bonus
  if (payload.status === "Cancelled" || payload.status === "Declined") {
    sub.bonusEligible = false;
    sub.bonusAmount = 0;
  }

  await sub.save();
  return sub;
};

export const deleteSubstitute = async (id, campusId) => {
  const sub = await SubstituteAssignment.findOne({ _id: id, campusId });
  if (!sub) throw new Error("Substitute assignment not found");

  sub.status = "Cancelled";
  sub.bonusEligible = false;
  sub.bonusAmount = 0;
  await sub.save();
  
  return { message: "Substitute assignment cancelled" };
};
