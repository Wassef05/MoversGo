const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * Also emits real-time event via Socket.IO if available
 */
const createNotification = async ({
  recipientId,
  title,
  message,
  type,
  entityType = null,
  entityId = null,
  link = null,
  io = null,
  meta = null,   // extra data forwarded to the client (e.g. { bookingId, amount })
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      relatedEntity: entityType
        ? {
            entityType,
            entityId,
            link,
          }
        : undefined,
    });

    // Emit real-time event if Socket.IO is available
    if (io) {
      const targetRoom = `user:${String(recipientId)}`;
      const unreadCount = await getUnreadCount(recipientId);
      io.to(targetRoom).emit('notification:new', {
        notification,
        unreadCount,
        meta: meta || null,
      });

      // Also emit a focused booking update event so booking pages reload immediately
      if (entityType === 'booking' && entityId) {
        io.to(targetRoom).emit('booking:updated', {
          bookingId: String(entityId),
          type,
          meta: meta || null,
        });
      }

      // Also emit a focused quote event so client dashboards and quote pages reload immediately
      if ((entityType === 'quote' || type === 'new_quote') && entityId) {
        io.to(targetRoom).emit('quote:new', {
          quoteId: String(entityId),
          type,
          meta: meta || null,
        });
      }
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Mark all notifications as read for a user
 */
const markAllRead = async (userId) => {
  return Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = {
  createNotification,
  getUnreadCount,
  markAllRead,
};

