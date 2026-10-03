import * as notificationService from "../services/notification.service.js";

/**
 * GET /api/v1/notifications
 * Get authenticated user's notifications + unread count
 */
export const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: result.notifications,
      unreadCount: result.unreadCount,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pageCount: result.pageCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/:id/read
 * Mark single notification as read
 */
export const markRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: result.notification,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/read-all
 * Mark all user notifications as read
 */
export const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: "Notification deleted.",
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notifications/test
 * Send a sample notification for testing
 */
export const sendTestNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification({
      userId: req.user._id,
      title: req.body.title || "Test Notification Alert",
      message: req.body.message || "This is a real-time push and email verification notification from EduHub.",
      type: req.body.type || "system",
      severity: req.body.severity || "info",
      link: req.body.link || "/super-admin/support",
      sendEmail: req.body.sendEmail !== false,
    });

    res.status(201).json({
      success: true,
      message: "Test notification dispatched.",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
