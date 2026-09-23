import mongoose from "mongoose";

const payrollAdjustmentSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
      index: true,
    },
    targetMonth: {
      type: String, // e.g. "2026-10"
      required: true,
      index: true,
    },
    sourceMonth: {
      type: String, // e.g. "2026-09"
      required: true,
    },
    type: {
      type: String,
      enum: ["Deduction", "Bonus"],
      required: true,
    },
    category: {
      type: String,
      enum: ["Absent", "Leave", "Substitute", "Late", "Other"],
      default: "Absent",
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    sourceApprovalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceApproval",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Applied", "Cancelled"],
      default: "Pending",
      index: true,
    },
    appliedPayrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonthlyPayroll",
      default: null,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying pending adjustments by teacher and month
payrollAdjustmentSchema.index({ campusId: 1, teacherProfileId: 1, targetMonth: 1, status: 1 });

export const PayrollAdjustment =
  mongoose.models.PayrollAdjustment ||
  mongoose.model("PayrollAdjustment", payrollAdjustmentSchema);

export default PayrollAdjustment;
