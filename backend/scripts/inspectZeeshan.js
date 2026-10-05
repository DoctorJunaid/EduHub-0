import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../src/models/user.model.js";
import Timetable from "../src/models/timetable.model.js";
import { ClassSchedule, TeacherProfile } from "../src/models/profile.model.js";
import TeacherClassSession from "../src/models/teacherClassSession.model.js";
import { TeacherAssignment } from "../src/models/academic.model.js";
import teacherAssignmentService from "../src/services/teacherAssignment.service.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const zeeshan = await User.findOne({ name: /Zeeshan/i }).lean();
  console.log("Zeeshan User:", zeeshan ? { _id: zeeshan._id, name: zeeshan.name, email: zeeshan.email, role: zeeshan.role, campusId: zeeshan.campusId } : "Not found");

  if (zeeshan) {
    const prof = await TeacherProfile.findOne({ user: zeeshan._id }).lean();
    console.log("TeacherProfile:", prof ? { _id: prof._id, employeeId: prof.employeeId, department: prof.department } : "Not found");

    const tt = await Timetable.find({ $or: [{ teacherId: zeeshan._id }, ...(prof ? [{ teacherId: prof._id }] : [])] }).lean();
    console.log("Timetable count:", tt.length, tt);

    const cs = await ClassSchedule.find({ $or: [{ teacherId: zeeshan._id }, ...(prof ? [{ teacherProfileId: prof._id }] : []), { instructor: /Zeeshan/i }, { teacherName: /Zeeshan/i }] }).lean();
    console.log("ClassSchedule count:", cs.length, cs);

    const ta = await TeacherAssignment.find({ $or: [{ teacherId: zeeshan._id }, ...(prof ? [{ teacherId: prof._id }] : [])] }).lean();
    console.log("TeacherAssignment count:", ta.length, ta);

    const tcs = await TeacherClassSession.find({ $or: [{ originalTeacherId: zeeshan._id }, { actualTeacherId: zeeshan._id }] }).lean();
    console.log("TeacherClassSession count:", tcs.length, tcs.map(s => ({ period: s.period, className: s.className, section: s.section, subject: s.subject })));

    const classes = await teacherAssignmentService.getTeacherAssignedClasses(zeeshan.campusId, zeeshan._id);
    console.log("Service getTeacherAssignedClasses count:", classes.length);
    console.log("Classes:", classes);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
