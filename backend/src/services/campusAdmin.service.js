import {
  TeacherProfile,
  StudentProfile,
  ClassSchedule,
  ExamSchedule,
  TeacherAttendance,
  StudentAttendance,
  FeeRecord,
  Performance,
} from "../models/profile.model.js";

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
    return await TeacherProfile.find(filter)
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });
  }

  async getTeacherProfileById(id) {
    const profile = await TeacherProfile.findById(id).populate(
      "user",
      "fullName email phone",
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
    return await StudentProfile.find(filter)
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });
  }

  async getStudentProfileById(id) {
    const profile = await StudentProfile.findById(id).populate(
      "user",
      "fullName email phone",
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

  // --- Class Schedule Operations ---
  async createClassSchedule(data) {
    return await ClassSchedule.create(data);
  }

  async getAllClassSchedules(filter = {}) {
    return await ClassSchedule.find(filter)
      .populate("teacherId", "employeeId department qualification")
      .sort({ dayOfWeek: 1, startTime: 1 });
  }

  async getClassScheduleById(id) {
    const record = await ClassSchedule.findById(id).populate(
      "teacherId",
      "employeeId department qualification",
    );
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  async updateClassSchedule(id, updateData) {
    const record = await ClassSchedule.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  async deleteClassSchedule(id) {
    const record = await ClassSchedule.findByIdAndDelete(id);
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  // --- Exam Schedule Operations ---
  async createExamSchedule(data) {
    return await ExamSchedule.create(data);
  }

  async getAllExamSchedules(filter = {}) {
    return await ExamSchedule.find(filter)
      .populate("teacherId", "employeeId department qualification")
      .sort({ examDate: 1, startTime: 1 });
  }

  async getExamScheduleById(id) {
    const record = await ExamSchedule.findById(id).populate(
      "teacherId",
      "employeeId department qualification",
    );
    if (!record) throw new Error("Exam schedule not found.");
    return record;
  }

  async updateExamSchedule(id, updateData) {
    const record = await ExamSchedule.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new Error("Exam schedule not found.");
    return record;
  }

  async deleteExamSchedule(id) {
    const record = await ExamSchedule.findByIdAndDelete(id);
    if (!record) throw new Error("Exam schedule not found.");
    return record;
  }

  // --- Teacher Attendance Operations ---
  async createTeacherAttendance(data) {
    return await TeacherAttendance.create(data);
  }

  async getAllTeacherAttendance(filter = {}) {
    return await TeacherAttendance.find(filter)
      .populate("teacherId", "employeeId department qualification")
      .sort({ date: -1 });
  }

  async getTeacherAttendanceById(id) {
    const record = await TeacherAttendance.findById(id).populate(
      "teacherId",
      "employeeId department qualification",
    );
    if (!record) throw new Error("Teacher attendance record not found.");
    return record;
  }

  async updateTeacherAttendance(id, updateData) {
    const record = await TeacherAttendance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new Error("Teacher attendance record not found.");
    return record;
  }

  async deleteTeacherAttendance(id) {
    const record = await TeacherAttendance.findByIdAndDelete(id);
    if (!record) throw new Error("Teacher attendance record not found.");
    return record;
  }

  // --- Student Attendance Operations ---
  async createStudentAttendance(data) {
    return await StudentAttendance.create(data);
  }

  async getAllStudentAttendance(filter = {}) {
    return await StudentAttendance.find(filter)
      .populate("studentId", "studentId gradeOrClass section rollNumber")
      .sort({ date: -1 });
  }

  async getStudentAttendanceById(id) {
    const record = await StudentAttendance.findById(id).populate(
      "studentId",
      "studentId gradeOrClass section rollNumber",
    );
    if (!record) throw new Error("Student attendance record not found.");
    return record;
  }

  async updateStudentAttendance(id, updateData) {
    const record = await StudentAttendance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new Error("Student attendance record not found.");
    return record;
  }

  async deleteStudentAttendance(id) {
    const record = await StudentAttendance.findByIdAndDelete(id);
    if (!record) throw new Error("Student attendance record not found.");
    return record;
  }

  // --- Fee Record Operations ---
  async createFeeRecord(data) {
    return await FeeRecord.create(data);
  }

  async getAllFeeRecords(filter = {}) {
    return await FeeRecord.find(filter)
      .populate("studentId", "studentId gradeOrClass section rollNumber")
      .sort({ dueDate: 1 });
  }

  async getFeeRecordById(id) {
    const record = await FeeRecord.findById(id).populate(
      "studentId",
      "studentId gradeOrClass section rollNumber",
    );
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async updateFeeRecord(id, updateData) {
    const record = await FeeRecord.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async deleteFeeRecord(id) {
    const record = await FeeRecord.findByIdAndDelete(id);
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  // --- Performance Operations ---
  async createPerformance(data) {
    return await Performance.create(data);
  }

  async getAllPerformance(filter = {}) {
    return await Performance.find(filter)
      .populate("studentId", "studentId gradeOrClass section rollNumber")
      .sort({ createdAt: -1 });
  }

  async getPerformanceById(id) {
    const record = await Performance.findById(id).populate(
      "studentId",
      "studentId gradeOrClass section rollNumber",
    );
    if (!record) throw new Error("Performance record not found.");
    return record;
  }

  async updatePerformance(id, updateData) {
    const record = await Performance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new Error("Performance record not found.");
    return record;
  }

  async deletePerformance(id) {
    const record = await Performance.findByIdAndDelete(id);
    if (!record) throw new Error("Performance record not found.");
    return record;
  }
}

export default new CampusAdminService();
