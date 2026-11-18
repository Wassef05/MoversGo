const MovingRequest = require('../models/MovingRequest');
const Company = require('../models/Company');
const Quote = require('../models/Quote');
const Notification = require('../models/Notification');
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

/**
 * Safely parse JSON or return original/fallback
 */
const safeParse = (field, fallback = {}) => {
  if (field === undefined || field === null) return fallback;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch {
    return fallback;
  }
};

/**
 * POST /api/v1/moving-requests
 * Client creates a new moving request
 */
const createRequest = catchAsync(async (req, res) => {
  const {
    departureAddress,
    departureHousingType,
    departureFloor,
    departureElevator,
    departureSurface,
    departureRooms,
    arrivalAddress,
    arrivalHousingType,
    arrivalFloor,
    arrivalElevator,
    arrivalSurface,
    arrivalRooms,
    furniture,
    appliances,
    estimatedBoxes,
    estimatedVolume,
    fragileItems,
    fragileItemsDescription,
    heavyItems,
    preferredDate,
    flexibleDates,
    alternativeDates,
    additionalServices,
    comments,
    estimatedBudget,
  } = req.body;

  const parsedDeparture = safeParse(departureAddress);
  const parsedArrival = safeParse(arrivalAddress);

  if (!parsedDeparture.city || !parsedDeparture.governorate) {
    return badRequest(res, 'L\'adresse de départ doit contenir au moins la ville et le gouvernorat.');
  }

  if (!parsedArrival.city || !parsedArrival.governorate) {
    return badRequest(res, 'L\'adresse d\'arrivée doit contenir au moins la ville et le gouvernorat.');
  }

  // Handle uploaded photos
  let photos = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    photos = req.files.map((file) => ({
      filePath: file.path.replace(/\\/g, '/'),
      caption: file.originalname,
      uploadedAt: new Date(),
    }));
  }

  // Handle nested options and inventory fallbacks
  let parsedServices = safeParse(additionalServices, {});
  if (Object.keys(parsedServices).length === 0 && req.body.options) {
    const opts = safeParse(req.body.options);
    parsedServices = {
      packing: !!opts.packagingService,
      furnitureDisassembly: !!opts.disassemblyService,
      furnitureAssembly: !!opts.disassemblyService,
      truckLift: !!opts.furnitureLiftNeeded,
      storage: !!opts.storageNeeded,
    };
  }

  let parsedFurniture = safeParse(furniture, []);
  if (parsedFurniture.length === 0 && req.body.inventory) {
    const inv = safeParse(req.body.inventory);
    if (inv && Array.isArray(inv.items)) {
      parsedFurniture = inv.items;
    }
  }

  const finalVolume = parseFloat(estimatedVolume) || (req.body.inventory && parseFloat(safeParse(req.body.inventory).estimatedVolume)) || 0;
  const finalBoxes = parseInt(estimatedBoxes, 10) || (req.body.inventory && parseInt(safeParse(req.body.inventory).boxesCount, 10)) || 0;
  const finalFragileDesc = fragileItemsDescription || (req.body.inventory && safeParse(req.body.inventory).fragileItems) || '';
  const requestComments = comments || (req.body.options && safeParse(req.body.options).comments) || '';

  const newRequest = await MovingRequest.create({
    client: req.user._id,
    customTitle: req.body.title ? req.body.title.trim() : undefined,
    departureAddress: parsedDeparture,
    departureHousingType: departureHousingType || (req.body.departure && safeParse(req.body.departure).housingType) || 'Appartement S+2',
    departureFloor: parseInt(departureFloor, 10) || (req.body.departure && parseInt(safeParse(req.body.departure).floor, 10)) || 0,
    departureElevator: departureElevator === 'true' || departureElevator === true || (req.body.departure && !!safeParse(req.body.departure).hasElevator),
    departureSurface: departureSurface ? parseFloat(departureSurface) : (req.body.departure && parseFloat(safeParse(req.body.departure).surface)) || undefined,
    departureRooms: departureRooms ? parseInt(departureRooms, 10) : undefined,
    arrivalAddress: parsedArrival,
    arrivalHousingType: arrivalHousingType || (req.body.arrival && safeParse(req.body.arrival).housingType) || 'Appartement S+2',
    arrivalFloor: parseInt(arrivalFloor, 10) || (req.body.arrival && parseInt(safeParse(req.body.arrival).floor, 10)) || 0,
    arrivalElevator: arrivalElevator === 'true' || arrivalElevator === true || (req.body.arrival && !!safeParse(req.body.arrival).hasElevator),
    arrivalSurface: arrivalSurface ? parseFloat(arrivalSurface) : (req.body.arrival && parseFloat(safeParse(req.body.arrival).surface)) || undefined,
    arrivalRooms: arrivalRooms ? parseInt(arrivalRooms, 10) : undefined,
    furniture: parsedFurniture,
    appliances: safeParse(appliances, []),
    estimatedBoxes: finalBoxes,
    estimatedVolume: finalVolume,
    fragileItems: fragileItems === 'true' || fragileItems === true || !!finalFragileDesc,
    fragileItemsDescription: finalFragileDesc,
    heavyItems: heavyItems === 'true' || heavyItems === true,
    photos,
    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
    flexibleDates: flexibleDates === 'true' || flexibleDates === true,
    alternativeDates: safeParse(alternativeDates, []),
    additionalServices: parsedServices,
    comments: requestComments,
    estimatedBudget,
    status: 'pending',
  });

  // Populate client details for response
  const populatedRequest = await MovingRequest.findById(newRequest._id).populate(
    'client',
    'firstName lastName phone email'
  );

  // Smart Recommendation Notification: Notify companies whose profile matches this new request
  const recommendationService = require('../services/recommendation.service');
  let matchedCompanies = [];
  try {
    matchedCompanies = await recommendationService.findMatchingCompaniesForRequest(populatedRequest, 50);
  } catch (matchErr) {
    console.warn('Smart matching evaluation warning:', matchErr.message);
  }

  // If no specific high-match companies found, fallback to active approved companies in area
  let companiesToNotify = matchedCompanies.map((m) => m.company);
  if (companiesToNotify.length === 0) {
    companiesToNotify = await Company.find({
      verificationStatus: 'approved',
      isActive: true,
    }).populate('user', 'email firstName lastName');

    if (companiesToNotify.length === 0) {
      companiesToNotify = await Company.find({ isActive: true }).populate('user', 'email firstName lastName');
    }
  }

  if (companiesToNotify.length > 0) {
    const { getUnreadCount } = require('../services/notification.service');
    const { sendEmail, templates } = require('../services/email.service');
    const io = req.app.get('io');
    const mongoose = require('mongoose');

    // Create tailored notifications
    const notifDocs = [];
    for (const comp of companiesToNotify) {
      const userId = comp.user?._id || comp.user;
      if (!userId) continue;

      const matchMeta = matchedCompanies.find((m) => String(m.company._id) === String(comp._id));
      const score = matchMeta?.score;
      const dist = matchMeta?.distanceKm;

      const title = score && score >= 75
        ? `🎯 Opportunité Recommandée (${score}% compatible)`
        : 'Nouvelle demande de déménagement 📦';

      const distanceTxt = dist !== null && dist !== undefined ? ` à ${dist} km de votre base` : '';
      const message = score && score >= 75
        ? `Ce déménagement de ${parsedDeparture.city} vers ${parsedArrival.city}${distanceTxt} correspond parfaitement à votre profil et vos services.`
        : `Nouvelle opportunité : trajet de ${parsedDeparture.city} vers ${parsedArrival.city} (${parsedDeparture.governorate})`;

      notifDocs.push({
        recipient: userId,
        title,
        message,
        type: 'new_request',
        relatedEntity: {
          entityType: 'request',
          entityId: populatedRequest._id,
          link: `/company/requests/${populatedRequest._id}`,
        },
      });
    }

    if (notifDocs.length > 0) {
      let createdNotifs = [];
      try {
        createdNotifs = await Notification.insertMany(notifDocs);
      } catch (err) {
        console.error('Error creating company notifications:', err.message);
      }

      if (io) {
        for (let i = 0; i < companiesToNotify.length; i++) {
          const comp = companiesToNotify[i];
          const userId = comp.user?._id || comp.user;
          if (!userId) continue;

          const notif = createdNotifs[i] || notifDocs[i];
          const notifObj = notif && notif.toObject ? notif.toObject() : {
            ...notif,
            _id: (notif && notif._id) ? notif._id : new mongoose.Types.ObjectId(),
          };

          const unread = await getUnreadCount(userId).catch(() => 1);

          // Emit real-time notification with full document & unreadCount
          io.to(`user:${userId.toString()}`).emit('notification:new', {
            notification: notifObj,
            unreadCount: unread,
            type: 'new_request',
            requestId: String(populatedRequest._id),
          });

          // Also emit request:new event so request list pages and dashboards update instantly
          io.to(`user:${userId.toString()}`).emit('request:new', {
            request: populatedRequest,
            requestId: String(populatedRequest._id),
          });
        }
      }

      // Send email notifications to companies with complete coordinates & direct dashboard link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const directUrl = `${frontendUrl}/company/requests/${populatedRequest._id}`;
      const dashboardUrl = `${frontendUrl}/company/dashboard`;

      for (const comp of companiesToNotify) {
        const targetEmail = comp.email || comp.user?.email;
        if (!targetEmail) continue;

        const compName =
          comp.companyName ||
          `${comp.user?.firstName || ''} ${comp.user?.lastName || ''}`.trim() ||
          'Déménageur Agréé';

        const emailData = templates.newMovingRequestForCompany(
          compName,
          populatedRequest,
          directUrl,
          dashboardUrl
        );

        sendEmail({
          to: targetEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }).catch((emailErr) => {
          console.warn(`⚠️ Échec d'envoi d'email à ${targetEmail}:`, emailErr.message);
        });
      }
    }
  }

  return created(res, { request: populatedRequest }, 'Demande de déménagement créée avec succès');
});

/**
 * GET /api/v1/moving-requests/my
 * Client views their own moving requests with pagination & status filter
 */
const getMyRequests = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status } = req.query;

  const filter = { client: req.user._id };
  if (status) {
    filter.status = status;
  }

  const total = await MovingRequest.countDocuments(filter);
  const requests = await MovingRequest.find(filter)
    .populate({
      path: 'acceptedQuote',
      populate: { path: 'company', select: 'companyName logo averageRating phone' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, requests, pagination, 'Vos demandes de déménagement');
});

/**
 * GET /api/v1/moving-requests/:id
 * Retrieve single request with permission check
 */
const getRequestById = catchAsync(async (req, res) => {
  const request = await MovingRequest.findById(req.params.id)
    .populate('client', 'firstName lastName email phone profileImage')
    .populate({
      path: 'acceptedQuote',
      populate: { path: 'company', select: 'companyName logo averageRating phone' },
    });

  if (!request) {
    return notFound(res, 'Demande de déménagement introuvable');
  }

  // Access control
  if (req.user.role === 'client') {
    if (request.client._id.toString() !== req.user._id.toString()) {
      return forbidden(res, 'Accès non autorisé à cette demande.');
    }
  } else if (req.user.role === 'company') {
    const company = req.company || (await Company.findOne({ user: req.user._id }));
    if (!company || company.verificationStatus !== 'approved') {
      return forbidden(res, 'Votre entreprise doit être validée pour consulter les demandes.');
    }
  }
  // Admins have unrestricted access

  return success(res, { request }, 'Demande récupérée avec succès');
});

/**
 * PUT /api/v1/moving-requests/:id
 * Client updates pending request
 */
const updateRequest = catchAsync(async (req, res) => {
  const request = await MovingRequest.findById(req.params.id);
  if (!request) {
    return notFound(res, 'Demande introuvable');
  }

  if (request.client.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Vous ne pouvez modifier que vos propres demandes.');
  }

  // Security rule: Once quotes have been submitted by companies, publication is locked to protect quote price validity
  const existingQuotesCount = await Quote.countDocuments({
    movingRequest: request._id,
    status: { $in: ['submitted', 'viewed', 'accepted'] },
  });

  if (request.status !== 'pending' || (request.quotesCount && request.quotesCount > 0) || existingQuotesCount > 0) {
    return badRequest(
      res,
      'Cette publication est verrouillée et ne peut plus être modifiée car des devis ont déjà été émis par des déménageurs.'
    );
  }

  const {
    title,
    departureAddress,
    departureHousingType,
    departureFloor,
    departureElevator,
    departureSurface,
    departureRooms,
    arrivalAddress,
    arrivalHousingType,
    arrivalFloor,
    arrivalElevator,
    arrivalSurface,
    arrivalRooms,
    furniture,
    appliances,
    estimatedBoxes,
    estimatedVolume,
    fragileItems,
    fragileItemsDescription,
    heavyItems,
    preferredDate,
    flexibleDates,
    alternativeDates,
    additionalServices,
    comments,
    estimatedBudget,
  } = req.body;

  if (title !== undefined) request.customTitle = title ? String(title).trim() : '';
  if (departureAddress !== undefined) request.departureAddress = safeParse(departureAddress);
  if (arrivalAddress !== undefined) request.arrivalAddress = safeParse(arrivalAddress);
  if (departureHousingType !== undefined) request.departureHousingType = departureHousingType;
  if (departureFloor !== undefined) request.departureFloor = parseInt(departureFloor, 10) || 0;
  if (departureElevator !== undefined) request.departureElevator = departureElevator === 'true' || departureElevator === true;
  if (departureSurface !== undefined) request.departureSurface = parseFloat(departureSurface);
  if (departureRooms !== undefined) request.departureRooms = parseInt(departureRooms, 10);
  if (arrivalHousingType !== undefined) request.arrivalHousingType = arrivalHousingType;
  if (arrivalFloor !== undefined) request.arrivalFloor = parseInt(arrivalFloor, 10) || 0;
  if (arrivalElevator !== undefined) request.arrivalElevator = arrivalElevator === 'true' || arrivalElevator === true;
  if (arrivalSurface !== undefined) request.arrivalSurface = parseFloat(arrivalSurface);
  if (arrivalRooms !== undefined) request.arrivalRooms = parseInt(arrivalRooms, 10);
  if (furniture !== undefined) request.furniture = safeParse(furniture, []);
  if (appliances !== undefined) request.appliances = safeParse(appliances, []);
  if (estimatedBoxes !== undefined) request.estimatedBoxes = parseInt(estimatedBoxes, 10) || 0;
  if (estimatedVolume !== undefined) request.estimatedVolume = parseFloat(estimatedVolume) || 0;
  if (fragileItems !== undefined) request.fragileItems = fragileItems === 'true' || fragileItems === true;
  if (fragileItemsDescription !== undefined) request.fragileItemsDescription = fragileItemsDescription;
  if (heavyItems !== undefined) request.heavyItems = heavyItems === 'true' || heavyItems === true;
  if (preferredDate !== undefined) request.preferredDate = preferredDate ? new Date(preferredDate) : undefined;
  if (flexibleDates !== undefined) request.flexibleDates = flexibleDates === 'true' || flexibleDates === true;
  if (alternativeDates !== undefined) request.alternativeDates = safeParse(alternativeDates, []);
  if (additionalServices !== undefined) request.additionalServices = safeParse(additionalServices, {});
  if (comments !== undefined) request.comments = comments;
  if (estimatedBudget !== undefined) request.estimatedBudget = estimatedBudget;

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const newPhotos = req.files.map((file) => ({
      filePath: file.path.replace(/\\/g, '/'),
      caption: file.originalname,
      uploadedAt: new Date(),
    }));
    request.photos.push(...newPhotos);
  }

  await request.save();
  return success(res, { request }, 'Demande mise à jour avec succès');
});

/**
 * DELETE /api/v1/moving-requests/:id
 * Client cancels own pending request; Admin can delete/cancel any
 */
const deleteRequest = catchAsync(async (req, res) => {
  const request = await MovingRequest.findById(req.params.id);
  if (!request) {
    return notFound(res, 'Demande introuvable');
  }

  if (req.user.role === 'client') {
    if (request.client.toString() !== req.user._id.toString()) {
      return forbidden(res, 'Vous ne pouvez annuler que vos propres demandes.');
    }
    if (request.status === 'booked' || request.status === 'completed') {
      return badRequest(res, `Impossible d'annuler une demande déjà en statut "${request.status}".`);
    }
    request.status = 'cancelled';
    await request.save();
    return success(res, { id: request._id }, 'Demande annulée avec succès');
  }

  if (req.user.role === 'admin') {
    request.status = 'cancelled';
    await request.save();
    return success(res, { id: request._id }, 'Demande annulée par l\'administrateur');
  }

  return forbidden(res, 'Action non autorisée');
});

/**
 * GET /api/v1/moving-requests/available
 * Approved companies view available moving requests in their service areas
 */
const getAvailableRequests = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { governorate, dateFrom, dateTo, housingType } = req.query;

  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company || company.verificationStatus !== 'approved') {
    return forbidden(res, 'Seules les entreprises validées peuvent voir les demandes disponibles.');
  }

  const filter = {
    status: { $in: ['pending', 'quoted'] },
    isVisible: true,
  };

  // Service areas matching
  if (company.serviceAreas && company.serviceAreas.length > 0) {
    filter.$or = [
      { 'departureAddress.governorate': { $in: company.serviceAreas } },
      { 'arrivalAddress.governorate': { $in: company.serviceAreas } },
    ];
  }

  // Query filters
  if (governorate) {
    const govFilter = [
      { 'departureAddress.governorate': { $regex: governorate, $options: 'i' } },
      { 'arrivalAddress.governorate': { $regex: governorate, $options: 'i' } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: govFilter }];
      delete filter.$or;
    } else {
      filter.$or = govFilter;
    }
  }

  if (housingType) {
    filter.departureHousingType = housingType;
  }

  if (dateFrom || dateTo) {
    filter.preferredDate = {};
    if (dateFrom) filter.preferredDate.$gte = new Date(dateFrom);
    if (dateTo) filter.preferredDate.$lte = new Date(dateTo);
  }

  const total = await MovingRequest.countDocuments(filter);
  const requests = await MovingRequest.find(filter)
    .populate('client', 'firstName lastName phone email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, requests, pagination, 'Demandes disponibles pour votre entreprise');
});

/**
 * POST /api/v1/moving-requests/:id/view
 * Company records that they viewed a moving request
 */
const markRequestViewed = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const request = await MovingRequest.findById(req.params.id);
  if (!request) {
    return notFound(res, 'Demande introuvable');
  }

  const alreadyViewed = request.viewedBy.some(
    (v) => v.company && v.company.toString() === company._id.toString()
  );

  if (!alreadyViewed) {
    request.viewedBy.push({
      company: company._id,
      viewedAt: new Date(),
    });
    await request.save();
  }

  return success(res, { viewed: true }, 'Demande marquée comme consultée');
});

/**
 * GET /api/v1/admin/requests
 * Admin view of all requests with status and city filter
 */
const getAllRequests = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status, city, search } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  if (city) {
    filter.$or = [
      { 'departureAddress.city': { $regex: city, $options: 'i' } },
      { 'arrivalAddress.city': { $regex: city, $options: 'i' } },
    ];
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      ...(filter.$or || []),
      { 'departureAddress.city': { $regex: s, $options: 'i' } },
      { 'arrivalAddress.city': { $regex: s, $options: 'i' } },
      { 'departureAddress.governorate': { $regex: s, $options: 'i' } },
      { 'arrivalAddress.governorate': { $regex: s, $options: 'i' } },
    ];
  }

  const total = await MovingRequest.countDocuments(filter);
  const requests = await MovingRequest.find(filter)
    .populate('client', 'firstName lastName email phone')
    .populate({
      path: 'acceptedQuote',
      populate: { path: 'company', select: 'companyName phone' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, requests, pagination, 'Liste des demandes de déménagement');
});

/**
 * GET /api/v1/moving-requests/public
 * Public moving requests listing for visitors and moving companies
 */
const getPublicRequests = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
  const { governorate, housingType, search } = req.query;

  const filter = {
    status: { $in: ['pending', 'quoted'] },
    isVisible: true,
  };

  if (governorate && governorate !== 'all') {
    filter.$or = [
      { 'departureAddress.governorate': { $regex: governorate, $options: 'i' } },
      { 'departureAddress.city': { $regex: governorate, $options: 'i' } },
    ];
  }

  if (housingType && housingType !== 'all') {
    filter.departureHousingType = housingType;
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      ...(filter.$or || []),
      { customTitle: { $regex: s, $options: 'i' } },
      { 'departureAddress.city': { $regex: s, $options: 'i' } },
      { 'arrivalAddress.city': { $regex: s, $options: 'i' } },
      { 'departureAddress.governorate': { $regex: s, $options: 'i' } },
      { 'arrivalAddress.governorate': { $regex: s, $options: 'i' } },
    ];
  }

  const total = await MovingRequest.countDocuments(filter);
  const requests = await MovingRequest.find(filter)
    .populate('client', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, requests, pagination, 'Demandes de déménagement publiques');
});

/**
 * GET /api/v1/moving-requests/public/:id
 * Retrieve details of a public moving request (with addresses & GPS coordinates)
 */
const getPublicRequestById = catchAsync(async (req, res) => {
  const request = await MovingRequest.findById(req.params.id)
    .populate('client', 'firstName lastName');

  if (!request) {
    return notFound(res, 'Demande de déménagement introuvable');
  }

  return success(res, { request }, 'Détail de la demande publique');
});

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getAvailableRequests,
  markRequestViewed,
  getAllRequests,
  getPublicRequests,
  getPublicRequestById,
};
