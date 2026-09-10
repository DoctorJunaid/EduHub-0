import { TeacherProfile, StudentProfile } from "../models/profile.model.js";

class CampusAdminService {
  // --- Teacher Operations ---
  async createTeacherProfile(data) {
    const existing = await TeacherProfile.findOne({
      employeeId: data.employeeId,
    });
    if (existing)
      throw new Error("Teacher with this Employee ID already exists.");
    return await TeacherProfile.create(data);
  }

  async getAllTeacherProfiles(filter = {}) {
    return await TeacherProfile.find(filter).populate(
      "user",
      "name email phone",
    );
  }

  async getTeacherProfileById(id) {
    const profile = await TeacherProfile.findById(id).populate(
      "user",
      "name email phone",
    );
    if (!profile) throw new Error("Teacher profile not found.");
    return profile;
  }

  async updateTeacherProfile(id, updateData) {
    const profile = await TeacherProfile.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!profile) throw new Error("Teacher profile not found.");
    return profile;
  }

  async deleteTeacherProfile(id) {
    const profile = await TeacherProfile.findByIdAndDelete(id);
    if (!profile) throw new Error("Teacher profile not found.");
    return profile;
  }

  // --- Student Operations ---
  async createStudentProfile(data) {
    const existing = await StudentProfile.findOne({
      studentId: data.studentId,
    });
    if (existing)
      throw new Error("Student with this Student ID already exists.");
    return await StudentProfile.create(data);
  }

  async getAllStudentProfiles(filter = {}) {
    return await StudentProfile.find(filter).populate(
      "user",
      "name email phone",
    );
  }

  async getStudentProfileById(id) {
    const profile = await StudentProfile.findById(id).populate(
      "user",
      "name email phone",
    );
    if (!profile) throw new Error("Student profile not found.");
    return profile;
  }

  async updateStudentProfile(id, updateData) {
    const profile = await StudentProfile.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!profile) throw new Error("Student profile not found.");
    return profile;
  }

  async deleteStudentProfile(id) {
    const profile = await StudentProfile.findByIdAndDelete(id);
    if (!profile) throw new Error("Student profile not found.");
    return profile;
  }
}

export default new CampusAdminService();
