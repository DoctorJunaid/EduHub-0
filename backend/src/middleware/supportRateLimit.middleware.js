/**
 * Support In-Memory Rate Limiting Middleware
 * Rules:
 * - Max 5 tickets per user per day
 * - Max 50 replies per user per day
 */

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

  const now = Date.now();
  const currentLogs = ticketCreationLog.get(userId) || [];
  const validLogs = cleanOldTimestamps(currentLogs, now);

  if (validLogs.length >= 5) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded: You can only create up to 5 conversations per day. Please wait before creating a new one.",
    });
  }

  validLogs.push(now);
  ticketCreationLog.set(userId, validLogs);
  next();
};

export const rateLimitTicketReply = (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();

  const now = Date.now();
  const currentLogs = replyCreationLog.get(userId) || [];
  const validLogs = cleanOldTimestamps(currentLogs, now);

  if (validLogs.length >= 50) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded: You have reached the maximum of 50 replies per day.",
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
