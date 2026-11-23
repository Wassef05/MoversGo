const Company = require('../models/Company');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const Transaction = require('../models/Transaction');
const MovingRequest = require('../models/MovingRequest');
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
const { sendEmail, templates } = require('../services/email.service');

/**
 * Helper to parse arrays from JSON strings or comma-separated strings
 */
const parseArray = (field) => {
  if (!field) return undefined;
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON
    }
    return field.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
};

/**
 * GET /api/v1/companies
 * Public listing of approved companies with filters and pagination
 */
const getPublicCompanies = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { governorate, minRating, search } = req.query;

  const filter = {
    verificationStatus: 'approved',
    isActive: true,
  };

  if (governorate) {
    filter.$or = [
      { 'address.governorate': { $regex: governorate, $options: 'i' } },
      { serviceAreas: { $regex: governorate, $options: 'i' } },
    ];
  }

  if (minRating) {
    const ratingNum = parseFloat(minRating);
    if (!isNaN(ratingNum)) {
      filter.averageRating = { $gte: ratingNum };
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      ...(filter.$or || []),
      { companyName: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { services: { $regex: s, $options: 'i' } },
    ];
  }

  const total = await Company.countDocuments(filter);
  const companies = await Company.find(filter)
    .select('-documents')
    .populate('user', 'firstName lastName email phone')
    .sort({ featured: -1, averageRating: -1, totalReviews: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, companies, pagination, 'Entreprises récupérées avec succès');
});

/**
 * GET /api/v1/companies/:id
 * Public company profile detail (hiding sensitive documents)
 */
const getPublicCompanyById = catchAsync(async (req, res) => {
  const company = await Company.findOne({
    _id: req.params.id,
    verificationStatus: 'approved',
    isActive: true,
  })
    .select('-documents')
    .populate('user', 'firstName lastName email phone');

  if (!company) {
    return notFound(res, 'Entreprise introuvable ou non disponible');
  }

  return success(res, { company }, 'Détails de l\'entreprise récupérés avec succès');
});

/**
 * GET /api/v1/companies/me
 * Company user's own profile with full document details
 */
const getMyCompanyProfile = catchAsync(async (req, res) => {
  const company = await Company.findOne({ user: req.user._id }).populate(
    'user',
    'firstName lastName email phone profileImage'
  );

  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  return success(res, { company }, 'Votre profil entreprise');
});

/**
 * PUT /api/v1/companies/me
 * Update company profile
 */
const updateMyCompanyProfile = catchAsync(async (req, res) => {
  const company = await Company.findOne({ user: req.user._id });
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const {
    companyName,
    description,
    services,
    serviceAreas,
    phone,
    email,
    website,
    address,
    fleetSize,
    employeesCount,
    legalIdentifier,
    legalStatus,
    licenseNumber,
    rneNumber,
  } = req.body;

  if (companyName !== undefined) company.companyName = companyName.trim();
  if (description !== undefined) company.description = description.trim();
  if (phone !== undefined) company.phone = phone.trim();
  if (email !== undefined) company.email = email.trim();
  if (website !== undefined) company.website = website.trim();
  if (legalIdentifier !== undefined) company.legalIdentifier = legalIdentifier.trim();
  if (legalStatus !== undefined) company.legalStatus = legalStatus.trim();
  if (licenseNumber !== undefined) company.licenseNumber = licenseNumber.trim();
  if (rneNumber !== undefined) company.rneNumber = rneNumber.trim();

  if (fleetSize !== undefined) company.fleetSize = Math.max(0, parseInt(fleetSize, 10) || 0);
  if (employeesCount !== undefined) company.employeesCount = Math.max(0, parseInt(employeesCount, 10) || 0);

  const parsedServices = parseArray(services);
  if (parsedServices !== undefined) company.services = parsedServices;

  const parsedAreas = parseArray(serviceAreas);
  if (parsedAreas !== undefined) company.serviceAreas = parsedAreas;

  if (address !== undefined || req.body.city !== undefined || req.body.governorate !== undefined || req.body.latitude !== undefined) {
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch {
        parsedAddress = { street: address };
      }
    }
    const addrObj = (typeof parsedAddress === 'object' && parsedAddress !== null) ? parsedAddress : {};

    const street = addrObj.street ?? req.body.street ?? company.address?.street;
    const city = addrObj.city ?? req.body.city ?? company.address?.city;
    const governorate = addrObj.governorate ?? req.body.governorate ?? company.address?.governorate;
    const postalCode = addrObj.postalCode ?? req.body.postalCode ?? company.address?.postalCode;

    const latRaw = req.body.latitude ?? req.body.lat ?? addrObj.latitude ?? company.address?.latitude;
    const lngRaw = req.body.longitude ?? req.body.lng ?? addrObj.longitude ?? company.address?.longitude;
    const lat = latRaw !== undefined && latRaw !== '' ? parseFloat(latRaw) : undefined;
    const lng = lngRaw !== undefined && lngRaw !== '' ? parseFloat(lngRaw) : undefined;

    company.address = {
      street,
      city,
      governorate,
      postalCode,
      latitude: !isNaN(lat) ? lat : undefined,
      longitude: !isNaN(lng) ? lng : undefined,
    };

    if (!isNaN(lat) && !isNaN(lng)) {
      company.location = {
        type: 'Point',
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng,
        formattedAddress: [street, city, governorate].filter(Boolean).join(', '),
      };
    }
  }

  await company.save();
  return success(res, { company }, 'Profil entreprise mis à jour avec succès');
});

/**
 * POST /api/v1/companies/me/logo
 * Update company logo
 */
const updateCompanyLogo = catchAsync(async (req, res) => {
  if (!req.file) {
    return badRequest(res, 'Veuillez télécharger un fichier logo.');
  }

  const company = await Company.findOne({ user: req.user._id });
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  company.logo = req.file.path.replace(/\\/g, '/');
  await company.save();

  return success(res, { logo: company.logo, company }, 'Logo mis à jour avec succès');
});

/**
 * POST /api/v1/companies/me/documents
 * Push uploaded document to company's documents array
 */
const uploadCompanyDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    return badRequest(res, 'Veuillez télécharger un fichier document.');
  }

  const company = await Company.findOne({ user: req.user._id });
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const newDoc = {
    name: req.body.name || req.file.originalname,
    filePath: req.file.path.replace(/\\/g, '/'),
    fileType: req.file.mimetype,
    status: 'pending',
    uploadedAt: new Date(),
  };

  company.documents.push(newDoc);
  await company.save();

  const createdDoc = company.documents[company.documents.length - 1];
  return created(res, { document: createdDoc, company }, 'Document ajouté avec succès');
});

/**
 * DELETE /api/v1/companies/me/documents/:docId
 * Remove a document by its subdocument id
 */
const deleteCompanyDocument = catchAsync(async (req, res) => {
  const company = await Company.findOne({ user: req.user._id });
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const doc = company.documents.id(req.params.docId);
  if (!doc) {
    return notFound(res, 'Document introuvable');
  }

  company.documents.pull(req.params.docId);
  await company.save();

  return success(res, null, 'Document supprimé avec succès');
});

/**
 * GET /api/v1/admin/companies/pending
 * Pending and under review companies for admin verification
 */
const getPendingCompanies = catchAsync(async (req, res) => {
  const companies = await Company.find({
    verificationStatus: { $in: ['pending', 'under_review', 'needs_rectification'] },
  })
    .populate('user', 'firstName lastName email phone createdAt')
    .sort({ createdAt: 1 });

  return success(res, { companies }, 'Entreprises en attente de vérification');
});

/**
 * GET /api/v1/admin/companies
 * Paginated companies list for admin
 */
const getAllCompanies = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { verificationStatus, search } = req.query;

  const filter = {};
  if (verificationStatus) {
    filter.verificationStatus = verificationStatus;
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { companyName: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { legalIdentifier: { $regex: s, $options: 'i' } },
    ];
  }

  const total = await Company.countDocuments(filter);
  const companies = await Company.find(filter)
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, companies, pagination, 'Liste des entreprises récupérée avec succès');
});

/**
 * PATCH /api/v1/admin/companies/:id/approve
 * Admin approves company
 */
const approveCompany = catchAsync(async (req, res) => {
  const company = await Company.findById(req.params.id).populate('user');
  if (!company) {
    return notFound(res, 'Entreprise introuvable');
  }

  company.verificationStatus = 'approved';
  company.verifiedAt = new Date();
  company.verifiedBy = req.user._id;
  company.rejectionReason = null;
  company.isActive = true;
  await company.save();

  // Make sure company user is active
  if (company.user) {
    await User.findByIdAndUpdate(company.user._id, { isActive: true });

    // Send real-time notification
    const io = req.app.get('io');
    await createNotification({
      recipientId: company.user._id,
      title: 'Entreprise validée ! 🎉',
      message: `Félicitations ! Votre entreprise "${company.companyName}" a été validée. Vous pouvez maintenant accéder aux demandes de déménagement.`,
      type: 'company_approved',
      entityType: 'company',
      entityId: company._id,
      io,
    });

    // Send email notification to company
    const recipientEmail = company.user?.email || company.email;
    if (recipientEmail) {
      const emailTemplate = templates.companyApproved(
        company.user?.firstName || 'Gérant Partenaire',
        company.companyName
      );
      await sendEmail({ to: recipientEmail, ...emailTemplate });
    }
  }

  return success(res, { company }, `L'entreprise "${company.companyName}" a été validée avec succès.`);
});

/**
 * PATCH /api/v1/admin/companies/:id/reject
 * Admin rejects company or requests document rectification
 */
const rejectCompany = catchAsync(async (req, res) => {
  const { rejectionReason, rectificationNotes, isRectification } = req.body;
  const reasonText = (rectificationNotes || rejectionReason || 'Dossier incomplet ou informations non conformes.').trim();

  const company = await Company.findById(req.params.id).populate('user');
  if (!company) {
    return notFound(res, 'Entreprise introuvable');
  }

  const statusToSet = isRectification ? 'needs_rectification' : 'rejected';
  company.verificationStatus = statusToSet;
  company.rejectionReason = reasonText;
  company.rectificationNotes = reasonText;
  company.isActive = false;
  await company.save();

  if (company.user) {
    const io = req.app.get('io');
    await createNotification({
      recipientId: company.user._id,
      title: isRectification ? 'Rectification requise pour votre dossier ⚠️' : 'Dossier entreprise non validé',
      message: `Remarques de l'administration : ${reasonText.slice(0, 140)}`,
      type: isRectification ? 'company_rectification' : 'company_rejected',
      entityType: 'company',
      entityId: company._id,
      link: '/company/dashboard',
      io,
    });

    const recipientEmail = company.user?.email || company.email;
    if (recipientEmail && templates.companyRectificationRequested) {
      const emailTemplate = templates.companyRectificationRequested(
        company.user?.firstName || 'Gérant Partenaire',
        company.companyName,
        reasonText
      );
      await sendEmail({ to: recipientEmail, ...emailTemplate });
    }
  }

  return success(res, { company }, `Décision enregistrée et notifiée par email à "${company.companyName}".`);
});

/**
 * PATCH /api/v1/admin/companies/:id/rectify
 * Admin sends specific rectification notes to company
 */
const requestCompanyRectification = catchAsync(async (req, res) => {
  const { notes, rectificationNotes } = req.body;
  const noteContent = (notes || rectificationNotes || 'Veuillez fournir un extrait RNE de moins de 3 mois et vérifier vos coordonnées légales.').trim();

  const company = await Company.findById(req.params.id).populate('user');
  if (!company) {
    return notFound(res, 'Entreprise introuvable');
  }

  company.verificationStatus = 'needs_rectification';
  company.rectificationNotes = noteContent;
  company.rejectionReason = noteContent;
  company.isActive = false;
  await company.save();

  if (company.user) {
    const io = req.app.get('io');
    await createNotification({
      recipientId: company.user._id,
      title: 'Rectification demandée pour votre compte ⚠️',
      message: `L'administration MoversGo a examiné votre dossier : ${noteContent.slice(0, 140)}...`,
      type: 'company_rectification',
      entityType: 'company',
      entityId: company._id,
      link: '/company/dashboard',
      io,
    });

    const recipientEmail = company.user?.email || company.email;
    if (recipientEmail && templates.companyRectificationRequested) {
      const emailTemplate = templates.companyRectificationRequested(
        company.user?.firstName || 'Gérant Partenaire',
        company.companyName,
        noteContent
      );
      await sendEmail({ to: recipientEmail, ...emailTemplate });
    }
  }

  return success(res, { company }, `Remarques de rectification envoyées par email à l'entreprise "${company.companyName}".`);
});

/**
 * POST /api/v1/companies/me/resubmit-rne
 * Company resubmits an updated RNE document or coordinates after rectification request
 */
const resubmitRneDocument = catchAsync(async (req, res) => {
  const company = await Company.findOne({ user: req.user._id }).populate('user');
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const rneFile = req.file || req.files?.rneDocument?.[0];
  if (rneFile) {
    company.rneDocument = {
      filePath: rneFile.path.replace(/\\/g, '/'),
      originalName: rneFile.originalname,
      uploadedAt: new Date(),
    };
  }

  const logoFile = req.files?.logo?.[0];
  if (logoFile) {
    company.logo = logoFile.path.replace(/\\/g, '/');
    if (company.user) {
      await User.findByIdAndUpdate(company.user._id || company.user, { profileImage: company.logo });
    }
  }

  if (req.body.legalIdentifier) {
    company.legalIdentifier = req.body.legalIdentifier.trim();
  }
  if (req.body.companyName) {
    company.companyName = req.body.companyName.trim();
  }
  if (req.body.phone) {
    company.phone = req.body.phone.trim();
  }
  if (req.body.firstName || req.body.lastName) {
    if (company.user) {
      await User.findByIdAndUpdate(company.user._id || company.user, {
        ...(req.body.firstName && { firstName: req.body.firstName.trim() }),
        ...(req.body.lastName && { lastName: req.body.lastName.trim() }),
      });
    }
  }

  company.verificationStatus = 'pending';
  company.rejectionReason = null;
  company.rectificationNotes = null;
  await company.save();

  // Notify admins that updated documents were submitted
  const admins = await User.find({ role: 'admin' });
  const io = req.app.get('io');
  for (const admin of admins) {
    await createNotification({
      recipientId: admin._id,
      title: 'Dossier RNE actualisé 📄',
      message: `L'entreprise "${company.companyName}" a soumis un nouvel extrait RNE suite à vos remarques.`,
      type: 'company_registration',
      entityType: 'company',
      entityId: company._id,
      link: '/admin/companies/pending',
      io,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || admins[0]?.email || 'rihemlazaar5@gmail.com';
  if (templates.adminNewCompanyRegistration) {
    const emailTemplate = templates.adminNewCompanyRegistration(
      company.companyName,
      `${company.user?.firstName || ''} ${company.user?.lastName || ''}`.trim() || 'Gérant',
      company.legalIdentifier,
      company.user?.email || company.email,
      company.phone || company.user?.phone
    );
    await sendEmail({ to: adminEmail, ...emailTemplate });
  }

  return success(res, { company }, "Votre extrait RNE a été actualisé et transmis à l'administrateur pour validation.");
});

/**
 * PATCH /api/v1/admin/companies/:id/suspend
 * Admin suspends company and its user account
 */
const suspendCompany = catchAsync(async (req, res) => {
  const company = await Company.findById(req.params.id).populate('user');
  if (!company) {
    return notFound(res, 'Entreprise introuvable');
  }

  company.verificationStatus = 'suspended';
  company.isActive = false;
  await company.save();

  if (company.user) {
    await User.findByIdAndUpdate(company.user._id, { isActive: false });

    const io = req.app.get('io');
    await createNotification({
      recipientId: company.user._id,
      title: 'Compte entreprise suspendu',
      message: `Votre compte entreprise "${company.companyName}" a été suspendu par un administrateur.`,
      type: 'system',
      entityType: 'company',
      entityId: company._id,
      io,
    });
  }

  return success(res, { company }, `L'entreprise "${company.companyName}" a été suspendue.`);
});

/**
 * GET /api/v1/companies/statistics or /api/v1/companies/me/statistics
 * Comprehensive performance metrics, monthly timelines, volumes, and financial breakdown
 */
const getCompanyStats = catchAsync(async (req, res) => {
  let company = req.company;
  if (!company) {
    company = await Company.findOne({ user: req.user._id });
  }
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  // Find all bookings for this company
  const bookings = await Booking.find({ company: company._id })
    .populate('movingRequest')
    .sort({ createdAt: -1 })
    .lean();

  // Find all quotes for this company
  const quotes = await Quote.find({ company: company._id })
    .sort({ createdAt: -1 })
    .lean();

  // Quote metrics
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted').length;
  const rejectedQuotes = quotes.filter((q) => q.status === 'rejected').length;
  const pendingQuotes = quotes.filter((q) => ['submitted', 'viewed', 'pending'].includes(q.status)).length;
  const conversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

  // Financial metrics
  const caTotal = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const depositReceived = bookings.reduce((sum, b) => sum + (b.depositAmount || 0), 0);
  const platformCommissions = bookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
  const caNet = bookings.reduce((sum, b) => sum + (b.netToCompany || ((b.totalAmount || 0) - (b.platformFee || 0))), 0);
  const remainingToCollect = Math.max(0, caTotal - depositReceived);

  // Operational metrics
  const totalBookings = bookings.length;
  const completedMoves = bookings.filter((b) => b.serviceStatus === 'completed').length;
  const inProgressMoves = bookings.filter((b) => b.serviceStatus === 'in_progress').length;
  const preparationMoves = bookings.filter((b) => b.serviceStatus === 'preparation').length;
  const cancelledMoves = bookings.filter((b) => b.serviceStatus === 'cancelled').length;

  // Volume calculation
  const volumeTotal = bookings.reduce((sum, b) => {
    if (b.movingRequest?.estimatedVolume) {
      return sum + Number(b.movingRequest.estimatedVolume);
    }
    if (b.movingRequest?.departureSurface) {
      return sum + Math.round(Number(b.movingRequest.departureSurface) * 0.4);
    }
    return sum + 20;
  }, 0);

  const averageBasket = totalBookings > 0 ? Math.round(caTotal / totalBookings) : 0;
  const averageVolume = totalBookings > 0 ? Math.round((volumeTotal / totalBookings) * 10) / 10 : 0;

  // Monthly Timeline (last 6 months)
  const monthNamesFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthNamesFull = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const now = new Date();
  const timeline = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    timeline.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      month: monthNamesFr[d.getMonth()],
      monthFull: `${monthNamesFull[d.getMonth()]} ${d.getFullYear()}`,
      ca: 0,
      caNet: 0,
      volume: 0,
      moves: 0,
      devisAcceptes: 0,
    });
  }

  bookings.forEach((b) => {
    const bDate = new Date(b.createdAt || b.scheduledDate || now);
    const target = timeline.find((t) => t.year === bDate.getFullYear() && t.monthIndex === bDate.getMonth());
    if (target) {
      target.ca += (b.totalAmount || 0);
      target.caNet += Math.round((b.netToCompany || b.totalAmount || 0) * 100) / 100;
      target.volume += (b.movingRequest?.estimatedVolume || 20);
      target.moves += 1;
    }
  });

  quotes.forEach((q) => {
    if (q.status === 'accepted') {
      const qDate = new Date(q.createdAt || now);
      const target = timeline.find((t) => t.year === qDate.getFullYear() && t.monthIndex === qDate.getMonth());
      if (target) {
        target.devisAcceptes += 1;
      }
    }
  });

  // Calculate growth vs previous month or baseline
  const currentMonthData = timeline[timeline.length - 1];
  const previousMonthData = timeline[timeline.length - 2];
  let caGrowthPercent = '+28%';
  if (previousMonthData && previousMonthData.ca > 0) {
    const diff = Math.round(((currentMonthData.ca - previousMonthData.ca) / previousMonthData.ca) * 100);
    caGrowthPercent = diff >= 0 ? `+${diff}%` : `${diff}%`;
  } else if (currentMonthData.ca > 0) {
    caGrowthPercent = '+100%';
  }

  // Housing distribution
  const housingMap = {
    apartment: { label: 'Appartement', count: 0 },
    house: { label: 'Villa / Maison', count: 0 },
    villa: { label: 'Villa / Maison', count: 0 },
    office: { label: 'Bureau / Pro', count: 0 },
    commercial: { label: 'Bureau / Pro', count: 0 },
    other: { label: 'Studio / Autre', count: 0 },
  };

  bookings.forEach((b) => {
    const rawType = (b.movingRequest?.departureHousingType || '').toLowerCase();
    if (rawType.includes('app') || rawType.includes('studio') || rawType.includes('étage') || rawType.includes('etage')) {
      housingMap.apartment.count += 1;
    } else if (rawType.includes('villa') || rawType.includes('maison')) {
      housingMap.villa.count += 1;
    } else if (rawType.includes('bur') || rawType.includes('pro') || rawType.includes('commer')) {
      housingMap.office.count += 1;
    } else {
      housingMap.other.count += 1;
    }
  });

  const housingDistribution = Object.values(
    Object.entries(housingMap).reduce((acc, [_, val]) => {
      if (!acc[val.label]) {
        acc[val.label] = { label: val.label, count: 0 };
      }
      acc[val.label].count += val.count;
      return acc;
    }, {})
  ).map((item) => ({
    ...item,
    percentage: totalBookings > 0 ? Math.round((item.count / totalBookings) * 100) : 0,
  }));

  // Benchmark
  let benchmark = 'Performance standard';
  if (conversionRate >= 50) benchmark = 'Top 5% transporteurs';
  else if (conversionRate >= 30) benchmark = 'Top 15% transporteurs';
  else if (conversionRate > 0) benchmark = 'Bonne conversion';

  return success(
    res,
    {
      overview: {
        caTotal,
        caNet,
        depositReceived,
        platformCommissions,
        remainingToCollect,
        caGrowthPercent,
        volumeTotal,
        completedMoves,
        activeMoves: inProgressMoves + preparationMoves,
        totalBookings,
        averageBasket,
        averageVolume,
        conversionRate,
        totalQuotes,
        acceptedQuotes,
        rejectedQuotes,
        pendingQuotes,
        benchmark,
      },
      monthlyTimeline: timeline,
      housingDistribution,
      serviceStatusBreakdown: {
        preparation: preparationMoves,
        in_progress: inProgressMoves,
        completed: completedMoves,
        cancelled: cancelledMoves,
      },
    },
    'Statistiques de performance récupérées avec succès'
  );
});

module.exports = {
  getPublicCompanies,
  getPublicCompanyById,
  getMyCompanyProfile,
  updateMyCompanyProfile,
  updateCompanyLogo,
  uploadCompanyDocument,
  deleteCompanyDocument,
  getPendingCompanies,
  getAllCompanies,
  approveCompany,
  rejectCompany,
  requestCompanyRectification,
  resubmitRneDocument,
  suspendCompany,
  getCompanyStats,
};
