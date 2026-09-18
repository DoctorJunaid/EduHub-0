import mongoose from "mongoose";

const salaryPolicySchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      unique: true,
      index: true,
    },
    workingDaysPerMonth: {
      type: Number,
      default: 26,
    },
    unpaidAbsentMultiplier: {
      type: Number,
      default: 1.0,
    },
    unpaidLeaveMultiplier: {
      type: Number,
      default: 1.0,
    },
    halfDayMultiplier: {
      type: Number,
      default: 0.5,
    },
    lateCountForHalfDay: {
      type: Number,
      default: 3,
    },
    lateHalfDayPenalty: {
      type: Number,
      default: 0.5,
    },
    earlyLeaveMultiplier: {
      type: Number,
      default: 0.5,
    },
    substituteBonusPerClass: {
      type: Number,
      default: 500,
    },
    perfectAttendanceBonus: {
      type: Number,
      default: 2000,
    },
    extraClassBonus: {
      type: Number,
      default: 400,
    },
    examDutyBonus: {
      type: Number,
      default: 300,
    },
  },
  { timestamps: true }
);

export const SalaryPolicy = mongoose.models.SalaryPolicy || mongoose.model("SalaryPolicy", salaryPolicySchema);
