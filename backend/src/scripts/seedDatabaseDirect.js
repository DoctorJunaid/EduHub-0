import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import { seedFullStructure, getStats } from "../services/seed.service.js";

// Set custom DNS servers for MongoDB Atlas SRV lookup
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runDirectSeed() {
  try {
    console.log("⏳ Connecting to MongoDB database...");
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in backend/.env");
    }

    let connected = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`⏳ Connecting to MongoDB database (attempt ${attempt}/3)...`);
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
        connected = true;
        break;
      } catch (err) {
        console.warn(`⚠️ Connection attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (connected) console.log(" Connected to MongoDB successfully!");

    // 1. Locate or create default Campus and Institute
    let campus = await Campus.findOne();
    let institute = await Institute.findOne();

    if (!institute) {
      console.log("Creating default Institute...");
      institute = await Institute.create({
        name: "PakTech Educational Network",
        type: "school",
        email: "info@paktech.edu.pk",
        status: "Active",
      });
    }

    if (!campus) {
      console.log("Creating default Campus...");
      campus = await Campus.create({
        instituteId: institute._id,
        name: "Main Campus Islamabad",
        email: "campus.main@paktech.edu.pk",
        phone: "+92 51 1234567",
        status: "Active",
      });
    }

    console.log(`\n🏫 Target Campus: "${campus.name}" (ID: ${campus._id})`);
    console.log("⏳ Running FULL School Structure Seed (Classes 1-12, Sections A-D, 60 Teachers, 1,440 Students, Timetable)...");

    const result = await seedFullStructure(campus._id, {
      teachers: 60,
      studentsPerClass: 30,
    });

    console.log("\n=======================================================");
    console.log("🎉 FULL SCHOOL STRUCTURE SEEDED SUCCESSFULLY!");
    console.log("=======================================================");
    const d = result.data;
    console.log(`📚 Grades Created:         ${d.grades} (Class 1 to Class 12)`);
    console.log(`🏫 Sections Created:       ${d.sections} (A, B, C, D for each grade)`);
    console.log(`🚪 Class Rooms:            ${d.classRooms} total rooms`);
    console.log(`📖 Unique Subjects:        ${d.subjects}`);
    console.log(`👨‍🏫 Teachers Created:       ${d.teachers} (5 per grade level, 48 class teachers)`);
    console.log(`👨‍🎓 Students Created:       ${d.students} (30 per section × 48 sections)`);
    console.log(`💼 Salary Profiles:        ${d.salaryProfiles}`);
    console.log(`🗓️ Timetable Slots:        ${d.timetableSlots} (Conflict-free weekly schedule)`);
    console.log(`📅 Attendance Records:     ${d.attendanceRecords} (30 days)`);
    console.log(`🔄 Substitute Duties:      ${d.substituteAssignments} (7 days)`);
    console.log(`💰 Monthly Payroll:        ${d.payrollRecords}`);
    console.log(`⏱️ Duration:               ${d.duration}`);
    console.log("-------------------------------------------------------");
    console.log("🔑 LOGIN CREDENTIALS:");
    console.log(`👨‍🏫 Teacher Password:     ${d.credentials.teacherPassword} (e.g. ${d.credentials.sampleTeacherEmail})`);
    console.log(`👨‍🎓 Student Password:     ${d.credentials.studentPassword} (e.g. ${d.credentials.sampleStudentEmail})`);
    console.log("🛡️ Campus Admin:          (Your existing Admin credentials remain 100% UNCHANGED)");
    console.log("=======================================================\n");

    const stats = await getStats(campus._id);
    console.log("📊 Live Database Stats for Campus:");
    console.table({
      Grades: stats.grades,
      Sections: stats.sections,
      ClassRooms: stats.classRooms,
      Subjects: stats.subjects,
      Teachers: stats.teachers,
      Students: stats.students,
      TimetableSlots: stats.timetableSlots,
      TeacherAttendance: stats.teacherAttendance,
      StudentAttendance: stats.studentAttendance,
      SubstituteAssignments: stats.substituteAssignments,
      PayrollRecords: stats.payrollRecords,
      CampusAdmins: stats.campusAdmins,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

runDirectSeed();
