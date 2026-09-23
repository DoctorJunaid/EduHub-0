import mongoose from "mongoose";

const attendanceApprovalSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
      index: true,
    },
    absentDate: {
      type: Date,
      required: true,
      index: true,
    },
    absentTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
      index: true,
    },

    // PROOF LAYER 1 — Absence Proof
    absenceProof: {
      attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherAttendance",
        required: true,
      },
      date: { type: Date, required: true },
      status: { type: String, required: true },
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      markedAt: { type: Date },
      remarks: { type: String, default: "" },
      snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // PROOF LAYER 2 — Calculation Proof
    deductionProof: {
      salaryProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherSalaryProfile",
      },
      salaryPolicyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalaryPolicy",
      },
      baseSalary: { type: Number, required: true },
      workingDaysPerMonth: { type: Number, required: true },
      dailySalary: { type: Number, required: true },
      multiplier: { type: Number, required: true },
      formula: { type: String, required: true },
      finalAmount: { type: Number, required: true },
    },

    // PROOF LAYER 3 — Substitute Coverage Proof
    substituteProof: {
      hasSubstitutes: { type: Boolean, default: false },
      substituteTeacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherProfile",
        default: null,
      },
      assignmentIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubstituteAssignment",
        },
      ],
      dutyCount: { type: Number, default: 0 },
      ratePerClass: { type: Number, default: 0 },
      formula: { type: String, default: "" },
      finalAmount: { type: Number, default: 0 },
      assignmentsSnapshot: [mongoose.Schema.Types.Mixed],
    },

    // PROOF LAYER 4 — Decision Proof
    decision: {
      decidedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
        email: { type: String },
        role: { type: String },
      },
      decidedAt: { type: Date },
      type: {
        type: String,
        enum: ["Approve", "Reject", null],
        default: null,
      },
      reason: { type: String, default: "" },
      ipAddress: { type: String, default: "" },
      userAgent: { type: String, default: "" },
      screenSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // PROOF LAYER 5 — Payroll Linkage Proof & Cryptographic Checksum
    application: {
      applied: { type: Boolean, default: false },
      appliedAt: { type: Date, default: null },
      deductionPayrollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MonthlyPayroll",
        default: null,
      },
      deductionLineItemIndex: { type: Number, default: null },
      bonusPayrollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MonthlyPayroll",
        default: null,
      },
      bonusLineItemIndex: { type: Number, default: null },
      isCarriedForward: { type: Boolean, default: false },
      adjustmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PayrollAdjustment",
        default: null,
      },
      checksum: { type: String, default: "" },
    },

    // Immutable state transitions history
    stateHistory: [
      {
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        changedBy: {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: { type: String },
          role: { type: String },
        },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save date normalization
attendanceApprovalSchema.pre("save", function (next) {
  if (this.absentDate) {
    const d = new Date(this.absentDate);
    this.absentDate = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
    );
  }
  if (typeof next === "function") next();
});

// Single index definitions
attendanceApprovalSchema.index({ campusId: 1, status: 1 });
attendanceApprovalSchema.index({ campusId: 1, absentDate: 1 });
attendanceApprovalSchema.index({ campusId: 1, absentTeacherId: 1, absentDate: 1 });
attendanceApprovalSchema.index({ "substituteProof.substituteTeacherId": 1 });

export const AttendanceApproval =
  mongoose.models.AttendanceApproval ||
  mongoose.model("AttendanceApproval", attendanceApprovalSchema);

export default AttendanceApproval;
