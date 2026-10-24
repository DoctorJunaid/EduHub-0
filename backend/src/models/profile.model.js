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
    isClassTeacher: { type: Boolean, default: false, index: true },
    classTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
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
    gradeId: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", default: null, index: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", default: null, index: true },
    gradeOrClass: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    rollNumber: { type: String, default: "1" },
    guardianDetails: {
      name: { type: String, default: "Guardian" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "Parent" },
    },
    enrollmentDate: { type: Date, default: Date.now },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
      index: true,
    },
    usesTransport: { type: Boolean, default: false, index: true },
    transportDetails: {
      routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route",
        default: null,
      },
      stopName: { type: String, trim: true, default: "" },
      assignedAt: { type: Date, default: null },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      default: null,
      index: true,
    },
    stopName: { type: String, trim: true, default: "" },
    transportEnrolled: { type: Boolean, default: false },
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
    concessionAmount: { type: Number, default: 0, min: 0 },
    scholarshipDiscount: { type: Number, default: 0, min: 0 },
    previousArrears: { type: Number, default: 0, min: 0 },
    totalPayable: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    paymentDate: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: [
        "GENERATED",
        "UNPAID",
        "PARTIALLY_PAID",
        "PAID",
        "OVERDUE",
        "WAIVED",
        "CANCELLED",
        "pending",
        "paid",
        "overdue",
        "partially_paid",
      ],
      default: "UNPAID",
    },
    challanNo: { type: String, default: "" },
    receiptNo: { type: String, default: "" },
    month: { type: String, default: "" },
    semester: { type: String, default: "" },
    gradeOrClass: { type: String, default: "" },
    academicSession: { type: String, default: "" },
    isAdmissionFee: { type: Boolean, default: false },
    description: { type: String, default: "" },
    breakdown: [
      {
        title: { type: String, default: "" },
        amount: { type: Number, default: 0 },
        isDiscount: { type: Boolean, default: false },
        concessionAmount: { type: Number, default: 0 },
        scholarshipDiscount: { type: Number, default: 0 },
      },
    ],
    discount: {
      amount: { type: Number, default: 0 },
      reason: { type: String, default: "" },
    },
    waiver: {
      amount: { type: Number, default: 0 },
      reason: { type: String, default: "" },
      waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      waivedAt: { type: Date, default: null },
    },
    omitted: {
      isOmitted: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      omittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      omittedAt: { type: Date, default: null },
    },
    lateFine: {
      amount: { type: Number, default: 0 },
      applied: { type: Boolean, default: false },
    },
    notes: { type: String, default: "" },
    auditTrail: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: "" },
        previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
        newValue: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
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

feeRecordSchema.pre("validate", function() {
  const gross = (this.amount || 0) + (this.previousArrears || 0) + (this.lateFine?.applied ? (this.lateFine?.amount || 0) : 0);
  const discounts = (this.concessionAmount || 0) + (this.scholarshipDiscount || 0) + (this.discount?.amount || 0) + (this.waiver?.amount || 0);
  // Guarantee non-negative totalPayable to eliminate negative balance adjustments
  if (this.totalPayable === undefined || this.totalPayable === null || this.isModified("amount") || this.isModified("concessionAmount") || this.isModified("scholarshipDiscount") || this.isModified("previousArrears")) {
    this.totalPayable = Math.max(0, gross - discounts);
  }
});

feeRecordSchema.index({ campusId: 1, status: 1 });
feeRecordSchema.index({ campusId: 1, month: 1, studentId: 1, feeType: 1 });
feeRecordSchema.index({ campusId: 1, studentId: 1, status: 1 });
feeRecordSchema.index({ challanNo: 1 });

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
    academicTerm: {
      type: String,
      enum: [
        "Midterm",
        "Final",
        "Term 1",
        "Term 2",
        "Term 3",
        "Annual",
        "Semester 1",
        "Semester 2",
      ],
      default: "Midterm",
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2026-2027",
      trim: true,
    },
    className: { type: String, default: "" },
    gradeOrClass: { type: String, default: "" },
    section: { type: String, default: "" },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    grade: { type: String, default: "" },
    gpa: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    isPublished: { type: Boolean, default: true },
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

performanceSchema.pre("validate", function() {
  if (!this.academicTerm && this.term) {
    if (/final|annual/i.test(this.term)) this.academicTerm = "Final";
    else if (/term\s*1|first/i.test(this.term)) this.academicTerm = "Term 1";
    else if (/term\s*2|second/i.test(this.term)) this.academicTerm = "Term 2";
    else if (/term\s*3|third/i.test(this.term)) this.academicTerm = "Term 3";
    else if (/semester\s*1/i.test(this.term)) this.academicTerm = "Semester 1";
    else if (/semester\s*2/i.test(this.term)) this.academicTerm = "Semester 2";
    else this.academicTerm = "Midterm";
  }
});

performanceSchema.index({ campusId: 1, studentId: 1 });
performanceSchema.index({ campusId: 1, className: 1, section: 1, term: 1 });
performanceSchema.index({ campusId: 1, academicTerm: 1, academicYear: 1 });
performanceSchema.index({ campusId: 1, examName: 1 });

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
