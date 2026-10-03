/**
 * Support In-Memory Rate Limiting Middleware
 * Rules:
 * - Max 5 tickets per user per day
 * - Max 50 replies per user per day
 */

import { isAdminRole, normalizeRole } from "./supportAccess.middleware.js";

// In-memory buckets storing timestamps per user ID
const ticketCreationLog = new Map(); // userId -> Array<timestamp>
const replyCreationLog = new Map();  // userId -> Array<timestamp>

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const cleanOldTimestamps = (timestamps, now) => {
  return timestamps.filter((t) => now - t < ONE_DAY_MS);
};

export const rateLimitTicketCreate = (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();

  const role = normalizeRole(req.user?.role);
  // Admins have higher limit for creating tickets (e.g. system issues)
  const maxLimit = isAdminRole(role) ? 50 : 10;

  const now = Date.now();
  const currentLogs = ticketCreationLog.get(userId) || [];
  const validLogs = cleanOldTimestamps(currentLogs, now);

  if (validLogs.length >= maxLimit) {
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded: You can only create up to ${maxLimit} conversations per day. Please wait before creating a new one.`,
    });
  }

  validLogs.push(now);
  ticketCreationLog.set(userId, validLogs);
  next();
};

export const rateLimitTicketReply = (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();

  const role = normalizeRole(req.user?.role);
  // Staff and teachers replying to students should not be capped by student limits
  if (isAdminRole(role) || role === "teacher") {
    return next();
  }

  const now = Date.now();
  const currentLogs = replyCreationLog.get(userId) || [];
  const validLogs = cleanOldTimestamps(currentLogs, now);

  if (validLogs.length >= 100) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded: You have reached the maximum replies per day.",
    });
  }

  validLogs.push(now);
  replyCreationLog.set(userId, validLogs);
  next();
};

export default {
  rateLimitTicketCreate,
  rateLimitTicketReply,
};
