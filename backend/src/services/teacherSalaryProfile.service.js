import { TeacherSalaryProfile } from '../models/teacherSalaryProfile.model.js';

/**
 * List all salary profiles for a given campus.
 * @param {string} campusId - Campus ObjectId
 * @returns {Promise<Array>} - Array of profiles
 */
export const listProfiles = async (campusId) => {
  return TeacherSalaryProfile.find({ campusId })
    .populate({
      path: "teacherProfileId",
      select: "user employeeId department designation",
      populate: { path: "user", select: "name email" },
    })
    .lean();
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
