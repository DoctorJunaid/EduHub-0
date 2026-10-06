import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";
import { Grade, Section, Subject, GradeSubject, TeacherAssignment } from "../models/academic.model.js";
import { StudentProfile, TeacherProfile, ClassSchedule } from "../models/profile.model.js";
import Timetable from "../models/timetable.model.js";

export async function syncPeshawarBoardData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected.");

  const campuses = await Campus.find().lean();
  console.log(`Found ${campuses.length} campuses.`);

  const peshawarBoardSubjects = [
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

  const standardGrades = [
    { name: "Class 6", desc: "Middle School Grade 6 Curriculum" },
    { name: "Class 7", desc: "Middle School Grade 7 Curriculum" },
    { name: "Class 8", desc: "Middle School Grade 8 Curriculum" },
    { name: "Class 9", desc: "Secondary School Certificate Part 1 (SSC-I) - Peshawar Board" },
    { name: "Class 10", desc: "Secondary School Certificate Part 2 (SSC-II) - Peshawar Board" },
    { name: "1st Year (11th)", desc: "Higher Secondary School Certificate Part 1 (HSSC-I) - FSc / ICS / FA" },
    { name: "2nd Year (12th)", desc: "Higher Secondary School Certificate Part 2 (HSSC-II) - FSc / ICS / FA" },
  ];

  for (const campus of campuses) {
    const campusId = campus._id;
    const instituteId = campus.instituteId;
    console.log(`\n--- Processing Campus: "${campus.name}" ---`);

    // 1. Upsert Subjects
    const subjectDocs = [];
    for (const sub of peshawarBoardSubjects) {
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
    for (const item of standardGrades) {
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
    const gradeMap = new Map(gradeDocs.map((g) => [g.name, g]));

    // 3. Link GradeSubjects in parallel
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
    console.log(`  ✓ Synced ${subjectDocs.length} subjects and ${gradeDocs.length} grades.`);

    // 4. Link Teachers & Timetable Matrix
    const teachers = await User.find({ campusId, role: { $in: ["teacher", "faculty"] } }).limit(6);
    if (teachers.length > 0) {
      const class9 = gradeMap.get("Class 9");
      const secA9 = await Section.findOne({ campusId, gradeId: class9._id, name: "Section A" });
      const weekdays = [1, 2, 3, 4, 5];
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      const scheduleConfig = [
        { subName: "Mathematics", teacher: teachers[0], room: "Room 101", startTime: "08:00", endTime: "08:45" },
        { subName: "Physics", teacher: teachers[1] || teachers[0], room: "Physics Lab", startTime: "08:45", endTime: "09:30" },
        { subName: "Computer Science", teacher: teachers[2] || teachers[0], room: "CS Lab 1", startTime: "09:45", endTime: "10:30" },
        { subName: "Chemistry", teacher: teachers[3] || teachers[0], room: "Chemistry Lab", startTime: "10:30", endTime: "11:15" },
        { subName: "English Compulsory", teacher: teachers[4] || teachers[0], room: "Room 101", startTime: "11:30", endTime: "12:15" },
        { subName: "Urdu Compulsory", teacher: teachers[5] || teachers[0], room: "Room 101", startTime: "12:15", endTime: "01:00" },
      ];

      for (const item of scheduleConfig) {
        const sub = subMap.get(item.subName);
        if (sub && class9 && secA9) {
          await TeacherAssignment.findOneAndUpdate(
            { campusId, teacherId: item.teacher._id, gradeId: class9._id, sectionId: secA9._id, subjectId: sub._id },
            { $set: { campusId, instituteId, teacherId: item.teacher._id, gradeId: class9._id, sectionId: secA9._id, subjectId: sub._id } },
            { upsert: true }
          );

          await Timetable.findOneAndUpdate(
            { campusId, gradeId: class9._id, sectionId: secA9._id, subjectId: sub._id },
            {
              $set: {
                institutionType: "School",
                teacherId: item.teacher._id,
                room: item.room,
                days: weekdays,
                startTime: item.startTime,
                endTime: item.endTime,
                status: "Active",
                instituteId,
              },
            },
            { upsert: true }
          );

          for (const dayOfWeek of dayNames) {
            await ClassSchedule.findOneAndUpdate(
              { campusId, subject: sub.name, className: "Class 9", section: "Section A", dayOfWeek },
              {
                $set: {
                  title: `${sub.name} Class`,
                  subject: sub.name,
                  className: "Class 9",
                  gradeOrClass: "Class 9",
                  section: "Section A",
                  days: weekdays,
                  dayOfWeek,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  room: item.room,
                  roomNumber: item.room,
                  teacherId: item.teacher._id,
                  teacherName: item.teacher.name,
                  instructor: item.teacher.name,
                  instituteId,
                },
              },
              { upsert: true }
            );
          }
        }
      }
      console.log(`  ✓ Synced Teacher assignments & Timetables.`);
    }

    // 5. Bulk Update Students in this campus
    const students = await User.find({ campusId, role: "student" }).lean();
    if (students.length > 0) {
      const studentUserOps = [];
      const profiles = await StudentProfile.find({ user: { $in: students.map((s) => s._id) } }).populate("gradeId sectionId");
      const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

      const defaultGrade = gradeMap.get("Class 9");
      const defaultSec = await Section.findOne({ campusId, gradeId: defaultGrade._id, name: "Section A" });
      const class9Subjects = ["English Compulsory", "Urdu Compulsory", "Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "Islamic Studies (Islamiat)", "Mutala-e-Quran-e-Hakeem"].join(", ");

      for (const s of students) {
        const prof = profileMap.get(String(s._id));
        let gName = prof?.gradeId?.name || s.gradeOrClass || s.program || "Class 9";
        let secName = prof?.sectionId?.name || s.section || "Section A";

        if (!prof) {
          await StudentProfile.create({
            user: s._id,
            studentId: s.roll || `STD-${Math.floor(1000 + Math.random() * 9000)}`,
            gradeId: defaultGrade._id,
            sectionId: defaultSec._id,
            rollNumber: "C9A-001",
            guardianDetails: { name: "Guardian", phone: s.phone || "+92 300 0000000", relation: "Father" },
            isActive: true,
          });
        }

        studentUserOps.push({
          updateOne: {
            filter: { _id: s._id },
            update: {
              $set: {
                gradeOrClass: gName,
                program: gName,
                section: secName,
                subjects: class9Subjects,
              },
            },
          },
        });
      }

      if (studentUserOps.length) {
        await User.bulkWrite(studentUserOps);
      }
      console.log(`  ✓ Synced ${students.length} student records.`);
    }
  }

  console.log("\n=======================================================");
  console.log("✓ All Peshawar Board Academic data synchronized successfully!");
  console.log("=======================================================");
}

if (process.argv[1]?.endsWith("syncPeshawarBoard.js")) {
  syncPeshawarBoardData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
