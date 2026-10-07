import mongoose from "mongoose";

const reportCardSchema = new mongoose.Schema(
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
    studentResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentResult",
      required: true,
      index: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2026-2027",
    },
    version: {
      type: Number,
      default: 1,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reportSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

reportCardSchema.index(
  { campusId: 1, studentId: 1, term: 1, examName: 1, version: 1 },
  { unique: true }
);

const ReportCard =
  mongoose.models.ReportCard || mongoose.model("ReportCard", reportCardSchema);

export default ReportCard;
