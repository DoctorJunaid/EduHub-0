import mongoose from "mongoose";

const deductionSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  category: {
    type: String,
    enum: ["Absent", "Leave", "Late", "Half Day", "Early Leave", "Tax", "Other"],
    required: true,
  },
  days: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  note: { type: String, default: "" },
});

const bonusSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  category: {
    type: String,
    enum: ["Substitute", "Perfect Attendance", "Extra Class", "Exam Duty", "Other"],
    required: true,
  },
  count: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  note: { type: String, default: "" },
});

const attendanceSummarySchema = new mongoose.Schema({
  totalWorkingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  lateCount: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  substituteDuties: { type: Number, default: 0 },
}, { _id: false });

const monthlyPayrollSchema = new mongoose.Schema(
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
    month: {
      type: String, // "2026-09"
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    baseSalary: { type: Number, required: true },
    allowancesTotal: { type: Number, required: true, default: 0 },
    grossSalary: { type: Number, required: true },
    deductions: [deductionSchema],
    bonuses: [bonusSchema],
    deductionsTotal: { type: Number, required: true, default: 0 },
    bonusesTotal: { type: Number, required: true, default: 0 },
    netSalary: { type: Number, required: true },
    attendanceSummary: attendanceSummarySchema,
    status: {
      type: String,
      enum: ["Draft", "Approved", "Paid"],
      default: "Draft",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    paidOn: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique: one payroll per teacher per month
monthlyPayrollSchema.index({ teacherProfileId: 1, month: 1 }, { unique: true });

export const MonthlyPayroll =
  mongoose.models.MonthlyPayroll ||
  mongoose.model("MonthlyPayroll", monthlyPayrollSchema);
