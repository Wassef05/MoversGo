const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { uploadMessageAttachments } = require('../config/multer');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} = require('../controllers/message.controller');

router.get('/', protect, getConversations);
router.post('/', protect, getOrCreateConversation);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, uploadMessageAttachments.array('attachments', 5), sendMessage);

module.exports = router;
