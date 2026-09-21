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
import FeeStructure from "../models/feeStructure.model.js";
import Timetable from "../models/timetable.model.js";

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

  // --- Class Schedule Operations ---
  async createClassSchedule(campusIdOrData, maybeInstituteId, maybeData) {
    let campusId, instituteId, data;
    if (typeof campusIdOrData === "object" && campusIdOrData !== null && !maybeData) {
      data = campusIdOrData;
      campusId = data.campusId;
      instituteId = data.instituteId;
    } else {
      campusId = campusIdOrData;
      instituteId = maybeInstituteId;
      data = maybeData || {};
    }

    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    let days = Array.isArray(data.days) && data.days.length ? data.days : null;
    if (!days && data.dayOfWeek) {
      days = [dayMap[data.dayOfWeek] || 1];
    }
    if (!days || !days.length) {
      days = [1, 2, 3, 4, 5];
    }

    const payload = {
      ...data,
      campusId: campusId || data.campusId,
      instituteId: instituteId || data.instituteId || null,
      institutionType: data.institutionType || "School",
      program: data.program || data.className || data.gradeOrClass || "Grade 10",
      section: data.section || "A",
      subject: data.subject || "General",
      instructor: data.instructor || data.teacherName || "Assigned Teacher",
      room: data.room || data.roomNumber || "Room 101",
      days,
      startTime: data.startTime || "08:30",
      endTime: data.endTime || "09:20",
      status: data.status || "Active",
    };

    return await Timetable.create(payload);
  }

  async getAllClassSchedules(campusIdOrFilter = {}, maybeFilter = {}) {
    let filter = {};
    if (typeof campusIdOrFilter === "object" && campusIdOrFilter !== null) {
      filter = { ...campusIdOrFilter };
    } else {
      filter = { ...maybeFilter, campusId: campusIdOrFilter };
    }

    const query = {};
    if (filter.campusId) query.campusId = filter.campusId;
    if (filter.days) query.days = filter.days;
    if (filter.dayOfWeek) {
      const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
      const dayNum = dayMap[filter.dayOfWeek];
      if (dayNum) query.days = dayNum;
    }
    if (filter.program || filter.className || filter.gradeOrClass) {
      const prog = filter.program || filter.className || filter.gradeOrClass;
      query.$or = [{ program: prog }, { className: prog }, { gradeOrClass: prog }];
    }
    if (filter.section) query.section = filter.section;
    if (filter.subject) query.subject = new RegExp(filter.subject, "i");
    if (filter.institutionType) query.institutionType = filter.institutionType;

    let records = await Timetable.find(query).sort({ days: 1, startTime: 1 });
    if (!records.length && filter.campusId) {
      const legacyQuery = { campusId: filter.campusId };
      if (filter.dayOfWeek) legacyQuery.dayOfWeek = filter.dayOfWeek;
      if (filter.section) legacyQuery.section = filter.section;
      const legacyRecords = await ClassSchedule.find(legacyQuery)
        .populate("teacherId", "name email phone department designation")
        .sort({ dayOfWeek: 1, startTime: 1 });
      if (legacyRecords.length) {
        return legacyRecords;
      }
    }
    return records;
  }

  async getClassScheduleById(id, campusId) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    let record = await Timetable.findOne(query);
    if (!record) {
      record = await ClassSchedule.findOne(query).populate(
        "teacherId",
        "name email phone department designation",
      );
    }
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  async updateClassSchedule(id, campusIdOrUpdate, maybeUpdate) {
    let campusId, updateData;
    if (maybeUpdate !== undefined) {
      campusId = campusIdOrUpdate;
      updateData = maybeUpdate;
    } else {
      updateData = campusIdOrUpdate;
    }
    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    let record = await Timetable.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!record) {
      record = await ClassSchedule.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true,
      });
    }
    if (!record) throw new Error("Class schedule not found.");
    return record;
  }

  async deleteClassSchedule(id, campusId) {
    const query = { _id: id };
    if (campusId) query.campusId = campusId;
    let record = await Timetable.findOneAndDelete(query);
    if (!record) {
      record = await ClassSchedule.findOneAndDelete(query);
    }
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
    const rawStatus = (data.status || data.paymentStatus || "pending").toLowerCase();
    const status = ["paid", "pending", "overdue"].includes(rawStatus) ? rawStatus : "pending";
    const amount = Number(data.amount || 0);
    const paidAmount = status === "paid" ? (Number(data.paidAmount) || amount) : Number(data.paidAmount || 0);
    const paymentDate = status === "paid"
      ? (data.paymentDate ? new Date(data.paymentDate) : new Date())
      : (data.paymentDate ? new Date(data.paymentDate) : null);
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date();

    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      feeType: data.feeType || data.feeCategory || "Tuition",
      challanNo: data.challanNo || data.voucherNo || `CH-${Math.floor(100000 + Math.random() * 900000)}`,
      month: data.month || (data.dueDate ? String(data.dueDate).slice(0, 7) : new Date().toISOString().slice(0, 7)),
      semester: data.semester || "Current Term",
      description: data.description || data.notes || "",
      notes: data.description || data.notes || "",
      breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
      amount,
      paidAmount,
      dueDate,
      paymentDate,
      status,
    };
    const created = await FeeRecord.create(payload);
    return await FeeRecord.findById(created._id).populate(
      "studentId",
      "name roll email program gradeOrClass section guardian guardianPhone",
    );
  }

  async getAllFeeRecords(campusId, filter = {}) {
    const query = { campusId };
    if (filter.status && filter.status !== "all") query.status = filter.status.toLowerCase();
    if (filter.paymentStatus && filter.paymentStatus !== "all") query.status = filter.paymentStatus.toLowerCase();
    if (filter.studentId) query.studentId = filter.studentId;
    if (filter.feeType && filter.feeType !== "all") query.feeType = new RegExp(`^${filter.feeType.trim()}$`, "i");

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      const studentMatches = await User.find({
        campusId,
        role: "student",
        $or: [
          { name: new RegExp(q, "i") },
          { roll: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
        ],
      }).select("_id").lean();

      query.$or = [
        { challanNo: new RegExp(q, "i") },
        { feeType: new RegExp(q, "i") },
        { studentId: { $in: studentMatches.map((s) => s._id) } },
      ];
    }

    return await FeeRecord.find(query)
      .populate("studentId", "name roll email program gradeOrClass section guardian guardianPhone")
      .sort({ dueDate: 1, createdAt: -1 });
  }

  async getFeeRecordById(id, campusId) {
    const record = await FeeRecord.findOne({ _id: id, campusId }).populate(
      "studentId",
      "name roll email program gradeOrClass section guardian guardianPhone",
    );
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async updateFeeRecord(id, campusId, updateData) {
    const payload = { ...updateData };
    if (payload.paymentStatus && !payload.status) {
      payload.status = payload.paymentStatus.toLowerCase();
    }
    if (payload.status) {
      payload.status = payload.status.toLowerCase();
    }
    if (payload.feeCategory && !payload.feeType) {
      payload.feeType = payload.feeCategory;
    }
    if (payload.voucherNo && !payload.challanNo) {
      payload.challanNo = payload.voucherNo;
    }
    if (payload.description && !payload.notes) payload.notes = payload.description;
    if (payload.notes && !payload.description) payload.description = payload.notes;
    if (payload.status === "paid") {
      if (!payload.paymentDate) payload.paymentDate = new Date();
      if (!payload.paidAmount && payload.amount) payload.paidAmount = payload.amount;
    }

    const record = await FeeRecord.findOneAndUpdate(
      { _id: id, campusId },
      payload,
      { returnDocument: "after", runValidators: true }
    ).populate(
      "studentId",
      "name roll email program gradeOrClass section guardian guardianPhone",
    );
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async deleteFeeRecord(id, campusId) {
    const record = await FeeRecord.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Fee record not found.");
    return record;
  }

  async generateMonthlyFees(campusId, instituteId, options = {}) {
    const month = options.month || new Date().toISOString().slice(0, 7);
    const dueDate = options.dueDate ? new Date(options.dueDate) : new Date(Date.now() + 14 * 86400000);
    const feeCategory = options.feeCategory || "Monthly Tuition Fee";
    const description = options.description || `Monthly Tuition & Composite Dues for ${month}`;
    const targetGrade = options.gradeOrClass && options.gradeOrClass !== "all" ? options.gradeOrClass.trim() : null;
    const defaultAmount = Number(options.defaultAmount) || 5000;

    // 1. Fetch eligible students
    const studentQuery = { campusId, role: "student", isActive: { $ne: false } };
    if (targetGrade) {
      studentQuery.$or = [
        { gradeOrClass: new RegExp(`^${targetGrade}$`, "i") },
        { program: new RegExp(`^${targetGrade}$`, "i") },
      ];
    }
    const students = await User.find(studentQuery).lean();
    if (!students.length) {
      return {
        generatedCount: 0,
        skippedCount: 0,
        totalEligible: 0,
        message: "No eligible students found for the selected grade/criteria.",
        records: [],
      };
    }

    // 2. Fetch Fee Structures for campus
    const feeStructures = await FeeStructure.find({ campusId }).lean();
    const structureMap = new Map(
      feeStructures.map((fs) => [(fs.gradeOrClass || "").trim().toLowerCase(), fs])
    );

    // 3. Find existing fee records for this month & feeType to avoid duplicate billing
    const existingRecords = await FeeRecord.find({
      campusId,
      month,
      feeType: new RegExp(`^${feeCategory.trim()}$`, "i"),
    }).select("studentId").lean();

    const billedStudentIds = new Set(existingRecords.map((r) => String(r.studentId)));

    // 4. Generate records for unbilled students
    const year = new Date().getFullYear();
    const toCreate = [];
    let skippedCount = 0;

    for (const student of students) {
      const studentIdStr = String(student._id);
      if (billedStudentIds.has(studentIdStr)) {
        skippedCount++;
        continue;
      }

      const studentGrade = (student.gradeOrClass || student.program || "").trim().toLowerCase();
      const matchedStructure = structureMap.get(studentGrade);

      let amount = defaultAmount;
      let breakdown = [{ title: feeCategory, amount: defaultAmount }];

      if (matchedStructure) {
        const tuition = Number(matchedStructure.tuitionFee || 0);
        const lab = Number(matchedStructure.labFee || 0);
        const sports = Number(matchedStructure.sportsFee || 0);
        const exam = Number(matchedStructure.examFee || 0);
        const other = Number(matchedStructure.otherFee || 0);
        const total = tuition + lab + sports + exam + other;
        if (total > 0) {
          amount = total;
          breakdown = [];
          if (tuition > 0) breakdown.push({ title: "Tuition Fee", amount: tuition });
          if (lab > 0) breakdown.push({ title: "Computer / Science Lab", amount: lab });
          if (sports > 0) breakdown.push({ title: "Sports & Physical Fund", amount: sports });
          if (exam > 0) breakdown.push({ title: "Examination Fee", amount: exam });
          if (other > 0) breakdown.push({ title: "General Services & Utility", amount: other });
        }
      }

      const rand = Math.floor(1000 + Math.random() * 9000);
      const challanNo = `VCH-${year}-${rand}`;
      const semester = student.gradeOrClass || student.program || month;

      toCreate.push({
        campusId,
        instituteId: instituteId || null,
        studentId: student._id,
        feeType: feeCategory,
        challanNo,
        month,
        semester,
        amount,
        paidAmount: 0,
        dueDate,
        paymentDate: null,
        status: "pending",
        description: matchedStructure?.description || description,
        notes: matchedStructure?.description || description,
        breakdown,
      });
    }

    let createdRecords = [];
    if (toCreate.length > 0) {
      const created = await FeeRecord.insertMany(toCreate);
      const createdIds = created.map((c) => c._id);
      createdRecords = await FeeRecord.find({ _id: { $in: createdIds } })
        .populate("studentId", "name roll email program gradeOrClass section guardian guardianPhone")
        .sort({ createdAt: -1 });
    }

    return {
      generatedCount: toCreate.length,
      skippedCount,
      totalEligible: students.length,
      records: createdRecords,
    };
  }

  // --- Fee Structure Operations ---
  async getFeeStructures(campusId) {
    return await FeeStructure.find({ campusId }).sort({ gradeOrClass: 1 });
  }

  async upsertFeeStructure(campusId, instituteId, data) {
    const gradeOrClass = (data.gradeOrClass || "").trim();
    if (!gradeOrClass) throw new Error("Grade or Class name is required.");

    const payload = {
      campusId,
      instituteId: instituteId || null,
      gradeOrClass,
      tuitionFee: Number(data.tuitionFee || 0),
      labFee: Number(data.labFee || 0),
      sportsFee: Number(data.sportsFee || 0),
      examFee: Number(data.examFee || 0),
      otherFee: Number(data.otherFee || 0),
      lateFeeFine: Number(data.lateFeeFine || 0),
      description: data.description || "",
    };

    return await FeeStructure.findOneAndUpdate(
      { campusId, gradeOrClass },
      payload,
      { returnDocument: "after", upsert: true, runValidators: true }
    );
  }

  async deleteFeeStructure(id, campusId) {
    const deleted = await FeeStructure.findOneAndDelete({ _id: id, campusId });
    if (!deleted) throw new Error("Fee structure not found.");
    return deleted;
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
