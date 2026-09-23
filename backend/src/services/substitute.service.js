import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import { TeacherProfile, ClassSchedule } from "../models/profile.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import Timetable from "../models/timetable.model.js";
import User from "../models/user.model.js";
import { SalaryPolicy } from "../models/salaryPolicy.model.js";
import { getEffectiveSettings } from "./settings.service.js";
import moment from "moment";

/**
 * Helper to resolve teacher information whether the stored ID is a TeacherProfile ID or a User ID.
 */
async function resolveTeacherRef(id) {
  if (!id) return null;

  // 1. Check if ID matches TeacherProfile
  try {
    const profile = await TeacherProfile.findById(id)
      .populate("user", "name email avatar department designation phone")
      .lean();
    if (profile) {
      return {
        _id: profile._id,
        name: profile.user?.name || profile.employeeId || "Teacher",
        email: profile.user?.email || "",
        avatar: profile.user?.avatar || "",
        department: profile.department || profile.user?.department || "Faculty",
        designation: profile.designation || profile.user?.designation || "Teacher",
        employeeId: profile.employeeId || "",
        user: profile.user || { name: profile.employeeId || "Teacher" },
      };
    }
  } catch {
    // Continue to user lookup if not a valid profile ID
  }

  // 2. Check if ID matches User directly
  try {
    const user = await User.findById(id)
      .select("name email avatar department designation phone")
      .lean();
    if (user) {
      const userProfile = await TeacherProfile.findOne({ user: user._id }).lean();
      return {
        _id: user._id,
        name: user.name || "Teacher",
        email: user.email || "",
        avatar: user.avatar || "",
        department: userProfile?.department || user.department || "Faculty",
        designation: userProfile?.designation || user.designation || "Teacher",
        employeeId: userProfile?.employeeId || "",
        user: { name: user.name, email: user.email, avatar: user.avatar },
      };
    }
  } catch {
    // Failed to find user
  }

  return { _id: id, name: "Staff Member", user: { name: "Staff Member" } };
}

/**
 * List all substitute assignments for a campus with optional filters.
 */
export const listSubstitutes = async (campusId, filters = {}) => {
  const query = { campusId };

  // Date filtering
  if (filters.date) {
    const targetDate = moment.utc(filters.date).startOf("day").toDate();
    const nextDate = moment.utc(filters.date).endOf("day").toDate();
    query.date = { $gte: targetDate, $lte: nextDate };
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.teacherId) {
    query.$or = [
      { originalTeacherId: filters.teacherId },
      { substituteTeacherId: filters.teacherId },
    ];
  }

  const assignments = await SubstituteAssignment.find(query)
    .populate("assignedBy", "name email role")
    .sort({ date: -1, period: 1 })
    .lean();

  // Resolve all teacher references accurately
  const populatedAssignments = await Promise.all(
    assignments.map(async (a) => {
      const [origTeacher, subTeacher] = await Promise.all([
        resolveTeacherRef(a.originalTeacherId),
        resolveTeacherRef(a.substituteTeacherId),
      ]);
      return {
        ...a,
        originalTeacherId: origTeacher,
        substituteTeacherId: subTeacher,
      };
    })
  );

  return populatedAssignments;
};

/**
 * Suggest available substitutes for a specific class, date, and period.
 */
export const suggestSubstitutes = async (campusId, params) => {
  const { date, className, section, period } = params;
  const targetDate = moment.utc(date).startOf("day").toDate();
  const endOfDay = moment.utc(date).endOf("day").toDate();
  const dayOfWeek = moment.utc(date).format("dddd");
  const dayOfWeekIndex = moment.utc(date).isoWeekday(); // 1 = Monday, 7 = Sunday

  // 1. Fetch effective settings for limits
  const { effectiveSettings } = await getEffectiveSettings(campusId);

  // 2. Load all active teachers under this campus
  const campusUsers = await User.find({
    campusId,
    role: { $in: ["teacher", "faculty"] },
    status: { $ne: "Inactive" },
  }).select("_id name email department designation");

  const campusUserIds = campusUsers.map((u) => u._id);

  const allTeacherProfiles = await TeacherProfile.find({
    user: { $in: campusUserIds },
    isActive: true,
  }).populate("user", "name email avatar department designation");

  // Fallback: If no TeacherProfiles exist, use User records directly
  let teachersList = [];
  if (allTeacherProfiles.length > 0) {
    teachersList = allTeacherProfiles.map((tp) => ({
      _id: tp._id,
      userId: tp.user?._id?.toString() || tp.user?.toString(),
      name: tp.user?.name || tp.employeeId || "Teacher",
      email: tp.user?.email || "",
      employeeId: tp.employeeId || "",
      department: tp.department || tp.user?.department || "General",
      designation: tp.designation || tp.user?.designation || "Teacher",
      subjects: tp.subjectsTaught || [],
    }));
  } else {
    teachersList = campusUsers.map((u) => ({
      _id: u._id,
      userId: u._id.toString(),
      name: u.name,
      email: u.email,
      employeeId: "",
      department: u.department || "General",
      designation: u.designation || "Teacher",
      subjects: [],
    }));
  }

  // 3. Remove teachers marked Absent or On Leave in TeacherAttendance today
  const attendances = await TeacherAttendance.find({
    campusId,
    date: { $gte: targetDate, $lte: endOfDay },
  });

  const unavailableIds = new Set();
  attendances.forEach((att) => {
    const statusLower = (att.status || "").toLowerCase();
    if (statusLower === "absent" || statusLower === "on leave" || statusLower === "excused") {
      if (att.teacherProfileId) {
        unavailableIds.add(att.teacherProfileId.toString());
      }
    }
  });

  let eligibleTeachers = teachersList.filter((t) => {
    const idStr = t._id.toString();
    const userIdStr = t.userId ? t.userId.toString() : "";
    return !unavailableIds.has(idStr) && !unavailableIds.has(userIdStr);
  });

  // 4. Remove teachers already assigned as substitutes for this date and period
  const existingSubstitutes = await SubstituteAssignment.find({
    campusId,
    date: { $gte: targetDate, $lte: endOfDay },
    period: Number(period),
    status: { $in: ["Pending Approval", "Assigned", "Completed"] },
  });

  const busySubstituteIds = new Set(
    existingSubstitutes.map((s) => s.substituteTeacherId.toString())
  );

  eligibleTeachers = eligibleTeachers.filter((t) => {
    const idStr = t._id.toString();
    const userIdStr = t.userId ? t.userId.toString() : "";
    return !busySubstituteIds.has(idStr) && !busySubstituteIds.has(userIdStr);
  });

  // 5. Calculate daily and weekly substitute loads
  const startOfWeek = moment.utc(targetDate).startOf("isoWeek").toDate();
  const endOfWeek = moment.utc(targetDate).endOf("isoWeek").toDate();

  const weeklySubstitutes = await SubstituteAssignment.find({
    campusId,
    date: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $in: ["Pending Approval", "Assigned", "Completed"] },
  });

  const dailyCounts = {};
  const weeklyCounts = {};

  weeklySubstitutes.forEach((sub) => {
    const tId = sub.substituteTeacherId.toString();
    weeklyCounts[tId] = (weeklyCounts[tId] || 0) + 1;
    if (moment.utc(sub.date).isSame(targetDate, "day")) {
      dailyCounts[tId] = (dailyCounts[tId] || 0) + 1;
    }
  });

  const {
    maxSubstitutesPerDayPerTeacher = 4,
    maxSubstitutesPerWeekPerTeacher = 15,
    substituteLoadWarningThreshold = 3,
  } = effectiveSettings;

  // 6. Format result and filter out teachers over limits
  const results = eligibleTeachers
    .map((t) => {
      const tId = t._id.toString();
      const uId = t.userId ? t.userId.toString() : "";
      const dailyLoad = (dailyCounts[tId] || 0) + (dailyCounts[uId] || 0);
      const weeklyLoad = (weeklyCounts[tId] || 0) + (weeklyCounts[uId] || 0);

      let status = "Available";
      let warning = false;

      if (
        dailyLoad >= maxSubstitutesPerDayPerTeacher ||
        weeklyLoad >= maxSubstitutesPerWeekPerTeacher
      ) {
        status = "Limit Exceeded";
      } else if (dailyLoad >= substituteLoadWarningThreshold) {
        warning = true;
      }

      return {
        _id: t._id,
        name: t.name,
        email: t.email,
        employeeId: t.employeeId,
        department: t.department,
        designation: t.designation,
        subjects: t.subjects,
        dailyLoad,
        weeklyLoad,
        status,
        warning,
      };
    })
    .filter((t) => t.status !== "Limit Exceeded");

  return results;
};

/**
 * Assign a substitute teacher with comprehensive limit enforcement and bonus calculation.
 */
export const assignSubstitute = async (campusId, userId, payload) => {
  const targetDate = moment.utc(payload.date).startOf("day").toDate();
  const endOfDay = moment.utc(payload.date).endOf("day").toDate();

  const { effectiveSettings } = await getEffectiveSettings(campusId);
  const salaryPolicy = await SalaryPolicy.findOne({ campusId });

  // 1. Validation: Cannot substitute for self
  if (payload.originalTeacherId.toString() === payload.substituteTeacherId.toString()) {
    const err = new Error("Teacher cannot substitute for themselves");
    err.statusCode = 400;
    throw err;
  }

  // 2. Validation: Unique per (className, section, date, period)
  const existingClassAssignment = await SubstituteAssignment.findOne({
    campusId,
    className: payload.className.trim(),
    section: (payload.section || "").trim(),
    date: { $gte: targetDate, $lte: endOfDay },
    period: Number(payload.period),
  });

  if (
    existingClassAssignment &&
    existingClassAssignment.status !== "Cancelled" &&
    existingClassAssignment.status !== "Declined"
  ) {
    const err = new Error("A substitute is already assigned for this class and period");
    err.statusCode = 409;
    throw err;
  }

  // 3. Validation: Substitute cannot be double-booked at the same date and period
  const existingTeacherDuty = await SubstituteAssignment.findOne({
    campusId,
    substituteTeacherId: payload.substituteTeacherId,
    date: { $gte: targetDate, $lte: endOfDay },
    period: Number(payload.period),
    status: { $in: ["Pending Approval", "Assigned", "Completed"] },
  });

  if (existingTeacherDuty) {
    const err = new Error(
      `Selected teacher is already assigned as a substitute for period ${payload.period}`
    );
    err.statusCode = 400;
    throw err;
  }

  // 4. Enforce Daily & Weekly substitute limits
  const startOfWeek = moment.utc(targetDate).startOf("isoWeek").toDate();
  const endOfWeek = moment.utc(targetDate).endOf("isoWeek").toDate();

  const [dailyCount, weeklyCount] = await Promise.all([
    SubstituteAssignment.countDocuments({
      campusId,
      substituteTeacherId: payload.substituteTeacherId,
      date: { $gte: targetDate, $lte: endOfDay },
      status: { $in: ["Pending Approval", "Assigned", "Completed"] },
    }),
    SubstituteAssignment.countDocuments({
      campusId,
      substituteTeacherId: payload.substituteTeacherId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
      status: { $in: ["Pending Approval", "Assigned", "Completed"] },
    }),
  ]);

  const maxDaily = effectiveSettings.maxSubstitutesPerDayPerTeacher || 4;
  const maxWeekly = effectiveSettings.maxSubstitutesPerWeekPerTeacher || 15;
  const warningThreshold = effectiveSettings.substituteLoadWarningThreshold || 3;

  if (dailyCount >= maxDaily) {
    const err = new Error(
      `Teacher has reached the maximum daily substitute limit (${maxDaily} duties/day)`
    );
    err.statusCode = 400;
    err.code = "LIMIT_EXCEEDED_DAY";
    throw err;
  }

  if (weeklyCount >= maxWeekly) {
    const err = new Error(
      `Teacher has reached the maximum weekly substitute limit (${maxWeekly} duties/week)`
    );
    err.statusCode = 400;
    err.code = "LIMIT_EXCEEDED_WEEK";
    throw err;
  }

  // 5. Determine initial status
  let status = "Assigned";
  if (effectiveSettings.requireApprovalForSubstitute) {
    status = "Pending Approval";
  }

  // 6. Calculate bonus
  const bonusAmount = salaryPolicy ? salaryPolicy.substituteBonusPerClass || 0 : 0;
  const bonusEligible = bonusAmount > 0;

  const substitute = new SubstituteAssignment({
    campusId,
    date: targetDate,
    period: Number(payload.period),
    startTime: payload.startTime || "08:00",
    endTime: payload.endTime || "08:45",
    className: payload.className.trim(),
    subject: payload.subject.trim(),
    section: (payload.section || "").trim(),
    originalTeacherId: payload.originalTeacherId,
    substituteTeacherId: payload.substituteTeacherId,
    reason: payload.reason || "Teacher Absent",
    status,
    notes: payload.notes || "",
    assignedBy: userId,
    bonusEligible,
    bonusAmount,
  });

  await substitute.save();

  // Return doc with optional warning if load is approaching threshold
  let warning = null;
  if (dailyCount + 1 >= warningThreshold) {
    warning = `Notice: Teacher is now at ${dailyCount + 1}/${maxDaily} daily substitute duties.`;
  }

  return { doc: substitute, warning };
};

/**
 * Update an existing substitute assignment.
 */
export const updateSubstitute = async (id, campusId, payload) => {
  const sub = await SubstituteAssignment.findOne({ _id: id, campusId });
  if (!sub) {
    const err = new Error("Substitute assignment not found");
    err.statusCode = 404;
    throw err;
  }

  if (payload.status) sub.status = payload.status;
  if (payload.notes !== undefined) sub.notes = payload.notes;
  if (payload.period) sub.period = Number(payload.period);
  if (payload.startTime) sub.startTime = payload.startTime;
  if (payload.endTime) sub.endTime = payload.endTime;
  if (payload.subject) sub.subject = payload.subject;

  // If status is cancelled or declined, remove bonus eligibility
  if (payload.status === "Cancelled" || payload.status === "Declined") {
    sub.bonusEligible = false;
    sub.bonusAmount = 0;
  }

  await sub.save();
  return sub;
};

/**
 * Delete / cancel a substitute assignment.
 */
export const deleteSubstitute = async (id, campusId) => {
  const sub = await SubstituteAssignment.findOne({ _id: id, campusId });
  if (!sub) {
    const err = new Error("Substitute assignment not found");
    err.statusCode = 404;
    throw err;
  }

  sub.status = "Cancelled";
  sub.bonusEligible = false;
  sub.bonusAmount = 0;
  await sub.save();

  return { message: "Substitute assignment cancelled successfully" };
};
