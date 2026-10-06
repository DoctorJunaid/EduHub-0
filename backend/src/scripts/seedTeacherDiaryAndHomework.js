import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";
import { Grade, Section, Subject, GradeSubject, TeacherAssignment } from "../models/academic.model.js";
import { ClassSchedule } from "../models/profile.model.js";
import Timetable from "../models/timetable.model.js";
import Diary from "../models/diary.model.js";
import Assignment from "../models/assignment.model.js";
import { StudentDiary, StudentAssignment } from "../models/studentPortal.model.js";

export async function seedTeacherDiaryAndHomework() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected.");

  const campuses = await Campus.find().lean();
  console.log(`Found ${campuses.length} campuses.`);

  for (const campus of campuses) {
    const campusId = campus._id;
    const instituteId = campus.instituteId;
    console.log(`\n--- Seeding Teacher Diary & Homework for Campus: "${campus.name}" ---`);

    const teachers = await User.find({ campusId, role: { $in: ["teacher", "faculty"] } }).lean();
    const students = await User.find({ campusId, role: "student" }).lean();
    const timetables = await Timetable.find({ campusId }).lean();
    const classSchedules = await ClassSchedule.find({ campusId }).lean();

    const tMap = new Map(timetables.map((t) => [String(t.subjectId), t]));
    const csMap = new Map(classSchedules.map((cs) => [cs.subject, cs]));

    const defaultTeacher = teachers[0] || { _id: new mongoose.Types.ObjectId(), name: "Dr. Tariq Mansoor" };
    const getTeacherForSub = (subName) => {
      const match = teachers.find(
        (t) =>
          (t.department && t.department.toLowerCase().includes(subName.toLowerCase())) ||
          (t.name && t.name.toLowerCase().includes(subName.toLowerCase()))
      );
      return match || teachers[Math.floor(Math.random() * Math.max(1, teachers.length))] || defaultTeacher;
    };

    // Dates for recent diary
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0];
    const dueDate1 = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
    const dueDate2 = new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0];
    const dueDate3 = new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0];

    const diaryEntriesData = [
      {
        subject: "Mathematics",
        className: "Class 9",
        section: "Section A",
        date: today,
        title: "Factorization of Quadratic Polynomials (Ex 5.2)",
        recap: "Demonstrated algebraic factorization using standard identities (a+b)² and splitting the middle linear term. Solved board questions 1 through 8 with step-by-step verification.",
        homework: "Solve Questions 9 to 18 of Exercise 5.2 in homework notebook. Pay special attention to sign changes during grouping.",
        resources: "KPK Textbook Board Mathematics Class 9, Chapter 5 (Page 104-108).",
      },
      {
        subject: "Physics",
        className: "Class 9",
        section: "Section A",
        date: today,
        title: "Newton's Second Law of Motion & Momentum (F = ma)",
        recap: "Derived the mathematical relation between applied net force, mass, and rate of change of momentum. Solved numerical problems related to accelerating vehicles.",
        homework: "Complete conceptual questions 3.1 to 3.5 and solve textbook numerical problems 3.1 & 3.2 on page 78.",
        resources: "Physics Practical Notebook & Chapter 3 Formula Sheet.",
      },
      {
        subject: "Computer Science",
        className: "Class 9",
        section: "Section A",
        date: yesterday,
        title: "Decision Making & If-Else Branching in C",
        recap: "Discussed boolean conditions, relational operators (==, !=, >, <), and nested if-else structures with code flow diagrams on the multimedia projector.",
        homework: "Write and dry-run a C program to check whether a given year is a Leap Year. Submit the flowchart in lab notebook.",
        resources: "CS Lab Manual - Unit 4 Programming Fundamentals.",
      },
      {
        subject: "Chemistry",
        className: "Class 9",
        section: "Section A",
        date: yesterday,
        title: "Bohr's Atomic Model & Shell Configurations",
        recap: "Explained energy quantization, fixed circular orbits (K, L, M, N), and maximum electron capacity formula (2n²). Illustrated electronic configuration of first 18 elements.",
        homework: "Draw electron dot and cross structures for Carbon, Sodium, and Chlorine atoms.",
        resources: "Chemistry Book Chapter 2, Page 42.",
      },
      {
        subject: "English Compulsory",
        className: "Class 9",
        section: "Section A",
        date: twoDaysAgo,
        title: "The Quaid's Vision & Pakistan - Reading & Vocabulary",
        recap: "Detailed reading and comprehension of Paragraphs 3 & 4. Highlighted contextual meanings of vocabulary: ideology, dynamic, integrity, and sovereignty.",
        homework: "Write a 120-word summary of the Quaid's address to the nation and answer Exercise questions 1 to 4.",
        resources: "English Grade 9 Coursebook - Unit 2.",
      },
      {
        subject: "Islamic Studies (Islamiat)",
        className: "Class 9",
        section: "Section A",
        date: twoDaysAgo,
        title: "Surah Al-Anfal: Verses 1 to 10 (Translation & Explanation)",
        recap: "Translation and thematic tafseer of Surah Al-Anfal focusing on true believers' qualities, trust in Allah (Tawakkul), and obedience to the Prophet (PBUH).",
        homework: "Memorize the translation of Verse 2 and write 5 key moral virtues learned in your Islamiat notebook.",
        resources: "Mutala-e-Quran & Islamiat Compulsory Curriculum (KPK Board).",
      },
    ];

    for (const item of diaryEntriesData) {
      const teacher = getTeacherForSub(item.subject);
      const schedule = csMap.get(item.subject);
      const classId = schedule?._id || new mongoose.Types.ObjectId();

      // Upsert into Diary
      await Diary.findOneAndUpdate(
        { campusId, className: item.className, section: item.section, subject: item.subject, date: item.date },
        {
          $set: {
            campusId,
            teacherId: teacher._id,
            teacherName: teacher.name,
            classId,
            className: item.className,
            gradeOrClass: item.className,
            section: item.section,
            subject: item.subject,
            date: item.date,
            dateObj: new Date(`${item.date}T00:00:00.000Z`),
            title: item.title,
            recap: item.recap,
            homework: item.homework,
            resources: item.resources,
            publicationStatus: "Published",
          },
        },
        { upsert: true, new: true }
      );

      // Upsert into StudentDiary
      await StudentDiary.findOneAndUpdate(
        { campusId, title: item.title, date: item.date },
        {
          $set: {
            campusId,
            classId,
            date: item.date,
            title: item.title,
            recap: item.recap,
            homework: item.homework,
            resources: item.resources,
            publicationStatus: "Published",
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Synced ${diaryEntriesData.length} daily diary entries.`);

    // 2. Active Homework / Assignments
    const sampleSubmissions = students.slice(0, 3).map((st, idx) => ({
      studentId: st._id,
      studentName: st.name,
      rollNumber: st.roll || "C9A-001",
      status: idx === 0 ? "Graded" : "Submitted",
      score: idx === 0 ? 46 : null,
      feedback: idx === 0 ? "Excellent algebraic derivation and clean handwriting." : "",
      notes: "Submitted via EduHub Student Portal.",
      submittedAt: new Date(Date.now() - 86400000),
    }));

    const assignmentsData = [
      {
        title: "Quadratic Equations Problem Set & Factorization",
        description: "Complete Exercise 5.2 Questions 1 to 18. Provide step-by-step working for quadratic polynomial roots and algebraic identities.",
        subject: "Mathematics",
        className: "Class 9",
        gradeOrClass: "Class 9",
        section: "Section A",
        dueDate: dueDate1,
        totalMarks: 50,
      },
      {
        title: "Newton's Laws of Motion & Momentum Lab Report",
        description: "Write a comprehensive experimental report on Newton's Second Law verification with friction compensation and acceleration graphs.",
        subject: "Physics",
        className: "Class 9",
        gradeOrClass: "Class 9",
        section: "Section A",
        dueDate: dueDate2,
        totalMarks: 25,
      },
      {
        title: "C Program: Decision Logic & Leap Year Verification",
        description: "Write, compile and submit the C source code and flowchart algorithm for conditional leap year determination with validation tests.",
        subject: "Computer Science",
        className: "Class 9",
        gradeOrClass: "Class 9",
        section: "Section A",
        dueDate: dueDate2,
        totalMarks: 30,
      },
      {
        title: "Essay: The Role of Youth in National Building",
        description: "Draft a coherent, well-structured 250-word English essay following standard KPK Textbook Board essay criteria.",
        subject: "English Compulsory",
        className: "Class 9",
        gradeOrClass: "Class 9",
        section: "Section A",
        dueDate: dueDate3,
        totalMarks: 20,
      },
    ];

    for (const item of assignmentsData) {
      const teacher = getTeacherForSub(item.subject);
      const schedule = csMap.get(item.subject);
      const classId = schedule?._id || new mongoose.Types.ObjectId();

      await Assignment.findOneAndUpdate(
        { campusId, className: item.className, section: item.section, title: item.title },
        {
          $set: {
            campusId,
            instituteId,
            classId,
            title: item.title,
            description: item.description,
            subject: item.subject,
            className: item.className,
            gradeOrClass: item.className,
            program: item.className,
            section: item.section,
            teacherId: teacher._id,
            instructorId: teacher._id,
            instructor: teacher.name,
            dueDate: new Date(`${item.dueDate}T23:59:59.000Z`),
            totalMarks: item.totalMarks,
            status: "Active",
            publicationStatus: "Published",
            submissions: sampleSubmissions,
          },
        },
        { upsert: true, new: true }
      );

      await StudentAssignment.findOneAndUpdate(
        { campusId, title: item.title },
        {
          $set: {
            campusId,
            classId,
            title: item.title,
            description: item.description,
            dueDate: item.dueDate,
            totalMarks: item.totalMarks,
            publicationStatus: "Published",
            submissions: sampleSubmissions.map((s) => ({
              studentId: s.studentId,
              notes: s.notes,
              status: s.status,
              score: s.score,
              feedback: s.feedback,
              submittedAt: s.submittedAt,
            })),
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Synced ${assignmentsData.length} active assignments.`);
  }

  console.log("\n=======================================================");
  console.log("✓ Live Teacher Daily Diary & Homework seeded successfully!");
  console.log("=======================================================");
}

if (process.argv[1]?.endsWith("seedTeacherDiaryAndHomework.js")) {
  seedTeacherDiaryAndHomework()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
