import mongoose from "mongoose";

const studentLeaveRequestSchema = new mongoose.Schema(
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
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    rollNumber: { type: String, default: "" },
    className: { type: String, default: "" },
    section: { type: String, default: "" },

    // The assigned teacher (or class teacher)
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    teacherName: { type: String, default: "" },

    date: { type: Date, required: true, index: true },
    dateStr: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    reason: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Medical",
        "Sick Leave",
        "Casual Leave",
        "Casual",
        "Personal",
        "Family Emergency",
        "Event",
        "Family Event",
        "Urgent",
        "Other",
      ],
      default: "Medical",
    },
    note: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },
    attachmentName: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
      index: true,
    },

    reviewedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    approvalRemarks: { type: String, default: "" },
  },
  { timestamps: true }
);

studentLeaveRequestSchema.index({ campusId: 1, dateStr: 1 });
studentLeaveRequestSchema.index({ campusId: 1, studentId: 1, dateStr: 1 });
studentLeaveRequestSchema.index({ campusId: 1, status: 1 });
studentLeaveRequestSchema.index({ teacherId: 1, status: 1 });

export const StudentLeaveRequest =
  mongoose.models.StudentLeaveRequest ||
  mongoose.model("StudentLeaveRequest", studentLeaveRequestSchema);

export default StudentLeaveRequest;
