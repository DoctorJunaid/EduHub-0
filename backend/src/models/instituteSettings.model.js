import mongoose from "mongoose";

const instituteSettingsSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      unique: true,
      index: true,
    },
    periodsPerDay: {
      type: Number,
      min: 1,
      max: 12,
      default: 6,
    },
    periodDurationMinutes: {
      type: Number,
      min: 20,
      max: 90,
      default: 45,
    },
    workingDaysPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      default: 6,
    },
    workingDaysPerMonth: {
      type: Number,
      min: 20,
      max: 31,
      default: 26,
    },
    maxSubstitutesPerDayPerTeacher: {
      type: Number,
      min: 1,
      max: 12,
      default: 4,
    },
    maxSubstitutesPerWeekPerTeacher: {
      type: Number,
      min: 1,
      max: 60,
      default: 15,
    },
    substituteLoadWarningThreshold: {
      type: Number,
      min: 1,
      max: 12,
      default: 3,
    },
    allowSameSubstituteForWholeDay: {
      type: Boolean,
      default: true,
    },
    requireApprovalForSubstitute: {
      type: Boolean,
      default: false,
    },
    lateGraceMinutes: {
      type: Number,
      min: 0,
      max: 60,
      default: 10,
    },
    earlyLeaveGraceMinutes: {
      type: Number,
      min: 0,
      max: 60,
      default: 15,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const InstituteSettings = mongoose.models.InstituteSettings || mongoose.model("InstituteSettings", instituteSettingsSchema);

export default InstituteSettings;
