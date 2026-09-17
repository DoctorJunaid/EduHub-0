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

const classScheduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    roomNumber: { type: String, default: "" },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
  },
  { timestamps: true },
);

const examScheduleSchema = new mongoose.Schema(
  {
    examName: { type: String, required: true, trim: true },
    examType: {
      type: String,
      required: true,
      enum: ["Midterm", "Final", "Quiz", "Assignment", "Practical"],
    },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    roomNumber: { type: String, default: "" },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      default: null,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
  },
  { timestamps: true },
);

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "late", "on leave"],
    },
    remarks: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
  },
  { timestamps: true },
);

const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "late", "excused"],
    },
    remarks: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
  },
  { timestamps: true },
);

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    feeType: {
      type: String,
      required: true,
      enum: ["tuition", "library", "transport", "exam", "miscellaneous"],
    },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
    notes: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
  },
  { timestamps: true },
);

const performanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    examName: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    term: { type: String, required: true, trim: true },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    grade: { type: String, default: "" },
    remarks: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
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
export const ClassSchedule = mongoose.model(
  "ClassSchedule",
  classScheduleSchema,
);
export const ExamSchedule = mongoose.model("ExamSchedule", examScheduleSchema);
export const TeacherAttendance = mongoose.model(
  "TeacherAttendance",
  teacherAttendanceSchema,
);
export const StudentAttendance = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema,
);
export const FeeRecord = mongoose.model("FeeRecord", feeRecordSchema);
export const Performance = mongoose.model("Performance", performanceSchema);
