import mongoose from "mongoose";

/**
 * Submission Schema for student submissions inside an Assignment
 */
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: { type: String, trim: true, default: "" },
    rollNumber: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Submitted", "Late", "Graded", "Missing", "Pending"],
      default: "Submitted",
      index: true,
    },
    score: { type: Number, default: null, min: 0 },
    feedback: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    attachmentUrl: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date, default: null },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: true, timestamps: true }
);

/**
 * Assignment Model
 * Created by teachers or campus admins, with per-student submissions and grading.
 */
const assignmentSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: [true, "Campus ID is required"],
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
      default: null,
      index: true,
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
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    gradeOrClass: {
      type: String,
      trim: true,
      default: "",
    },
    program: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    instructor: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks are required"],
      default: 100,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Active", "Closed", "Draft", "Archived", "Published"],
      default: "Active",
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

assignmentSchema.index({ campusId: 1, teacherId: 1, createdAt: -1 });
assignmentSchema.index({ campusId: 1, classId: 1 });
assignmentSchema.index({ campusId: 1, dueDate: -1 });
assignmentSchema.index({ campusId: 1, className: 1, section: 1 });

export const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
