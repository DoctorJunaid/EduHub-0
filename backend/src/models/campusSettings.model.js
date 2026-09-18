import mongoose from "mongoose";

const campusSettingsSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      unique: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true,
    },
    periodsPerDay: {
      type: Number,
      min: 1,
      max: 12,
    },
    periodDurationMinutes: {
      type: Number,
      min: 20,
      max: 90,
    },
    workingDaysPerWeek: {
      type: Number,
      min: 1,
      max: 7,
    },
    workingDaysPerMonth: {
      type: Number,
      min: 20,
      max: 31,
    },
    maxSubstitutesPerDayPerTeacher: {
      type: Number,
      min: 1,
      max: 12,
    },
    maxSubstitutesPerWeekPerTeacher: {
      type: Number,
      min: 1,
      max: 60,
    },
    substituteLoadWarningThreshold: {
      type: Number,
      min: 1,
      max: 12,
    },
    allowSameSubstituteForWholeDay: {
      type: Boolean,
    },
    requireApprovalForSubstitute: {
      type: Boolean,
    },
    lateGraceMinutes: {
      type: Number,
      min: 0,
      max: 60,
    },
    earlyLeaveGraceMinutes: {
      type: Number,
      min: 0,
      max: 60,
    },
    substituteBonusPerClass: {
      type: Number,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const CampusSettings = mongoose.models.CampusSettings || mongoose.model("CampusSettings", campusSettingsSchema);

export default CampusSettings;
