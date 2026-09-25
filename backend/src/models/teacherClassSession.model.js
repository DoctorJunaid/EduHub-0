import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    isDisputed: {
      type: Boolean,
      default: false,
    },
    disputeReason: {
      type: String,
      trim: true,
      default: "",
    },
    disputedAt: {
      type: Date,
      default: null,
    },
    disputeStatus: {
      type: String,
      enum: ["None", "Pending", "Approved", "Rejected"],
      default: "None",
      index: true,
    },
    resolutionRemark: {
      type: String,
      trim: true,
      default: "",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const adjustmentReviewSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["None", "Pending Review", "Approved", "Rejected"],
      default: "None",
      index: true,
    },
    proposedDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    proposedBonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewRemark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const teacherClassSessionSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: [true, "Campus ID is required"],
      index: true,
    },
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      default: null,
      index: true,
    },
    academicSession: {
      type: String,
      trim: true,
      default: "2026-2027",
    },
    date: {
      type: Date,
      required: [true, "Session date is required"],
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: [true, "Day of week is required"],
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
    period: {
      type: Number,
      required: [true, "Period index is required"],
      default: 1,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      default: null,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Original teacher is required"],
      index: true,
    },
    actualTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actual teacher is required"],
      index: true,
    },
    isSubstituted: {
      type: Boolean,
      default: false,
      index: true,
    },
    substituteAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubstituteAssignment",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "Scheduled",
        "Pending",
        "Completed",
        "Missed",
        "Absent",
        "Substituted",
        "Cancelled",
        "Approved Adjustment",
      ],
      default: "Scheduled",
      index: true,
    },
    attendanceStatus: {
      type: String,
      enum: ["Unrecorded", "Present", "Absent", "Late", "On Leave", "Excused"],
      default: "Unrecorded",
    },
    creditValue: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    bonusValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductionValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    markedAt: {
      type: Date,
      default: null,
    },
    dispute: {
      type: disputeSchema,
      default: () => ({}),
    },
    adjustmentReview: {
      type: adjustmentReviewSchema,
      default: () => ({}),
    },
    salaryAdjustmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollAdjustment",
      default: null,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceApproval",
      default: null,
    },
    appliedToPayrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonthlyPayroll",
      default: null,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Normalize date to UTC midnight before save
teacherClassSessionSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    this.date = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
    );
  }
  if (typeof next === "function") next();
});

// Unique compound index to prevent duplicate class sessions for the same slot on the same day
teacherClassSessionSchema.index(
  { campusId: 1, date: 1, period: 1, originalTeacherId: 1, className: 1, section: 1 },
  { unique: true }
);

// Helpful query indexes
teacherClassSessionSchema.index({ campusId: 1, date: 1, status: 1 });
teacherClassSessionSchema.index({ campusId: 1, originalTeacherId: 1, date: 1 });
teacherClassSessionSchema.index({ campusId: 1, actualTeacherId: 1, date: 1 });
teacherClassSessionSchema.index({ campusId: 1, "dispute.disputeStatus": 1 });
teacherClassSessionSchema.index({ campusId: 1, "adjustmentReview.status": 1 });

export const TeacherClassSession =
  mongoose.models.TeacherClassSession ||
  mongoose.model("TeacherClassSession", teacherClassSessionSchema);

export default TeacherClassSession;
