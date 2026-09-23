import mongoose from "mongoose";

/**
 * Assignment Model
 * Created by campus_admin / teacher, visible to students.
 * Submissions are tracked per student.
 */
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Late", "Graded", "Missing"],
      default: "Submitted",
    },
    score: { type: Number, default: null },
    feedback: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },
    description: { type: String, trim: true, default: "" },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    program: { type: String, trim: true, default: "" },
    gradeOrClass: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    instructor: { type: String, trim: true, default: "" },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dueDate: { type: Date, required: [true, "Due date is required"] },
    totalMarks: { type: Number, default: 100, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Closed", "Draft"],
      default: "Active",
    },
    submissions: [submissionSchema],
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: [true, "Campus is required"],
      index: true,
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ campusId: 1, dueDate: -1 });
assignmentSchema.index({ campusId: 1, program: 1, section: 1 });

const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
