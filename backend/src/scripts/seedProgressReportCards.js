import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import { ExamSchedule, Performance, StudentProfile } from "../models/profile.model.js";
import { Grade, Section, Subject, GradeSubject } from "../models/academic.model.js";

const reportCardTerms = [
  {
    term: "Mid-Term Examination",
    semester: "Mid-Term Examination",
    academicYear: "2025-2026",
    examType: "Midterm",
    dates: {
      Mathematics: "2026-09-15",
      Physics: "2026-09-17",
      "Computer Science": "2026-09-19",
      Chemistry: "2026-09-22",
      "English Compulsory": "2026-09-24",
      "Islamic Studies": "2026-09-26",
      "Urdu Compulsory": "2026-09-28",
      "Pakistan Studies": "2026-09-30",
    },
    performanceModifier: 1.0,
  },
  {
    term: "First Term Assessment",
    semester: "First Term Assessment",
    academicYear: "2025-2026",
    examType: "Midterm",
    dates: {
      Mathematics: "2026-05-10",
      Physics: "2026-05-12",
      "Computer Science": "2026-05-14",
      Chemistry: "2026-05-16",
      "English Compulsory": "2026-05-18",
      "Islamic Studies": "2026-05-20",
    },
    performanceModifier: 0.95,
  },
];

const subjectConfigs = [
  {
    subject: "Mathematics",
    totalMarks: 75,
    sampleScore: 68,
    grade: "A+",
    gpa: 4.0,
    remarks: "Exceptional mastery in algebraic factorization and geometric proofs. Excellent analytical problem solving.",
  },
  {
    subject: "Physics",
    totalMarks: 75,
    sampleScore: 64,
    grade: "A",
    gpa: 3.8,
    remarks: "Very strong conceptual understanding of kinematics and Newton's laws. Lab manual work is well maintained.",
  },
  {
    subject: "Computer Science",
    totalMarks: 75,
    sampleScore: 71,
    grade: "A+",
    gpa: 4.0,
    remarks: "Outstanding programming and algorithmic logic. Practical computer lab assessment was top tier.",
  },
  {
    subject: "Chemistry",
    totalMarks: 75,
    sampleScore: 62,
    grade: "A",
    gpa: 3.7,
    remarks: "Good command over atomic structure and chemical balancing. Needs slight revision in stoichiometry numericals.",
  },
  {
    subject: "English Compulsory",
    totalMarks: 75,
    sampleScore: 65,
    grade: "A",
    gpa: 3.8,
    remarks: "Eloquent essay writing, comprehension and grammar application. Active participant in class discussions.",
  },
  {
    subject: "Islamic Studies",
    totalMarks: 50,
    sampleScore: 46,
    grade: "A+",
    gpa: 4.0,
    remarks: "Excellent recitation and understanding of Surah translations and Hadith morals. Exemplary conduct.",
  },
  {
    subject: "Urdu Compulsory",
    totalMarks: 75,
    sampleScore: 61,
    grade: "B+",
    gpa: 3.5,
    remarks: "Good handwriting and Tashreeh of Ghazal poetry. Keep practicing vocabulary and formal letter composition.",
  },
  {
    subject: "Pakistan Studies",
    totalMarks: 50,
    sampleScore: 44,
    grade: "A",
    gpa: 3.8,
    remarks: "Thorough knowledge of Pakistan Movement historical chronology and geographical resources.",
  },
];

async function seedProgressReportCards() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for fast Progress Report Cards seeding...");

    const campuses = await Campus.find().lean();
    console.log(`Found ${campuses.length} campuses.`);

    const examOps = [];
    const perfOps = [];

    for (const campus of campuses) {
      const campusId = campus._id;
      const instituteId = campus.instituteId || null;
      const students = await User.find({ campusId, role: "student" }).lean();
      const teachers = await User.find({ campusId, role: { $in: ["teacher", "faculty"] } }).lean();
      const headTeacher = teachers[0] || null;

      for (const tConfig of reportCardTerms) {
        for (const sConf of subjectConfigs) {
          const examDateStr = tConfig.dates[sConf.subject] || "2026-09-20";
          const examDate = new Date(`${examDateStr}T09:00:00.000Z`);

          for (const cName of ["Class 9", "Class 10"]) {
            examOps.push({
              updateOne: {
                filter: {
                  campusId,
                  subject: sConf.subject,
                  className: cName,
                  section: "Section A",
                  examType: tConfig.examType,
                },
                update: {
                  $set: {
                    campusId,
                    instituteId,
                    examName: `${tConfig.term} - ${sConf.subject}`,
                    examType: tConfig.examType,
                    institutionType: "School",
                    program: cName,
                    className: cName,
                    gradeOrClass: cName,
                    department: cName,
                    section: "Section A",
                    subject: sConf.subject,
                    examDate,
                    date: examDateStr,
                    startTime: "09:00",
                    endTime: "12:00",
                    roomNumber: "Examination Hall 1",
                    room: "Examination Hall 1",
                    totalMarks: sConf.totalMarks,
                    sessionOrShift: "Morning",
                    invigilator: headTeacher ? headTeacher.name : "Senior Invigilator",
                    teacherId: headTeacher ? headTeacher._id : null,
                  },
                },
                upsert: true,
              },
            });
          }

          for (const student of students) {
            const studentClass = student.gradeOrClass || student.program || "Class 9";
            const studentSection = student.section || "Section A";
            const seedOffset = (student._id.toString().charCodeAt(student._id.toString().length - 1) % 5) - 2;
            const marksObtained = Math.min(
              sConf.totalMarks,
              Math.max(25, Math.round(sConf.sampleScore * tConfig.performanceModifier + seedOffset))
            );
            const percentage = Number(((marksObtained / sConf.totalMarks) * 100).toFixed(1));
            let grade = "A";
            let gpa = 3.8;
            if (percentage >= 90) { grade = "A+"; gpa = 4.0; }
            else if (percentage >= 80) { grade = "A"; gpa = 3.7; }
            else if (percentage >= 70) { grade = "B"; gpa = 3.3; }
            else if (percentage >= 60) { grade = "C"; gpa = 2.8; }
            else { grade = "D"; gpa = 2.0; }

            perfOps.push({
              updateOne: {
                filter: {
                  campusId,
                  studentId: student._id,
                  subject: sConf.subject,
                  term: tConfig.term,
                },
                update: {
                  $set: {
                    campusId,
                    instituteId,
                    studentId: student._id,
                    examName: `${tConfig.term} - ${sConf.subject}`,
                    subject: sConf.subject,
                    term: tConfig.term,
                    className: studentClass,
                    gradeOrClass: studentClass,
                    section: studentSection,
                    marksObtained,
                    totalMarks: sConf.totalMarks,
                    grade,
                    gpa,
                    percentage,
                    remarks: sConf.remarks,
                    isPublished: true,
                    markedBy: headTeacher ? headTeacher._id : null,
                  },
                },
                upsert: true,
              },
            });
          }
        }
      }
    }

    if (examOps.length > 0) {
      await ExamSchedule.bulkWrite(examOps);
      console.log(`Executed ${examOps.length} ExamSchedule bulk operations.`);
    }
    if (perfOps.length > 0) {
      await Performance.bulkWrite(perfOps);
      console.log(`Executed ${perfOps.length} Performance bulk operations.`);
    }
    console.log("Successfully fast-seeded Exam Schedules and Progress Report Cards!");
  } catch (err) {
    console.error("Error seeding progress report cards:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seedProgressReportCards();

