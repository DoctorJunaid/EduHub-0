import mongoose from "mongoose";

// Teacher Profile Schema
const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    subjectsTaught: [{ type: String }],
    qualification: { type: String, required: true },
    designation: { type: String, default: "Teacher" },
    hireDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Student Profile Schema
const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: { type: String, required: true, unique: true },
    gradeOrClass: { type: String, required: true },
    section: { type: String, required: true },
    rollNumber: { type: String, required: true },
    guardianDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relation: { type: String, required: true },
    },
    enrollmentDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const TeacherProfile = mongoose.model(
  "TeacherProfile",
  teacherProfileSchema,
);
export const StudentProfile = mongoose.model(
  "StudentProfile",
  studentProfileSchema,
);
