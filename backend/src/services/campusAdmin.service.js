import mongoose from "mongoose";
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
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Timetable from "../models/timetable.model.js";
import Assignment from "../models/assignment.model.js";
import { Grade, Section, Subject } from "../models/academic.model.js";
import {
  parseTimeToMinutes,
  normalizeTimeString,
  timesOverlap,
  WEEKDAYS,
} from "../utils/timetableTime.js";

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
  async validateScheduleConflicts(campusId, payload, excludeId = null) {
    if (!campusId || !payload || !payload.days || !payload.days.length) return;
    const newStart = parseTimeToMinutes(payload.startTime);
    const newEnd = parseTimeToMinutes(payload.endTime);
    if (newStart === null || newEnd === null || newEnd <= newStart) return;

    const query = {
      campusId,
      days: { $in: payload.days },
      status: { $ne: "Cancelled" },
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingRecords = await Timetable.find(query);
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    for (const record of existingRecords) {
      const commonDays = payload.days.filter(
        (d) => Array.isArray(record.days) && record.days.includes(d)
      );
      if (!commonDays.length) continue;

      const recStart = parseTimeToMinutes(record.startTime);
      const recEnd = parseTimeToMinutes(record.endTime);
      if (recStart === null || recEnd === null) continue;

      const overlaps = Math.max(newStart, recStart) < Math.min(newEnd, recEnd);
      if (!overlaps) continue;

      const conflictingDayStr = commonDays
        .map((d) => dayNames[d - 1] || `Day ${d}`)
        .join(", ");

      // 1. Break vs Class conflict
      if (!payload.isBreak && record.isBreak) {
        throw new Error(
          `Cannot schedule class during designated break period '${record.subject || record.breakTitle || "Break"}' on ${conflictingDayStr} (${record.startTime} - ${record.endTime}).`
        );
      }
      if (payload.isBreak && !record.isBreak) {
        throw new Error(
          `Cannot schedule break period during existing class '${record.subject}' on ${conflictingDayStr} (${record.startTime} - ${record.endTime}).`
        );
      }
      if (payload.isBreak && record.isBreak) {
        throw new Error(
          `Another break '${record.subject || record.breakTitle}' is already scheduled on ${conflictingDayStr} (${record.startTime} - ${record.endTime}).`
        );
      }

      // 2. Room conflict (only between regular classes, ignore generic rooms)
      const ignoredRooms = [
        "",
        "tbd",
        "n/a",
        "cafeteria / grounds",
        "campus grounds / cafeteria",
        "campus cafeteria / ground",
        "break area",
        "school grounds",
      ];
      const pRoom = (payload.room || "").trim().toLowerCase();
      const rRoom = (record.room || "").trim().toLowerCase();
      if (pRoom && rRoom && pRoom === rRoom && !ignoredRooms.includes(pRoom)) {
        throw new Error(
          `Room '${payload.room}' is already occupied on ${conflictingDayStr} by ${record.subject} (${record.startTime} - ${record.endTime}).`
        );
      }

      // 3. Instructor conflict (both by teacherId and instructor string)
      if (payload.teacherId && record.teacherId && String(payload.teacherId) === String(record.teacherId)) {
        throw new Error(
          `Instructor is already assigned on ${conflictingDayStr} to '${record.subject || "another class"}' (${record.startTime} - ${record.endTime}).`
        );
      }
      const ignoredInstructors = [
        "",
        "tbd",
        "unassigned",
        "assigned teacher",
        "campus administration",
        "campus staff",
        "duty staff",
      ];
      const pInst = (payload.instructor || "").trim().toLowerCase();
      const rInst = (record.instructor || "").trim().toLowerCase();
      if (pInst && rInst && pInst === rInst && !ignoredInstructors.includes(pInst)) {
        throw new Error(
          `Instructor '${payload.instructor}' is already assigned on ${conflictingDayStr} to ${record.subject} (${record.startTime} - ${record.endTime}).`
        );
      }

      // 4. Class & Section conflict (both by gradeId+sectionId and program+section string)
      if (
        payload.gradeId &&
        record.gradeId &&
        String(payload.gradeId) === String(record.gradeId) &&
        payload.sectionId &&
        record.sectionId &&
        String(payload.sectionId) === String(record.sectionId)
      ) {
        throw new Error(
          `This Class and Section already has '${record.subject}' scheduled on ${conflictingDayStr} (${record.startTime} - ${record.endTime}).`
        );
      }
      const pProg = (payload.program || "").trim().toLowerCase();
      const rProg = (record.program || "").trim().toLowerCase();
      const pSec = (payload.section || "").trim().toLowerCase();
      const rSec = (record.section || "").trim().toLowerCase();
      if (pProg && rProg && pProg === rProg && pSec && rSec && pSec === rSec) {
        throw new Error(
          `Class ${payload.program} Section ${payload.section} already has '${record.subject}' scheduled on ${conflictingDayStr} (${record.startTime} - ${record.endTime}).`
        );
      }
    }
  }

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
    days = days.map((d) => parseInt(d, 10)).filter((d) => !isNaN(d) && d >= 1 && d <= 7);

    const startTime = normalizeTimeString(data.startTime) || data.startTime || "08:30";
    const endTime = normalizeTimeString(data.endTime) || data.endTime || "09:20";

    const payload = {
      ...data,
      campusId: campusId || data.campusId,
      instituteId:
        typeof maybeInstituteId === "string" ? maybeInstituteId : null,
      days,
      institutionType: data.institutionType || "School",
      program: data.program || "",
      section: data.section || "",
      subject: data.subject || "",
      instructor: data.instructor || "",
      gradeId: data.gradeId || null,
      sectionId: data.sectionId || null,
      subjectId: data.subjectId || null,
      teacherId: data.teacherId || null,
      room: data.room || data.roomNumber || (data.isBreak ? "Cafeteria / Grounds" : "Room 101"),
      startTime,
      endTime,
      status: data.status || "Active",
      isBreak: Boolean(data.isBreak),
      breakTitle: data.breakTitle || (data.isBreak ? (data.subject || "Lunch & Prayer Break") : ""),
    };

    await this.validateScheduleConflicts(payload.campusId, payload);

    const created = await Timetable.create(payload);
    const populated = await Timetable.findById(created._id)
      .populate("gradeId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name code")
      .populate("teacherId", "name email");

    if (populated) {
      const doc = populated.toObject();
      if (doc.gradeId && !doc.program) doc.program = doc.gradeId.name;
      if (doc.sectionId && !doc.section) doc.section = doc.sectionId.name;
      if (doc.subjectId && !doc.subject) doc.subject = doc.subjectId.name;
      if (doc.teacherId && !doc.instructor) doc.instructor = doc.teacherId.name;
      return doc;
    }
    return created;
  }

  async getAllClassSchedules(campusIdOrFilter = {}, maybeFilter = {}) {
    let filter = {};
    const isId =
      campusIdOrFilter instanceof mongoose.Types.ObjectId ||
      (typeof campusIdOrFilter === "string" && mongoose.isValidObjectId(campusIdOrFilter)) ||
      (campusIdOrFilter && (campusIdOrFilter._bsontype === "ObjectID" || campusIdOrFilter._bsontype === "ObjectId"));

    if (isId) {
      filter = { ...maybeFilter, campusId: campusIdOrFilter };
    } else if (typeof campusIdOrFilter === "object" && campusIdOrFilter !== null) {
      filter = { ...campusIdOrFilter };
    } else {
      filter = { ...maybeFilter, campusId: campusIdOrFilter || maybeFilter?.campusId };
    }

    const query = {};
    if (filter.campusId) query.campusId = filter.campusId;
    if (filter.days) query.days = filter.days;
    if (filter.dayOfWeek) {
      const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
      const dayNum = dayMap[filter.dayOfWeek];
      if (dayNum) query.days = dayNum;
    }

    const conditions = [];

    if (filter.program || filter.className || filter.gradeOrClass) {
      const prog = filter.program || filter.className || filter.gradeOrClass;
      conditions.push({
        $or: [
          { program: prog },
          { className: prog },
          { gradeOrClass: prog },
          { isBreak: true },
        ],
      });
    }
    if (filter.section) {
      conditions.push({
        $or: [
          { section: filter.section },
          { section: `Section ${filter.section}` },
          { section: "All sections" },
          { section: "" },
          { isBreak: true },
        ],
      });
    }
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    if (filter.subject) query.subject = new RegExp(filter.subject, "i");
    if (filter.institutionType) query.institutionType = filter.institutionType;

    let records = await Timetable.find(query)
      .populate("gradeId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name code")
      .populate("teacherId", "name email")
      .sort({ days: 1, startTime: 1 });

    // Map populated names back to string fields for frontend compatibility
    records = records.map(r => {
      const doc = r.toObject();
      if (doc.gradeId && !doc.program) doc.program = doc.gradeId.name;
      if (doc.sectionId && !doc.section) doc.section = doc.sectionId.name;
      if (doc.subjectId && !doc.subject) doc.subject = doc.subjectId.name;
      if (doc.isBreak && !doc.subject) doc.subject = doc.breakTitle || "Break";
      if (doc.teacherId && !doc.instructor) doc.instructor = doc.teacherId.name;
      return doc;
    });

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
    if (updateData && updateData.days) {
      updateData.days = updateData.days
        .map((d) => parseInt(d, 10))
        .filter((d) => !isNaN(d) && d >= 1 && d <= 7);
    }
    if (updateData && updateData.startTime) {
      const normStart = normalizeTimeString(updateData.startTime);
      if (normStart) updateData.startTime = normStart;
    }
    if (updateData && updateData.endTime) {
      const normEnd = normalizeTimeString(updateData.endTime);
      if (normEnd) updateData.endTime = normEnd;
    }

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const existing = await Timetable.findOne(query);
    if (existing) {
      const mergedPayload = {
        ...existing.toObject(),
        ...updateData,
        campusId: campusId || existing.campusId,
      };
      if (updateData.days) mergedPayload.days = updateData.days;

      await this.validateScheduleConflicts(mergedPayload.campusId, mergedPayload, id);

      const updated = await Timetable.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("gradeId", "name")
        .populate("sectionId", "name")
        .populate("subjectId", "name code")
        .populate("teacherId", "name email");

      if (updated) {
        const doc = updated.toObject();
        if (doc.gradeId && !doc.program) doc.program = doc.gradeId.name;
        if (doc.sectionId && !doc.section) doc.section = doc.sectionId.name;
        if (doc.subjectId && !doc.subject) doc.subject = doc.subjectId.name;
        if (doc.teacherId && !doc.instructor) doc.instructor = doc.teacherId.name;
        return doc;
      }
      return updated;
    }

    let record = await ClassSchedule.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
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
  async validateExamConflicts(campusId, payload, excludeId = null) {
    if (!campusId || !payload) return;
    const dateStr = payload.date
      ? payload.date.slice(0, 10)
      : payload.examDate
      ? new Date(payload.examDate).toISOString().split("T")[0]
      : null;
    const newStart = parseTimeToMinutes(payload.startTime);
    const newEnd = parseTimeToMinutes(payload.endTime);
    if (!dateStr || newStart === null || newEnd === null || newEnd <= newStart) return;

    const query = {
      campusId,
      $or: [
        { date: dateStr },
        {
          examDate: {
            $gte: new Date(`${dateStr}T00:00:00.000Z`),
            $lte: new Date(`${dateStr}T23:59:59.999Z`),
          },
        },
      ],
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingExams = await ExamSchedule.find(query);

    // 1. Check Cohort Daily Exam Cap (Max 2 exams per day; 1 is standard, 2 is rare, 3+ strictly prohibited)
    const pClass = (payload.program || payload.className || payload.gradeOrClass || payload.department || "").trim().toLowerCase();
    const pSec = (payload.section || "").trim().toLowerCase();

    const cohortExamsOnDay = existingExams.filter((ex) => {
      const exClass = (ex.program || ex.className || ex.gradeOrClass || ex.department || "").trim().toLowerCase();
      const exSec = (ex.section || "").trim().toLowerCase();
      return pClass && exClass && pClass === exClass && pSec && exSec && pSec === exSec;
    });

    if (cohortExamsOnDay.length >= 2) {
      const names = cohortExamsOnDay.map((e) => `'${e.subject || e.examName}'`).join(" and ");
      throw new Error(
        `Class ${payload.program || payload.className || payload.gradeOrClass} Section ${payload.section} already has 2 exams scheduled on ${dateStr} (${names}). Maximum allowed is 2 exams per day.`
      );
    }

    if (cohortExamsOnDay.length === 1) {
      const existingExam = cohortExamsOnDay[0];
      const exStart = parseTimeToMinutes(existingExam.startTime);
      const exEnd = parseTimeToMinutes(existingExam.endTime);

      if (exStart !== null && exEnd !== null) {
        // Direct overlap check
        const overlaps = Math.max(newStart, exStart) < Math.min(newEnd, exEnd);
        if (overlaps) {
          throw new Error(
            `Class ${payload.program || payload.className || payload.gradeOrClass} Section ${payload.section} already has an exam scheduled for '${existingExam.subject}' on ${dateStr} (${existingExam.startTime} - ${existingExam.endTime}).`
          );
        }

        // Rest interval check (minimum 30 minutes between papers on a dual-exam day)
        const gap = newStart >= exEnd ? (newStart - exEnd) : (exStart - newEnd);
        if (gap < 30) {
          throw new Error(
            `Dual-exam day for Class ${payload.program || payload.className || payload.gradeOrClass} Section ${payload.section} requires at least a 30-minute rest interval between papers. Existing exam '${existingExam.subject}' runs ${existingExam.startTime} - ${existingExam.endTime} (Gap: ${gap} mins).`
          );
        }
      }
    }

    // 2. Room & Invigilator Overlap Conflicts across campus
    for (const existing of existingExams) {
      const exStart = parseTimeToMinutes(existing.startTime);
      const exEnd = parseTimeToMinutes(existing.endTime);
      if (exStart === null || exEnd === null) continue;

      const overlaps = Math.max(newStart, exStart) < Math.min(newEnd, exEnd);
      if (!overlaps) continue;

      // Room conflict
      const pRoom = (payload.room || payload.roomNumber || "").trim().toLowerCase();
      const exRoom = (existing.room || existing.roomNumber || "").trim().toLowerCase();
      const ignoredRooms = ["", "tbd", "n/a"];
      if (pRoom && exRoom && pRoom === exRoom && !ignoredRooms.includes(pRoom)) {
        throw new Error(
          `Exam Hall/Room '${payload.room || payload.roomNumber}' is already occupied on ${dateStr} by ${existing.subject} (${existing.startTime} - ${existing.endTime}).`
        );
      }

      // Invigilator conflict
      const pInv = (payload.invigilator || payload.teacherName || "").trim().toLowerCase();
      const exInv = (existing.invigilator || "").trim().toLowerCase();
      const ignoredInvigilators = ["", "tbd", "unassigned", "assigned invigilator", "duty staff"];
      if (pInv && exInv && pInv === exInv && !ignoredInvigilators.includes(pInv)) {
        throw new Error(
          `Invigilator '${payload.invigilator}' is already supervising ${existing.subject} on ${dateStr} (${existing.startTime} - ${existing.endTime}).`
        );
      }
    }
  }

  async createExamSchedule(campusId, instituteId, data) {
    const startTime = normalizeTimeString(data.startTime) || data.startTime || "09:00";
    const endTime = normalizeTimeString(data.endTime) || data.endTime || "12:00";
    const date = data.date
      ? data.date.slice(0, 10)
      : data.examDate
      ? new Date(data.examDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const examDate = data.examDate
      ? new Date(data.examDate)
      : new Date(`${date}T12:00:00.000Z`);

    const program = data.program || data.className || data.gradeOrClass || data.department || "";
    const className =
      data.className ||
      data.program ||
      data.gradeOrClass ||
      data.department ||
      (data.section ? `Class ${data.section}` : "Grade 10");
    const gradeOrClass = data.gradeOrClass || className;
    const department = data.department || className;
    const room = data.room || data.roomNumber || "Hall A";
    const examType = data.examType || "Midterm";
    const examName =
      data.examName ||
      `${examType} Examination - ${data.subject || "Subject"}`;

    const startM = parseTimeToMinutes(startTime) ?? 9 * 60;
    const sessionOrShift =
      data.sessionOrShift ||
      (startM < 12 * 60 ? "Morning" : startM < 16 * 60 ? "Afternoon" : "Evening");

    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      institutionType: data.institutionType || "School",
      program: program || className,
      examName,
      examType,
      subject: data.subject || "General Examination",
      className,
      gradeOrClass,
      department,
      section: data.section || "A",
      room,
      roomNumber: room,
      invigilator:
        data.invigilator || data.teacherName || "Assigned Invigilator",
      totalMarks:
        Number(data.totalMarks) > 0 ? Number(data.totalMarks) : 100,
      startTime,
      endTime,
      date,
      examDate,
      sessionOrShift,
      isDualExamDay: false,
    };

    await this.validateExamConflicts(campusId, payload);

    const existingSameCohort = await ExamSchedule.findOne({
      campusId,
      $or: [
        { date },
        {
          examDate: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`),
          },
        },
      ],
      $or: [{ program }, { className }, { gradeOrClass }],
      section: payload.section,
    });

    if (existingSameCohort) {
      payload.isDualExamDay = true;
    }

    const created = await ExamSchedule.create(payload);

    if (existingSameCohort) {
      await ExamSchedule.updateOne(
        { _id: existingSameCohort._id },
        { isDualExamDay: true }
      );
    }

    return created;
  }

  async getAllExamSchedules(campusId, filter = {}) {
    const query = { campusId };
    if (filter.examType) query.examType = filter.examType;
    if (filter.program || filter.className || filter.gradeOrClass || filter.department) {
      const term = filter.program || filter.className || filter.gradeOrClass || filter.department;
      query.$or = [
        { program: term },
        { className: term },
        { gradeOrClass: term },
        { department: term },
      ];
    }
    if (filter.section) query.section = filter.section;
    if (filter.room) {
      query.$or = [{ room: filter.room }, { roomNumber: filter.room }];
    }
    if (filter.invigilator) {
      query.invigilator = new RegExp(filter.invigilator, "i");
    }
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
    const existing = await ExamSchedule.findOne({ _id: id, campusId });
    if (!existing) throw new Error("Exam schedule not found.");

    const mergedPayload = {
      ...existing.toObject(),
      ...updateData,
      campusId,
    };
    if (updateData.startTime) {
      mergedPayload.startTime =
        normalizeTimeString(updateData.startTime) || updateData.startTime;
    }
    if (updateData.endTime) {
      mergedPayload.endTime =
        normalizeTimeString(updateData.endTime) || updateData.endTime;
    }
    if (updateData.date) {
      mergedPayload.date = updateData.date.slice(0, 10);
      mergedPayload.examDate = new Date(`${mergedPayload.date}T12:00:00.000Z`);
    }
    if (updateData.room) {
      mergedPayload.room = updateData.room;
      mergedPayload.roomNumber = updateData.room;
    }
    if (updateData.department) {
      mergedPayload.className = updateData.department;
      mergedPayload.gradeOrClass = updateData.department;
      mergedPayload.department = updateData.department;
    }
    if (updateData.totalMarks !== undefined) {
      mergedPayload.totalMarks = Number(updateData.totalMarks) || 100;
    }

    const startM = parseTimeToMinutes(mergedPayload.startTime) ?? 9 * 60;
    mergedPayload.sessionOrShift =
      mergedPayload.sessionOrShift ||
      (startM < 12 * 60 ? "Morning" : startM < 16 * 60 ? "Afternoon" : "Evening");

    await this.validateExamConflicts(campusId, mergedPayload, id);

    const record = await ExamSchedule.findOneAndUpdate(
      { _id: id, campusId },
      mergedPayload,
      { new: true, runValidators: true }
    );

    if (record.date) {
      const cohortExams = await ExamSchedule.find({
        campusId,
        $or: [
          { date: record.date },
          {
            examDate: {
              $gte: new Date(`${record.date}T00:00:00.000Z`),
              $lte: new Date(`${record.date}T23:59:59.999Z`),
            },
          },
        ],
        section: record.section,
      });
      const isDual = cohortExams.length >= 2;
      await ExamSchedule.updateMany(
        { _id: { $in: cohortExams.map((e) => e._id) } },
        { isDualExamDay: isDual }
      );
    }

    return record;
  }

  async deleteExamSchedule(id, campusId) {
    const record = await ExamSchedule.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Exam schedule not found.");

    if (record.date) {
      const remaining = await ExamSchedule.find({
        campusId,
        $or: [
          { date: record.date },
          {
            examDate: {
              $gte: new Date(`${record.date}T00:00:00.000Z`),
              $lte: new Date(`${record.date}T23:59:59.999Z`),
            },
          },
        ],
        section: record.section,
      });
      if (remaining.length === 1) {
        await ExamSchedule.updateOne(
          { _id: remaining[0]._id },
          { isDualExamDay: false }
        );
      }
    }

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
      const dateStr = String(filter.date).slice(0, 10);
      const dStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dEnd = new Date(`${dateStr}T23:59:59.999Z`);
      query.$or = [
        { dateStr },
        { date: { $gte: dStart, $lte: dEnd } },
      ];
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

  async getFeePayments(feeRecordId, campusId) {
    return await PaymentTransaction.find({ feeRecordId, campusId })
      .populate("submittedBy", "name email")
      .populate("confirmedBy", "name email")
      .sort({ createdAt: -1 });
  }

  async getPendingPayments(campusId) {
    return await PaymentTransaction.find({ campusId, status: "PENDING" })
      .populate("feeRecordId")
      .populate("submittedBy", "name email roll")
      .sort({ createdAt: -1 });
  }

  async getStudentPayments(studentId, campusId) {
    return await PaymentTransaction.find({ studentId, campusId })
      .populate("feeRecordId")
      .populate("submittedBy", "name email")
      .populate("confirmedBy", "name email")
      .sort({ createdAt: -1 });
  }

  async recordPayment(feeRecordId, campusId, instituteId, data) {
    const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, campusId });
    if (!feeRecord) throw new Error("Fee record not found.");

    const amount = Number(data.amount || 0);
    if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
    
    const remaining = feeRecord.amount - feeRecord.paidAmount;
    if (amount > remaining) {
      throw new Error(`Payment amount (${amount}) exceeds remaining balance (${remaining}).`);
    }

    const payment = await PaymentTransaction.create({
      feeRecordId,
      studentId: feeRecord.studentId,
      campusId,
      instituteId: instituteId || null,
      amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paymentMethod: data.paymentMethod || "Cash",
      referenceNo: data.referenceNo || "",
      receiptUrl: data.receiptUrl || "",
      status: data.status || "CONFIRMED",
      submittedBy: data.submittedBy || null,
      confirmedBy: data.status === "CONFIRMED" ? data.submittedBy : null,
      confirmationDate: data.status === "CONFIRMED" ? new Date() : null,
      notes: data.notes || "",
    });

    if (payment.status === "CONFIRMED") {
      await this.updateFeeRecordStatus(feeRecordId, campusId);
    }

    return { payment, feeRecord: await FeeRecord.findById(feeRecordId) };
  }

  async confirmPayment(paymentId, campusId, adminId, notes) {
    const payment = await PaymentTransaction.findOne({ _id: paymentId, campusId });
    if (!payment) throw new Error("Payment transaction not found.");
    if (payment.status !== "PENDING") throw new Error(`Payment is already ${payment.status}.`);

    const feeRecord = await FeeRecord.findOne({ _id: payment.feeRecordId, campusId });
    if (!feeRecord) throw new Error("Associated fee record not found.");

    const remaining = feeRecord.amount - feeRecord.paidAmount;
    if (payment.amount > remaining) {
      throw new Error(`Payment amount (${payment.amount}) exceeds remaining balance (${remaining}).`);
    }

    payment.status = "CONFIRMED";
    payment.confirmedBy = adminId;
    payment.confirmationDate = new Date();
    if (notes) payment.notes = notes;
    await payment.save();

    const updatedFeeRecord = await this.updateFeeRecordStatus(payment.feeRecordId, campusId);
    return { payment, feeRecord: updatedFeeRecord };
  }

  async rejectPayment(paymentId, campusId, adminId, notes) {
    const payment = await PaymentTransaction.findOne({ _id: paymentId, campusId });
    if (!payment) throw new Error("Payment transaction not found.");
    if (payment.status !== "PENDING") throw new Error(`Payment is already ${payment.status}.`);

    payment.status = "REJECTED";
    payment.confirmedBy = adminId;
    payment.confirmationDate = new Date();
    if (notes) payment.notes = notes;
    await payment.save();

    return { payment, feeRecord: await FeeRecord.findById(payment.feeRecordId) };
  }

  async updateFeeRecordStatus(feeRecordId, campusId) {
    const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, campusId });
    if (!feeRecord) return null;

    const confirmedPayments = await PaymentTransaction.find({
      feeRecordId,
      campusId,
      status: "CONFIRMED"
    });

    const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
    feeRecord.paidAmount = totalPaid;

    if (totalPaid >= feeRecord.amount) {
      feeRecord.status = "PAID";
      feeRecord.paymentDate = new Date();
    } else if (totalPaid > 0) {
      feeRecord.status = "PARTIALLY_PAID";
      if (new Date() > feeRecord.dueDate) {
        feeRecord.status = "OVERDUE";
      }
    } else {
      feeRecord.status = new Date() > feeRecord.dueDate ? "OVERDUE" : "UNPAID";
    }

    await feeRecord.save();
    return feeRecord;
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

      if (student.baseFee && student.baseFee > 0) {
        amount = student.baseFee;
        breakdown = [{ title: "Monthly Tuition Fee", amount: student.baseFee }];
      } else if (matchedStructure) {
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
        status: "UNPAID",
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

  // --- Assignment Operations ---
  async createAssignment(campusId, instituteId, data) {
    const payload = {
      ...data,
      campusId,
      instituteId: instituteId || null,
      program: data.program || data.gradeOrClass || "",
      gradeOrClass: data.gradeOrClass || data.program || "",
      section: data.section || "",
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 86400000),
      totalMarks: Number(data.totalMarks || 100),
      status: data.status || "Active",
      submissions: [],
    };
    return await Assignment.create(payload);
  }

  async getAllAssignments(campusId, filter = {}) {
    const query = { campusId };
    if (filter.program) query.$or = [{ program: filter.program }, { gradeOrClass: filter.program }];
    if (filter.gradeOrClass) query.$or = [{ program: filter.gradeOrClass }, { gradeOrClass: filter.gradeOrClass }];
    if (filter.section) query.section = filter.section;
    if (filter.subject) query.subject = new RegExp(filter.subject, "i");
    if (filter.status && filter.status !== "all") query.status = filter.status;
    if (filter.instructorId) query.instructorId = filter.instructorId;
    return await Assignment.find(query).sort({ dueDate: 1, createdAt: -1 });
  }

  async getAssignmentById(id, campusId) {
    const record = await Assignment.findOne({ _id: id, campusId });
    if (!record) throw new Error("Assignment not found.");
    return record;
  }

  async updateAssignment(id, campusId, updateData) {
    const payload = { ...updateData };
    if (payload.dueDate) payload.dueDate = new Date(payload.dueDate);
    if (payload.totalMarks !== undefined) payload.totalMarks = Number(payload.totalMarks);
    const record = await Assignment.findOneAndUpdate(
      { _id: id, campusId },
      payload,
      { new: true, runValidators: true }
    );
    if (!record) throw new Error("Assignment not found.");
    return record;
  }

  async deleteAssignment(id, campusId) {
    const record = await Assignment.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Assignment not found.");
    return record;
  }

  async submitAssignment(assignmentId, campusId, studentId, data) {
    const assignment = await Assignment.findOne({ _id: assignmentId, campusId });
    if (!assignment) throw new Error("Assignment not found.");
    const existing = assignment.submissions.find((s) => String(s.studentId) === String(studentId));
    if (existing) {
      existing.notes = data.notes || existing.notes;
      existing.submittedAt = new Date();
      existing.status = "Submitted";
    } else {
      assignment.submissions.push({
        studentId,
        status: "Submitted",
        notes: data.notes || "",
        submittedAt: new Date(),
      });
    }
    return await assignment.save();
  }

  async gradeSubmission(assignmentId, campusId, studentId, { score, feedback }) {
    const assignment = await Assignment.findOne({ _id: assignmentId, campusId });
    if (!assignment) throw new Error("Assignment not found.");
    const submission = assignment.submissions.find((s) => String(s.studentId) === String(studentId));
    if (!submission) throw new Error("Submission not found.");
    submission.score = Number(score);
    submission.feedback = feedback || "";
    submission.status = "Graded";
    return await assignment.save();
  }
}

export default new CampusAdminService();
