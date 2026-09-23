import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "student_created",
        "student_assigned",
        "student_updated",
        "student_removed",
        "faculty_created",
        "faculty_updated",
        "faculty_removed",
        "schedule_created",
        "schedule_updated",
        "schedule_deleted",
        "exam_created",
        "exam_updated",
        "exam_deleted",
        "teacher_attendance_marked",
        "student_attendance_marked",
        "student_attendance_bulk",
        "fee_created",
        "fee_updated",
        "fee_deleted",
        "fee_generated",
        "fee_waived",
        "fee_omitted",
        "payment_recorded",
        "payment_confirmed",
        "payment_rejected",
        "performance_created",
        "system_event",
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ["students", "staff", "academic", "attendance", "alerts", "fees"],
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    entityType: {
      type: String,
      enum: ["student", "faculty", "schedule", "exam", "attendance", "fee", "payment", "performance", "system"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete logs after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound index for efficient campus + time queries
activityLogSchema.index({ campus: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

/**
 * Fire-and-forget helper – controllers call this without awaiting.
 * If logging fails it is silently ignored to avoid blocking API responses.
 */
export const logActivity = (fields) => {
  ActivityLog.create(fields).catch((err) =>
    console.warn("Activity log write failed:", err.message)
  );
};

export default ActivityLog;
