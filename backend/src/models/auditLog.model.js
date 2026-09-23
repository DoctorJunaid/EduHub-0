import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["AttendanceApproval", "PayrollAdjustment", "MonthlyPayroll", "SubstituteAssignment", "TeacherAttendance"],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["created", "approved", "rejected", "applied", "carried_forward", "cancelled", "updated"],
    },
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "System" },
      email: { type: String, default: "" },
      role: { type: String, default: "system" },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    reason: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for querying entity-specific audit logs
auditLogSchema.index({ campusId: 1, entityType: 1, entityId: 1, timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
