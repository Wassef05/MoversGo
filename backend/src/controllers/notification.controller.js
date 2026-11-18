const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const {
  success,
  notFound,
  forbidden,
  buildPagination,
} = require('../utils/apiResponse');

/**
 * GET /api/v1/notifications
 * Get authenticated user's notifications, latest first, with unreadCount
 */
const getMyNotifications = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { isRead } = req.query;

  const filter = { recipient: req.user._id };
  if (isRead !== undefined && isRead !== '') {
    filter.isRead = isRead === 'true' || isRead === true;
  }

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  const pagination = buildPagination(page, limit, total);
  return res.status(200).json({
    success: true,
    message: 'Notifications récupérées',
    data: {
      notifications,
      unreadCount,
    },
    pagination,
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark single notification as read
 */
const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return notFound(res, 'Notification introuvable');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Accès non autorisé à cette notification.');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return success(res, { notification, unreadCount }, 'Notification marquée comme lue');
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications for current user as read
 */
const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return success(res, { unreadCount: 0 }, 'Toutes les notifications ont été marquées comme lues');
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a specific notification belonging to current user
 */
const deleteNotification = catchAsync(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return notFound(res, 'Notification introuvable');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Accès non autorisé à cette notification.');
  }

  await notification.deleteOne();

  return success(res, { id: req.params.id }, 'Notification supprimée avec succès');
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
};
