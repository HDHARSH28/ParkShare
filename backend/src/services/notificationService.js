import Notification from '../models/Notification.js';

/**
 * Dispatch a notification to a specific user
 */
export const createNotification = async ({ userId, title, message, type, link = '' }) => {
  try {
    if (!userId || !title || !message || !type) {
      console.warn('Incomplete notification payload:', { userId, title, message, type });
      return null;
    }

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
    });

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Get user's notifications with pagination and unread filter
 */
export const getMyNotifications = async (userId, query = {}) => {
  const { isRead, limit = 20, page = 1 } = query;
  const filter = { user: userId };

  if (isRead !== undefined && isRead !== '') {
    filter.isRead = isRead === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
  return { unreadCount };
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  return { success: true, message: 'All notifications marked as read' };
};
