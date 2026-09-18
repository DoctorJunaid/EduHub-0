import mongoose from "mongoose";

const substituteAssignmentSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: Number,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      default: "",
    },
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
      index: true,
    },
    substituteTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ["Teacher Absent", "On Leave", "Training", "Emergency", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending Approval", "Assigned", "Completed", "Cancelled", "Declined"],
      default: "Assigned",
    },
    notes: {
      type: String,
      maxlength: 300,
      default: "",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bonusEligible: {
      type: Boolean,
      default: true,
    },
    bonusAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Unique constraint: A single class/section can only have one substitute per period per date
substituteAssignmentSchema.index({ className: 1, section: 1, date: 1, period: 1 }, { unique: true });

export const SubstituteAssignment = mongoose.models.SubstituteAssignment || mongoose.model("SubstituteAssignment", substituteAssignmentSchema);
