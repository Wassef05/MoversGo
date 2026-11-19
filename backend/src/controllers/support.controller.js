const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
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
const { sendTicketReplyNotification } = require('../services/email.service');

/**
 * Automatically delete closed tickets that have passed their 4-day retention period.
 */
const cleanupExpiredTickets = async () => {
  try {
    const now = new Date();
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const result = await SupportTicket.deleteMany({
      status: 'closed',
      $or: [
        { autoDeleteAt: { $lte: now } },
        { closedAt: { $lte: fourDaysAgo } },
        { isArchived: true, archivedAt: { $lte: fourDaysAgo } },
      ],
    });
    if (result.deletedCount > 0) {
      console.log(`🧹 [Archivage Support] ${result.deletedCount} ticket(s) fermé(s) depuis 4 jours supprimé(s) définitivement.`);
    }
    return result.deletedCount;
  } catch (err) {
    console.error('Erreur nettoyage tickets expirés:', err.message);
    return 0;
  }
};

/**
 * POST /api/v1/support
 * Authenticated user creates a support ticket
 */
const createTicket = catchAsync(async (req, res) => {
  const { subject, description, category, priority, relatedBooking } = req.body;

  if (!subject || subject.trim().length === 0) {
    return badRequest(res, 'Le sujet du ticket est obligatoire.');
  }

  if (!description || description.trim().length === 0) {
    return badRequest(res, 'La description du problème est obligatoire.');
  }

  const ticket = await SupportTicket.create({
    user: req.user._id,
    subject: subject.trim(),
    description: description.trim(),
    category: category || 'other',
    priority: priority || 'medium',
    relatedBooking: relatedBooking || null,
    status: 'open',
    messages: [
      {
        sender: req.user._id,
        content: description.trim(),
        isAdminMessage: req.user.role === 'admin',
        sentAt: new Date(),
      },
    ],
  });

  // Notify admins in real-time
  const io = req.app.get('io');
  const admins = await User.find({ role: 'admin' }).select('_id');
  const roleLabel = req.user.role === 'company' ? '🚚 Déménageur' : '👤 Client';
  for (const admin of admins) {
    await createNotification({
      recipientId: admin._id,
      title: 'Nouveau ticket de support 🎫',
      message: `${roleLabel} (${req.user.firstName}): ${subject.trim()}`,
      type: 'system',
      entityType: 'user',
      entityId: ticket._id,
      link: `/admin/support?tab=${category === 'dispute' ? 'disputes' : 'tickets'}`,
      io,
    });
  }

  return created(res, { ticket }, 'Ticket de support créé avec succès. Notre équipe vous répondra bientôt.');
});

/**
 * GET /api/v1/support/my
 * User views their submitted support tickets
 */
const getMyTickets = catchAsync(async (req, res) => {
  // Purge any closed tickets past the 4-day retention limit
  await cleanupExpiredTickets();

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status, priority, category, isArchived } = req.query;

  const filter = { user: req.user._id };
  if (status) {
    if (status === 'archived') {
      filter.$or = [{ status: 'closed' }, { isArchived: true }];
    } else {
      filter.status = status;
    }
  }
  if (isArchived === 'true') filter.isArchived = true;
  if (isArchived === 'false') filter.isArchived = { $ne: true };
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const total = await SupportTicket.countDocuments(filter);
  const tickets = await SupportTicket.find(filter)
    .populate('assignedAdmin', 'firstName lastName')
    .populate('relatedBooking', 'scheduledDate totalAmount serviceStatus')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, tickets, pagination, 'Vos tickets de support');
});

/**
 * GET /api/v1/support/:id
 * Retrieve a single ticket with full message thread (owner or admin)
 */
const getTicketById = catchAsync(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'firstName lastName email phone role profileImage')
    .populate('assignedAdmin', 'firstName lastName email')
    .populate('messages.sender', 'firstName lastName profileImage role')
    .populate('relatedBooking');

  if (!ticket) {
    return notFound(res, 'Ticket introuvable');
  }

  // Access check
  if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Accès non autorisé à ce ticket.');
  }

  return success(res, { ticket }, 'Détails du ticket');
});

/**
 * POST /api/v1/support/:id/messages
 * Owner or admin adds a message to the ticket thread
 */
const addMessage = catchAsync(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return notFound(res, 'Ticket introuvable');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = ticket.user.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return forbidden(res, 'Vous ne pouvez pas ajouter de message à ce ticket.');
  }

  // Prevent sending messages to closed/archived tickets scheduled for deletion
  if (ticket.status === 'closed' || ticket.isArchived) {
    return badRequest(
      res,
      'Ce ticket est fermé et archivé. Aucun nouveau message ne peut y être ajouté car il est programmé pour une suppression définitive sous 4 jours.'
    );
  }

  const { content, attachments } = req.body;
  if (!content || content.trim().length === 0) {
    return badRequest(res, 'Le contenu du message est obligatoire.');
  }

  const newMessage = {
    sender: req.user._id,
    content: content.trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
    isAdminMessage: isAdmin,
    sentAt: new Date(),
  };

  ticket.messages.push(newMessage);

  // Status transitions
  if (isAdmin) {
    ticket.status = 'waiting_response';
    if (!ticket.assignedAdmin) {
      ticket.assignedAdmin = req.user._id;
    }
  } else {
    if (ticket.status === 'waiting_response' || ticket.status === 'resolved') {
      ticket.status = 'in_progress';
    }
  }

  await ticket.save();

  // Real-time notifications
  const io = req.app.get('io');
  if (isAdmin) {
    const ticketOwner = await User.findById(ticket.user).select('role firstName lastName email');
    const userRole = ticketOwner?.role || 'client';
    const userLink = userRole === 'company' ? '/company/support' : '/client/support';

    // Notify user in real-time
    await createNotification({
      recipientId: ticket.user,
      title: 'Réponse à votre ticket 💬',
      message: `Le support MoversGo a répondu à votre demande: "${ticket.subject}".`,
      type: 'system',
      entityType: 'user',
      entityId: ticket._id,
      link: userLink,
      io,
    });

    // Send email notification to user
    try {
      if (ticketOwner?.email) {
        await sendTicketReplyNotification({
          userEmail: ticketOwner.email,
          userName: `${ticketOwner.firstName || ''} ${ticketOwner.lastName || ''}`.trim() || (userRole === 'company' ? 'Partenaire' : 'Client'),
          ticketSubject: ticket.subject,
          replyMessage: content.trim(),
        });
      }
    } catch (emailErr) {
      console.warn('Could not send ticket reply email notification:', emailErr.message);
    }
  } else {
    // Notify admins that the user/company replied
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        title: 'Nouveau message sur ticket support 📩',
        message: `${req.user.firstName} (${req.user.role === 'company' ? 'Déménageur' : 'Client'}): Réponse sur "${ticket.subject}".`,
        type: 'system',
        entityType: 'user',
        entityId: ticket._id,
        link: `/admin/support?tab=${ticket.category === 'dispute' ? 'disputes' : 'tickets'}`,
        io,
      });
    }
  }

  await ticket.populate('messages.sender', 'firstName lastName profileImage role');
  const addedMsg = ticket.messages[ticket.messages.length - 1];

  return created(res, { ticket, message: addedMsg }, 'Message ajouté avec succès');
});

/**
 * GET /api/v1/admin/support
 * Admin views all support tickets with filters
 */
const getAllTickets = catchAsync(async (req, res) => {
  // Purge any closed tickets past the 4-day retention limit
  await cleanupExpiredTickets();

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status, priority, category, search, isArchived } = req.query;

  const filter = {};
  if (status) {
    if (status === 'archived') {
      filter.$or = [{ status: 'closed' }, { isArchived: true }];
    } else {
      filter.status = status;
    }
  }
  if (isArchived === 'true') filter.isArchived = true;
  if (isArchived === 'false') filter.isArchived = { $ne: true };
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { subject: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  const total = await SupportTicket.countDocuments(filter);
  const tickets = await SupportTicket.find(filter)
    .populate('user', 'firstName lastName email phone role')
    .populate('assignedAdmin', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, tickets, pagination, 'Tous les tickets de support');
});

/**
 * PATCH /api/v1/admin/support/:id/status
 * Admin updates ticket status or assigns admin
 */
const updateTicketStatus = catchAsync(async (req, res) => {
  const { status, priority, assignedAdmin } = req.body;

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return notFound(res, 'Ticket introuvable');
  }

  const allowedStatuses = ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'];
  if (status) {
    if (!allowedStatuses.includes(status)) {
      return badRequest(
        res,
        `Statut invalide. Valeurs autorisées: ${allowedStatuses.join(', ')}`
      );
    }
    ticket.status = status;
    if (status === 'resolved') ticket.resolvedAt = new Date();
    if (status === 'closed') {
      ticket.closedAt = new Date();
      ticket.isArchived = true;
      ticket.archivedAt = new Date();
      // Set automatic permanent deletion in 4 days
      ticket.autoDeleteAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    } else {
      ticket.isArchived = false;
      ticket.archivedAt = null;
      ticket.autoDeleteAt = null;
    }
  }

  if (priority) {
    const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
    if (allowedPriorities.includes(priority)) {
      ticket.priority = priority;
    }
  }

  if (assignedAdmin) {
    ticket.assignedAdmin = assignedAdmin;
  }

  await ticket.save();

  // Notify ticket owner
  const io = req.app.get('io');
  const ticketOwner = await User.findById(ticket.user).select('role firstName lastName email');
  const userRole = ticketOwner?.role || 'client';
  const userLink = userRole === 'company' ? '/company/support' : '/client/support';

  let notifTitle = `Ticket ${status ? `mis à jour (${status})` : 'mis à jour'} 🎫`;
  let notifMessage = `Le statut de votre demande de support "${ticket.subject}" est désormais: ${ticket.status}.`;
  if (status === 'closed') {
    notifTitle = 'Ticket clôturé & archivé 📦';
    notifMessage = `Votre ticket "${ticket.subject}" a été fermé et archivé. Il sera définitivement supprimé dans 4 jours.`;
  }

  await createNotification({
    recipientId: ticket.user,
    title: notifTitle,
    message: notifMessage,
    type: 'system',
    entityType: 'user',
    entityId: ticket._id,
    link: userLink,
    io,
  });

  return success(res, { ticket }, status === 'closed' ? 'Ticket fermé et archivé (suppression dans 4 jours)' : 'Ticket mis à jour avec succès');
});

/**
 * PATCH /api/v1/support/:id/close
 * Owner or Admin closes and archives a ticket, scheduling permanent deletion in 4 days
 */
const closeTicket = catchAsync(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return notFound(res, 'Ticket introuvable');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = ticket.user.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return forbidden(res, 'Vous ne disposez pas des autorisations nécessaires pour fermer ce ticket.');
  }

  ticket.status = 'closed';
  ticket.isArchived = true;
  ticket.closedAt = new Date();
  ticket.archivedAt = new Date();
  ticket.autoDeleteAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // 4 days

  await ticket.save();

  const io = req.app.get('io');
  if (isOwner) {
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        title: "Ticket fermé par l'utilisateur 📦",
        message: `${req.user.firstName} (${req.user.role === 'company' ? 'Déménageur' : 'Client'}) a fermé le ticket "${ticket.subject}". Archivé (suppression sous 4 jours).`,
        type: 'system',
        entityType: 'user',
        entityId: ticket._id,
        link: `/admin/support?tab=${ticket.category === 'dispute' ? 'disputes' : 'tickets'}`,
        io,
      });
    }
  } else {
    const ticketOwner = await User.findById(ticket.user).select('role firstName lastName email');
    const userRole = ticketOwner?.role || 'client';
    const userLink = userRole === 'company' ? '/company/support' : '/client/support';

    await createNotification({
      recipientId: ticket.user,
      title: 'Ticket clôturé & archivé 📦',
      message: `Votre ticket "${ticket.subject}" a été fermé et archivé. Il sera définitivement supprimé dans 4 jours.`,
      type: 'system',
      entityType: 'user',
      entityId: ticket._id,
      link: userLink,
      io,
    });
  }

  return success(
    res,
    { ticket },
    'Ticket clôturé et archivé avec succès. Suppression définitive automatique dans 4 jours.'
  );
});

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
  getAllTickets,
  updateTicketStatus,
  closeTicket,
  cleanupExpiredTickets,
};
