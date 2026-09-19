import { TeacherSalaryProfile } from '../models/teacherSalaryProfile.model.js';
import { TeacherProfile } from '../models/profile.model.js';

/**
 * List all salary profiles for a given campus.
 * @param {string} campusId - Campus ObjectId
 * @returns {Promise<Array>} - Array of profiles
 */
export const listProfiles = async (campusId) => {
  return TeacherSalaryProfile.find({ campusId })
    .select("teacherProfileId baseSalary allowances taxDeduction otherDeduction isActive")
    .populate({
      path: "teacherProfileId",
      select: "user employeeId department designation",
      populate: { path: "user", select: "name email" },
    })
    .lean();
};

/**
 * Get only teachers that belong to the current campus. This is deliberately
 * separate from the profile list so opening Salary Profiles never waits for
 * the selector data.
 */
export const listCampusTeachers = async (campusId) => {
  const teachers = await TeacherProfile.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.campusId": campusId } },
    {
      $project: {
        employeeId: 1,
        department: 1,
        designation: 1,
        name: "$user.name",
        email: "$user.email",
      },
    },
    { $sort: { name: 1, employeeId: 1 } },
  ]);
  return teachers;
};

/**
 * Create or update a teacher's salary profile.
 * @param {string} campusId - Campus ObjectId
 * @param {string} teacherId - TeacherProfile ObjectId
 * @param {Object} payload - Profile data
 * @returns {Promise<Object>} - Upserted profile
 */
export const upsertProfile = async (campusId, teacherId, payload) => {
  const filter = { campusId, teacherProfileId: teacherId };
  const update = { $set: { ...payload, campusId, teacherProfileId: teacherId } };
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  const profile = await TeacherSalaryProfile.findOneAndUpdate(filter, update, options).lean();
  return profile;
};
