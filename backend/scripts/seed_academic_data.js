import mongoose from "mongoose";
import "dotenv/config";
import { Grade, Section, Subject, GradeSubject, TeacherAssignment } from "../src/models/academic.model.js";
import User from "../src/models/user.model.js";
import Campus from "../src/models/campus.model.js";
import Institute from "../src/models/institute.model.js";

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/eduhub");
    console.log("Connected to MongoDB.");

    // 1. Get Context
    // Find the first campus admin to inherit campusId and instituteId
    let campus = await Campus.findOne();
    if (!campus) {
      console.log("No campus found, creating a default one...");
      const institute = await Institute.findOne() || await Institute.create({
        name: "EduHub Default Institute",
        code: "EDU-001",
        website: "https://eduhub.local",
        email: "admin@eduhub.local",
        status: "Active"
      });
      campus = await Campus.create({
        name: "EduHub Main Campus",
        code: "MC-001",
        instituteId: institute._id,
        status: "Active",
        contactDetails: { email: "campus@eduhub.local" }
      });
    }

    const campusId = campus._id;
    const instituteId = campus.instituteId;

    console.log(`Using Campus ID: ${campusId}`);

    // Fetch or create some teachers
    let teachers = await User.find({ role: { $in: ["teacher", "faculty"] }, campusId }).limit(5);
    if (teachers.length === 0) {
      console.log("No teachers found. Generating mock teachers...");
      const mockTeachers = [
        { name: "Dr. Alan Turing", email: "alan.turing@eduhub.local", role: "teacher", passwordHash: "password123", campusId, instituteId },
        { name: "Marie Curie", email: "marie.curie@eduhub.local", role: "teacher", passwordHash: "password123", campusId, instituteId },
        { name: "Richard Feynman", email: "richard.feynman@eduhub.local", role: "teacher", passwordHash: "password123", campusId, instituteId },
        { name: "Ada Lovelace", email: "ada.lovelace@eduhub.local", role: "teacher", passwordHash: "password123", campusId, instituteId }
      ];
      teachers = await User.insertMany(mockTeachers);
    }

    // 2. Clear Existing Academic Data to prevent duplicates during seed
    console.log("Clearing existing academic configuration...");
    await Grade.deleteMany({ campusId });
    await Section.deleteMany({ campusId });
    await Subject.deleteMany({ campusId });
    await GradeSubject.deleteMany({ campusId });
    await TeacherAssignment.deleteMany({ campusId });

    // 3. Create Grades
    console.log("Seeding Grades...");
    const grades = await Grade.insertMany([
      { name: "Grade 9 (Science)", description: "Matriculation Science Group", campusId, instituteId },
      { name: "Grade 10 (Science)", description: "Matriculation Science Group", campusId, instituteId },
      { name: "BS Computer Science", description: "Undergraduate CS Program", campusId, instituteId },
      { name: "BS Software Engineering", description: "Undergraduate SE Program", campusId, instituteId }
    ]);

    // 4. Create Sections
    console.log("Seeding Sections...");
    const sectionsData = [];
    for (const grade of grades) {
      sectionsData.push(
        { name: "Section A", gradeId: grade._id, campusId, instituteId },
        { name: "Section B", gradeId: grade._id, campusId, instituteId }
      );
    }
    const sections = await Section.insertMany(sectionsData);

    // 5. Create Subjects
    console.log("Seeding Subjects...");
    const subjects = await Subject.insertMany([
      { name: "Mathematics", code: "MATH101", description: "Core Mathematics", campusId, instituteId },
      { name: "Physics", code: "PHY101", description: "Core Physics", campusId, instituteId },
      { name: "Computer Science", code: "CS101", description: "Introduction to CS", campusId, instituteId },
      { name: "Data Structures", code: "CS201", description: "Advanced Data Structures", campusId, instituteId },
      { name: "English", code: "ENG101", description: "Language and Literature", campusId, instituteId }
    ]);

    // 6. Assign Subjects to Grades (GradeSubject)
    console.log("Mapping Subjects to Grades...");
    const gradeSubjectsData = [];
    for (const grade of grades) {
      for (const subject of subjects) {
        // High school gets math, physics, english
        if (grade.name.includes("Grade") && ["MATH101", "PHY101", "ENG101"].includes(subject.code)) {
            gradeSubjectsData.push({ gradeId: grade._id, subjectId: subject._id, campusId, instituteId });
        }
        // University gets CS and Data Structures, plus English
        if (grade.name.includes("BS") && ["CS101", "CS201", "ENG101"].includes(subject.code)) {
            gradeSubjectsData.push({ gradeId: grade._id, subjectId: subject._id, campusId, instituteId });
        }
      }
    }
    await GradeSubject.insertMany(gradeSubjectsData);

    // 7. Assign Teachers to Sections and Subjects
    console.log("Assigning Teachers...");
    const teacherAssignmentsData = [];
    const bsCSGrade = grades.find(g => g.name === "BS Computer Science");
    const bsSEGrade = grades.find(g => g.name === "BS Software Engineering");
    const grade10 = grades.find(g => g.name === "Grade 10 (Science)");

    const secA_CS = sections.find(s => s.name === "Section A" && s.gradeId.equals(bsCSGrade._id));
    const secA_10 = sections.find(s => s.name === "Section A" && s.gradeId.equals(grade10._id));

    const csSubject = subjects.find(s => s.code === "CS101");
    const dsSubject = subjects.find(s => s.code === "CS201");
    const physicsSubject = subjects.find(s => s.code === "PHY101");
    const mathSubject = subjects.find(s => s.code === "MATH101");

    // Assign Turing to CS101 for BSCS Sec A
    teacherAssignmentsData.push({
      teacherId: teachers[0]._id,
      gradeId: bsCSGrade._id,
      sectionId: secA_CS._id,
      subjectId: csSubject._id,
      campusId,
      instituteId
    });

    // Assign Lovelace to CS201 for BSCS Sec A
    if (teachers[3]) {
      teacherAssignmentsData.push({
        teacherId: teachers[3]._id,
        gradeId: bsCSGrade._id,
        sectionId: secA_CS._id,
        subjectId: dsSubject._id,
        campusId,
        instituteId
      });
    }

    // Assign Curie to Physics for Grade 10 Sec A
    if (teachers[1]) {
      teacherAssignmentsData.push({
        teacherId: teachers[1]._id,
        gradeId: grade10._id,
        sectionId: secA_10._id,
        subjectId: physicsSubject._id,
        campusId,
        instituteId
      });
    }

    // Assign Feynman to Math for Grade 10 Sec A
    if (teachers[2]) {
      teacherAssignmentsData.push({
        teacherId: teachers[2]._id,
        gradeId: grade10._id,
        sectionId: secA_10._id,
        subjectId: mathSubject._id,
        campusId,
        instituteId
      });
    }

    await TeacherAssignment.insertMany(teacherAssignmentsData);

    console.log("Successfully seeded professional academic data!");
    process.exit(0);

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
