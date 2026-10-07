import mongoose from "mongoose";

const studentResultSubjectSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      default: "",
      trim: true,
    },
    marks: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: 1,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: "",
    },
    gpa: {
      type: Number,
      default: 0,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      default: null,
    },
    teacherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teacherName: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Entered", "Absent", "Pending", "Exempted"],
      default: "Pending",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    enteredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const studentResultSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      default: null,
      index: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      default: null,
    },
    term: {
      type: String,
      required: true,
      trim: true,
      default: "Midterm",
    },
    examId: {
      type: String,
      default: "",
      trim: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
      default: "Midterm Examination",
    },
    academicYear: {
      type: String,
      default: "2026-2027",
      trim: true,
    },

    // Subject-wise marks
    subjects: [studentResultSubjectSchema],

    // Aggregate summary
    totalMarks: {
      type: Number,
      default: 0,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    overallGrade: {
      type: String,
      default: "Pending",
    },
    gpa: {
      type: Number,
      default: 0,
    },
    classRank: {
      type: Number,
      default: null,
    },
    totalStudentsInClass: {
      type: Number,
      default: 0,
    },

    // Class Teacher inputs
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      default: null,
    },
    classTeacherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    classTeacherRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    classTeacherSubmittedAt: {
      type: Date,
      default: null,
    },
    classTeacherSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Admin review & approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Published", "Rejected"],
      default: "Draft",
      index: true,
    },

    // Attendance snapshot at compile time
    attendanceSummary: {
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      excusedDays: { type: Number, default: 0 },
      totalDays: { type: Number, default: 0 },
      percentage: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

studentResultSchema.index({ campusId: 1, classId: 1, term: 1, examName: 1 });
studentResultSchema.index(
  { campusId: 1, studentId: 1, term: 1, examName: 1 },
  { unique: true }
);

const StudentResult =
  mongoose.models.StudentResult ||
  mongoose.model("StudentResult", studentResultSchema);

export default StudentResult;
