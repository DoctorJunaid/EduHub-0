import mongoose from "mongoose";
import "dotenv/config";
import { Grade, Section, Subject, GradeSubject, TeacherAssignment } from "../src/models/academic.model.js";
import Timetable from "../src/models/timetable.model.js";

const wipeData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/eduhub");
    console.log("Connected to MongoDB.");

    console.log("Wiping academic configuration...");
    await Grade.deleteMany({});
    await Section.deleteMany({});
    await Subject.deleteMany({});
    await GradeSubject.deleteMany({});
    await TeacherAssignment.deleteMany({});

    console.log("Wiping timetable schedules...");
    await Timetable.deleteMany({});
    // Also clear legacy ClassSchedule if needed
    try {
        const ClassSchedule = mongoose.model("ClassSchedule");
        await ClassSchedule.deleteMany({});
    } catch(e) {}

    console.log("Database wipe complete. You can now start fresh with the new Academic Configuration.");
    process.exit(0);
  } catch (error) {
    console.error("Error wiping database:", error);
    process.exit(1);
  }
};

wipeData();
