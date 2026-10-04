/**
 * Support Service Layer
 * Encapsulates all Mongoose queries and business rules for Support Tickets and Messages.
 */
import mongoose from "mongoose";
import SupportTicket from "../models/supportTicket.model.js";
import SupportMessage from "../models/supportMessage.model.js";
import User from "../models/user.model.js";
import generateTicketNumber from "../utils/ticketNumber.js";
import { createNotification } from "./notification.service.js";
import {
  normalizeRole,
  isAdminRole,
  canViewTicket,
  canReplyToTicket,
  canAssignTicket,
  canEscalateTicket,
  canCloseTicket,
  canMessageUser,
} from "../middleware/supportAccess.middleware.js";

// SLA Thresholds in Hours
const SLA_HOURS = {
  Urgent: 2,
  High: 8,
  Medium: 24,
  Low: 72,
};

const CATEGORY_MAP = [
  { id: "Academic", label: "Homework or subject", icon: "📚", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Attendance", label: "Attendance", icon: "📅", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Fees & Payments", label: "Fees or payment", icon: "💰", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Library", label: "Library", icon: "📖", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Transport", label: "Transport", icon: "🚌", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Technical Issue", label: "My account", icon: "👤", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Discipline", label: "Discipline", icon: "⚠️", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Payroll", label: "Salary", icon: "💵", roles: ["teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Other", label: "Something else", icon: "❓", roles: ["student", "parent", "teacher", "campus_admin", "institute_admin", "super_admin"] },
  { id: "Platform Bug", label: "Platform Bug", icon: "🐛", roles: ["campus_admin", "institute_admin", "super_admin"] },
  { id: "Feature Request", label: "Feature Request", icon: "💡", roles: ["campus_admin", "institute_admin", "super_admin"] },
];

/**
 * Auto-close: Find tickets where status = "Resolved" AND lastActivityAt < now - 7 days -> bulk update to "Closed"
 */
export const runAutoClose = async (scopeFilter = {}) => {
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
 * Auto-assign helper
 */
export const autoAssign = async (ticketData, user) => {
  const role = normalizeRole(user.role);
  const { category } = ticketData;
  const campusId = user.campusId || null;
  const instituteId = user.instituteId || null;

  if (category === "Payroll" && role === "teacher") {
    const campusAdmin = await User.findOne({
      campusId,
      role: { $in: ["campus_admin", "campus_manager", "principal"] },
      isActive: true,
    }).lean();
    return campusAdmin;
  }

  if (category === "Platform Bug" || category === "Feature Request") {
    const superAdmin = await User.findOne({
      role: "super_admin",
      isActive: true,
    }).lean();
    return superAdmin;
  }

  if (category === "Academic" && role === "student") {
    // Assign to student's teacher in same campus
    const teacher = await User.findOne({
      campusId,
      role: { $in: ["teacher", "faculty"] },
      isActive: true,
    }).lean();
    if (teacher) return teacher;
  }

  // Fallback: Campus admin or Institute admin
  if (campusId) {
    const campusAdmin = await User.findOne({
      campusId,
      role: { $in: ["campus_admin", "campus_manager", "principal"] },
      isActive: true,
    }).lean();
    if (campusAdmin) return campusAdmin;
  }

  if (instituteId) {
    const instAdmin = await User.findOne({
      instituteId,
      role: "institute_admin",
      isActive: true,
    }).lean();
    if (instAdmin) return instAdmin;
  }

  const superAdmin = await User.findOne({
    role: "super_admin",
    isActive: true,
  }).lean();
  return superAdmin;
};

/**
 * 1. Create Ticket
 */
export const createTicket = async (user, payload) => {
  const {
    category,
    priority: requestedPriority,
    subject,
    description,
    attachments = [],
  } = payload;

  if (!subject || subject.trim().length < 5) {
    const error = new Error("Subject must be at least 5 characters long");
    error.statusCode = 400;
    throw error;
  }

  if (!description || description.trim().length < 10) {
    const error = new Error("Description must be at least 10 characters long");
    error.statusCode = 400;
    throw error;
  }

  const role = normalizeRole(user.role);

  // Validate admin-only categories
  if (category === "Platform Bug" || category === "Feature Request") {
    if (!isAdminRole(role)) {
      const error = new Error(`Only administrators can create tickets for "${category}"`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate Payroll category for teacher only or admin
  if (category === "Payroll" && role !== "teacher" && !isAdminRole(role)) {
    const error = new Error("Salary inquiries are only available for staff members");
    error.statusCode = 400;
    throw error;
  }

  // Priority enforcement: Regular users are auto-Medium; admins can set
  const priority = isAdminRole(role) && requestedPriority ? requestedPriority : "Medium";

  // Auto assign
  const assignedUser = await autoAssign({ category }, user);

  // Generate ticket number
  const ticketNumber = await generateTicketNumber();

  const ticket = await SupportTicket.create({
    ticketNumber,
    campusId: user.campusId || null,
    instituteId: user.instituteId || null,
    createdBy: user._id,
    createdBySnapshot: {
      name: user.name || "User",
      email: user.email || "",
      role: user.role || "student",
    },
    assignedTo: assignedUser ? assignedUser._id : null,
    assignedToSnapshot: assignedUser
      ? {
          name: assignedUser.name || "Support Team",
          email: assignedUser.email || "",
          role: assignedUser.role || "campus_admin",
        }
      : { name: "Support Team", email: "", role: "campus_admin" },
    category,
    priority,
    status: "Open",
    subject: subject.trim(),
    description: description.trim(),
    attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
    escalationLevel: 1,
    escalationHistory: [],
    lastActivityAt: new Date(),
  });

  // Initial message thread entry
  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name || "User",
      email: user.email || "",
      role: user.role || "student",
    },
    message: description.trim(),
    attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
    isInternal: false,
    readBy: [{ userId: user._id, readAt: new Date() }],
  });

  // Push & Email Notification to Assigned Staff / Admin
  if (assignedUser && String(assignedUser._id) !== String(user._id)) {
    createNotification({
      userId: assignedUser._id,
      title: `New Support Ticket #${ticketNumber}`,
      message: `${user.name || "A user"} opened a ${priority} ticket: "${subject.trim()}".`,
      type: "ticket_created",
      severity: priority === "Urgent" || priority === "High" ? "high" : "info",
      link: assignedUser.role === "super_admin" ? `/super-admin/support/${ticket._id}` : `/support/${ticket._id}`,
      ticketId: ticket._id,
      metadata: {
        ticketNumber,
        category,
        priority,
        status: "Open",
      },
      sendEmail: true,
    });
  }

  return ticket;
};

/**
 * 2. List Tickets (Role-Scoped & Paginated)
 */
export const listTickets = async (user, filters = {}) => {
  const role = normalizeRole(user.role);
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Run periodic auto-close
  const baseScope = {};
  if (role === "campus_admin" && user.campusId) baseScope.campusId = user.campusId;
  if (role === "institute_admin" && user.instituteId) baseScope.instituteId = user.instituteId;
  await runAutoClose(baseScope);

  const query = {};

  const andConditions = [];

  // Tenant / Role Scoping
  if (role === "super_admin") {
    if (filters.campusId) andConditions.push({ campusId: filters.campusId });
    if (filters.instituteId) andConditions.push({ instituteId: filters.instituteId });
  } else if (role === "institute_admin") {
    andConditions.push({ instituteId: user.instituteId });
    if (filters.campusId) andConditions.push({ campusId: filters.campusId });
  } else if (role === "campus_admin") {
    andConditions.push({ campusId: user.campusId });
  } else if (role === "teacher") {
    andConditions.push({
      $or: [
        { createdBy: user._id },
        { assignedTo: user._id },
      ],
    });
  } else {
    // Student, Parent
    andConditions.push({ createdBy: user._id });
  }

  // Filter application
  if (filters.status && filters.status !== "all") {
    if (filters.status === "Overdue") {
      query.status = { $in: ["Open", "In Progress", "Escalated"] };
    } else {
      query.status = filters.status;
    }
  }

  if (filters.category && filters.category !== "all") {
    query.category = filters.category;
  }

  if (filters.priority && filters.priority !== "all") {
    query.priority = filters.priority;
  }

  if (filters.assignedTo) {
    if (filters.assignedTo === "unassigned") {
      query.assignedTo = null;
    } else {
      query.assignedTo = filters.assignedTo;
    }
  }

  if (filters.search) {
    const s = filters.search.trim();
    andConditions.push({
      $or: [
        { ticketNumber: { $regex: s, $options: "i" } },
        { subject: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
        { "createdBySnapshot.name": { $regex: s, $options: "i" } },
      ],
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SupportTicket.countDocuments(query),
  ]);

  // Calculate Overdue status for each ticket
  const now = Date.now();
  const enrichedTickets = tickets.map((t) => {
    const slaLimit = SLA_HOURS[t.priority] || 24;
    const elapsedHours = (now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
    const isOverdue =
      ["Open", "In Progress", "Escalated"].includes(t.status) &&
      elapsedHours > slaLimit;

    return {
      ...t,
      isOverdue,
      slaRemainingHours: Math.max(0, slaLimit - elapsedHours),
    };
  });

  return {
    tickets: enrichedTickets,
    total,
    page,
    limit,
    pageCount: Math.ceil(total / limit) || 1,
  };
};

/**
 * 3. Get Single Ticket + Messages + Mark Read
 */
export const getTicket = async (user, ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    const error = new Error("Invalid ticket ID format");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId).lean();
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canViewTicket(user, ticket)) {
    const error = new Error("You do not have permission to view this ticket");
    error.statusCode = 403;
    throw error;
  }

  const role = normalizeRole(user.role);
  const isStaff = isAdminRole(role) || role === "teacher";

  // Message query (hide internal notes from regular creators/users)
  const messageQuery = { ticketId: ticket._id };
  if (!isStaff) {
    messageQuery.isInternal = false;
  }

  const messages = await SupportMessage.find(messageQuery)
    .sort({ createdAt: 1 })
    .lean();

  // Mark unread messages as read for this user
  await SupportMessage.updateMany(
    {
      ticketId: ticket._id,
      "readBy.userId": { $ne: user._id },
    },
    {
      $push: { readBy: { userId: user._id, readAt: new Date() } },
    }
  );

  const slaLimit = SLA_HOURS[ticket.priority] || 24;
  const elapsedHours = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
  const isOverdue =
    ["Open", "In Progress", "Escalated"].includes(ticket.status) &&
    elapsedHours > slaLimit;

  return {
    ticket: {
      ...ticket,
      isOverdue,
      slaRemainingHours: Math.max(0, slaLimit - elapsedHours),
    },
    messages,
  };
};

/**
 * 4. Assign Ticket (Admin only)
 */
export const assignTicket = async (user, ticketId, assigneeId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canAssignTicket(user, ticket)) {
    const error = new Error("You do not have permission to assign this ticket");
    error.statusCode = 403;
    throw error;
  }

  const assignee = await User.findById(assigneeId).lean();
  if (!assignee) {
    const error = new Error("Assignee user not found");
    error.statusCode = 404;
    throw error;
  }

  // Cross-campus check for campus admins
  const userRole = normalizeRole(user.role);
  if (userRole === "campus_admin" && user.campusId) {
    if (assignee.campusId && String(assignee.campusId) !== String(user.campusId)) {
      const error = new Error("Cannot assign ticket to a staff member of a different campus");
      error.statusCode = 403;
      throw error;
    }
  }

  ticket.assignedTo = assignee._id;
  ticket.assignedToSnapshot = {
    name: assignee.name,
    email: assignee.email,
    role: assignee.role,
  };
  if (ticket.status === "Open") {
    ticket.status = "In Progress";
  }
  ticket.lastActivityAt = new Date();
  await ticket.save();

  // Internal log message
  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: `Assigned ticket to ${assignee.name} (${assignee.role})`,
    isInternal: true,
  });

  // Push & Email Notification to Assignee
  if (String(assignee._id) !== String(user._id)) {
    createNotification({
      userId: assignee._id,
      title: `Ticket #${ticket.ticketNumber} Assigned to You`,
      message: `${user.name} assigned ticket "${ticket.subject}" to you.`,
      type: "ticket_assigned",
      severity: ticket.priority === "Urgent" ? "critical" : "info",
      link: assignee.role === "super_admin" ? `/super-admin/support/${ticket._id}` : `/support/${ticket._id}`,
      ticketId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
      },
      sendEmail: true,
    });
  }

  return ticket;
};

/**
 * 5. Change Status (Admin only)
 */
export const changeStatus = async (user, ticketId, newStatus) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canAssignTicket(user, ticket)) {
    const error = new Error("You do not have permission to modify this ticket status");
    error.statusCode = 403;
    throw error;
  }

  const validStatuses = ["Open", "In Progress", "Resolved", "Closed", "Escalated", "Cancelled"];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid status: ${newStatus}`);
    error.statusCode = 400;
    throw error;
  }

  const oldStatus = ticket.status;
  ticket.status = newStatus;
  ticket.lastActivityAt = new Date();

  if (newStatus === "Resolved" && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date();
  }
  if (newStatus === "Closed" && !ticket.closedAt) {
    ticket.closedAt = new Date();
  }

  await ticket.save();

  // Internal audit entry
  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: `Status updated from "${oldStatus}" to "${newStatus}"`,
    isInternal: true,
  });

  // Push & Email Notification to Ticket Creator
  if (String(ticket.createdBy) !== String(user._id)) {
    createNotification({
      userId: ticket.createdBy,
      title: `Ticket #${ticket.ticketNumber} Status: ${newStatus}`,
      message: `Your support ticket has been marked as "${newStatus}" by ${user.name}.`,
      type: "ticket_status",
      severity: newStatus === "Resolved" || newStatus === "Closed" ? "success" : "info",
      link: `/support/${ticket._id}`,
      ticketId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        status: newStatus,
      },
      sendEmail: true,
    });
  }

  return ticket;
};

/**
 * 6. Escalate Ticket (Admin only)
 * Escalation ladder: Level 1 (Campus) -> Level 2 (Institute) -> Level 3 (Super Admin)
 */
export const escalateTicket = async (user, ticketId, reason = "") => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canEscalateTicket(user, ticket)) {
    if ((ticket.escalationLevel || 1) >= 3) {
      const error = new Error("Already at highest level (Level 3)");
      error.statusCode = 400;
      throw error;
    }
    const error = new Error("You do not have permission to escalate this ticket");
    error.statusCode = 403;
    throw error;
  }

  const currentLevel = ticket.escalationLevel || 1;
  const nextLevel = currentLevel + 1;

  let newAssignee = null;
  if (nextLevel === 2) {
    newAssignee = await User.findOne({
      instituteId: ticket.instituteId,
      role: "institute_admin",
      isActive: true,
    }).lean();
  } else if (nextLevel === 3) {
    newAssignee = await User.findOne({
      role: "super_admin",
      isActive: true,
    }).lean();
  }

  ticket.escalationLevel = nextLevel;
  ticket.status = "Escalated";
  ticket.escalationHistory.push({
    from: ticket.assignedTo,
    to: newAssignee ? newAssignee._id : null,
    reason: reason.trim() || `Escalated to Level ${nextLevel}`,
    timestamp: new Date(),
    actor: user._id,
  });

  if (newAssignee) {
    ticket.assignedTo = newAssignee._id;
    ticket.assignedToSnapshot = {
      name: newAssignee.name,
      email: newAssignee.email,
      role: newAssignee.role,
    };
  }

  ticket.lastActivityAt = new Date();
  await ticket.save();

  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: `🚨 Escalated to Level ${nextLevel}. Reason: ${reason || "Not specified"}`,
    isInternal: true,
  });

  // Push & Email Notification to New Escalation Assignee
  if (newAssignee && String(newAssignee._id) !== String(user._id)) {
    createNotification({
      userId: newAssignee._id,
      title: `🚨 Ticket #${ticket.ticketNumber} Escalated (Level ${nextLevel})`,
      message: `${user.name} escalated ticket "${ticket.subject}". Reason: ${reason || "Immediate review required"}`,
      type: "ticket_escalated",
      severity: "critical",
      link: newAssignee.role === "super_admin" ? `/super-admin/support/${ticket._id}` : `/support/${ticket._id}`,
      ticketId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        escalationLevel: nextLevel,
        status: "Escalated",
      },
      sendEmail: true,
    });
  }

  return ticket;
};

/**
 * 7. Reply to Ticket
 */
export const replyToTicket = async (user, ticketId, payload) => {
  const { message, attachments = [], isInternal = false } = payload;

  if ((!message || !message.trim()) && (!attachments || attachments.length === 0)) {
    const error = new Error("Message content or attachment is required");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status === "Closed" || ticket.status === "Cancelled") {
    const error = new Error("This conversation is closed and cannot receive replies");
    error.statusCode = 400;
    throw error;
  }

  if (!canReplyToTicket(user, ticket)) {
    const error = new Error("You do not have permission to reply to this ticket");
    error.statusCode = 403;
    throw error;
  }

  const role = normalizeRole(user.role);
  const isStaff = isAdminRole(role) || role === "teacher";

  // Only staff can mark messages as internal notes
  const effectiveInternal = isStaff && Boolean(isInternal);

  const newMessage = await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name || "User",
      email: user.email || "",
      role: user.role || "student",
    },
    message: message ? message.trim() : "(Attachment)",
    attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
    isInternal: effectiveInternal,
    readBy: [{ userId: user._id, readAt: new Date() }],
  });

  const creatorId = String(ticket.createdBy?._id || ticket.createdBy);
  const isCreator = creatorId === String(user._id);

  // Update firstResponseAt if staff replies to non-staff creator
  if (!effectiveInternal && isStaff && !ticket.firstResponseAt) {
    if (!isCreator) {
      ticket.firstResponseAt = new Date();
    }
  }

  // Update status transitions on external replies
  if (!effectiveInternal) {
    if (isCreator && ticket.status === "Resolved") {
      ticket.status = "In Progress";
    } else if (!isCreator && ticket.status === "Open") {
      ticket.status = "In Progress";
    }
  }

  ticket.lastActivityAt = new Date();
  await ticket.save();

  // Push & Email Notifications for Replies (Non-Internal only)
  if (!effectiveInternal) {
    if (!isCreator) {
      // Staff replied -> Notify creator
      createNotification({
        userId: creatorId,
        title: `New Reply on Ticket #${ticket.ticketNumber}`,
        message: `${user.name || "Support Staff"} replied: "${msgPreview}"`,
        type: "ticket_reply",
        severity: "info",
        link: `/support/${ticket._id}`,
        ticketId: ticket._id,
        metadata: {
          ticketNumber: ticket.ticketNumber,
          category: ticket.category,
          status: ticket.status,
        },
        sendEmail: true,
      });
    } else if (ticket.assignedTo && String(ticket.assignedTo) !== String(user._id)) {
      // Creator replied -> Notify assigned staff/admin
      createNotification({
        userId: ticket.assignedTo,
        title: `Customer Replied: Ticket #${ticket.ticketNumber}`,
        message: `${user.name || "Customer"} replied: "${msgPreview}"`,
        type: "ticket_reply",
        severity: "info",
        link: ticket.assignedToSnapshot?.role === "super_admin" ? `/super-admin/support/${ticket._id}` : `/support/${ticket._id}`,
        ticketId: ticket._id,
        metadata: {
          ticketNumber: ticket.ticketNumber,
          category: ticket.category,
          status: ticket.status,
        },
        sendEmail: true,
      });
    }
  }

  return newMessage;
};

/**
 * 8. Close Ticket (Creator or Admin)
 */
export const closeTicket = async (user, ticketId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (!canCloseTicket(user, ticket)) {
    const error = new Error("You do not have permission to close this conversation");
    error.statusCode = 403;
    throw error;
  }

  ticket.status = "Closed";
  ticket.closedAt = new Date();
  ticket.lastActivityAt = new Date();
  await ticket.save();

  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderSnapshot: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: "✓ Conversation marked as resolved and closed.",
    isInternal: false,
  });

  // Push & Email Notification to Creator on Close
  if (String(ticket.createdBy) !== String(user._id)) {
    createNotification({
      userId: ticket.createdBy,
      title: `Ticket #${ticket.ticketNumber} Closed`,
      message: `Your conversation has been closed and resolved. Thank you for contacting EduHub Support.`,
      type: "ticket_status",
      severity: "success",
      link: `/support/${ticket._id}`,
      ticketId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        status: "Closed",
      },
      sendEmail: true,
    });
  }

  return ticket;
};

/**
 * 9. Rate Ticket (Creator only, once)
 */
export const rateTicket = async (user, ticketId, rating, comment = "") => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    const error = new Error("Support ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const isCreator = String(ticket.createdBy) === String(user._id);
  if (!isCreator) {
    const error = new Error("Only the creator of this conversation can provide a rating");
    error.statusCode = 403;
    throw error;
  }

  if (ticket.satisfactionRating !== null && ticket.satisfactionRating !== undefined) {
    const error = new Error("Already rated: You have already submitted a rating for this conversation");
    error.statusCode = 400;
    throw error;
  }

  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    const error = new Error("Rating must be an integer between 1 and 5");
    error.statusCode = 400;
    throw error;
  }

  ticket.satisfactionRating = numRating;
  ticket.satisfactionComment = comment ? comment.trim().slice(0, 500) : "";
  ticket.lastActivityAt = new Date();
  await ticket.save();

  return ticket;
};

/**
 * 10. Get KPI Stats (Role Scoped)
 */
export const getStats = async (user) => {
  const role = normalizeRole(user.role);
  const query = {};

  if (role === "super_admin") {
    // all
  } else if (role === "institute_admin") {
    query.instituteId = user.instituteId;
  } else if (role === "campus_admin") {
    query.campusId = user.campusId;
  } else if (role === "teacher") {
    query.$or = [
      { createdBy: user._id },
      { assignedTo: user._id },
    ];
  } else {
    query.createdBy = user._id;
  }

  const [
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    escalatedCount,
    allTickets,
  ] = await Promise.all([
    SupportTicket.countDocuments({ ...query, status: "Open" }),
    SupportTicket.countDocuments({ ...query, status: "In Progress" }),
    SupportTicket.countDocuments({ ...query, status: "Resolved" }),
    SupportTicket.countDocuments({ ...query, status: "Closed" }),
    SupportTicket.countDocuments({ ...query, status: "Escalated" }),
    SupportTicket.find({
      ...query,
      status: { $in: ["Open", "In Progress", "Escalated"] },
    })
      .select("createdAt priority status")
      .lean(),
  ]);

  const now = Date.now();
  let overdueCount = 0;
  allTickets.forEach((t) => {
    const slaLimit = SLA_HOURS[t.priority] || 24;
    const elapsedHours = (now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
    if (elapsedHours > slaLimit) overdueCount += 1;
  });

  // Calculate resolution averages for admins
  let avgResolutionHours = 0;
  let avgFirstResponseHours = 0;
  if (isAdminRole(role)) {
    const closedSample = await SupportTicket.find({
      ...query,
      status: "Closed",
      resolvedAt: { $exists: true, $ne: null },
    })
      .select("createdAt resolvedAt firstResponseAt")
      .limit(100)
      .lean();

    if (closedSample.length > 0) {
      let totalResTime = 0;
      let totalFirstResp = 0;
      let firstRespCount = 0;

      closedSample.forEach((s) => {
        totalResTime += (new Date(s.resolvedAt) - new Date(s.createdAt)) / (1000 * 60 * 60);
        if (s.firstResponseAt) {
          totalFirstResp += (new Date(s.firstResponseAt) - new Date(s.createdAt)) / (1000 * 60 * 60);
          firstRespCount += 1;
        }
      });

      avgResolutionHours = Math.round((totalResTime / closedSample.length) * 10) / 10;
      avgFirstResponseHours = firstRespCount > 0 ? Math.round((totalFirstResp / firstRespCount) * 10) / 10 : 0;
    }
  }

  return {
    badgeCount: openCount + inProgressCount,
    waiting: openCount,
    lookingAt: inProgressCount,
    answered: resolvedCount,
    done: closedCount,
    escalated: escalatedCount,
    overdue: overdueCount,
    avgResolutionHours,
    avgFirstResponseHours,
  };
};

/**
 * 11. Get Categories for Role
 */
export const getCategoriesForRole = (role) => {
  const normRole = normalizeRole(role);
  return CATEGORY_MAP.filter((cat) => cat.roles.includes(normRole));
};

/**
 * 12. Get Contacts (Who can this user message)
 */
export const getContacts = async (user) => {
  const role = normalizeRole(user.role);
  const query = { isActive: true, _id: { $ne: user._id } };

  if (role === "super_admin") {
    // all
  } else if (role === "institute_admin") {
    query.$or = [{ role: "super_admin" }, { instituteId: user.instituteId }];
  } else if (role === "campus_admin") {
    query.$or = [
      { role: "super_admin" },
      { role: "institute_admin", instituteId: user.instituteId },
      { campusId: user.campusId },
    ];
  } else if (role === "teacher") {
    query.$or = [
      { campusId: user.campusId, role: { $in: ["campus_admin", "campus_manager", "principal", "teacher"] } },
      { campusId: user.campusId, role: { $in: ["student", "parent"] } },
    ];
  } else {
    // student, parent
    query.$or = [
      { campusId: user.campusId, role: { $in: ["campus_admin", "campus_manager", "principal", "teacher"] } },
    ];
  }

  const contacts = await User.find(query)
    .select("name email role avatar department designation campusId")
    .limit(50)
    .lean();

  return contacts.filter((c) => canMessageUser(user, c));
};

/**
 * 13. Mark Message as Read
 */
export const markMessageRead = async (user, messageId) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    const error = new Error("Invalid message ID");
    error.statusCode = 400;
    throw error;
  }

  await SupportMessage.updateOne(
    { _id: messageId, "readBy.userId": { $ne: user._id } },
    { $push: { readBy: { userId: user._id, readAt: new Date() } } }
  );

  return { success: true };
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
  autoAssign,
  runAutoClose,
  markMessageRead,
};
