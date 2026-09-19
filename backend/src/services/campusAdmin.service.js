import {
  TeacherProfile,
  StudentProfile,
  ClassSchedule,
  ExamSchedule,
  StudentAttendance,
  FeeRecord,
  Performance,
} from "../models/profile.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import User from "../models/user.model.js";

class CampusAdminService {
  // --- Dashboard Aggregated Statistics ---
  async getDashboardStats(campusId, isSchool = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Students Count
    const [totalStudents, activeStudents, totalFaculty, activeFaculty] = await Promise.all([
      User.countDocuments({ campusId, role: "student" }),
      User.countDocuments({ campusId, role: "student", status: "Active" }),
      User.countDocuments({ campusId, role: { $in: ["faculty", "teacher"] } }),
      User.countDocuments({ campusId, role: { $in: ["faculty", "teacher"] }, status: "Active" }),
    ]);

    // 2. Class / Routine Counts
    const totalClasses = await ClassSchedule.countDocuments({ campusId });

    // 3. Exam Count
    const totalExams = await ExamSchedule.countDocuments({ campusId });

    // 4. Student Attendance Today
    const todayStudentAttendance = await StudentAttendance.find({
      campusId,
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    const studentPresentCount = todayStudentAttendance.filter(
      (a) => a.status === "Present" || a.status === "present"
    ).length;

    const studentAttendanceRate =
      todayStudentAttendance.length > 0
        ? Math.round((studentPresentCount / todayStudentAttendance.length) * 100)
        : totalStudents > 0
        ? 95
        : 0;

    // 5. Faculty Attendance Today
    const todayFacultyAttendance = await TeacherAttendance.find({
      campusId,
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    const facultyPresentCount = todayFacultyAttendance.filter(
      (a) => a.status === "Present" || a.status === "present"
    ).length;

    const facultyAttendanceRate =
      todayFacultyAttendance.length > 0
        ? Math.round((facultyPresentCount / todayFacultyAttendance.length) * 100)
        : totalFaculty > 0
        ? 98
        : 0;

    // 6. Fee Stats
    const feeRecords = await FeeRecord.find({ campusId }).lean();
    let totalFeeAmount = 0;
    let collectedFeeAmount = 0;
    let pendingVouchersCount = 0;

    for (const f of feeRecords) {
      totalFeeAmount += f.amount || 0;
      if (f.status === "paid" || f.status === "Paid") {
        collectedFeeAmount += f.paidAmount || f.amount || 0;
      } else {
        pendingVouchersCount++;
        collectedFeeAmount += f.paidAmount || 0;
      }
    }

    return {
      totalStudents,
      activeStudents,
      totalFaculty,
      activeFaculty,
      totalClasses,
      totalExams,
      studentAttendanceRate,
      facultyAttendanceRate,
      todayStudentAttendanceLogged: todayStudentAttendance.length,
      todayFacultyAttendanceLogged: todayFacultyAttendance.length,
      totalFeeAmount,
      collectedFeeAmount,
      pendingVouchersCount,
      isSchool,
    };
  }

  // --- Teacher Profile Operations ---
  async createTeacherProfile(data) {
    const existing = await TeacherProfile.findOne({
      employeeId: data.employeeId,
    });
    if (existing)
      throw new Error("Teacher with this Employee ID already exists.");
    return await TeacherProfile.create(data);
  }

  async getAllTeacherProfiles(campusId, filter = {}) {
    const query = { ...filter };
    if (campusId) query.campusId = campusId;
    return await TeacherProfile.find(query)
      .populate("user", "name email phone department designation")
      .sort({ createdAt: -1 });
  }

  async getTeacherProfileById(id, campusId) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    const profile = await TeacherProfile.findOne(query).populate(
      "user",
      "name email phone department designation",
    );
    if (!profile) throw new Error("Teacher profile not found.");
    return profile;
  }

  async updateTeacherProfile(id, campusId, updateData) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    const profile = await TeacherProfile.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!profile) throw new Error("Teacher profile not found.");
    return profile;
  }

  async deleteTeacherProfile(id, campusId) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    const profile = await TeacherProfile.findOneAndDelete(query);
    if (!profile) throw new Error("Teacher profile not found.");
    return profile;
  }

  // --- Student Profile Operations ---
  async createStudentProfile(data) {
    const existing = await StudentProfile.findOne({
      studentId: data.studentId,
    });
    if (existing)
      throw new Error("Student with this Student ID already exists.");
    return await StudentProfile.create(data);
  }

  async getAllStudentProfiles(campusId, filter = {}) {
    const query = { ...filter };
    if (campusId) query.campusId = campusId;
    return await StudentProfile.find(query)
      .populate("user", "name email phone roll program section")
      .sort({ createdAt: -1 });
  }

  async getStudentProfileById(id, campusId) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    const profile = await StudentProfile.findOne(query).populate(
      "user",
      "name email phone roll program section",
    );
    if (!profile) throw new Error("Student profile not found.");
    return profile;
  }

  async updateStudentProfile(id, campusId, updateData) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    const profile = await StudentProfile.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!profile) throw new Error("Student profile not found.");
    return profile;
  }

  async deleteStudentProfile(id, campusId) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    const profile = await StudentProfile.findOneAndDelete(query);
    if (!profile) throw new Error("Student profile not found.");
    return profile;
  }

  // --- Class Schedule Operations (School Period Routines) ---
  async createClassSchedule(campusId, instituteId, data) {
    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      className: data.className || data.gradeOrClass || "Grade 10",
      gradeOrClass: data.gradeOrClass || data.className || "Grade 10",
      periodName: data.periodName || data.title || "Period 1",
      title: data.title || data.periodName || "Period 1",
      teacherName: data.teacherName || data.instructor || "",
      instructor: data.instructor || data.teacherName || "",
      room: data.room || data.roomNumber || "",
      roomNumber: data.roomNumber || data.room || "",
    };
    return await ClassSchedule.create(payload);
  }

  async getAllClassSchedules(campusId, filter = {}) {
    const query = { campusId };
    if (filter.dayOfWeek) query.dayOfWeek = filter.dayOfWeek;
    if (filter.className || filter.gradeOrClass) {
      query.$or = [
        { className: filter.className || filter.gradeOrClass },
        { gradeOrClass: filter.className || filter.gradeOrClass },
      ];
    }
    if (filter.section) query.section = filter.section;
    if (filter.subject) query.subject = new RegExp(filter.subject, "i");

    return await ClassSchedule.find(query)
      .populate("teacherId", "name email phone department designation")
      .sort({ dayOfWeek: 1, startTime: 1 });
  }

  async getClassScheduleById(id, campusId) {
    const record = await ClassSchedule.findOne({ _id: id, campusId }).populate(
      "teacherId",
      "name email phone department designation",
    );
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  async updateClassSchedule(id, campusId, updateData) {
    const payload = { ...updateData };
    if (payload.gradeOrClass && !payload.className) payload.className = payload.gradeOrClass;
    if (payload.instructor && !payload.teacherName) payload.teacherName = payload.instructor;
    if (payload.room && !payload.roomNumber) payload.roomNumber = payload.room;

    const record = await ClassSchedule.findOneAndUpdate(
      { _id: id, campusId },
      payload,
      { new: true, runValidators: true }
    );
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  async deleteClassSchedule(id, campusId) {
    const record = await ClassSchedule.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  // --- Exam Schedule Operations ---
  async createExamSchedule(campusId, instituteId, data) {
    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      className: data.className || data.gradeOrClass || "Grade 10",
      gradeOrClass: data.gradeOrClass || data.className || "Grade 10",
      room: data.room || data.roomNumber || "",
      roomNumber: data.roomNumber || data.room || "",
      invigilator: data.invigilator || data.teacherName || "",
      date: data.date || (data.examDate ? new Date(data.examDate).toISOString().split("T")[0] : ""),
      examDate: data.examDate || (data.date ? new Date(data.date) : new Date()),
    };
    return await ExamSchedule.create(payload);
  }

  async getAllExamSchedules(campusId, filter = {}) {
    const query = { campusId };
    if (filter.examType) query.examType = filter.examType;
    if (filter.className || filter.gradeOrClass) {
      query.$or = [
        { className: filter.className || filter.gradeOrClass },
        { gradeOrClass: filter.className || filter.gradeOrClass },
      ];
    }
    if (filter.section) query.section = filter.section;
    if (filter.subject) query.subject = new RegExp(filter.subject, "i");

    return await ExamSchedule.find(query)
      .populate("teacherId", "name email phone")
      .sort({ examDate: 1, startTime: 1 });
  }

  async getExamScheduleById(id, campusId) {
    const record = await ExamSchedule.findOne({ _id: id, campusId }).populate(
      "teacherId",
      "name email phone",
    );
    if (!record) throw new Error("Exam schedule not found.");
    return record;
  }

  async updateExamSchedule(id, campusId, updateData) {
    const payload = { ...updateData };
    if (payload.gradeOrClass && !payload.className) payload.className = payload.gradeOrClass;
    if (payload.date && !payload.examDate) payload.examDate = new Date(payload.date);

    const record = await ExamSchedule.findOneAndUpdate(
      { _id: id, campusId },
      payload,
      { new: true, runValidators: true }
    );
    if (!record) throw new Error("Exam schedule not found.");
    return record;
  }

  async deleteExamSchedule(id, campusId) {
    const record = await ExamSchedule.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Exam schedule not found.");
    return record;
  }

  // --- Student Attendance Operations ---
  async createStudentAttendance(campusId, instituteId, data) {
    const date = new Date(data.date || new Date());
    date.setHours(0, 0, 0, 0);

    const payload = {
      ...data,
      date,
      dateStr: data.dateStr || date.toISOString().split("T")[0],
      campusId,
      instituteId: instituteId || null,
      status: data.status || "Present",
    };

    // Upsert so same student cannot have multiple attendance on same day
    return await StudentAttendance.findOneAndUpdate(
      { campusId, studentId: data.studentId, date },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async createBulkStudentAttendance(campusId, instituteId, { date: dateInput, records = [] }) {
    const date = new Date(dateInput || new Date());
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];

    const results = [];
    for (const item of records) {
      if (!item.studentId) continue;
      const updated = await StudentAttendance.findOneAndUpdate(
        { campusId, studentId: item.studentId, date },
        {
          campusId,
          instituteId: instituteId || null,
          studentId: item.studentId,
          date,
          dateStr,
          status: item.status || "Present",
          remarks: item.remarks || "",
          className: item.className || item.gradeOrClass || "",
          section: item.section || "",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(updated);
    }
    return results;
  }

  async getAllStudentAttendance(campusId, filter = {}) {
    const query = { campusId };

    if (filter.date) {
      const d = new Date(filter.date);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      query.date = { $gte: d, $lt: nextD };
    }
    if (filter.status) {
      query.status = new RegExp(`^${filter.status}$`, "i");
    }
    if (filter.studentId) {
      query.studentId = filter.studentId;
    }
    if (filter.section) {
      query.section = filter.section;
    }

    return await StudentAttendance.find(query)
      .populate("studentId", "name email roll program gradeOrClass section")
      .sort({ date: -1 });
  }

  async getStudentAttendanceById(id, campusId) {
    const record = await StudentAttendance.findOne({ _id: id, campusId }).populate(
      "studentId",
      "name email roll program gradeOrClass section",
    );
    if (!record) throw new Error("Student attendance record not found.");
    return record;
  }

  async updateStudentAttendance(id, campusId, updateData) {
    const record = await StudentAttendance.findOneAndUpdate(
      { _id: id, campusId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!record) throw new Error("Student attendance record not found.");
    return record;
  }

  async deleteStudentAttendance(id, campusId) {
    const record = await StudentAttendance.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Student attendance record not found.");
    return record;
  }

  // --- Fee Record Operations ---
  async createFeeRecord(campusId, instituteId, data) {
    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      challanNo: data.challanNo || `CH-${Math.floor(100000 + Math.random() * 900000)}`,
      month: data.month || new Date().toISOString().slice(0, 7),
      status: data.status ? data.status.toLowerCase() : "pending",
    };
    return await FeeRecord.create(payload);
  }

  async getAllFeeRecords(campusId, filter = {}) {
    const query = { campusId };
    if (filter.status) query.status = filter.status.toLowerCase();
    if (filter.studentId) query.studentId = filter.studentId;
    if (filter.feeType) query.feeType = filter.feeType.toLowerCase();

    return await FeeRecord.find(query)
      .populate("studentId", "name roll program gradeOrClass section guardian guardianPhone")
      .sort({ dueDate: 1, createdAt: -1 });
  }

  async getFeeRecordById(id, campusId) {
    const record = await FeeRecord.findOne({ _id: id, campusId }).populate(
      "studentId",
      "name roll program gradeOrClass section guardian guardianPhone",
    );
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async updateFeeRecord(id, campusId, updateData) {
    const payload = { ...updateData };
    if (payload.status) payload.status = payload.status.toLowerCase();
    if (payload.status === "paid" && !payload.paymentDate) {
      payload.paymentDate = new Date();
    }

    const record = await FeeRecord.findOneAndUpdate(
      { _id: id, campusId },
      payload,
      { new: true, runValidators: true }
    );
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async deleteFeeRecord(id, campusId) {
    const record = await FeeRecord.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  // --- Performance / Exam Results Operations ---
  async createPerformance(campusId, instituteId, data) {
    const marksObtained = Number(data.marksObtained || 0);
    const totalMarks = Number(data.totalMarks || 100);
    const pct = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

    let grade = data.grade || "";
    if (!grade) {
      if (pct >= 85) grade = "A+";
      else if (pct >= 80) grade = "A";
      else if (pct >= 70) grade = "B";
      else if (pct >= 60) grade = "C";
      else if (pct >= 50) grade = "D";
      else grade = "F";
    }

    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      marksObtained,
      totalMarks,
      percentage: Math.round(pct * 10) / 10,
      grade,
      term: data.term || "Midterm Examination",
    };

    return await Performance.create(payload);
  }

  async getAllPerformance(campusId, filter = {}) {
    const query = { campusId };
    if (filter.studentId) query.studentId = filter.studentId;
    if (filter.examName) query.examName = filter.examName;
    if (filter.subject) query.subject = new RegExp(filter.subject, "i");
    if (filter.term) query.term = filter.term;

    return await Performance.find(query)
      .populate("studentId", "name roll program gradeOrClass section")
      .sort({ createdAt: -1 });
  }

  async getPerformanceById(id, campusId) {
    const record = await Performance.findOne({ _id: id, campusId }).populate(
      "studentId",
      "name roll program gradeOrClass section",
    );
    if (!record) throw new Error("Performance record not found.");
    return record;
  }

  async updatePerformance(id, campusId, updateData) {
    const payload = { ...updateData };
    if (payload.marksObtained !== undefined || payload.totalMarks !== undefined) {
      const current = await Performance.findById(id);
      const marksObtained = Number(payload.marksObtained ?? current?.marksObtained ?? 0);
      const totalMarks = Number(payload.totalMarks ?? current?.totalMarks ?? 100);
      const pct = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
      payload.percentage = Math.round(pct * 10) / 10;
      if (!payload.grade) {
        if (pct >= 85) payload.grade = "A+";
        else if (pct >= 80) payload.grade = "A";
        else if (pct >= 70) payload.grade = "B";
        else if (pct >= 60) payload.grade = "C";
        else if (pct >= 50) payload.grade = "D";
        else payload.grade = "F";
      }
    }

    const record = await Performance.findOneAndUpdate(
      { _id: id, campusId },
      payload,
      { new: true, runValidators: true }
    );
    if (!record) throw new Error("Performance record not found.");
    return record;
  }

  async deletePerformance(id, campusId) {
    const record = await Performance.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Performance record not found.");
    return record;
  }
}

export default new CampusAdminService();
