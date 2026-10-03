import mongoose from "mongoose";
import AuditLog from "../models/auditLog.model.js";

/**
 * Write an immutable audit log entry.
 */
export const writeAuditLog = async ({
  campusId = null,
  instituteId = null,
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
      campusId: campusId || null,
      instituteId: instituteId || null,
      entityType,
      entityId,
      action,
      performedBy: {
        userId: performedBy?.userId || performedBy?._id || performedBy?.id || null,
        name: performedBy?.name || "System",
        email: performedBy?.email || "",
        role: performedBy?.role || "system",
      },
      timestamp: new Date(),
      ipAddress: ipAddress || "",
      userAgent: userAgent || "",
      changes: changes || {},
      reason: reason || "",
      metadata: metadata || {},
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("Audit log write error:", error.message);
    return null;
  }
};

/**
 * High-level helper: extracts actor identity, IP, and user-agent directly from request context.
 */
export const logAuditEvent = async (
  req,
  {
    entityType,
    entityId,
    action,
    campusId = null,
    instituteId = null,
    changes = {},
    reason = "",
    metadata = {},
  }
) => {
  const user = req?.user || null;
  const performedBy = user
    ? {
        userId: user._id || user.id,
        name: user.name || "Authorized User",
        email: user.email || "",
        role: user.role || "admin",
      }
    : {
        name: "System",
        role: "system",
      };

  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    "";
  const userAgent = req?.headers?.["user-agent"] || "";

  return writeAuditLog({
    campusId: campusId || user?.campusId || null,
    instituteId: instituteId || user?.instituteId || null,
    entityType,
    entityId,
    action,
    performedBy,
    ipAddress,
    userAgent,
    changes,
    reason,
    metadata,
  });
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

export default {
  writeAuditLog,
  logAuditEvent,
  getAuditTrail,
};
