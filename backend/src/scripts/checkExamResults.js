import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { Performance, ExamSchedule } from "../models/profile.model.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const danyal = await User.findOne({ email: "danyal.mirza16@eduhub.com" }).lean();
    console.log("Danyal ID:", danyal?._id, "Campus:", danyal?.campusId);

    const perfs = await Performance.find({ campusId: danyal.campusId, studentId: danyal._id }).lean();
    console.log("Danyal performance records:", perfs.length);

    const exams = await ExamSchedule.find({ campusId: danyal.campusId }).lean();
    console.log("Campus ExamSchedule records:", exams.length);
    if (exams.length > 0) {
      console.log("Sample Exam:", exams[0]);
    }
    if (perfs.length > 0) {
      console.log("Sample Performance:", perfs[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
