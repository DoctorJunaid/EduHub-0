import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendNotificationEmail } from "../utils/emailService.js";
import { getTicketNotificationTemplate } from "../utils/emailTemplates.js";

/**
 * 1. Create a single in-app notification and optionally dispatch email
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  severity = "info",
  link = "",
  ticketId = null,
  metadata = {},
  sendEmail = true,
  emailDetails = null,
}) => {
  try {
    if (!userId || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
      severity,
      link: link.trim(),
      ticketId,
      metadata,
    });

    // Fire & forget email dispatch
    if (sendEmail) {
      (async () => {
        try {
          const user = await User.findById(userId).select("name email role").lean();
          if (user && user.email) {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const fullActionUrl = link ? (link.startsWith("http") ? link : `${frontendUrl}${link}`) : "";
            
            const html = getTicketNotificationTemplate({
              badgeText: type.replace(/_/g, " ").toUpperCase(),
              title,
              greeting: `Hello ${user.name || "there"},`,
              mainText: message,
              details: emailDetails || (metadata?.ticketNumber ? [
                { label: "Ticket #", value: metadata.ticketNumber },
                { label: "Status", value: metadata.status || "Updated" },
                { label: "Category", value: metadata.category || "General Support" },
              ] : []),
              actionUrl: fullActionUrl,
              actionText: "Open in EduHub Portal",
            });

            await sendNotificationEmail({
              to: user.email,
              subject: `[EduHub Support] ${title}`,
              html,
              text: `${title}\n\n${message}\n\nLink: ${fullActionUrl}`,
            });
          }
        } catch (mailErr) {
          console.warn("[NOTIFICATION SERVICE] Email notification warning:", mailErr.message);
        }
      })();
    }

    return notification;
  } catch (err) {
    console.error("[NOTIFICATION SERVICE] Failed to create notification:", err);
    return null;
  }
};

/**
 * 2. Get user notifications with unread count
 */
export const getUserNotifications = async (userId, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(options.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = { userId };
  if (options.unreadOnly === "true" || options.unreadOnly === true) {
    query.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    pageCount: Math.ceil(total / limit) || 1,
  };
};

/**
 * 3. Mark single notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    const error = new Error("Invalid notification ID");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true, readAt: new Date() } },
    { returnDocument: "after" }
  ).lean();

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  return { notification, unreadCount };
};

/**
 * 4. Mark all user notifications as read
 */
export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return { success: true, unreadCount: 0 };
};

/**
 * 5. Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!result) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  return { success: true, unreadCount };
};

/**
 * 6. Broadcast notification to targeted audience
 */
export const broadcastToAudience = async ({
  title,
  message,
  severity = "info",
  audience = "all",
  instituteId = null,
  link = "",
}) => {
  try {
    const userQuery = { isActive: true };

    if (instituteId) {
      userQuery.instituteId = instituteId;
    }

    if (audience === "teachers") {
      userQuery.role = { $in: ["teacher", "faculty"] };
    } else if (audience === "students") {
      userQuery.role = "student";
    } else if (audience === "admins") {
      userQuery.role = { $in: ["institute_admin", "campus_admin", "super_admin"] };
    } else if (audience === "institute_admin") {
      userQuery.role = "institute_admin";
    }

    const targetUsers = await User.find(userQuery).select("_id").lean();
    if (!targetUsers.length) return 0;

    const docs = targetUsers.map((u) => ({
      userId: u._id,
      title: title.trim(),
      message: message.trim(),
      type: "broadcast",
      severity,
      link: link || "/super-admin/broadcasts",
    }));

    await Notification.insertMany(docs);
    return targetUsers.length;
  } catch (err) {
    console.error("[NOTIFICATION SERVICE] broadcastToAudience error:", err);
    return 0;
  }
};

export default {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastToAudience,
};
