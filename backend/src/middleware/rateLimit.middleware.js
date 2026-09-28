/**
 * In-Memory Rate Limiting Middleware for Support Endpoints
 * - Max 5 tickets per user per day
 * - Max 50 replies per user per day
 */

const ticketCreations = new Map();
const ticketReplies = new Map();

// Cleanup old timestamps periodically (every 1 hour)
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [userId, timestamps] of ticketCreations.entries()) {
    const valid = timestamps.filter((t) => t > oneDayAgo);
    if (valid.length) ticketCreations.set(userId, valid);
    else ticketCreations.delete(userId);
  }
  for (const [userId, timestamps] of ticketReplies.entries()) {
    const valid = timestamps.filter((t) => t > oneDayAgo);
    if (valid.length) ticketReplies.set(userId, valid);
    else ticketReplies.delete(userId);
  }
}, 60 * 60 * 1000);

export const rateLimitTicketCreate = (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const history = ticketCreations.get(userId) || [];
  const recent = history.filter((t) => t > oneDayAgo);

  if (recent.length >= 5) {
    return res.status(429).json({
      success: false,
      message: "Daily ticket creation limit reached (5 tickets per 24 hours). Please wait before opening another ticket.",
    });
  }

  recent.push(now);
  ticketCreations.set(userId, recent);
  next();
};

export const rateLimitTicketReply = (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const history = ticketReplies.get(userId) || [];
  const recent = history.filter((t) => t > oneDayAgo);

  if (recent.length >= 50) {
    return res.status(429).json({
      success: false,
      message: "Daily reply limit reached (50 replies per 24 hours).",
    });
  }

  recent.push(now);
  ticketReplies.set(userId, recent);
  next();
};

export default {
  rateLimitTicketCreate,
  rateLimitTicketReply,
};
