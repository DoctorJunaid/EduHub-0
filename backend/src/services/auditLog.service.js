import mongoose from "mongoose";
import AuditLog from "../models/auditLog.model.js";

/**
 * Write an immutable audit log entry.
 */
export const writeAuditLog = async ({
  campusId,
  entityType,
  entityId,
  action,
  performedBy,
  ipAddress = "",
  userAgent = "",
  changes = {},
  reason = "",
  metadata = {},
}) => {
  try {
    const log = new AuditLog({
      campusId,
      entityType,
      entityId,
      action,
      performedBy: {
        userId: performedBy?.userId || performedBy?._id || null,
        name: performedBy?.name || "System",
        email: performedBy?.email || "",
        role: performedBy?.role || "system",
      },
      timestamp: new Date(),
      ipAddress,
      userAgent,
      changes,
      reason,
      metadata,
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("Audit log write error:", error.message);
    return null;
  }
};

/**
 * Retrieve audit trail for a specific entity.
 */
export const getAuditTrail = async (campusId, entityTypeOrId, maybeEntityId) => {
  const query = { campusId };

  if (maybeEntityId) {
    query.entityType = entityTypeOrId;
    query.entityId = maybeEntityId;
  } else if (entityTypeOrId) {
    if (mongoose.isValidObjectId(entityTypeOrId)) {
      query.entityId = entityTypeOrId;
    } else {
      query.entityType = entityTypeOrId;
    }
  }

  return await AuditLog.find(query).sort({ timestamp: -1 }).lean();
};
