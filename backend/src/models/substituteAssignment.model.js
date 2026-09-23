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
      default: "08:00",
    },
    endTime: {
      type: String,
      required: true,
      default: "08:45",
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
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
      default: "Teacher Absent",
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

// Pre-save hook: Normalize date to UTC midnight
substituteAssignmentSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    this.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }
  if (typeof next === "function") next();
});

// Unique constraint: A single class/section can only have one active substitute per period per date
substituteAssignmentSchema.index(
  { className: 1, section: 1, date: 1, period: 1 },
  { unique: true }
);

export const SubstituteAssignment =
  mongoose.models.SubstituteAssignment ||
  mongoose.model("SubstituteAssignment", substituteAssignmentSchema);
