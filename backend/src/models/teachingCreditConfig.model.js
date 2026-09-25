import mongoose from "mongoose";

const teachingCreditConfigSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      unique: true,
      index: true,
    },
    creditPerCompletedPeriod: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    creditForSubstitution: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    bonusPerSubstituteClass: {
      type: Number,
      default: 500,
      min: 0,
    },
    requireApprovalForSubstituteBonus: {
      type: Boolean,
      default: true,
    },
    requireApprovalForMissedDeduction: {
      type: Boolean,
      default: true,
    },
    deductionMode: {
      type: String,
      enum: ["Formula", "FixedAmount"],
      default: "Formula",
    },
    perMissedClassDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    missedClassFormulaMultiplier: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    expectedPeriodsPerDay: {
      type: Number,
      default: 5,
      min: 1,
      max: 12,
    },
    workingDaysPerMonth: {
      type: Number,
      default: 26,
      min: 10,
      max: 31,
    },
    graceLateMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 60,
    },
    approvedLeaveDeducts: {
      type: Boolean,
      default: false,
    },
    cancelledClassDeducts: {
      type: Boolean,
      default: false,
    },
    payrollCutoffDay: {
      type: Number,
      default: 28,
      min: 1,
      max: 31,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const TeachingCreditConfig =
  mongoose.models.TeachingCreditConfig ||
  mongoose.model("TeachingCreditConfig", teachingCreditConfigSchema);

export default TeachingCreditConfig;
