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
