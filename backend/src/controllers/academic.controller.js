import {
  Grade,
  Section,
  Subject,
  GradeSubject,
  TeacherAssignment,
} from "../models/academic.model.js";
import User from "../models/user.model.js";

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
export const getTeacherAssignments = async (req, res) => {
  try {
    const { gradeId, sectionId, subjectId, teacherId } = req.query;
    const query = { campusId: req.user.campusId };
    if (gradeId) query.gradeId = gradeId;
    if (sectionId) query.sectionId = sectionId;
    if (subjectId) query.subjectId = subjectId;
    if (teacherId) query.teacherId = teacherId;

    const assignments = await TeacherAssignment.find(query)
      .populate("teacherId", "name email")
      .populate("gradeId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name code");
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching assignments", error });
  }
};

export const createTeacherAssignment = async (req, res) => {
  try {
    const { teacherId, gradeId, sectionId, subjectId } = req.body;
    const existing = await TeacherAssignment.findOne({
      teacherId,
      gradeId,
      sectionId,
      subjectId,
      campusId: req.user.campusId,
    });
    if (existing) {
      return res.status(400).json({ message: "Assignment already exists" });
    }
    
    // Validate subject is part of grade
    const gradeSubject = await GradeSubject.findOne({ gradeId, subjectId });
    if (!gradeSubject) {
        return res.status(400).json({ message: "This subject is not configured for this grade." });
    }

    const assignment = await TeacherAssignment.create({
      teacherId,
      gradeId,
      sectionId,
      subjectId,
      campusId: req.user.campusId,
      instituteId: req.user.instituteId,
    });
    const populated = await TeacherAssignment.findById(assignment._id)
      .populate("teacherId", "name email")
      .populate("gradeId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name code");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error creating assignment", error });
  }
};

export const deleteTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await TeacherAssignment.findOneAndDelete({ _id: id, campusId: req.user.campusId });
    res.status(200).json({ message: "Assignment removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error removing assignment", error });
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

