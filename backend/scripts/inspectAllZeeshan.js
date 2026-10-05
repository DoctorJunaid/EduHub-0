import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../src/models/user.model.js";
import { TeacherProfile } from "../src/models/profile.model.js";
import teacherAssignmentService from "../src/services/teacherAssignment.service.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({ name: /Zeeshan/i }).lean();
  console.log("Found Zeeshan users:", users.map(u => ({ id: u._id, name: u.name, email: u.email, campusId: u.campusId })));

  for (const u of users) {
    const classes = await teacherAssignmentService.getTeacherAssignedClasses(u.campusId, u._id);
    console.log(`Teacher ${u.name} (${u._id}) in campus ${u.campusId} has ${classes.length} classes.`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
