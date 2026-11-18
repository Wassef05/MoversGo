const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // imported ONCE at top level
const catchAsync = require('../utils/catchAsync');
const {
  success,
  created,
  paginated,
  notFound,
  badRequest,
  forbidden,
  buildPagination,
} = require('../utils/apiResponse');
const { createNotification } = require('../services/notification.service');

/**
 * GET /api/v1/conversations
 * List all conversations where current user is a participant (or all conversations for admin)
 */
const getConversations = catchAsync(async (req, res) => {
  const query = req.user.role === 'admin'
    ? (req.query.mine === 'true' ? { participants: req.user._id } : {})
    : { participants: req.user._id };

  const conversations = await Conversation.find(query)
    .populate('participants', 'firstName lastName profileImage role company email phone')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'firstName lastName profileImage role' },
    })
    .populate({
      path: 'booking',
      select: 'scheduledDate totalAmount serviceStatus bookingStatus',
    })
    .sort({ lastMessageAt: -1 });

  return success(res, { conversations }, 'Conversations récupérées');
});

/**
 * POST /api/v1/conversations
 * Find existing conversation or create a new one between current user and recipient
 */
const getOrCreateConversation = catchAsync(async (req, res) => {
  const { participantId, bookingId } = req.body;

  if (!participantId) {
    return badRequest(res, "L'identifiant du destinataire (participantId) est obligatoire.");
  }

  if (participantId.toString() === req.user._id.toString()) {
    return badRequest(res, 'Impossible de créer une conversation avec vous-même.');
  }

  const recipient = await User.findById(participantId);
  if (!recipient) {
    return notFound(res, 'Destinataire introuvable.');
  }

  // Check if conversation already exists between these 2 users
  const query = {
    participants: { $all: [req.user._id, participantId], $size: 2 },
  };
  if (bookingId) {
    query.booking = bookingId;
  }

  let conversation = await Conversation.findOne(query)
    .populate('participants', 'firstName lastName profileImage role company')
    .populate('lastMessage')
    .populate('booking');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      booking: bookingId || null,
      lastMessageAt: new Date(),
      unreadCount: new Map([[participantId.toString(), 0], [req.user._id.toString(), 0]]),
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName profileImage role company')
      .populate('booking');

    return created(res, { conversation }, 'Nouvelle conversation créée');
  }

  return success(res, { conversation }, 'Conversation existante récupérée');
});

/**
 * GET /api/v1/conversations/:id/messages
 * Retrieve messages in conversation and mark incoming messages as read
 */
const getMessages = catchAsync(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    return notFound(res, 'Conversation introuvable');
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );

  if (!isParticipant && req.user.role !== 'admin') {
    return forbidden(res, 'Accès non autorisé à cette conversation.');
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));

  // Mark all unread messages for this user in this conversation as read
  await Message.updateMany(
    {
      conversation: conversation._id,
      receiver: req.user._id,
      isRead: false,
    },
    {
      $set: { isRead: true, readAt: new Date() },
    }
  );

  // Reset unread count for current user
  if (conversation.unreadCount) {
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();
  }

  const total = await Message.countDocuments({ conversation: conversation._id });
  const messages = await Message.find({ conversation: conversation._id })
    .populate('sender', 'firstName lastName profileImage role')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, messages, pagination, 'Messages de la conversation');
});

/**
 * POST /api/v1/conversations/:id/messages
 * Send a message in a conversation with real-time Socket.IO dispatch
 */
const sendMessage = catchAsync(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    return notFound(res, 'Conversation introuvable');
  }

  let isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );

  // If admin sends a message, automatically join conversation as participant
  if (!isParticipant && req.user.role === 'admin') {
    conversation.participants.push(req.user._id);
    await conversation.save();
    isParticipant = true;
  }

  if (!isParticipant) {
    return forbidden(res, 'Vous ne faites pas partie de cette conversation.');
  }

  const receiverId = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );

  if (!receiverId) {
    return badRequest(res, 'Destinataire introuvable dans cette conversation.');
  }

  // ── Block check ── sender or receiver may have blocked the other
  // User is already imported at top of file — no re-declaration needed
  const [senderUser, receiverUserBlock] = await Promise.all([
    User.findById(req.user._id).select('blockedUsers'),
    User.findById(receiverId).select('blockedUsers'),
  ]);

  const senderHasBlocked = senderUser?.blockedUsers?.some(
    (u) => u.toString() === receiverId.toString()
  );
  const receiverHasBlocked = receiverUserBlock?.blockedUsers?.some(
    (u) => u.toString() === req.user._id.toString()
  );

  if (senderHasBlocked) {
    return badRequest(res, 'Vous avez bloqué cet utilisateur. Débloquez-le pour reprendre la conversation.');
  }
  if (receiverHasBlocked) {
    return forbidden(res, 'Vous ne pouvez pas envoyer de message à cet utilisateur.');
  }

  const { content } = req.body;

  let attachments = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    attachments = req.files.map((file) => ({
      filePath: file.path.replace(/\\/g, '/'),
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));
  }

  if ((!content || content.trim().length === 0) && attachments.length === 0) {
    return badRequest(res, 'Le contenu du message ou une pièce jointe est obligatoire.');
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    receiver: receiverId,
    content: content ? content.trim() : '',
    attachments,
  });

  // Update conversation lastMessage and receiver's unreadCount
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();

  if (!conversation.unreadCount) {
    conversation.unreadCount = new Map();
  }
  const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
  conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
  await conversation.save();

  // Populate sender for display
  await message.populate('sender', 'firstName lastName profileImage role');

  // Real-time Socket.IO emission
  const io = req.app.get('io');
  if (io) {
    io.to(`conversation:${conversation._id}`).emit('message:new', message);
    io.to(`user:${receiverId.toString()}`).emit('message:received', message);
  }

  // Create notification for receiver — link is role-aware
  const receiverFull = await User.findById(receiverId).select('role');
  const receiverRole = receiverFull?.role || 'client';
  const msgLink = receiverRole === 'company'
    ? `/company/messages/${conversation._id}`
    : `/client/messages/${conversation._id}`;

  const preview = content
    ? content.length > 80
      ? `${content.substring(0, 77)}...`
      : content
    : 'Vous a envoyé une pièce jointe';

  await createNotification({
    recipientId: receiverId,
    title: `Nouveau message de ${req.user.firstName}`,
    message: preview,
    type: 'new_message',
    entityType: 'message',
    entityId: message._id,
    link: msgLink,
    io,
  });

  return created(res, { message }, 'Message envoyé');
});

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
};
