import mongoose from "mongoose";
import {
  Grade,
  Section,
  Subject,
  GradeSubject,
  TeacherAssignment,
} from "../models/academic.model.js";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import { TeacherProfile } from "../models/profile.model.js";

// GRADES
export const getGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ campusId: req.user.campusId }).sort({
      createdAt: 1,
    });
    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching grades", error });
  }
};

export const createGrade = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = await Grade.findOne({ campusId: req.user.campusId, name });
    if (existing) {
      return res.status(400).json({ message: "Grade already exists" });
    }
    const grade = await Grade.create({
      name,
      description,
      campusId: req.user.campusId,
      instituteId: req.user.instituteId,
    });
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: "Server error creating grade", error });
  }
};

export const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    await Grade.findOneAndDelete({ _id: id, campusId: req.user.campusId });
    // Also delete linked sections, gradeSubjects, teacherAssignments
    await Section.deleteMany({ gradeId: id });
    await GradeSubject.deleteMany({ gradeId: id });
    await TeacherAssignment.deleteMany({ gradeId: id });
    res.status(200).json({ message: "Grade deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting grade", error });
  }
};

// SECTIONS
export const getSections = async (req, res) => {
  try {
    const { gradeId } = req.query;
    const query = { campusId: req.user.campusId };
    if (gradeId) query.gradeId = gradeId;
    const sections = await Section.find(query).populate("gradeId", "name");
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching sections", error });
  }
};

export const createSection = async (req, res) => {
  try {
    const { name, gradeId } = req.body;
    const existing = await Section.findOne({
      campusId: req.user.campusId,
      gradeId,
      name,
    });
    if (existing) {
      return res.status(400).json({ message: "Section already exists in this grade" });
    }
    const section = await Section.create({
      name,
      gradeId,
      campusId: req.user.campusId,
      instituteId: req.user.instituteId,
    });
    const populated = await Section.findById(section._id).populate("gradeId", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error creating section", error });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await Section.findOneAndDelete({ _id: id, campusId: req.user.campusId });
    await TeacherAssignment.deleteMany({ sectionId: id });
    res.status(200).json({ message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting section", error });
  }
};

// SUBJECTS
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ campusId: req.user.campusId });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching subjects", error });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const existing = await Subject.findOne({ campusId: req.user.campusId, name });
    if (existing) {
      return res.status(400).json({ message: "Subject already exists" });
    }
    const subject = await Subject.create({
      name,
      code,
      description,
      campusId: req.user.campusId,
      instituteId: req.user.instituteId,
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: "Server error creating subject", error });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await Subject.findOneAndDelete({ _id: id, campusId: req.user.campusId });
    await GradeSubject.deleteMany({ subjectId: id });
    await TeacherAssignment.deleteMany({ subjectId: id });
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting subject", error });
  }
};

// GRADE-SUBJECT ASSIGNMENTS (Class Subjects)
export const getGradeSubjects = async (req, res) => {
  try {
    const { gradeId } = req.query;
    const query = { campusId: req.user.campusId };
    if (gradeId) query.gradeId = gradeId;
    const gradeSubjects = await GradeSubject.find(query)
      .populate("gradeId", "name")
      .populate("subjectId", "name code");
    res.status(200).json(gradeSubjects);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching grade subjects", error });
  }
};

export const assignSubjectToGrade = async (req, res) => {
  try {
    const { gradeId, subjectId } = req.body;
    const existing = await GradeSubject.findOne({
      gradeId,
      subjectId,
      campusId: req.user.campusId,
    });
    if (existing) {
      return res.status(400).json({ message: "Subject already assigned to this grade" });
    }
    const gradeSubject = await GradeSubject.create({
      gradeId,
      subjectId,
      campusId: req.user.campusId,
      instituteId: req.user.instituteId,
    });
    const populated = await GradeSubject.findById(gradeSubject._id)
      .populate("gradeId", "name")
      .populate("subjectId", "name code");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error assigning subject", error });
  }
};

export const removeSubjectFromGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const gs = await GradeSubject.findOneAndDelete({ _id: id, campusId: req.user.campusId });
    if (gs) {
      await TeacherAssignment.deleteMany({ gradeId: gs.gradeId, subjectId: gs.subjectId });
    }
    res.status(200).json({ message: "Subject removed from grade" });
  } catch (error) {
    res.status(500).json({ message: "Server error removing subject from grade", error });
  }
};

// TEACHER ASSIGNMENTS
export const checkTeacherAssignmentConflict = async (req, res) => {
  try {
    const campusId = req.user.campusId;
    const { teacherId, gradeId, sectionId, subjectId, timeSlot } = {
      ...req.query,
      ...req.body,
    };

    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus context required" });
    }

    let timeConflict = null;
    let subjectConflict = null;

    // 1. Check Time Conflict (if teacher and timeSlot provided)
    if (teacherId && timeSlot && timeSlot.trim()) {
      const existingTeacherSlots = await TeacherAssignment.find({
        campusId,
        teacherId,
        timeSlot: { $exists: true, $ne: "" },
      })
        .populate("gradeId", "name")
        .populate("sectionId", "name")
        .populate("subjectId", "name code")
        .lean();

      timeConflict = existingTeacherSlots.find((ea) => {
        const isSameClassAndSubject =
          String(ea.gradeId?._id || ea.gradeId) === String(gradeId) &&
          String(ea.sectionId?._id || ea.sectionId) === String(sectionId) &&
          String(ea.subjectId?._id || ea.subjectId) === String(subjectId);
        if (isSameClassAndSubject) return false;

        const eaSlot = (ea.timeSlot || "").trim().toLowerCase();
        const currentSlot = timeSlot.trim().toLowerCase();
        return eaSlot === currentSlot;
      });
    }

    // 2. Check Subject Already Assigned Conflict
    if (gradeId && sectionId && subjectId) {
      const query = {
        campusId,
        gradeId,
        sectionId,
        subjectId,
      };
      if (teacherId) {
        query.teacherId = { $ne: teacherId };
      }
      subjectConflict = await TeacherAssignment.findOne(query)
        .populate("teacherId", "name email")
        .populate("subjectId", "name code")
        .lean();
    }

    if (timeConflict || subjectConflict) {
      const conflictType = timeConflict && subjectConflict 
        ? "BOTH_CONFLICTS"
        : timeConflict 
          ? "TIME_CONFLICT" 
          : "SUBJECT_CONFLICT";

      let message = "";
      if (timeConflict && subjectConflict) {
        message = `Double Conflict: Teacher is already scheduled during "${timeSlot}" AND this subject is already assigned to ${subjectConflict.teacherId?.name || "another teacher"}.`;
      } else if (timeConflict) {
        const otherClass = `${timeConflict.gradeId?.name || "Class"} - Section ${timeConflict.sectionId?.name || ""}`;
        const otherSub = timeConflict.subjectId?.name || "Subject";
        message = `Scheduling Conflict: Teacher is already teaching ${otherClass} (${otherSub}) during "${timeSlot}".`;
      } else {
        const existingTeacherName = subjectConflict.teacherId?.name || "Another teacher";
        message = `Subject Conflict: This class subject is already assigned to ${existingTeacherName}.`;
      }

      return res.status(200).json({
        success: true,
        hasConflict: true,
        conflictType,
        message,
        details: {
          timeConflict: timeConflict ? {
            class: `${timeConflict.gradeId?.name || "Class"} - ${timeConflict.sectionId?.name || "Section"}`,
            subject: timeConflict.subjectId?.name || "",
            timeSlot: timeConflict.timeSlot,
          } : null,
          subjectConflict: subjectConflict ? {
            teacherName: subjectConflict.teacherId?.name || "Assigned Teacher",
            teacherEmail: subjectConflict.teacherId?.email || "",
            subjectName: subjectConflict.subjectId?.name || "",
            existingAssignmentId: subjectConflict._id,
          } : null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      hasConflict: false,
      message: "No scheduling or subject conflicts detected.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherAssignments = async (req, res) => {
  try {
    const { gradeId, sectionId, subjectId, teacherId } = req.query;
    const query = { campusId: req.user.campusId };
    if (gradeId) query.gradeId = gradeId;
    if (sectionId) query.sectionId = sectionId;
    if (subjectId) query.subjectId = subjectId;
    if (teacherId) {
      const possibleIds = [teacherId];
      if (mongoose.isValidObjectId(teacherId)) {
        const u = await User.findById(teacherId);
        if (u) {
          const p = await TeacherProfile.findOne({ user: u._id });
          if (p) possibleIds.push(p._id);
        } else {
          const p = await TeacherProfile.findById(teacherId);
          if (p?.user) possibleIds.push(p.user);
        }
      }
      query.teacherId = { $in: possibleIds };
    }

    const assignments = await TeacherAssignment.find(query)
      .populate("teacherId", "name email phone avatar designation department")
      .populate("gradeId", "name")
      .populate("sectionId", "name classTeacherId")
      .populate("subjectId", "name code")
      .populate("forceConfirmedBy", "name email")
      .sort({ createdAt: -1 });

    // Calculate total classes assigned per teacher in this campus for workload visibility
    const allCampusAssignments = await TeacherAssignment.find({ campusId: req.user.campusId }).select("teacherId").lean();
    const teacherWorkloadCounts = {};
    for (const a of allCampusAssignments) {
      const tId = String(a.teacherId?._id || a.teacherId);
      if (tId) {
        teacherWorkloadCounts[tId] = (teacherWorkloadCounts[tId] || 0) + 1;
      }
    }

    const enriched = assignments.map((a) => {
      const tId = String(a.teacherId?._id || a.teacherId);
      const isClassTeacher = a.sectionId?.classTeacherId && String(a.sectionId.classTeacherId) === tId;
      return {
        ...a.toObject(),
        totalClassesAssigned: teacherWorkloadCounts[tId] || 1,
        isClassTeacher: Boolean(isClassTeacher),
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching assignments", error: error.message });
  }
};

export const createTeacherAssignment = async (req, res) => {
  try {
    const {
      teacherId,
      gradeId,
      sectionId,
      subjectId,
      timeSlot = "",
      roomNumber = "",
      forceConfirm = false,
      overrideReason = "",
    } = req.body;

    let campusId = req.user.campusId;
    let instituteId = req.user.instituteId;

    if (!instituteId && campusId) {
      const camp = await Campus.findById(campusId).select("instituteId");
      if (camp) instituteId = camp.instituteId;
    }

    // Resolve canonical user and profile IDs
    let resolvedUserId = teacherId;
    let resolvedProfileId = null;

    if (mongoose.isValidObjectId(teacherId)) {
      const u = await User.findById(teacherId);
      if (u) {
        resolvedUserId = u._id;
        const p = await TeacherProfile.findOne({ user: u._id });
        resolvedProfileId = p?._id || null;
      } else {
        const p = await TeacherProfile.findById(teacherId);
        if (p && p.user) {
          resolvedUserId = p.user;
          resolvedProfileId = p._id;
        }
      }
    }

    const checkTeacherIds = [resolvedUserId, resolvedProfileId].filter(Boolean);

    // 1. Check for exact duplicate of this teacher in this class & subject
    const exactExisting = await TeacherAssignment.findOne({
      teacherId: { $in: checkTeacherIds },
      gradeId,
      sectionId,
      subjectId,
      campusId,
    });
    if (exactExisting) {
      // If updating timeSlot or roomNumber
      if (timeSlot || roomNumber) {
        exactExisting.timeSlot = timeSlot || exactExisting.timeSlot;
        exactExisting.roomNumber = roomNumber || exactExisting.roomNumber;
        await exactExisting.save();
        const updated = await TeacherAssignment.findById(exactExisting._id)
          .populate("teacherId", "name email phone avatar")
          .populate("gradeId", "name")
          .populate("sectionId", "name")
          .populate("subjectId", "name code");
        return res.status(200).json(updated);
      }
      return res.status(400).json({ message: "Teacher is already assigned to this class and subject" });
    }

    // 2. Check Conflicts:
    // A. Time Slot conflict: teacher already has another class during the same time slot
    let timeConflict = null;
    if (timeSlot && timeSlot.trim()) {
      const teacherSlots = await TeacherAssignment.find({
        campusId,
        teacherId: { $in: checkTeacherIds },
        timeSlot: { $exists: true, $ne: "" },
      })
        .populate("gradeId", "name")
        .populate("sectionId", "name")
        .populate("subjectId", "name code")
        .lean();

      timeConflict = teacherSlots.find((ea) => {
        const isSameClassAndSubject =
          String(ea.gradeId?._id || ea.gradeId) === String(gradeId) &&
          String(ea.sectionId?._id || ea.sectionId) === String(sectionId) &&
          String(ea.subjectId?._id || ea.subjectId) === String(subjectId);
        if (isSameClassAndSubject) return false;
        return (ea.timeSlot || "").trim().toLowerCase() === timeSlot.trim().toLowerCase();
      });
    }

    // B. Subject Conflict: subject already assigned to another teacher in this section
    const subjectConflict = await TeacherAssignment.findOne({
      campusId,
      gradeId,
      sectionId,
      subjectId,
      teacherId: { $nin: checkTeacherIds },
    })
      .populate("teacherId", "name email")
      .populate("subjectId", "name code");

    // 3. If Conflict Exists and NOT Force Confirmed -> Return 409 Conflict
    if ((timeConflict || subjectConflict) && !forceConfirm) {
      let conflictType = "";
      let message = "";
      if (timeConflict && subjectConflict) {
        conflictType = "BOTH_CONFLICTS";
        message = `Scheduling & Subject Conflict: Teacher is already busy during "${timeSlot}", and this subject is already assigned to ${subjectConflict.teacherId?.name || "another teacher"}.`;
      } else if (timeConflict) {
        conflictType = "TIME_CONFLICT";
        const otherClass = `${timeConflict.gradeId?.name || "Class"} - Section ${timeConflict.sectionId?.name || ""}`;
        const otherSub = timeConflict.subjectId?.name || "Subject";
        message = `Scheduling Conflict: Teacher is already teaching ${otherClass} (${otherSub}) during "${timeSlot}".`;
      } else {
        conflictType = "SUBJECT_CONFLICT";
        const existingTeacherName = subjectConflict.teacherId?.name || "Another teacher";
        message = `Subject Conflict: This class subject is already assigned to ${existingTeacherName}.`;
      }

      return res.status(409).json({
        success: false,
        conflict: true,
        conflictType,
        message,
        details: {
          timeConflict: timeConflict ? {
            class: `${timeConflict.gradeId?.name || "Class"} - ${timeConflict.sectionId?.name || "Section"}`,
            subject: timeConflict.subjectId?.name || "",
            timeSlot: timeConflict.timeSlot,
          } : null,
          subjectConflict: subjectConflict ? {
            teacherName: subjectConflict.teacherId?.name || "Assigned Teacher",
            teacherEmail: subjectConflict.teacherId?.email || "",
            subjectName: subjectConflict.subjectId?.name || "",
            existingAssignmentId: subjectConflict._id,
          } : null,
        },
      });
    }

    // 4. If Force Confirmed and subject conflict exists:
    // Remove the previous assignment to prevent orphaned duplicate subject assignments
    if (subjectConflict && forceConfirm) {
      await TeacherAssignment.findByIdAndDelete(subjectConflict._id);
    }

    // Auto-link GradeSubject if not already configured
    let gradeSubject = await GradeSubject.findOne({ gradeId, subjectId, campusId });
    if (!gradeSubject) {
      gradeSubject = await GradeSubject.create({
        gradeId,
        subjectId,
        campusId,
        instituteId: instituteId || null,
      });
    }

    const hasConflict = Boolean(timeConflict || subjectConflict);
    const assignment = await TeacherAssignment.create({
      teacherId: resolvedUserId,
      gradeId,
      sectionId,
      subjectId,
      timeSlot: timeSlot ? timeSlot.trim() : "",
      roomNumber: roomNumber ? roomNumber.trim() : "",
      isForceConfirmed: Boolean(hasConflict && forceConfirm),
      overrideReason: hasConflict && forceConfirm
        ? (overrideReason || (timeConflict ? `Override time conflict at ${timeSlot}` : "Reassigned subject override"))
        : "",
      forceConfirmedBy: hasConflict && forceConfirm ? req.user._id : null,
      forceConfirmedAt: hasConflict && forceConfirm ? new Date() : null,
      campusId,
      instituteId: instituteId || null,
    });

    // Synchronize subject name with TeacherProfile & User
    const subjectDoc = await Subject.findById(subjectId);
    if (subjectDoc) {
      await TeacherProfile.findOneAndUpdate(
        { $or: [{ user: resolvedUserId }, ...(resolvedProfileId ? [{ _id: resolvedProfileId }] : [])] },
        { $addToSet: { subjectsTaught: subjectDoc.name } }
      );
      const user = await User.findById(resolvedUserId);
      if (user) {
        const currentSubs = (user.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
        if (!currentSubs.includes(subjectDoc.name)) {
          currentSubs.push(subjectDoc.name);
          await User.findByIdAndUpdate(resolvedUserId, { subjects: currentSubs.join(", ") });
        }
      }
    }

    const populated = await TeacherAssignment.findById(assignment._id)
      .populate("teacherId", "name email phone avatar designation department")
      .populate("gradeId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name code")
      .populate("forceConfirmedBy", "name email");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error creating assignment", error: error.message });
  }
};

export const deleteTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await TeacherAssignment.findOneAndDelete({ _id: id, campusId: req.user.campusId });
    if (assignment) {
      const subjectDoc = await Subject.findById(assignment.subjectId);
      if (subjectDoc) {
        const remaining = await TeacherAssignment.countDocuments({
          teacherId: assignment.teacherId,
          subjectId: assignment.subjectId,
        });
        if (remaining === 0) {
          await TeacherProfile.findOneAndUpdate(
            { user: assignment.teacherId },
            { $pull: { subjectsTaught: subjectDoc.name } }
          );
        }
      }
    }
    res.status(200).json({ message: "Assignment removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error removing assignment", error: error.message });
  }
};

// PESHAWAR BOARD PRESET SEEDER FOR CAMPUS ADMIN
export const PESHAWAR_BOARD_CATALOG = [
  { name: "English Compulsory", code: "ENG-9", description: "BISE Peshawar Board - English Language, Grammar, Composition & Literature" },
  { name: "Urdu Compulsory", code: "URD-9", description: "BISE Peshawar Board - Urdu Qawaid, Nazm, Ghazal & Sabaq" },
  { name: "Mathematics", code: "MATH-9", description: "BISE Peshawar Board - Algebra, Geometry, Trigonometry & Matrices" },
  { name: "Physics", code: "PHY-9", description: "BISE Peshawar Board - Kinematics, Dynamics, Optics & Practical Labs" },
  { name: "Chemistry", code: "CHEM-9", description: "BISE Peshawar Board - Structure of Atoms, Chemical Reactions & Lab Work" },
  { name: "Computer Science", code: "CS-9", description: "BISE Peshawar Board - Computer Systems, C/Python Coding, Database & IT Labs" },
  { name: "Biology", code: "BIO-9", description: "BISE Peshawar Board - Cell Biology, Genetics, Enzymes, Physiology & Lab" },
  { name: "Islamic Studies (Islamiat)", code: "ISL-9", description: "BISE Peshawar Board - Selected Surahs, Ahadith & Islamic Morals" },
  { name: "Pakistan Studies", code: "PAK-10", description: "BISE Peshawar Board - Creation of Pakistan, Constitution & Geography" },
  { name: "Mutala-e-Quran-e-Hakeem", code: "MQH-9", description: "BISE Peshawar Board - Translation & Tajweed of the Holy Quran" },
  { name: "General Science", code: "GSCI-8", description: "Integrated Foundation Sciences for Middle / Secondary Groups" },
];

export const PESHAWAR_BOARD_GRADES = [
  { name: "Class 6", desc: "Middle School Grade 6 Curriculum" },
  { name: "Class 7", desc: "Middle School Grade 7 Curriculum" },
  { name: "Class 8", desc: "Middle School Grade 8 Curriculum" },
  { name: "Class 9", desc: "Secondary School Certificate Part 1 (SSC-I) - Peshawar Board" },
  { name: "Class 10", desc: "Secondary School Certificate Part 2 (SSC-II) - Peshawar Board" },
  { name: "1st Year (11th)", desc: "Higher Secondary School Certificate Part 1 (HSSC-I) - FSc / ICS / FA" },
  { name: "2nd Year (12th)", desc: "Higher Secondary School Certificate Part 2 (HSSC-II) - FSc / ICS / FA" },
];

export const getPeshawarPresetPreview = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      board: "BISE Peshawar (Khyber Pakhtunkhwa)",
      subjects: PESHAWAR_BOARD_CATALOG,
      grades: PESHAWAR_BOARD_GRADES,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const seedPeshawarBoardPreset = async (req, res) => {
  try {
    const campusId = req.user.campusId;
    const instituteId = req.user.instituteId;

    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus context required" });
    }

    // 1. Upsert Subjects
    const subjectDocs = [];
    for (const sub of PESHAWAR_BOARD_CATALOG) {
      const doc = await Subject.findOneAndUpdate(
        { campusId, name: sub.name },
        { $set: { code: sub.code, description: sub.description, instituteId } },
        { upsert: true, new: true }
      );
      subjectDocs.push(doc);
    }
    const subMap = new Map(subjectDocs.map((s) => [s.name, s]));

    // 2. Upsert Grades & Sections
    const gradeDocs = [];
    for (const item of PESHAWAR_BOARD_GRADES) {
      const gDoc = await Grade.findOneAndUpdate(
        { campusId, name: item.name },
        { $set: { description: item.desc, instituteId } },
        { upsert: true, new: true }
      );
      gradeDocs.push(gDoc);

      for (const sName of ["Section A", "Section B"]) {
        await Section.findOneAndUpdate(
          { campusId, gradeId: gDoc._id, name: sName },
          { $set: { instituteId } },
          { upsert: true, new: true }
        );
      }
    }

    // 3. Link GradeSubjects
    const gsOps = [];
    for (const g of gradeDocs) {
      let subjectList = [];
      if (g.name === "Class 9") {
        subjectList = ["English Compulsory", "Urdu Compulsory", "Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "Islamic Studies (Islamiat)", "Mutala-e-Quran-e-Hakeem"];
      } else if (g.name === "Class 10") {
        subjectList = ["English Compulsory", "Urdu Compulsory", "Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "Pakistan Studies", "Mutala-e-Quran-e-Hakeem"];
      } else if (g.name.includes("1st Year") || g.name.includes("2nd Year")) {
        subjectList = ["English Compulsory", "Urdu Compulsory", "Mathematics", "Physics", "Chemistry", "Computer Science", "Islamic Studies (Islamiat)", "Pakistan Studies"];
      } else {
        subjectList = ["English Compulsory", "Urdu Compulsory", "Mathematics", "General Science", "Islamic Studies (Islamiat)", "Computer Science"];
      }

      for (const sName of subjectList) {
        const sub = subMap.get(sName);
        if (sub) {
          gsOps.push({
            updateOne: {
              filter: { campusId, gradeId: g._id, subjectId: sub._id },
              update: { $set: { campusId, instituteId, gradeId: g._id, subjectId: sub._id } },
              upsert: true,
            },
          });
        }
      }
    }
    if (gsOps.length) await GradeSubject.bulkWrite(gsOps);

    // 4. Also update students in this campus with the standard subjects string if empty
    const students = await User.find({ campusId, role: "student" });
    const class9Subjects = ["English Compulsory", "Urdu Compulsory", "Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "Islamic Studies (Islamiat)", "Mutala-e-Quran-e-Hakeem"].join(", ");
    const updateOps = students.map((s) => ({
      updateOne: {
        filter: { _id: s._id },
        update: {
          $set: {
            gradeOrClass: s.gradeOrClass || "Class 9",
            program: s.program || "Class 9",
            section: s.section || "Section A",
            subjects: s.subjects || class9Subjects,
          },
        },
      },
    }));
    if (updateOps.length) await User.bulkWrite(updateOps);

    return res.status(200).json({
      success: true,
      message: "BISE Peshawar Board standard academic structure and subjects seeded successfully!",
      gradesCount: gradeDocs.length,
      subjectsCount: subjectDocs.length,
      gradeSubjectsCount: gsOps.length,
    });
  } catch (error) {
    console.error("Seed Peshawar Board Preset Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

