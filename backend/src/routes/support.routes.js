const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

let supportController;
try { supportController = require('../controllers/support.controller'); } catch { supportController = {}; }

const ctrl = (name) => (req, res, next) => {
  if (supportController[name]) return supportController[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

router.post('/', protect, ctrl('createTicket'));
router.get('/my', protect, ctrl('getMyTickets'));
router.get('/:id', protect, ctrl('getTicketById'));
router.post('/:id/messages', protect, ctrl('addMessage'));

// Admin
router.get('/', protect, authorize('admin'), ctrl('getAllTickets'));
router.patch('/:id/status', protect, authorize('admin'), ctrl('updateTicketStatus'));

module.exports = router;

