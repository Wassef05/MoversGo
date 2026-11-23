const Booking = require('../models/Booking');
const Company = require('../models/Company');
const MovingRequest = require('../models/MovingRequest');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const catchAsync = require('../utils/catchAsync');
const {
  success,
  paginated,
  notFound,
  badRequest,
  forbidden,
  buildPagination,
} = require('../utils/apiResponse');
const { createNotification } = require('../services/notification.service');
const { calculateCommission } = require('../utils/commission.util');

const DEPOSIT_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE) || 0.02;

/**
 * GET /api/v1/bookings/my
 * Client views their bookings
 */
const getMyBookings = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { bookingStatus, serviceStatus } = req.query;

  const filter = { client: req.user._id };
  if (bookingStatus) filter.bookingStatus = bookingStatus;
  if (serviceStatus) filter.serviceStatus = serviceStatus;

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate('client', 'firstName lastName email phone address')
    .populate('company', 'companyName logo averageRating phone address email user')
    .populate('movingRequest', 'departureAddress arrivalAddress preferredDate status title comments')
    .populate('quote')
    .sort({ scheduledDate: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, bookings, pagination, 'Vos réservations de déménagement');
});

/**
 * GET /api/v1/bookings/company
 * Company views their bookings
 */
const getCompanyBookings = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { bookingStatus, serviceStatus } = req.query;

  const filter = { company: company._id };
  if (bookingStatus) filter.bookingStatus = bookingStatus;
  if (serviceStatus) filter.serviceStatus = serviceStatus;

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate('client', 'firstName lastName phone email profileImage')
    .populate('company', 'companyName logo averageRating phone address email user')
    .populate('movingRequest', 'departureAddress arrivalAddress preferredDate status title comments')
    .populate('quote')
    .sort({ scheduledDate: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, bookings, pagination, 'Réservations de votre entreprise');
});

/**
 * GET /api/v1/bookings/:id
 * Retrieve single booking with full populated details and permission check
 */
const getBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('client', 'firstName lastName email phone profileImage address')
    .populate('company', 'companyName logo averageRating phone email address user')
    .populate('movingRequest')
    .populate('quote');

  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  // Permission check
  if (req.user.role === 'client') {
    if (booking.client._id.toString() !== req.user._id.toString()) {
      return forbidden(res, 'Accès non autorisé à cette réservation.');
    }
  } else if (req.user.role === 'company') {
    const company = req.company || (await Company.findOne({ user: req.user._id }));
    if (!company || booking.company._id.toString() !== company._id.toString()) {
      return forbidden(res, 'Accès non autorisé à cette réservation.');
    }
  }

  return success(res, { booking }, 'Détails de la réservation récupérés');
});

/**
 * PATCH /api/v1/bookings/:id/status
 * Company updates serviceStatus (preparation -> in_progress -> completed)
 */
const updateServiceStatus = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  if (booking.company.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez modifier que les réservations de votre entreprise.');
  }

  const { serviceStatus, note } = req.body;
  const allowedStatuses = ['preparation', 'in_progress', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(serviceStatus)) {
    return badRequest(
      res,
      `Statut de service invalide. Valeurs autorisées: ${allowedStatuses.join(', ')}`
    );
  }

  booking.serviceStatus = serviceStatus;

  // Update tracking steps
  const now = new Date();
  if (serviceStatus === 'in_progress') {
    booking.trackingSteps.forEach((s) => {
      if (s.step.includes('en cours') || s.step.includes('Préparation')) {
        s.isDone = true;
        s.completedAt = now;
      }
    });
    // Sync moving request status
    await MovingRequest.findByIdAndUpdate(booking.movingRequest, { status: 'in_progress' });

    // Auto-generate or prepare official signed invoice for driver pre-departure
    try {
      await getOrCreateInvoice(booking._id);
    } catch (invErr) {
      console.warn('Invoice pre-generation warning:', invErr.message);
    }
  } else if (serviceStatus === 'completed') {
    booking.trackingSteps.forEach((s) => {
      s.isDone = true;
      if (!s.completedAt) s.completedAt = now;
    });

    // Increment completedMoves counter on Company
    await Company.findByIdAndUpdate(booking.company, { $inc: { completedMoves: 1 } });

    // Enable review for client
    booking.hasReview = false;

    // Sync moving request status
    await MovingRequest.findByIdAndUpdate(booking.movingRequest, { status: 'completed' });
  }

  if (note) {
    booking.companyNotes = note;
  }

  await booking.save();

  // Notify client of status change
  const io = req.app.get('io');
  let title = 'Mise à jour de votre déménagement 🚚';
  let message = `Votre déménagement est passé en statut: ${serviceStatus}.`;

  if (serviceStatus === 'completed') {
    title = 'Déménagement terminé ! 🎉';
    message = `Votre déménagement avec ${company.companyName} est marqué comme terminé. Partagez votre expérience en laissant un avis !`;
  } else if (serviceStatus === 'in_progress') {
    title = 'Déménagement en cours & Facture émise 🚛📄';
    message = `L'équipe de ${company.companyName} est en route ! Votre facture officielle avec le reste TTC à régler sur place est disponible.`;
  }

  await createNotification({
    recipientId: booking.client,
    title,
    message,
    type: serviceStatus === 'completed' ? 'moving_reminder' : 'system',
    entityType: 'booking',
    entityId: booking._id,
    link: `/client/bookings/${booking._id}`,
    io,
  });

  if (io && company.user) {
    io.to(`user:${String(company.user)}`).emit('booking:updated', {
      bookingId: String(booking._id),
      serviceStatus,
      type: 'service_status_updated',
    });
  }

  return success(res, { booking }, `Statut du service mis à jour: ${serviceStatus}`);
});

/**
 * POST /api/v1/bookings/:id/cancel
 * Client or Company cancels a booking
 */
const cancelBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  let isClient = false;
  let isCompany = false;

  if (req.user.role === 'client' && booking.client.toString() === req.user._id.toString()) {
    isClient = true;
  } else if (req.user.role === 'company') {
    const company = req.company || (await Company.findOne({ user: req.user._id }));
    if (company && booking.company.toString() === company._id.toString()) {
      isCompany = true;
    }
  } else if (req.user.role === 'admin') {
    isClient = true; // Admin bypass
  }

  if (!isClient && !isCompany) {
    return forbidden(res, 'Vous n\'êtes pas autorisé à annuler cette réservation.');
  }

  if (booking.bookingStatus === 'cancelled') {
    return badRequest(res, 'Cette réservation est déjà annulée.');
  }

  if (booking.serviceStatus === 'completed') {
    return badRequest(res, 'Impossible d\'annuler un déménagement déjà terminé.');
  }

  const { cancellationReason } = req.body;
  booking.bookingStatus = 'cancelled';
  booking.serviceStatus = 'cancelled';
  booking.cancellationReason = cancellationReason || 'Annulé par l\'utilisateur.';
  booking.cancelledBy = req.user._id;
  booking.cancelledAt = new Date();
  await booking.save();

  // Also set request status to cancelled
  await MovingRequest.findByIdAndUpdate(booking.movingRequest, { status: 'cancelled' });

  // Notifications
  const io = req.app.get('io');
  const companyDoc = await Company.findById(booking.company);

  if (isClient) {
    // Notify company
    if (companyDoc?.user) {
      await createNotification({
        recipientId: companyDoc.user,
        title: 'Réservation annulée ❌',
        message: `Le client a annulé la réservation #${booking._id}. Motif: ${booking.cancellationReason}`,
        type: 'booking_cancelled',
        entityType: 'booking',
        entityId: booking._id,
        link: `/company/bookings/${booking._id}`,
        io,
      });
    }
  } else {
    // Notify client
    await createNotification({
      recipientId: booking.client,
      title: 'Réservation annulée ❌',
      message: `L'entreprise a annulé la réservation #${booking._id}. Motif: ${booking.cancellationReason}`,
      type: 'booking_cancelled',
      entityType: 'booking',
      entityId: booking._id,
      link: `/client/bookings/${booking._id}`,
      io,
    });
  }

  return success(res, { booking }, 'Réservation annulée avec succès');
});

/**
 * GET /api/v1/admin/bookings
 * Admin view of all bookings
 */
const getAllBookings = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { bookingStatus, serviceStatus } = req.query;

  const filter = {};
  if (bookingStatus) filter.bookingStatus = bookingStatus;
  if (serviceStatus) filter.serviceStatus = serviceStatus;

  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate('client', 'firstName lastName email phone')
    .populate('company', 'companyName phone logo')
    .populate('movingRequest', 'departureAddress arrivalAddress preferredDate title')
    .populate('quote')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, bookings, pagination, 'Toutes les réservations');
});

/**
 * POST /api/v1/bookings/:id/request-payment
 * Company confirms pickup / takes charge and sends signal to client to pay the deposit (virement/carte or espece)
 */
const requestDepositPayment = catchAsync(async (req, res) => {
  const company = await Company.findOne({ user: req.user._id });
  if (!company) {
    return forbidden(res, 'Seule une entreprise validée peut effectuer cette action.');
  }

  const booking = await Booking.findById(req.params.id)
    .populate('client', 'firstName lastName email phone')
    .populate('company', 'companyName phone logo user')
    .populate('movingRequest')
    .populate('quote');

  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  if (booking.company._id.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez pas gérer une réservation assignée à un autre déménageur.');
  }

  const { paymentMode = 'virement' } = req.body;
  const isCash = paymentMode === 'espece';

  booking.paymentRequested = true;
  booking.paymentRequestedAt = new Date();
  booking.requestedPaymentMode = isCash ? 'espece' : 'virement';
  await booking.save();

  const io = req.app.get('io');
  const clientId = booking.client?._id || booking.client;

  // Real-time notification to client
  await createNotification({
    recipientId: clientId,
    title: isCash
      ? "Prise en charge confirmée — Acompte en espèces 💵"
      : "Prise en charge confirmée — Règlement de l'acompte requis 💳",
    message: isCash
      ? `${company.companyName} a confirmé la prise en charge. Le règlement de l'acompte de ${booking.depositAmount} TND s'effectuera en espèces le jour J.`
      : `${company.companyName} a confirmé la prise en charge. Veuillez procéder au règlement en ligne de votre acompte de ${booking.depositAmount} TND par carte bancaire.`,
    type: 'payment_requested',
    entityType: 'booking',
    entityId: booking._id,
    link: `/client/bookings/${booking._id}`,
    io,
    meta: {
      bookingId: String(booking._id),
      amount: booking.depositAmount,
      paymentMode: isCash ? 'espece' : 'virement',
      companyName: company.companyName,
    },
  });

  // Direct socket broadcast to ensure immediate real-time dashboard update without page refresh
  if (io) {
    const liveUpdatePayload = {
      bookingId: String(booking._id),
      paymentRequested: true,
      requestedPaymentMode: booking.requestedPaymentMode,
      paymentStatus: booking.paymentStatus,
      type: 'payment_requested',
      meta: {
        bookingId: String(booking._id),
        amount: booking.depositAmount,
        paymentMode: isCash ? 'espece' : 'virement',
        companyName: company.companyName,
      },
    };
    io.to(`user:${clientId}`).emit('booking:updated', liveUpdatePayload);
    io.emit('booking:updated', liveUpdatePayload);
  }

  // Automated message in chat
  try {
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, clientId] },
    });
    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user._id, clientId],
        booking: booking._id,
      });
    }

    const messageText = isCash
      ? `Bonjour, nous confirmons officiellement la prise en charge de votre déménagement. Le règlement de l'acompte de ${booking.depositAmount} TND s'effectuera directement en espèces lors de l'arrivée du camion.`
      : `Bonjour, nous confirmons officiellement la prise en charge de votre déménagement. Vous pouvez maintenant procéder au règlement sécurisé de l'acompte de ${booking.depositAmount} TND par carte bancaire sur MoversGo pour autoriser le démarrage de l'équipe.`;

    const automatedMsg = await Message.create({
      conversation: conv._id,
      sender: req.user._id,
      content: messageText,
    });

    conv.lastMessage = automatedMsg._id;
    conv.lastMessageAt = new Date();
    await conv.save();

    if (io) {
      io.to(`conversation:${conv._id}`).emit('message:new', {
        message: automatedMsg,
        conversationId: conv._id,
      });
    }
  } catch (chatErr) {
    console.warn('Impossible de créer le message automatique de prise en charge:', chatErr.message);
  }

  // Send email to client
  try {
    const { sendEmail } = require('../services/email.service');
    const clientEmail = booking.client?.email;
    const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim() || 'Client';

    if (clientEmail) {
      await sendEmail({
        to: clientEmail,
        subject: `MoversGo - ${isCash ? '💵 Acompte en espèces' : '💳 Règlement de l\'acompte requis'} (${company.companyName})`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #cf0000, #9f1239); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">MoversGo</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0;">Prise en charge de votre déménagement</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; font-size: 18px;">Bonjour ${clientName} 👋</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Bonne nouvelle ! Le déménageur <strong>${company.companyName}</strong> a officiellement confirmé la prise en charge de votre déménagement.
              </p>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #1e40af; font-weight: 700; margin: 0 0 4px; font-size: 14px;">Mode de règlement : ${isCash ? 'Espèces à l\'enlèvement' : 'Paiement en ligne par carte'}</p>
                <p style="color: #1d4ed8; margin: 0; font-size: 13px;">
                  Montant de l'acompte : <strong>${booking.depositAmount} TND</strong> ${isCash ? '(à régler sur place)' : '(séquestré en toute sécurité jusqu\'à l\'intervention)'}.
                </p>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/bookings/${booking._id}" style="background: #cf0000; color: white; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                  Accéder à ma réservation →
                </a>
              </div>
            </div>
          </div>
        `,
        text: `Prise en charge confirmée par ${company.companyName}. Montant acompte: ${booking.depositAmount} TND. Accéder: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/bookings/${booking._id}`,
      });
    }
  } catch (emailErr) {
    console.warn("Échec d'envoi d'email au client pour la demande d'acompte:", emailErr.message);
  }

  return success(res, { booking }, "Prise en charge confirmée et demande d'acompte transmise au client.");
});

/**
 * POST /api/v1/bookings/:id/pay-deposit
 * Client pays deposit online using virtual payment card simulator
 */
const payDeposit = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('client', 'firstName lastName email phone')
    .populate('company', 'companyName phone logo user')
    .populate('movingRequest')
    .populate('quote');

  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  const clientId = booking.client?._id || booking.client;
  if (clientId.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Vous ne pouvez régler un acompte que pour vos propres réservations.');
  }

  if (booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid') {
    return badRequest(res, "L'acompte pour cette réservation a déjà été consigné.");
  }

  const { cardLast4 = '9010' } = req.body;

  booking.paymentStatus = 'deposit_paid';
  booking.depositPaidAt = new Date();
  await booking.save();

  const Payment = require('../models/Payment');
  const Transaction = require('../models/Transaction');

  const fin = calculateCommission({
    totalPrice: booking.totalAmount,
    depositPercent: booking.depositPercent,
    depositAmount: booking.depositAmount,
  });

  const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const payment = await Payment.create({
    booking: booking._id,
    client: req.user._id,
    company: booking.company._id,
    amount: booking.depositAmount,
    currency: 'TND',
    paymentType: 'deposit',
    paymentMethod: 'card',
    provider: 'test',
    transactionReference: paymentRef,
    paymentStatus: 'completed',
    platformFee: booking.platformFee || fin.platformFee,
    netToCompany: booking.netToCompany || fin.netToCompanyDeposit,
    paidAt: new Date(),
    notes: `Acompte réglé par carte virtuelle (finissant par ${cardLast4}) - Séquestre MoversGo`,
  });

  await Transaction.create({
    booking: booking._id,
    payment: payment._id,
    client: req.user._id,
    company: booking.company._id,
    amount: booking.depositAmount,
    type: 'deposit',
    platformFee: booking.platformFee || fin.platformFee,
    platformFeeRate: fin.commissionRateOnTTC,
    netToCompany: booking.netToCompany || fin.netToCompanyDeposit,
    paymentMethod: 'card',
    status: 'completed',
    description: `Acompte séquestre consigné - Carte •••• ${cardLast4}`,
  });

  const io = req.app.get('io');
  const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim() || 'Client';

  // Real-time notification to company
  let companyUserId = booking.company?.user?._id || booking.company?.user;
  let compDoc = null;
  if (booking.company) {
    compDoc = await Company.findById(booking.company._id || booking.company);
    if (!companyUserId) {
      companyUserId = compDoc?.user;
    }
  }

  if (companyUserId) {
    await createNotification({
      recipientId: companyUserId,
      title: `Acompte validé et reçu (${booking.depositAmount} TND) ✅`,
      message: `${clientName} a réglé l'acompte de ${booking.depositAmount} TND par carte bancaire. Les fonds sont sécurisés en séquestre MoversGo. Vous pouvez démarrer le déménagement !`,
      type: 'payment_received',
      entityType: 'booking',
      entityId: booking._id,
      link: `/company/bookings/${booking._id}`,
      io,
      meta: {
        bookingId: String(booking._id),
        amount: booking.depositAmount,
        clientName,
        paymentMethod: 'card',
      },
    });
  }

  // Real-time notification to client
  await createNotification({
    recipientId: req.user._id,
    title: 'Acompte consigné avec succès 🎉',
    message: `Votre paiement de ${booking.depositAmount} TND a été validé. Vos fonds sont protégés par le compte séquestre MoversGo.`,
    type: 'payment_received',
    entityType: 'booking',
    entityId: booking._id,
    link: `/client/bookings/${booking._id}`,
    io,
    meta: {
      bookingId: String(booking._id),
      amount: booking.depositAmount,
      paymentMethod: 'card',
    },
  });

  // Broadcast real-time booking update event so all pages reload without refresh
  if (io) {
    io.emit('booking:updated', {
      bookingId: String(booking._id),
      paymentStatus: 'deposit_paid',
      type: 'payment_received',
      meta: {
        bookingId: String(booking._id),
        amount: booking.depositAmount,
        paymentMethod: 'card',
      },
    });
  }

  // Send official emails (Client receipt + Company notification)
  try {
    const { sendEmail, templates } = require('../services/email.service');
    const remaining = booking.remainingAmount != null
      ? booking.remainingAmount
      : Math.max(0, (booking.totalAmount || 0) - (booking.depositAmount || 0));

    const depCity = booking.movingRequest?.departureAddress?.city || booking.movingRequest?.departureAddress?.governorate || 'Départ';
    const arrCity = booking.movingRequest?.arrivalAddress?.city || booking.movingRequest?.arrivalAddress?.governorate || 'Arrivée';

    // 1. Email to client (reçu officiel)
    let clientUser = null;
    if (booking.client) {
      clientUser = await User.findById(booking.client._id || booking.client).select('email firstName lastName');
    }
    const clientEmail = clientUser?.email || booking.client?.email;
    if (clientEmail) {
      const clientEmailContent = templates.paymentReceiptForClient({
        clientName,
        companyName: compDoc?.companyName || booking.company?.companyName || 'Déménageur Agréé',
        bookingId: booking._id,
        paymentRef,
        depositAmount: booking.depositAmount,
        remainingAmount: remaining,
        totalPrice: booking.totalAmount,
        depCity,
        arrCity,
        paymentMethod: 'Carte Bancaire Virtuelle • Compte Séquestre MoversGo',
      });
      console.log(`📧 [Pay Deposit] Envoi reçu client à: ${clientEmail}`);
      const clientSendRes = await sendEmail({ to: clientEmail, ...clientEmailContent });
      console.log('📧 [Pay Deposit] Résultat envoi client:', clientSendRes);
    }

    // 2. Email to company (avis d'acompte consigné & invitation à signer la facture)
    let companyUser = null;
    if (companyUserId) {
      companyUser = await User.findById(companyUserId).select('email firstName lastName');
    }
    const companyRecipientEmail = compDoc?.email || companyUser?.email || compDoc?.contactEmail;
    if (companyRecipientEmail) {
      const companyEmailContent = templates.depositReceivedForCompany({
        companyName: compDoc?.companyName || companyUser?.firstName || 'Déménageur',
        clientName,
        bookingId: booking._id,
        paymentRef,
        depositAmount: booking.depositAmount,
        totalPrice: booking.totalAmount,
        remainingAmount: remaining,
        depCity,
        arrCity,
        scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR') : 'À convenir',
      });
      console.log(`📧 [Pay Deposit] Envoi avis acompte à l'entreprise à: ${companyRecipientEmail}`);
      const compSendRes = await sendEmail({ to: companyRecipientEmail, ...companyEmailContent });
      console.log('📧 [Pay Deposit] Résultat envoi entreprise:', compSendRes);
    }
  } catch (emailErr) {
    console.warn("Échec d'envoi d'emails suite au paiement d'acompte:", emailErr);
  }

  // Automated message in conversation
  try {
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    const conv = await Conversation.findOne({
      participants: { $all: [req.user._id, booking.company.user] },
    });
    if (conv) {
      const confirmationMsg = await Message.create({
        conversation: conv._id,
        sender: req.user._id,
        content: `💳 Acompte de ${booking.depositAmount} TND consigné avec succès (Réf: ${paymentRef}). Fonds protégés sur compte séquestre. L'équipe peut officiellement démarrer le camion !`,
      });
      conv.lastMessage = confirmationMsg._id;
      conv.lastMessageAt = new Date();
      await conv.save();

      if (io) {
        io.to(`conversation:${conv._id}`).emit('message:new', {
          message: confirmationMsg,
          conversationId: conv._id,
        });
      }
    }
  } catch (chatErr) {
    console.warn('Erreur message chat paiement acompte:', chatErr.message);
  }

  // Auto-generate official invoice as soon as deposit is paid
  let invoice = null;
  try {
    invoice = await getOrCreateInvoice(booking._id);
  } catch (invErr) {
    console.warn('Erreur génération facture automatique post-acompte:', invErr.message);
  }

  return success(
    res,
    {
      booking,
      payment,
      paymentReference: paymentRef,
      invoice,
    },
    'Acompte consigné avec succès sur le compte séquestre MoversGo. Facture finale débloquée.'
  );
});

/**
 * POST /api/v1/bookings/:id/confirm-cash-deposit
 * Company confirms receipt of cash deposit from client
 */
const confirmCashDeposit = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const booking = await Booking.findById(req.params.id)
    .populate('client', 'firstName lastName email phone')
    .populate('company', 'companyName phone logo user')
    .populate('movingRequest')
    .populate('quote');

  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  if (booking.company._id.toString() !== company._id.toString()) {
    return forbidden(res, 'Action non autorisée sur cette réservation.');
  }

  if (booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid') {
    return badRequest(res, "L'acompte pour cette réservation a déjà été validé.");
  }

  booking.paymentStatus = 'deposit_paid';
  booking.depositPaidAt = new Date();
  booking.requestedPaymentMode = 'espece';
  await booking.save();

  const Payment = require('../models/Payment');
  const Transaction = require('../models/Transaction');

  const fin = calculateCommission({
    totalPrice: booking.totalAmount,
    depositPercent: booking.depositPercent,
    depositAmount: booking.depositAmount,
  });

  const paymentRef = `PAY-CASH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const payment = await Payment.create({
    booking: booking._id,
    client: booking.client._id,
    company: company._id,
    amount: booking.depositAmount,
    currency: 'TND',
    paymentType: 'deposit',
    paymentMethod: 'cash',
    provider: 'manual',
    transactionReference: paymentRef,
    paymentStatus: 'completed',
    platformFee: booking.platformFee || fin.platformFee,
    netToCompany: booking.netToCompany || fin.netToCompanyDeposit,
    paidAt: new Date(),
    notes: `Acompte réglé en espèces et validé par le transporteur ${company.companyName}`,
  });

  await Transaction.create({
    booking: booking._id,
    payment: payment._id,
    client: booking.client._id,
    company: company._id,
    amount: booking.depositAmount,
    type: 'deposit',
    platformFee: booking.platformFee || fin.platformFee,
    platformFeeRate: fin.commissionRateOnTTC,
    netToCompany: booking.netToCompany || fin.netToCompanyDeposit,
    paymentMethod: 'cash',
    status: 'completed',
    description: `Acompte réglé en espèces - Réception validée`,
  });

  // Generate official final invoice
  let invoice = null;
  try {
    invoice = await getOrCreateInvoice(booking._id);
  } catch (invErr) {
    console.warn('Invoice generation error:', invErr.message);
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('booking:updated', {
      bookingId: String(booking._id),
      paymentStatus: 'deposit_paid',
      type: 'payment_received',
      meta: {
        bookingId: String(booking._id),
        amount: booking.depositAmount,
        paymentMethod: 'cash',
      },
    });
  }

  // Send official emails (Client receipt + Company notification)
  try {
    const { sendEmail, templates } = require('../services/email.service');
    const remaining = booking.remainingAmount != null
      ? booking.remainingAmount
      : Math.max(0, (booking.totalAmount || 0) - (booking.depositAmount || 0));

    const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim() || 'Client';
    const depCity = booking.movingRequest?.departureAddress?.city || booking.movingRequest?.departureAddress?.governorate || 'Départ';
    const arrCity = booking.movingRequest?.arrivalAddress?.city || booking.movingRequest?.arrivalAddress?.governorate || 'Arrivée';

    // 1. Email to client
    let clientUser = null;
    if (booking.client) {
      clientUser = await User.findById(booking.client._id || booking.client).select('email firstName lastName');
    }
    const clientEmail = clientUser?.email || booking.client?.email;
    if (clientEmail) {
      const emailContent = templates.paymentReceiptForClient({
        clientName,
        companyName: company.companyName || 'Déménageur Agréé',
        bookingId: booking._id,
        paymentRef,
        depositAmount: booking.depositAmount,
        remainingAmount: remaining,
        totalPrice: booking.totalAmount,
        depCity,
        arrCity,
        paymentMethod: 'Espèces (Remis en main propre au transporteur)',
      });

      console.log(`📧 [Cash Deposit] Envoi reçu client à: ${clientEmail}`);
      const clientSendRes = await sendEmail({ to: clientEmail, ...emailContent });
      console.log('📧 [Cash Deposit] Résultat envoi client:', clientSendRes);
    }

    // 2. Email to company to sign invoice
    let companyUser = null;
    if (company.user) {
      companyUser = await User.findById(company.user).select('email firstName lastName');
    }
    const companyRecipientEmail = company.email || companyUser?.email || company.contactEmail;
    if (companyRecipientEmail) {
      const companyEmailContent = templates.depositReceivedForCompany({
        companyName: company.companyName || companyUser?.firstName || 'Déménageur',
        clientName,
        bookingId: booking._id,
        paymentRef,
        depositAmount: booking.depositAmount,
        totalPrice: booking.totalAmount,
        remainingAmount: remaining,
        depCity,
        arrCity,
        scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR') : 'À convenir',
      });
      console.log(`📧 [Cash Deposit] Envoi avis acompte à l'entreprise à: ${companyRecipientEmail}`);
      const compSendRes = await sendEmail({ to: companyRecipientEmail, ...companyEmailContent });
      console.log('📧 [Cash Deposit] Résultat envoi entreprise:', compSendRes);
    }
  } catch (emailErr) {
    console.warn("Échec d'envoi du reçu espèces par email:", emailErr);
  }

  // Real-time notification to client
  await createNotification({
    recipientId: booking.client._id || booking.client,
    title: 'Acompte en espèces validé & Facture disponible 📄🎉',
    message: `${company.companyName} a confirmé la réception de votre acompte de ${booking.depositAmount} TND. Votre facture finale est disponible !`,
    type: 'payment_received',
    entityType: 'booking',
    entityId: booking._id,
    link: `/client/bookings/${booking._id}`,
    io,
    meta: {
      bookingId: String(booking._id),
      amount: booking.depositAmount,
      paymentMethod: 'cash',
    },
  });

  return success(
    res,
    {
      booking,
      payment,
      invoice,
    },
    "Réception de l'acompte en espèces validée avec succès. Facture finale générée."
  );
});

/**
 * Helper to generate or find an invoice for a booking
 */
const getOrCreateInvoice = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('client', 'firstName lastName phone email address')
    .populate('company', 'companyName logo legalIdentifier rneNumber phone email address')
    .populate('movingRequest')
    .populate('quote');

  if (!booking) return null;

  const company = booking.company || {};
  const client = booking.client || {};
  const reqObj = booking.movingRequest || {};
  const quote = booking.quote || {};

  let invoice = await Invoice.findOne({ booking: bookingId });

  const remaining = booking.remainingAmount != null
    ? booking.remainingAmount
    : Math.max(0, (booking.totalAmount || 0) - (booking.depositAmount || 0));

  if (invoice) {
    // Keep dynamic values updated (paymentStatus, logo, remaining balance)
    let needsSave = false;
    if (company.logo && invoice.companySnapshot?.logo !== company.logo) {
      invoice.companySnapshot.logo = company.logo;
      needsSave = true;
    }
    if (invoice.paymentStatus !== booking.paymentStatus) {
      invoice.paymentStatus = booking.paymentStatus;
      needsSave = true;
    }
    if (invoice.remainingBalanceTTC !== remaining) {
      invoice.remainingBalanceTTC = remaining;
      needsSave = true;
    }
    if (needsSave) {
      await invoice.save();
    }
    return invoice;
  }

  // Build line items from quote
  const lineItems = [];
  const pd = quote.priceDetails || {};

  if (pd.transport || pd.baseTransport) {
    lineItems.push({
      description: 'Transport routier sécurisé & Véhicule capitonné',
      amount: Number(pd.transport || pd.baseTransport),
    });
  }
  if (pd.labor || pd.manpower) {
    lineItems.push({
      description: "Équipe de manutentionnaires & Chauffeur déménageur",
      amount: Number(pd.labor || pd.manpower),
    });
  }
  if (pd.packaging || pd.packing) {
    lineItems.push({
      description: 'Fourniture cartons, adhésifs & Protection sous film à bulles',
      amount: Number(pd.packaging || pd.packing),
    });
  }
  if (pd.furnitureLift || pd.monteMeuble) {
    lineItems.push({
      description: 'Prestation Monte-meubles extérieur sécurisé',
      amount: Number(pd.furnitureLift || pd.monteMeuble),
    });
  }
  if (pd.assembly || pd.disassembly) {
    lineItems.push({
      description: 'Démontage & Remontage du mobilier volumineux',
      amount: Number(pd.assembly || pd.disassembly),
    });
  }
  if (pd.insurance) {
    lineItems.push({
      description: 'Assurance tous risques transport routier & garantie contractuelle',
      amount: Number(pd.insurance),
    });
  }

  // If no detailed keys matched, create a standard comprehensive line item
  if (lineItems.length === 0) {
    const depCity = reqObj.departureAddress?.city || reqObj.departureAddress?.governorate || 'Départ';
    const arrCity = reqObj.arrivalAddress?.city || reqObj.arrivalAddress?.governorate || 'Destination';
    lineItems.push({
      description: `Prestation globale de déménagement professionnel (${depCity} ➔ ${arrCity})`,
      amount: booking.totalAmount || 0,
    });
  }

  const fin = calculateCommission({
    totalPrice: booking.totalAmount,
    depositPercent: booking.depositPercent,
    depositAmount: booking.depositAmount,
  });

  const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`;

  invoice = await Invoice.create({
    invoiceNumber,
    booking: booking._id,
    client: client._id,
    company: company._id,
    movingRequest: reqObj._id,
    quote: quote._id,
    issuedDate: booking.depositPaidAt || booking.createdAt || new Date(),
    dueDate: booking.scheduledDate || new Date(),
    companySnapshot: {
      companyName: company.companyName || 'Société de Déménagement MoversGo',
      logo: company.logo || null,
      legalIdentifier: company.legalIdentifier || company.rneNumber || 'En cours de validation RNE',
      rneNumber: company.rneNumber || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || {},
    },
    clientSnapshot: {
      fullName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client MoversGo',
      phone: client.phone || '',
      email: client.email || '',
      departureAddress: {
        street: reqObj.departureAddress?.street || '',
        city: reqObj.departureAddress?.city || '',
        governorate: reqObj.departureAddress?.governorate || '',
        floor: reqObj.departureFloor || 0,
        hasElevator: Boolean(reqObj.departureElevator),
        housingType: reqObj.departureHousingType || 'Logement',
      },
      arrivalAddress: {
        street: reqObj.arrivalAddress?.street || '',
        city: reqObj.arrivalAddress?.city || '',
        governorate: reqObj.arrivalAddress?.governorate || '',
        floor: reqObj.arrivalFloor || 0,
        hasElevator: Boolean(reqObj.arrivalElevator),
        housingType: reqObj.arrivalHousingType || 'Logement',
      },
    },
    movingDate: booking.scheduledDate,
    movingTime: booking.scheduledTime || '08:00',
    estimatedVolume: reqObj.estimatedVolume || 0,
    lineItems,
    excludedServices: quote.excludedServices || [],
    totalTTC: booking.totalAmount || 0,
    depositPaidTTC: booking.depositAmount || 0,
    remainingBalanceTTC: remaining,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.requestedPaymentMode || 'card',
    depositCommissionRate: fin.commissionRateOnTTC,
    depositCommissionAmount: fin.platformFee,
    depositNetToCompany: fin.netToCompanyDeposit,
    isSignedByCompany: false,
    isSignedByClient: false,
    isFullySigned: false,
    status: 'awaiting_company_signature',
    signatureHash: null,
    companyStampText: `Société Agréée MoversGo - ${company.companyName} - Matricule: ${company.legalIdentifier || company.rneNumber || 'Certifié RNE'}`,
    notes: 'Facture officielle valant bon de transport routier. Le solde restant TTC doit être réglé sur place auprès du chauffeur déménageur à la livraison.',
  });

  return invoice;
};

/**
 * GET /api/v1/bookings/:id/invoice
 * Retrieve or generate official signed invoice for booking
 */
const getBookingInvoice = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  // Permission check — admin can view all invoices
  if (req.user.role === 'admin') {
    // Admin bypass: full access
  } else if (req.user.role === 'client') {
    if (booking.client.toString() !== req.user._id.toString()) {
      return forbidden(res, 'Accès non autorisé à cette facture.');
    }
  } else if (req.user.role === 'company') {
    const company = req.company || (await Company.findOne({ user: req.user._id }));
    if (!company || booking.company.toString() !== company._id.toString()) {
      return forbidden(res, 'Accès non autorisé à cette facture.');
    }
  }

  // Verify deposit is paid or service has progressed
  const isDepositSettled =
    booking.paymentStatus === 'deposit_paid' ||
    booking.paymentStatus === 'fully_paid' ||
    booking.serviceStatus === 'in_progress' ||
    booking.serviceStatus === 'completed';

  if (!isDepositSettled) {
    return badRequest(
      res,
      "La facture finale sera débloquée et affichée dès que l'acompte aura été réglé par le client et validé."
    );
  }

  const invoice = await getOrCreateInvoice(booking._id);
  if (!invoice) {
    return badRequest(res, 'Impossible de générer la facture pour cette réservation.');
  }

  // If caller is client and invoice is NOT yet signed by company:
  // Enforce rule: "le client peux consulté la facture mais aprés la signature de l'entreprise"
  if (req.user.role === 'client' && req.user.role !== 'admin' && !invoice.isSignedByCompany) {
    return success(
      res,
      {
        invoice: null,
        status: 'awaiting_company_signature',
        invoiceNumber: invoice.invoiceNumber,
        depositAmount: booking.depositAmount,
        totalAmount: booking.totalAmount,
        companyName: invoice.companySnapshot?.companyName || 'Déménageur Agréé',
      },
      "La facture officielle a été générée suite au paiement de l'acompte. Elle sera consultable dès que l'entreprise de déménagement aura apposé sa signature numérique."
    );
  }

  return success(res, { invoice }, 'Facture finale officielle récupérée avec succès');
});

/**
 * POST /api/v1/bookings/:id/invoice/sign
 * Company applies a digital signature to the official invoice
 */
const signInvoice = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  // Verify caller is company assigned or admin
  if (req.user.role === 'company') {
    const company = req.company || (await Company.findOne({ user: req.user._id }));
    if (!company || booking.company.toString() !== company._id.toString()) {
      return forbidden(res, "Seule l'entreprise assignée peut apposer sa signature sur cette facture.");
    }
  } else if (req.user.role !== 'admin') {
    return forbidden(res, 'Action non autorisée');
  }

  let invoice = await Invoice.findOne({ booking: booking._id });
  if (!invoice) {
    invoice = await getOrCreateInvoice(booking._id);
  }
  if (!invoice) {
    return badRequest(res, 'Facture introuvable pour cette réservation.');
  }

  const { signatureImage, signerName, stampText } = req.body;
  if (!signatureImage) {
    return badRequest(res, 'Le tracé de votre signature numérique est requis.');
  }

  invoice.isSignedByCompany = true;
  invoice.isCustomSigned = true;
  invoice.companySignedAt = new Date();
  invoice.signedAt = new Date();
  if (signatureImage) invoice.companySignatureImage = signatureImage;
  if (signerName) invoice.companySignerName = signerName.trim();
  if (stampText) invoice.companyStampText = stampText.trim();
  invoice.signatureHash = `SIG-ELEC-${String(booking._id).slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  if (invoice.isSignedByClient) {
    invoice.isFullySigned = true;
    invoice.status = 'fully_signed';
  } else {
    invoice.status = 'awaiting_client_signature';
  }

  await invoice.save();

  // Notify client that invoice has been signed by company
  const io = req.app.get('io');
  if (io) {
    io.emit('booking:updated', {
      bookingId: String(booking._id),
      type: 'invoice_signed_by_company',
      status: invoice.status,
    });
  }

  await createNotification({
    recipientId: booking.client,
    title: 'Facture signée par le transporteur ✍️📄',
    message: `L'entreprise a apposé sa signature numérique officielle sur la facture #${invoice.invoiceNumber}. Vous pouvez maintenant la consulter et signer votre décharge.`,
    type: 'system',
    entityType: 'booking',
    entityId: booking._id,
    link: `/client/bookings/${booking._id}`,
    io,
  });

  // Send email to client
  try {
    const { sendEmail, templates } = require('../services/email.service');
    const User = require('../models/User');
    const clientUser = await User.findById(booking.client).select('email firstName');
    const clientEmail = clientUser?.email || invoice.clientSnapshot?.email;
    if (clientEmail) {
      const emailContent = templates.invoiceSignedForClient({
        clientName: clientUser?.firstName || invoice.clientSnapshot?.fullName || 'Client',
        companyName: invoice.companySnapshot?.companyName || 'Déménageur',
        bookingId: booking._id,
        invoiceNumber: invoice.invoiceNumber,
      });
      await sendEmail({
        to: clientEmail,
        ...emailContent,
      });
    }
  } catch (emailErr) {
    console.warn("Échec d'envoi d'email au client pour facture signée:", emailErr.message);
  }

  return success(res, { invoice }, 'Facture signée numériquement avec succès et transmise au client.');
});

/**
 * POST /api/v1/bookings/:id/invoice/sign-client
 * Client applies digital signature to the delivery discharge & final invoice
 */
const signClientInvoice = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  // Verify caller is booking client or admin
  if (req.user.role === 'client') {
    if (booking.client.toString() !== req.user._id.toString()) {
      return forbidden(res, 'Vous ne pouvez signer la décharge que pour vos propres réservations.');
    }
  } else if (req.user.role !== 'admin') {
    return forbidden(res, 'Action non autorisée');
  }

  let invoice = await Invoice.findOne({ booking: booking._id });
  if (!invoice) {
    invoice = await getOrCreateInvoice(booking._id);
  }
  if (!invoice) {
    return badRequest(res, 'Facture introuvable pour cette réservation.');
  }

  // Company must have signed first
  if (!invoice.isSignedByCompany) {
    return badRequest(
      res,
      "L'entreprise de déménagement doit impérativement apposer sa signature numérique sur la facture avant que vous ne puissiez signer votre décharge."
    );
  }

  const { signatureImage, signerName, dischargeText } = req.body;
  if (!signatureImage) {
    return badRequest(res, 'Le tracé de votre signature est requis.');
  }

  const clientName =
    signerName?.trim() ||
    `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
    invoice.clientSnapshot?.fullName ||
    'Client';

  invoice.isSignedByClient = true;
  invoice.clientSignatureImage = signatureImage;
  invoice.clientSignerName = clientName;
  invoice.clientSignedAt = new Date();
  if (dischargeText) invoice.clientDischargeText = dischargeText.trim();

  // Both parties have signed -> 100% complete
  invoice.isFullySigned = true;
  invoice.fullySignedAt = new Date();
  invoice.status = 'fully_signed';

  await invoice.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('booking:updated', {
      bookingId: String(booking._id),
      type: 'invoice_fully_signed',
      status: 'fully_signed',
    });
  }

  // Resolve company user for notification
  let companyUserId = null;
  const compDoc = await Company.findById(booking.company);
  if (compDoc?.user) {
    companyUserId = compDoc.user;
  }

  if (companyUserId) {
    await createNotification({
      recipientId: companyUserId,
      title: 'Décharge client signée & Facture validée ✅📄',
      message: `${clientName} a signé la décharge pour la facture #${invoice.invoiceNumber}. La facture finale est désormais certifiée par les deux parties avec transparence totale.`,
      type: 'system',
      entityType: 'booking',
      entityId: booking._id,
      link: `/company/bookings/${booking._id}`,
      io,
    });

    // Send email to company
    try {
      const { sendEmail, templates } = require('../services/email.service');
      const compEmail = compDoc.email || compDoc.contactEmail;
      if (compEmail) {
        const emailContent = templates.invoiceFullySignedForCompany({
          companyName: compDoc.companyName || 'Déménageur',
          clientName,
          bookingId: booking._id,
          invoiceNumber: invoice.invoiceNumber,
        });
        await sendEmail({
          to: compEmail,
          ...emailContent,
        });
      }
    } catch (emailErr) {
      console.warn("Échec d'envoi d'email à l'entreprise pour décharge signée:", emailErr.message);
    }
  }

  return success(
    res,
    { invoice },
    'Décharge client signée avec succès. La facture finale officielle est désormais validée par les deux parties.'
  );
});

/**
 * POST /api/v1/bookings/:id/remind
 * Company sends an interactive moving reminder to the client (Notification in-app + Email)
 */
const sendMovingReminder = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  const isAdmin = req.user.role === 'admin';

  if (!company && !isAdmin) {
    return forbidden(res, 'Seule une entreprise validée peut effectuer cette action.');
  }

  const booking = await Booking.findById(req.params.id)
    .populate('client', 'firstName lastName email phone')
    .populate('company', 'companyName phone email contactEmail logo')
    .populate('movingRequest');

  if (!booking) {
    return notFound(res, 'Réservation introuvable');
  }

  if (!isAdmin && booking.company._id.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez pas envoyer de rappel pour une réservation assignée à une autre entreprise.');
  }

  const client = booking.client;
  if (!client) {
    return badRequest(res, 'Client associé introuvable pour cette réservation');
  }

  const movingReq = booking.movingRequest || {};
  const scheduledDate = booking.scheduledDate || booking.movingDate;
  const scheduledTime = booking.scheduledTime || booking.movingTime || '08:00';

  // Compute countdown / days left
  const now = new Date();
  const moveDate = new Date(scheduledDate);
  const diffTime = moveDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let countdownText = 'Très bientôt';
  if (diffDays <= 0) {
    countdownText = "Aujourd'hui !";
  } else if (diffDays === 1) {
    countdownText = 'Demain (J-1)';
  } else if (diffDays > 1) {
    countdownText = `Dans ${diffDays} jours (J-${diffDays})`;
  }

  // Update booking reminder tracking
  booking.lastReminderSentAt = new Date();
  booking.remindersCount = (booking.remindersCount || 0) + 1;
  await booking.save();

  const io = req.app.get('io');
  const clientId = client._id;
  const companyName = booking.company?.companyName || company?.companyName || 'Votre déménageur';

  const dateFormatted = moveDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // 1. Send in-app notification to client
  try {
    await createNotification({
      recipientId: clientId,
      title: `🚛 Rappel Déménagement : ${countdownText}`,
      message: `Votre intervention avec ${companyName} est prévue le ${dateFormatted} vers ${scheduledTime}. Consultez les détails et préparez vos accès.`,
      type: 'moving_reminder',
      entityType: 'booking',
      entityId: booking._id,
      link: `/client/bookings/${booking._id}`,
      io,
      meta: {
        bookingId: String(booking._id),
        scheduledDate,
        scheduledTime,
        countdownText,
        companyName,
      },
    });
  } catch (notifErr) {
    console.warn('Erreur notification rappel:', notifErr.message);
  }

  // 2. Send email to client
  try {
    const { sendEmail, templates } = require('../services/email.service');
    if (client.email && templates.movingReminderForClient) {
      const emailContent = templates.movingReminderForClient({
        clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client',
        companyName,
        companyPhone: booking.company?.phone || company?.phone || '',
        scheduledDate: dateFormatted,
        scheduledTime,
        countdownText,
        departureAddress: movingReq.departureAddress,
        arrivalAddress: movingReq.arrivalAddress,
        bookingId: booking._id,
        volume: movingReq.volumeEstimate || movingReq.totalVolume || null,
        remindersCount: booking.remindersCount,
      });

      await sendEmail({
        to: client.email,
        ...emailContent,
      });
    }
  } catch (emailErr) {
    console.warn("Échec d'envoi de l'email de rappel:", emailErr.message);
  }

  return success(
    res,
    {
      bookingId: booking._id,
      lastReminderSentAt: booking.lastReminderSentAt,
      remindersCount: booking.remindersCount,
      countdownText,
    },
    `Rappel de déménagement envoyé avec succès à ${client.firstName || 'votre client'} (${countdownText} - Email & Notification).`
  );
});

module.exports = {
  getMyBookings,
  getCompanyBookings,
  getBookingById,
  updateServiceStatus,
  cancelBooking,
  getAllBookings,
  requestDepositPayment,
  payDeposit,
  confirmCashDeposit,
  getBookingInvoice,
  signInvoice,
  signClientInvoice,
  sendMovingReminder,
};
