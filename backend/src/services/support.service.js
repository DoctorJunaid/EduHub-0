/**
 * Support Service Layer
 * Encapsulates all Mongoose data queries and business rules for Support Tickets and Messages.
 */
import mongoose from "mongoose";
import SupportTicket from "../models/supportTicket.model.js";
import SupportMessage from "../models/supportMessage.model.js";
import User from "../models/user.model.js";
import generateTicketNumber from "../utils/ticketNumber.js";
import {
  canViewTicket,
  canReplyToTicket,
  canAssignTicket,
  canEscalateTicket,
  canCloseTicket,
  canMessageUser,
  isAdminRole,
} from "../middleware/supportAccess.middleware.js";

// SLA Thresholds in Hours
const SLA_HOURS = {
  Urgent: 2,
  High: 8,
  Medium: 24,
  Low: 72,
};

/**
 * Helper: Run auto-close on tickets that have been "Resolved" for > 7 days
 */
const runAutoClose = async (scopeFilter = {}) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SupportTicket.updateMany(
      {
        ...scopeFilter,
        status: "Resolved",
        lastActivityAt: { $lt: sevenDaysAgo },
      },
      {
        $set: {
          status: "Closed",
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      }
    );
  } catch (err) {
    console.error("Auto-close support tickets error:", err);
  }
};

/**
 * 1. Create Ticket
 */
export const createTicket = async (user, payload) => {
  const { category, priority = "Medium", subject, description, attachments = [] } = payload;

  if (!subject || subject.trim().length < 5) {
    const error = new Error("Subject must be at least 5 characters long");
    error.statusCode = 400;
    throw error;
  }

  if (!description || description.trim().length < 20) {
    const error = new Error("Description must be at least 20 characters long");
    error.statusCode = 400;
    throw error;
  }

  // Validate Category for non-admins
  if (category === "Platform Bug" || category === "Feature Request") {
    if (!isAdminRole(user.role)) {
      const error = new Error(`Only administrators can create tickets in category "${category}"`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Auto-Assignee resolution
  let assignedUser = null;
  const campusId = user.campusId || null;
  const instituteId = user.instituteId || null;

  if (category === "Platform Bug" || category === "Feature Request") {
    assignedUser = await User.findOne({ role: "super_admin", isActive: true });
  } else if (category === "Payroll" && (user.role === "teacher" || user.role === "faculty")) {
    assignedUser = await User.findOne({
      campusId,
      role: { $in: ["campus_admin", "campus_manager", "principal"] },
      isActive: true,
    });
  } else if (category === "Academic" && user.role === "student") {
    // Attempt to assign to a teacher in the same campus
    assignedUser = await User.findOne({
      campusId,
      role: { $in: ["teacher", "faculty"] },
      isActive: true,
    });
  }

  // Default fallback assignment: Campus Admin or Institute Admin
  if (!assignedUser && campusId) {
    assignedUser = await User.findOne({
      campusId,
      role: { $in: ["campus_admin", "campus_manager", "principal"] },
      isActive: true,
    });
  }

  if (!assignedUser && instituteId) {
    assignedUser = await User.findOne({
      instituteId,
      role: "institute_admin",
      isActive: true,
    });
  }

  // Auto urgent for login/technical issues
  let finalPriority = priority;
  if (category === "Technical Issue" && /login|access|password|lock/i.test(`${subject} ${description}`)) {
    finalPriority = "Urgent";
  }

  const ticketNumber = await generateTicketNumber();

  const ticket = await SupportTicket.create({
    ticketNumber,
    campusId,
    instituteId,
    createdBy: user._id,
    createdBySnapshot: {
      name: user.name || "User",
      email: user.email || "",
      role: user.role || "student",
    },
    assignedTo: assignedUser ? assignedUser._id : null,
    assignedToSnapshot: assignedUser
      ? {
          name: assignedUser.name || "Admin",
          email: assignedUser.email || "",
          role: assignedUser.role || "campus_admin",
        }
      : { name: "Unassigned", email: "", role: "" },
    category,
    priority: finalPriority,
    status: "Open",
    subject: subject.trim(),
    description: description.trim(),
    attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
    escalationLevel: 1,
    lastActivityAt: new Date(),
  });

  return ticket;
};

/**
 * 2. List Tickets (Paginated & Role-Scoped)
 */
export const listTickets = async (user, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    priority,
    search,
    scope = "my", // "my" | "all" (all for admins)
    assignedTo,
  } = filters;

  const query = {};

  // Build role-based scope filter
  if (user.role === "super_admin") {
    if (scope === "my") {
      query.$or = [{ createdBy: user._id }, { assignedTo: user._id }];
    }
  } else if (user.role === "institute_admin") {
    if (scope === "all" && user.instituteId) {
      query.instituteId = user.instituteId;
    } else {
      query.$or = [{ createdBy: user._id }, { assignedTo: user._id }, { instituteId: user.instituteId }];
    }
  } else if (user.role === "campus_admin" || user.role === "campus_manager" || user.role === "principal") {
    if (scope === "all" && user.campusId) {
      query.campusId = user.campusId;
    } else {
      query.$or = [{ createdBy: user._id }, { assignedTo: user._id }, { campusId: user.campusId }];
    }
  } else {
    // Teacher, student, parent
    query.$or = [{ createdBy: user._id }, { assignedTo: user._id }];
  }

  // Trigger auto-close check on read
  await runAutoClose(query.campusId ? { campusId: query.campusId } : {});

  // Apply filters
  if (status && status !== "All") query.status = status;
  if (category && category !== "All") query.category = category;
  if (priority && priority !== "All") query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  if (search && search.trim()) {
    const term = search.trim();
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { ticketNumber: { $regex: term, $options: "i" } },
        { subject: { $regex: term, $options: "i" } },
        { "createdBySnapshot.name": { $regex: term, $options: "i" } },
        { "assignedToSnapshot.name": { $regex: term, $options: "i" } },
      ],
    });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, tickets] = await Promise.all([
    SupportTicket.countDocuments(query),
    SupportTicket.find(query)
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "name email role avatar")
      .populate("assignedTo", "name email role avatar")
      .lean(),
  ]);

  return {
    tickets,
    total,
    page: pageNum,
    limit: limitNum,
    pageCount: Math.max(1, Math.ceil(total / limitNum)),
  };
};

/**
 * 3. Get One Ticket + All Threaded Messages
 */
export const getTicket = async (user, ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    const error = new Error("Invalid ticket ID");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId)
    .populate("createdBy", "name email role avatar")
    .populate("assignedTo", "name email role avatar")
    .populate("escalationHistory.from", "name email role")
    .populate("escalationHistory.to", "name email role")
    .populate("escalationHistory.actor", "name email role");

  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canViewTicket(user, ticket)) {
    const error = new Error("Access denied. You do not have permission to view this support ticket.");
    error.statusCode = 403;
    throw error;
  }

  // Filter messages (internal notes hidden from non-admin creators)
  const messageQuery = { ticketId: ticket._id };
  if (!isAdminRole(user.role)) {
    messageQuery.isInternal = false;
  }

  const messages = await SupportMessage.find(messageQuery)
    .sort({ createdAt: 1 })
    .populate("senderId", "name email role avatar")
    .lean();

  // Mark unread messages as read by current user
  await SupportMessage.updateMany(
    {
      ticketId: ticket._id,
      "readBy.userId": { $ne: user._id },
    },
    {
      $push: { readBy: { userId: user._id, readAt: new Date() } },
    }
  );

  return {
    ticket,
    messages,
  };
};

/**
 * 4. Assign Ticket (Admin only)
 */
export const assignTicket = async (user, ticketId, assigneeId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canAssignTicket(user, ticket)) {
    const error = new Error("Access denied. Only administrators can assign tickets.");
    error.statusCode = 403;
    throw error;
  }

  const assignee = await User.findById(assigneeId);
  if (!assignee) {
    const error = new Error("Assignee user not found");
    error.statusCode = 404;
    throw error;
  }

  // Multi-tenant boundary check
  if (user.role === "campus_admin" && assignee.campusId && String(assignee.campusId) !== String(user.campusId)) {
    const error = new Error("Cannot assign ticket to a staff member outside your campus");
    error.statusCode = 403;
    throw error;
  }

  ticket.assignedTo = assignee._id;
  ticket.assignedToSnapshot = {
    name: assignee.name,
    email: assignee.email,
    role: assignee.role,
  };
  ticket.lastActivityAt = new Date();
  if (ticket.status === "Open") {
    ticket.status = "In Progress";
  }

  await ticket.save();
  return ticket;
};

/**
 * 5. Change Ticket Status (Admin only)
 */
export const changeStatus = async (user, ticketId, status) => {
  const validStatuses = ["Open", "In Progress", "Resolved", "Closed", "Escalated", "Cancelled"];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status "${status}"`);
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canAssignTicket(user, ticket)) {
    const error = new Error("Access denied. Only administrators can change ticket status.");
    error.statusCode = 403;
    throw error;
  }

  ticket.status = status;
  ticket.lastActivityAt = new Date();

  if (status === "Resolved" && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date();
  }
  if (status === "Closed" && !ticket.closedAt) {
    ticket.closedAt = new Date();
  }

  await ticket.save();
  return ticket;
};

/**
 * 6. Escalate Ticket (Admin only, moves up one level)
 */
export const escalateTicket = async (user, ticketId, reason = "") => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canEscalateTicket(user, ticket)) {
    const error = new Error(
      (ticket.escalationLevel || 1) >= 3
        ? "Ticket is already at the highest escalation level (Level 3 - Super Admin)"
        : "Access denied. You cannot escalate this ticket."
    );
    error.statusCode = 400;
    throw error;
  }

  const previousLevel = ticket.escalationLevel || 1;
  const nextLevel = previousLevel + 1;
  const previousAssignee = ticket.assignedTo;

  let newAssignee = null;

  if (nextLevel === 2) {
    // Level 2 -> Institute Admin
    newAssignee = await User.findOne({
      instituteId: ticket.instituteId || user.instituteId,
      role: "institute_admin",
      isActive: true,
    });
  } else if (nextLevel === 3) {
    // Level 3 -> Super Admin
    newAssignee = await User.findOne({
      role: "super_admin",
      isActive: true,
    });
  }

  ticket.escalationLevel = nextLevel;
  ticket.status = "Escalated";
  ticket.lastActivityAt = new Date();

  if (newAssignee) {
    ticket.assignedTo = newAssignee._id;
    ticket.assignedToSnapshot = {
      name: newAssignee.name,
      email: newAssignee.email,
      role: newAssignee.role,
    };
  }

  ticket.escalationHistory.push({
    from: previousAssignee,
    to: newAssignee ? newAssignee._id : null,
    reason: reason.trim() || `Escalated to Level ${nextLevel}`,
    timestamp: new Date(),
    actor: user._id,
  });

  await ticket.save();
  return ticket;
};

/**
 * 7. Reply to Ticket
 */
export const replyToTicket = async (user, ticketId, payload) => {
  const { message, attachments = [], isInternal = false } = payload;

  if (!message || !message.trim()) {
    const error = new Error("Message content cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status === "Closed" || ticket.status === "Cancelled") {
    const error = new Error("Cannot reply to a closed or cancelled support ticket");
    error.statusCode = 400;
    throw error;
  }

  if (!canReplyToTicket(user, ticket)) {
    const error = new Error("Access denied. You do not have permission to reply to this ticket.");
    error.statusCode = 403;
    throw error;
  }

  const internalNote = Boolean(isInternal) && isAdminRole(user.role);

  const reply = await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name || "User",
      email: user.email || "",
      role: user.role || "student",
    },
    message: message.trim(),
    attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
    isInternal: internalNote,
    readBy: [{ userId: user._id, readAt: new Date() }],
  });

  ticket.lastActivityAt = new Date();

  // First response tracking (if admin replies and firstResponseAt is null)
  if (isAdminRole(user.role) && !ticket.firstResponseAt && !internalNote) {
    ticket.firstResponseAt = new Date();
  }

  // If ticket was "Resolved" and creator replies, reopen to "In Progress"
  if (ticket.status === "Resolved" && String(ticket.createdBy) === String(user._id)) {
    ticket.status = "In Progress";
  } else if (ticket.status === "Open" && isAdminRole(user.role)) {
    ticket.status = "In Progress";
  }

  await ticket.save();
  return reply;
};

/**
 * 8. Close Ticket (Creator or Admin)
 */
export const closeTicket = async (user, ticketId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canCloseTicket(user, ticket)) {
    const error = new Error("Access denied. You do not have permission to close this ticket.");
    error.statusCode = 403;
    throw error;
  }

  ticket.status = "Closed";
  ticket.closedAt = new Date();
  ticket.lastActivityAt = new Date();

  await ticket.save();
  return ticket;
};

/**
 * 9. Rate Ticket Satisfaction (Creator only, once)
 */
export const rateTicket = async (user, ticketId, rating, comment = "") => {
  const score = parseInt(rating, 10);
  if (isNaN(score) || score < 1 || score > 5) {
    const error = new Error("Satisfaction rating must be a number between 1 and 5");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(ticket.createdBy) !== String(user._id)) {
    const error = new Error("Only the ticket creator can submit a satisfaction rating");
    error.statusCode = 403;
    throw error;
  }

  if (ticket.satisfactionRating) {
    const error = new Error("Satisfaction rating has already been submitted for this ticket");
    error.statusCode = 400;
    throw error;
  }

  ticket.satisfactionRating = score;
  ticket.satisfactionComment = comment ? comment.trim() : "";
  ticket.lastActivityAt = new Date();

  await ticket.save();
  return ticket;
};

/**
 * 10. Get Scoped Dashboard Stats & SLAs
 */
export const getStats = async (user) => {
  const query = {};

  if (user.role === "super_admin") {
    // Platform-wide
  } else if (user.role === "institute_admin" && user.instituteId) {
    query.instituteId = user.instituteId;
  } else if (
    (user.role === "campus_admin" || user.role === "campus_manager" || user.role === "principal") &&
    user.campusId
  ) {
    query.campusId = user.campusId;
  } else {
    query.$or = [{ createdBy: user._id }, { assignedTo: user._id }];
  }

  const tickets = await SupportTicket.find(query).lean();

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress" || t.status === "Escalated").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const closedCount = tickets.filter((t) => t.status === "Closed").length;
  const totalCount = tickets.length;

  // Unread / assigned to me count for sidebar badge
  const myAssignedOpenCount = tickets.filter(
    (t) =>
      String(t.assignedTo) === String(user._id) &&
      (t.status === "Open" || t.status === "In Progress" || t.status === "Escalated")
  ).length;

  const myOpenTicketsCount = tickets.filter(
    (t) => String(t.createdBy) === String(user._id) && t.status !== "Closed" && t.status !== "Cancelled"
  ).length;

  // SLA Computations (no cron, on read)
  const now = Date.now();
  let ticketsWithinSLA = 0;
  let ticketsOverdue = 0;
  let totalResponseTimeMs = 0;
  let responseCount = 0;
  let totalResolutionTimeMs = 0;
  let resolutionCount = 0;

  for (const t of tickets) {
    const slaHours = SLA_HOURS[t.priority] || 24;
    const slaMs = slaHours * 60 * 60 * 1000;
    const createdMs = new Date(t.createdAt).getTime();

    // Check first response SLA
    if (t.firstResponseAt) {
      const responseMs = new Date(t.firstResponseAt).getTime();
      const elapsed = responseMs - createdMs;
      totalResponseTimeMs += elapsed;
      responseCount++;
      if (elapsed <= slaMs) ticketsWithinSLA++;
      else ticketsOverdue++;
    } else if (t.status === "Open" || t.status === "In Progress") {
      const elapsed = now - createdMs;
      if (elapsed > slaMs) ticketsOverdue++;
    }

    // Check resolution time
    if (t.resolvedAt) {
      const resolvedMs = new Date(t.resolvedAt).getTime();
      totalResolutionTimeMs += resolvedMs - createdMs;
      resolutionCount++;
    }
  }

  const avgFirstResponseHours =
    responseCount > 0 ? Number((totalResponseTimeMs / responseCount / (1000 * 60 * 60)).toFixed(1)) : 0;
  const avgResolutionHours =
    resolutionCount > 0 ? Number((totalResolutionTimeMs / resolutionCount / (1000 * 60 * 60)).toFixed(1)) : 0;

  return {
    open: openCount,
    inProgress: inProgressCount,
    resolved: resolvedCount,
    closed: closedCount,
    total: totalCount,
    badgeCount: isAdminRole(user.role) ? myAssignedOpenCount : myOpenTicketsCount,
    sla: {
      ticketsWithinSLA,
      ticketsOverdue,
      avgFirstResponseHours,
      avgResolutionHours,
    },
  };
};

/**
 * 11. Get Categories For Role
 */
export const getCategoriesForRole = (role = "student") => {
  const common = [
    "Technical Issue",
    "Academic",
    "Attendance",
    "Fees & Payments",
    "Library",
    "Transport",
    "Discipline",
    "Other",
  ];

  if (role === "teacher" || role === "faculty") {
    return ["Payroll", ...common];
  }

  if (isAdminRole(role)) {
    return ["Platform Bug", "Feature Request", "Payroll", ...common];
  }

  return common;
};

/**
 * 12. Get Authorized Contacts (Who this user can message/tag)
 */
export const getContacts = async (user) => {
  const query = { isActive: true, _id: { $ne: user._id } };

  if (user.role === "campus_admin" || user.role === "campus_manager" || user.role === "principal") {
    if (user.campusId) query.campusId = user.campusId;
  } else if (user.role === "institute_admin") {
    if (user.instituteId) query.instituteId = user.instituteId;
  } else if (user.campusId) {
    query.campusId = user.campusId;
  }

  const candidates = await User.find(query)
    .select("name email role avatar department designation")
    .limit(50)
    .lean();

  return candidates.filter((recipient) => canMessageUser(user, recipient));
};

export default {
  createTicket,
  listTickets,
  getTicket,
  assignTicket,
  changeStatus,
  escalateTicket,
  replyToTicket,
  closeTicket,
  rateTicket,
  getStats,
  getCategoriesForRole,
  getContacts,
};
