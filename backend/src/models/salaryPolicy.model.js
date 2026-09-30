import mongoose from "mongoose";

const deductionRuleSchema = new mongoose.Schema({
  min: { type: Number, default: 0 },
  max: { type: Number, default: null }, // null = infinity
  type: { type: String, enum: ['None', 'Fixed Amount', 'Percentage', 'Per Class', 'Per Day'], required: true },
  amount: { type: Number, default: 0 }
});

const substituteRuleSchema = new mongoose.Schema({
  min: { type: Number, default: 0 },
  max: { type: Number, default: null },
  type: { type: String, enum: ['None', 'Fixed Amount', 'Percentage', 'Per Class', 'Per Day'], required: true },
  amount: { type: Number, default: 0 }
});

const policyVersionSchema = new mongoose.Schema({
  versionName: { type: String, required: true },
  effectiveDate: { type: Date, required: true, default: Date.now },
  missedClassDeductionRules: [deductionRuleSchema],
  absentDayDeductionRules: [deductionRuleSchema],
  substituteBonusRules: [substituteRuleSchema],
  
  workingDaysPerMonth: { type: Number, default: 26 },
  unpaidAbsentMultiplier: { type: Number, default: 1.0 },
  unpaidLeaveMultiplier: { type: Number, default: 1.0 },
  halfDayMultiplier: { type: Number, default: 0.5 },
  lateCountForHalfDay: { type: Number, default: 3 },
  lateHalfDayPenalty: { type: Number, default: 0.5 },
  earlyLeaveMultiplier: { type: Number, default: 0.5 },
  perfectAttendanceBonus: { type: Number, default: 2000 },
  extraClassBonus: { type: Number, default: 400 },
  examDutyBonus: { type: Number, default: 300 },
  createdAt: { type: Date, default: Date.now }
});

const salaryPolicySchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      unique: true,
      index: true,
    },
    activeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    versions: [policyVersionSchema],

    // Legacy fields for backward compatibility
    workingDaysPerMonth: { type: Number, default: 26 },
    unpaidAbsentMultiplier: { type: Number, default: 1.0 },
    unpaidLeaveMultiplier: { type: Number, default: 1.0 },
    halfDayMultiplier: { type: Number, default: 0.5 },
    lateCountForHalfDay: { type: Number, default: 3 },
    lateHalfDayPenalty: { type: Number, default: 0.5 },
    earlyLeaveMultiplier: { type: Number, default: 0.5 },
    substituteBonusPerClass: { type: Number, default: 500 },
    perfectAttendanceBonus: { type: Number, default: 2000 },
    extraClassBonus: { type: Number, default: 400 },
    examDutyBonus: { type: Number, default: 300 },
  },
  { timestamps: true }
);

export const SalaryPolicy = mongoose.models.SalaryPolicy || mongoose.model("SalaryPolicy", salaryPolicySchema);
