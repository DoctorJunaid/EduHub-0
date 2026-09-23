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

import TeacherAttendance from "./teacherAttendance.model.js";

const classScheduleSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    periodName: { type: String, trim: true, default: "" },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    gradeOrClass: { type: String, trim: true, default: "" },
    section: { type: String, required: true, trim: true },
    days: { type: [Number], default: [] },
    isBreak: { type: Boolean, default: false },
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
    room: { type: String, default: "" },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      default: null,
    },
    teacherName: { type: String, default: "" },
    instructor: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

classScheduleSchema.index({ campusId: 1, dayOfWeek: 1 });

const examScheduleSchema = new mongoose.Schema(
  {
    examName: { type: String, trim: true },
    examType: {
      type: String,
      required: true,
      default: "Midterm",
    },
    institutionType: { type: String, trim: true, default: "School" },
    program: { type: String, trim: true, default: "" },
    className: { type: String, trim: true, default: "" },
    gradeOrClass: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    section: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    date: { type: String, default: "" },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    roomNumber: { type: String, default: "" },
    room: { type: String, default: "" },
    totalMarks: { type: Number, default: 100 },
    sessionOrShift: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "Standard"],
      default: "Morning",
    },
    isDualExamDay: { type: Boolean, default: false },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    invigilator: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

examScheduleSchema.pre("validate", function validateExamSchedule() {
  if (!this.examName) {
    this.examName = `${this.examType || "Midterm"} Examination - ${this.subject || "Course"}`;
  }
  if (!this.program) {
    this.program = this.className || this.gradeOrClass || this.department || "";
  }
  if (!this.className) {
    this.className = this.program || this.gradeOrClass || this.department || (this.section ? `Class ${this.section}` : "Grade 10");
  }
  if (!this.gradeOrClass) {
    this.gradeOrClass = this.program || this.className;
  }
  if (!this.department) {
    this.department = this.program || this.className;
  }
  if (!this.date && this.examDate) {
    try {
      this.date = new Date(this.examDate).toISOString().split("T")[0];
    } catch {
      // ignore
    }
  }
  if (this.room && !this.roomNumber) this.roomNumber = this.room;
  if (this.roomNumber && !this.room) this.room = this.roomNumber;
});

examScheduleSchema.index({ campusId: 1, examDate: 1 });
examScheduleSchema.index({ campusId: 1, date: 1, room: 1 });
examScheduleSchema.index({ campusId: 1, date: 1, invigilator: 1 });

const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    dateStr: { type: String, default: "" },
    status: {
      type: String,
      required: true,
      enum: [
        "Present",
        "Absent",
        "Late",
        "Excused",
        "On Leave",
        "present",
        "absent",
        "late",
        "excused",
        "on leave",
      ],
      default: "Present",
    },
    className: { type: String, default: "" },
    gradeOrClass: { type: String, default: "" },
    section: { type: String, default: "" },
    remarks: { type: String, default: "" },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

studentAttendanceSchema.index({ campusId: 1, date: 1 });
studentAttendanceSchema.index({ campusId: 1, studentId: 1, date: 1 });

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feeType: {
      type: String,
      required: true,
      default: "tuition",
    },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    paymentDate: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    challanNo: { type: String, default: "" },
    month: { type: String, default: "" },
    semester: { type: String, default: "" },
    description: { type: String, default: "" },
    breakdown: [
      {
        title: { type: String, default: "" },
        amount: { type: Number, default: 0 },
      },
    ],
    notes: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

feeRecordSchema.index({ campusId: 1, status: 1 });

const performanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    examName: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    term: { type: String, required: true, trim: true },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    grade: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

performanceSchema.index({ campusId: 1, studentId: 1 });

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
export { TeacherAttendance };
export const StudentAttendance = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema,
);
export const FeeRecord = mongoose.model("FeeRecord", feeRecordSchema);
export const Performance = mongoose.model("Performance", performanceSchema);
