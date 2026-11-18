const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');

let notificationController;
try { notificationController = require('../controllers/notification.controller'); } catch { notificationController = {}; }

const ctrl = (name) => (req, res, next) => {
  if (notificationController[name]) return notificationController[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

router.get('/', protect, ctrl('getMyNotifications'));
router.patch('/read-all', protect, ctrl('markAllRead'));
router.patch('/:id/read', protect, ctrl('markAsRead'));
router.delete('/:id', protect, ctrl('deleteNotification'));

module.exports = router;

