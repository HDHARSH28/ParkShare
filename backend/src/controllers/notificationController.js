import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService.js';

export const getMy = async (req, res, next) => {
  try {
    const result = await getMyNotifications(req.user.id, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getUnread = async (req, res, next) => {
  try {
    const result = await getUnreadCount(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const markOne = async (req, res, next) => {
  try {
    const notification = await markAsRead(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};

export const markAll = async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};
