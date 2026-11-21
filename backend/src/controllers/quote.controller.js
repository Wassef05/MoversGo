const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const MovingRequest = require('../models/MovingRequest');
const Company = require('../models/Company');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
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

const PLATFORM_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE) || 0.12;

/**
 * POST /api/v1/quotes
 * Company submits a quote for a pending/quoted request
 */
const createQuote = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  if (company.verificationStatus !== 'approved') {
    return forbidden(res, 'Votre entreprise doit être validée pour soumettre des devis.');
  }

  const {
    movingRequest: movingRequestId,
    totalPrice,
    priceDetails,
    depositPercent,
    depositPercentage,
    includedServices,
    excludedServices,
    terms,
    validityDate,
    proposedDate,
    estimatedDuration,
    notes,
  } = req.body;

  const numTotalPrice = parseFloat(totalPrice);
  if (isNaN(numTotalPrice) || numTotalPrice <= 0) {
    return badRequest(res, 'Le montant total du devis doit être un nombre positif.');
  }

  const allowedDepositPercents = [10, 20, 30, 40, 50, 60];
  const rawDepositPercent = depositPercent !== undefined ? depositPercent : (depositPercentage !== undefined ? depositPercentage : 30);
  const parsedDepositPercent = parseFloat(rawDepositPercent) || 30;
  const numDepositPercent = allowedDepositPercents.includes(parsedDepositPercent)
    ? parsedDepositPercent
    : allowedDepositPercents.reduce((prev, curr) =>
        Math.abs(curr - parsedDepositPercent) < Math.abs(prev - parsedDepositPercent) ? curr : prev
      );
  // Server-side calculation of deposit
  const depositAmount = Math.round(numTotalPrice * (numDepositPercent / 100) * 100) / 100;

  // Validate request exists and is open for quotes
  const movingRequest = await MovingRequest.findById(movingRequestId);
  if (!movingRequest) {
    return notFound(res, 'Demande de déménagement introuvable.');
  }

  if (!['pending', 'quoted'].includes(movingRequest.status)) {
    return badRequest(
      res,
      `Impossible de soumettre un devis. La demande est actuellement "${movingRequest.status}".`
    );
  }

  // Check if company already submitted active quote for this request
  const existingActiveQuote = await Quote.findOne({
    movingRequest: movingRequestId,
    company: company._id,
    status: { $in: ['submitted', 'viewed', 'accepted'] },
  });

  if (existingActiveQuote) {
    return badRequest(res, 'Vous avez déjà soumis un devis actif pour cette demande.');
  }

  // Handle uploaded attachments if any
  let attachments = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    attachments = req.files.map((file) => ({
      filePath: file.path.replace(/\\/g, '/'),
      fileName: file.originalname,
      uploadedAt: new Date(),
    }));
  }

  // Validity date default: 15 days if not provided
  const valDate = validityDate
    ? new Date(validityDate)
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const quote = await Quote.create({
    movingRequest: movingRequestId,
    company: company._id,
    totalPrice: numTotalPrice,
    priceDetails: typeof priceDetails === 'string' ? JSON.parse(priceDetails) : priceDetails || {},
    depositAmount,
    depositPercent: numDepositPercent,
    includedServices: Array.isArray(includedServices)
      ? includedServices
      : typeof includedServices === 'string'
        ? includedServices.split(',').map((s) => s.trim())
        : [],
    excludedServices: Array.isArray(excludedServices)
      ? excludedServices
      : typeof excludedServices === 'string'
        ? excludedServices.split(',').map((s) => s.trim())
        : [],
    terms,
    validityDate: valDate,
    proposedDate: proposedDate ? new Date(proposedDate) : movingRequest.preferredDate,
    estimatedDuration,
    attachments,
    notes,
    status: 'submitted',
  });

  // Update request status & counter
  await MovingRequest.findByIdAndUpdate(movingRequestId, {
    $inc: { quotesCount: 1 },
    $set: { status: 'quoted' },
  });

  // Populate company and request
  const populatedQuote = await Quote.findById(quote._id)
    .populate('company', 'companyName logo averageRating phone')
    .populate('movingRequest', 'departureAddress arrivalAddress preferredDate status');

  // Notify client
  const io = req.app.get('io');
  await createNotification({
    recipientId: movingRequest.client,
    title: 'Nouveau devis reçu 💰',
    message: `${company.companyName} vous a envoyé un devis de ${numTotalPrice} TND pour votre déménagement.`,
    type: 'new_quote',
    entityType: 'quote',
    entityId: quote._id,
    link: `/client/quotes/${quote._id}`,
    io,
  });

  return created(res, { quote: populatedQuote }, 'Devis envoyé avec succès');
});

/**
 * GET /api/v1/quotes/company
 * Company lists their submitted quotes
 */
const getMyQuotes = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status } = req.query;

  const filter = { company: company._id };
  if (status) {
    filter.status = status;
  }

  const total = await Quote.countDocuments(filter);
  const quotes = await Quote.find(filter)
    .populate({
      path: 'movingRequest',
      select: 'departureAddress arrivalAddress preferredDate status client title',
      populate: { path: 'client', select: 'firstName lastName phone' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, quotes, pagination, 'Vos devis soumis');
});

/**
 * GET /api/v1/quotes/client
 * Client lists all quotes received for their moving requests
 */
const getClientQuotes = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status, movingRequestId } = req.query;

  // Find all requests belonging to this client
  const requestFilter = { client: req.user._id };
  if (movingRequestId) {
    requestFilter._id = movingRequestId;
  }

  const clientRequests = await MovingRequest.find(requestFilter).select('_id');
  const requestIds = clientRequests.map((r) => r._id);

  const filter = { movingRequest: { $in: requestIds } };
  if (status) {
    filter.status = status;
  }

  const total = await Quote.countDocuments(filter);
  const quotes = await Quote.find(filter)
    .populate('company', 'companyName logo averageRating phone totalReviews address legalIdentifier email')
    .populate('movingRequest', 'departureAddress arrivalAddress preferredDate status title')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, quotes, pagination, 'Devis reçus');
});

/**
 * GET /api/v1/quotes/:id
 * Retrieve single quote with ownership check
 */
const getQuoteById = catchAsync(async (req, res) => {
  const quote = await Quote.findById(req.params.id)
    .populate('company', 'companyName logo averageRating phone totalReviews serviceAreas email address legalIdentifier user')
    .populate({
      path: 'movingRequest',
      populate: { path: 'client', select: 'firstName lastName email phone' },
    });

  if (!quote) {
    return notFound(res, 'Devis introuvable');
  }

  // Access check
  if (req.user.role === 'client') {
    const isOwner = quote.movingRequest?.client?._id?.toString() === req.user._id.toString();
    if (!isOwner) {
      return forbidden(res, 'Accès non autorisé à ce devis.');
    }

    // Mark as viewed if client opens it for the first time
    if (quote.status === 'submitted') {
      quote.status = 'viewed';
      quote.viewedAt = new Date();
      await quote.save();
    }
  } else if (req.user.role === 'company') {
    const company = req.company || (await Company.findOne({ user: req.user._id }));
    if (!company || quote.company?._id?.toString() !== company._id.toString()) {
      return forbidden(res, 'Accès non autorisé à ce devis.');
    }
  }

  return success(res, { quote }, 'Détails du devis récupérés');
});

/**
 * PUT /api/v1/quotes/:id
 * Company updates their submitted quote
 */
const updateQuote = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const quote = await Quote.findById(req.params.id);
  if (!quote) {
    return notFound(res, 'Devis introuvable');
  }

  if (quote.company.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez modifier que vos propres devis.');
  }

  if (!['submitted', 'viewed'].includes(quote.status)) {
    return badRequest(
      res,
      `Ce devis ne peut plus être modifié car son statut est "${quote.status}".`
    );
  }

  const {
    totalPrice,
    priceDetails,
    depositPercent,
    includedServices,
    excludedServices,
    terms,
    validityDate,
    proposedDate,
    estimatedDuration,
    notes,
  } = req.body;

  if (totalPrice !== undefined) {
    const numPrice = parseFloat(totalPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      return badRequest(res, 'Montant total invalide.');
    }
    quote.totalPrice = numPrice;
  }

  if (depositPercent !== undefined) {
    const allowedDepositPercents = [10, 20, 30, 40, 50, 60];
    const parsedDP = parseFloat(depositPercent) || 30;
    quote.depositPercent = allowedDepositPercents.includes(parsedDP)
      ? parsedDP
      : allowedDepositPercents.reduce((prev, curr) =>
          Math.abs(curr - parsedDP) < Math.abs(prev - parsedDP) ? curr : prev
        );
  }

  // Recompute deposit server-side
  quote.depositAmount = Math.round(quote.totalPrice * (quote.depositPercent / 100) * 100) / 100;

  if (priceDetails !== undefined) {
    quote.priceDetails = typeof priceDetails === 'string' ? JSON.parse(priceDetails) : priceDetails;
  }
  if (includedServices !== undefined) {
    quote.includedServices = Array.isArray(includedServices)
      ? includedServices
      : typeof includedServices === 'string'
        ? includedServices.split(',').map((s) => s.trim())
        : quote.includedServices;
  }
  if (excludedServices !== undefined) {
    quote.excludedServices = Array.isArray(excludedServices)
      ? excludedServices
      : typeof excludedServices === 'string'
        ? excludedServices.split(',').map((s) => s.trim())
        : quote.excludedServices;
  }
  if (terms !== undefined) quote.terms = terms;
  if (validityDate !== undefined) quote.validityDate = new Date(validityDate);
  if (proposedDate !== undefined) quote.proposedDate = new Date(proposedDate);
  if (estimatedDuration !== undefined) quote.estimatedDuration = estimatedDuration;
  if (notes !== undefined) quote.notes = notes;

  await quote.save();
  return success(res, { quote }, 'Devis mis à jour avec succès');
});

/**
 * POST /api/v1/quotes/:id/accept
 * Client accepts a quote -> triggers Booking, Transaction, Payment creation
 */
const acceptQuote = catchAsync(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) {
    return notFound(res, 'Devis introuvable');
  }

  const request = await MovingRequest.findById(quote.movingRequest);
  if (!request) {
    return notFound(res, 'Demande associée introuvable');
  }

  if (request.client.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Vous ne pouvez accepter des devis que pour vos propres demandes.');
  }

  if (quote.status === 'accepted') {
    return badRequest(res, 'Ce devis a déjà été accepté.');
  }

  if (quote.status === 'cancelled' || quote.status === 'expired') {
    return badRequest(res, `Impossible d'accepter un devis en statut "${quote.status}".`);
  }

  if (request.status === 'booked' || request.status === 'completed') {
    return badRequest(res, 'Cette demande est déjà réservée.');
  }

  // Financial calculations
  const platformFee = Math.round(quote.totalPrice * PLATFORM_COMMISSION_RATE * 100) / 100;
  const netToCompany = Math.round((quote.totalPrice - platformFee) * 100) / 100;
  const remainingAmount = Math.round((quote.totalPrice - quote.depositAmount) * 100) / 100;

  // Multi-document transactions require a Replica Set deployment
  const topologyType = mongoose.connection?.client?.topology?.description?.type || '';
  const isReplicaSet = topologyType.toLowerCase().includes('replicaset');

  let session = null;
  let useSession = false;

  if (isReplicaSet) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useSession = true;
    } catch {
      session = null;
      useSession = false;
    }
  }

  let booking;
  let transaction;
  let payment;

  try {
    const sessionOpt = useSession && session ? { session } : {};

    // 1. Accept this quote
    quote.status = 'accepted';
    quote.respondedAt = new Date();
    await quote.save(sessionOpt);

    // 2. Reject all other quotes for this request
    await Quote.updateMany(
      {
        movingRequest: request._id,
        _id: { $ne: quote._id },
        status: { $in: ['submitted', 'viewed'] },
      },
      {
        $set: {
          status: 'rejected',
          respondedAt: new Date(),
          rejectionReason: 'Une autre offre a été sélectionnée par le client.',
        },
      },
      sessionOpt
    );

    // 3. Update MovingRequest status
    request.status = 'booked';
    request.acceptedQuote = quote._id;
    await request.save(sessionOpt);

    // 4. Create Booking
    const bookingData = {
      client: req.user._id,
      company: quote.company,
      movingRequest: request._id,
      quote: quote._id,
      scheduledDate: quote.proposedDate || request.preferredDate || new Date(),
      scheduledTime: '08:00',
      estimatedDuration: quote.estimatedDuration || 'Demi-journée',
      totalAmount: quote.totalPrice,
      depositAmount: quote.depositAmount,
      depositPercent: quote.depositPercent || (quote.totalPrice > 0 ? Math.round((quote.depositAmount / quote.totalPrice) * 100) : 30),
      remainingAmount,
      platformFee,
      netToCompany,
      paymentStatus: 'deposit_pending',
      bookingStatus: 'confirmed',
      serviceStatus: 'preparation',
      trackingSteps: [
        { step: 'Réservation confirmée', completedAt: new Date(), isDone: true },
        { step: 'Préparation du camion & équipe', isDone: false },
        { step: 'Déménagement en cours', isDone: false },
        { step: 'Déménagement terminé', isDone: false },
      ],
    };

    if (useSession && session) {
      const [createdBooking] = await Booking.create([bookingData], { session });
      booking = createdBooking;
    } else {
      booking = await Booking.create(bookingData);
    }

    // 5. Create Payment record (deposit pending)
    const paymentData = {
      booking: booking._id,
      client: req.user._id,
      company: quote.company,
      amount: quote.depositAmount,
      currency: 'TND',
      paymentType: 'deposit',
      paymentMethod: 'card',
      provider: 'test',
      paymentStatus: 'pending',
      platformFee,
      platformFeeRate: PLATFORM_COMMISSION_RATE,
      netToCompany,
      notes: `Acompte initial de ${quote.depositPercent || numDepositPercent}% pour réservation #${booking._id}`,
    };

    if (useSession && session) {
      const [createdPayment] = await Payment.create([paymentData], { session });
      payment = createdPayment;
    } else {
      payment = await Payment.create(paymentData);
    }

    // 6. Create Transaction record
    const transactionData = {
      booking: booking._id,
      payment: payment._id,
      client: req.user._id,
      company: quote.company,
      amount: quote.depositAmount,
      type: 'deposit',
      platformFee,
      platformFeeRate: PLATFORM_COMMISSION_RATE,
      netToCompany,
      paymentMethod: 'card',
      status: 'pending',
      description: `Acompte pour le déménagement #${request._id}`,
    };

    if (useSession && session) {
      const [createdTx] = await Transaction.create([transactionData], { session });
      transaction = createdTx;
    } else {
      transaction = await Transaction.create(transactionData);
    }

    if (useSession && session) {
      await session.commitTransaction();
      session.endSession();
    }
  } catch (err) {
    if (useSession && session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw err;
  }

  // Real-time notifications outside transaction
  const io = req.app.get('io');
  const companyDoc = await Company.findById(quote.company?._id || quote.company);

  // Auto-initiate conversation between client and company for this booking
  const Conversation = require('../models/Conversation');
  let conversation = null;
  if (companyDoc?.user) {
    try {
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, companyDoc.user], $size: 2 },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user._id, companyDoc.user],
          booking: booking._id,
          lastMessageAt: new Date(),
          unreadCount: new Map([[companyDoc.user.toString(), 0], [req.user._id.toString(), 0]]),
        });
      } else if (!conversation.booking) {
        conversation.booking = booking._id;
        await conversation.save();
      }
    } catch (e) {
      console.error('Conversation auto-create error:', e.message);
    }
  }

  if (companyDoc) {
    if (companyDoc.user) {
      await createNotification({
        recipientId: companyDoc.user,
        title: 'Devis accepté ! 🚀 Félicitations',
        message: `Votre devis de ${quote.totalPrice} TND a été accepté pour le déménagement vers ${request.arrivalAddress?.city || 'destination'}.`,
        type: 'quote_accepted',
        entityType: 'booking',
        entityId: booking._id,
        link: `/company/bookings/${booking._id}`,
        io,
      });
    }

    // Send official email to company informing them their quote was accepted
    try {
      const { sendEmail, templates } = require('../services/email.service');
      let companyUser = null;
      if (companyDoc.user) {
        companyUser = await User.findById(companyDoc.user).select('email firstName lastName');
      }
      const companyRecipientEmail = companyDoc.email || companyUser?.email || companyDoc.contactEmail;
      const clientName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Client MoversGo';
      const depCity = request.departureAddress?.city || request.departureAddress?.governorate || '—';
      const arrCity = request.arrivalAddress?.city || request.arrivalAddress?.governorate || '—';
      const schedDate = booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR') : 'À convenir';

      console.log(`📧 [Quote Accept] Envoi de l'e-mail d'acceptation à l'entreprise (${companyDoc.companyName || 'Déménageur'}) -> ${companyRecipientEmail}`);

      if (companyRecipientEmail) {
        const emailContent = templates.quoteAcceptedForCompany({
          companyName: companyDoc.companyName || companyUser?.firstName || 'Déménageur',
          clientName,
          bookingId: booking._id,
          totalPrice: quote.totalPrice,
          depositAmount: quote.depositAmount,
          depCity,
          arrCity,
          scheduledDate: schedDate,
        });

        const sendResult = await sendEmail({
          to: companyRecipientEmail,
          ...emailContent,
        });
        console.log(`📧 [Quote Accept] Résultat d'envoi e-mail:`, sendResult);
      } else {
        console.warn(`⚠️ [Quote Accept] Aucun e-mail trouvé pour l'entreprise ID: ${companyDoc._id}`);
      }
    } catch (emailErr) {
      console.error("❌ Échec d'envoi d'email à l'entreprise pour devis accepté:", emailErr);
    }
  }

  await createNotification({
    recipientId: req.user._id,
    title: 'Réservation validée 🎉',
    message: `Votre réservation auprès de ${companyDoc?.companyName || 'l\'entreprise'} est confirmée.`,
    type: 'booking_confirmed',
    entityType: 'booking',
    entityId: booking._id,
    link: `/client/bookings/${booking._id}`,
    io,
  });

  return success(
    res,
    {
      booking,
      quote,
      payment,
      transaction,
      conversationId: conversation?._id || null,
    },
    'Devis accepté et réservation créée avec succès.'
  );
});

/**
 * POST /api/v1/quotes/:id/reject
 * Client rejects a quote
 */
const rejectQuote = catchAsync(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) {
    return notFound(res, 'Devis introuvable');
  }

  const request = await MovingRequest.findById(quote.movingRequest);
  if (!request) {
    return notFound(res, 'Demande associée introuvable');
  }

  if (request.client.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Vous ne pouvez refuser des devis que pour vos propres demandes.');
  }

  const { rejectionReason } = req.body;
  quote.status = 'rejected';
  quote.respondedAt = new Date();
  quote.rejectionReason = rejectionReason || 'Offre déclinée par le client.';
  await quote.save();

  // Notify company
  const companyDoc = await Company.findById(quote.company);
  if (companyDoc?.user) {
    const io = req.app.get('io');
    await createNotification({
      recipientId: companyDoc.user,
      title: 'Devis décliné',
      message: `Votre devis pour le déménagement (${request.departureAddress?.city} → ${request.arrivalAddress?.city}) n'a pas été retenu.`,
      type: 'quote_rejected',
      entityType: 'quote',
      entityId: quote._id,
      link: `/company/quotes/${quote._id}`,
      io,
    });
  }

  return success(res, { quote }, 'Devis refusé.');
});

/**
 * DELETE /api/v1/quotes/:id
 * Company cancels their submitted quote
 */
const cancelQuote = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const quote = await Quote.findById(req.params.id);
  if (!quote) {
    return notFound(res, 'Devis introuvable');
  }

  if (quote.company.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez annuler que vos propres devis.');
  }

  if (quote.status === 'accepted') {
    return badRequest(res, 'Impossible d\'annuler un devis qui a déjà été accepté.');
  }

  quote.status = 'cancelled';
  await quote.save();

  // Decrement request count
  await MovingRequest.findByIdAndUpdate(quote.movingRequest, {
    $inc: { quotesCount: -1 },
  });

  return success(res, { id: quote._id }, 'Devis annulé avec succès');
});

/**
 * GET /api/v1/admin/quotes
 * Admin view of all quotes
 */
const getAllQuotes = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const total = await Quote.countDocuments(filter);
  const quotes = await Quote.find(filter)
    .populate('company', 'companyName phone logo')
    .populate({
      path: 'movingRequest',
      populate: { path: 'client', select: 'firstName lastName email phone' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, quotes, pagination, 'Tous les devis');
});

module.exports = {
  createQuote,
  getMyQuotes,
  getClientQuotes,
  getQuoteById,
  updateQuote,
  acceptQuote,
  rejectQuote,
  cancelQuote,
  getAllQuotes,
};
