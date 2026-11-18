const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Company = require('../models/Company');
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

/**
 * POST /api/v1/reviews
 * Client creates a review for a completed booking
 */
const createReview = catchAsync(async (req, res) => {
  const {
    booking: bookingId,
    rating,
    punctualityRating,
    careRating,
    professionalismRating,
    valueRating,
    comment,
  } = req.body;

  const numRating = parseFloat(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return badRequest(res, 'La note globale doit être comprise entre 1 et 5.');
  }

  if (!comment || comment.trim().length < 10) {
    return badRequest(res, 'Le commentaire doit comporter au moins 10 caractères.');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return notFound(res, 'Réservation introuvable.');
  }

  if (booking.client.toString() !== req.user._id.toString()) {
    return forbidden(res, 'Vous ne pouvez noter que vos propres réservations.');
  }

  if (booking.serviceStatus !== 'completed') {
    return badRequest(
      res,
      'Vous ne pouvez laisser un avis que lorsque le déménagement est marqué comme terminé.'
    );
  }

  if (booking.hasReview) {
    return badRequest(res, 'Un avis a déjà été soumis pour cette réservation.');
  }

  const existingReview = await Review.findOne({ booking: booking._id });
  if (existingReview) {
    return badRequest(res, 'Un avis existe déjà pour cette réservation.');
  }

  const review = await Review.create({
    client: req.user._id,
    company: booking.company,
    booking: booking._id,
    rating: numRating,
    punctualityRating: punctualityRating ? parseFloat(punctualityRating) : undefined,
    careRating: careRating ? parseFloat(careRating) : undefined,
    professionalismRating: professionalismRating ? parseFloat(professionalismRating) : undefined,
    valueRating: valueRating ? parseFloat(valueRating) : undefined,
    comment: comment.trim(),
    status: 'pending', // Soumis en attente de modération par l'administrateur
    isPublishedToPublic: false,
  });

  // Mark booking as reviewed
  booking.hasReview = true;
  await booking.save();

  // Real-time notifications
  const io = req.app.get('io');
  const companyDoc = await Company.findById(booking.company);

  if (companyDoc?.user) {
    await createNotification({
      recipientId: companyDoc.user,
      title: 'Nouvel avis client reçu ⭐',
      message: `${req.user.firstName} a soumis un avis (${numRating}/5). Il sera visible dès validation par l'administrateur.`,
      type: 'review_submitted',
      entityType: 'review',
      entityId: review._id,
      link: `/company/reviews`,
      io,
    });
  }

  // Notify admins
  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const admin of admins) {
    await createNotification({
      recipientId: admin._id,
      title: 'Nouvel avis à modérer 🛡️',
      message: `Un avis (${numRating}/5) a été soumis pour ${companyDoc?.companyName || 'une entreprise'}.`,
      type: 'review_submitted',
      entityType: 'review',
      entityId: review._id,
      link: `/admin/reviews`,
      io,
    });
  }

  return created(res, { review }, 'Votre avis a été soumis avec succès et sera vérifié par notre équipe de modération.');
});

/**
 * GET /api/v1/reviews/company/:companyId
 * Public list of approved reviews for a given company
 */
const getCompanyReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { publicOnly } = req.query;

  const { companyId } = req.params;
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    return paginated(res, [], buildPagination(page, limit, 0), 'Avis de l\'entreprise');
  }

  const filter = {
    company: companyId,
    status: 'approved',
  };

  // If requesting only reviews approved AND published to public visitor profile
  if (publicOnly === 'true' || publicOnly === true) {
    filter.isPublishedToPublic = true;
  }

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('client', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, reviews, pagination, 'Avis de l\'entreprise');
});

/**
 * GET /api/v1/reviews/public
 * Public list of approved reviews for visitors, home page, and testimonials
 */
const getPublicReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));

  const filter = {
    status: 'approved',
  };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('client', 'firstName lastName')
    .populate('company', 'companyName logo averageRating')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, reviews, pagination, 'Avis clients publics');
});

/**
 * GET /api/v1/reviews/my
 * Client views their submitted reviews
 */
const getMyReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

  const filter = { client: req.user._id };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('company', 'companyName logo averageRating')
    .populate({
      path: 'booking',
      select: 'scheduledDate totalAmount movingRequest',
      populate: { path: 'movingRequest', select: 'departureAddress arrivalAddress' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, reviews, pagination, 'Vos avis');
});

/**
 * GET /api/v1/admin/reviews
 * Admin lists all reviews with status filtering
 */
const getAllReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('client', 'firstName lastName email')
    .populate('company', 'companyName')
    .populate('booking', 'scheduledDate totalAmount')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, reviews, pagination, 'Tous les avis clients');
});

/**
 * PATCH /api/v1/admin/reviews/:id/moderate
 * Admin approves or rejects a review
 */
const moderateReview = catchAsync(async (req, res) => {
  let { status, rejectionReason } = req.body;
  if (status === 'published') status = 'approved';
  if (!['approved', 'rejected'].includes(status)) {
    return badRequest(res, 'Le statut de modération doit être "approved" ou "rejected".');
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return notFound(res, 'Avis introuvable');
  }

  review.status = status;
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  if (status === 'rejected') {
    review.rejectionReason = rejectionReason || 'Avis non conforme aux conditions d\'utilisation.';
  } else {
    review.rejectionReason = undefined;
  }

  await review.save();

  // Notify client
  const io = req.app.get('io');
  await createNotification({
    recipientId: review.client,
    title: status === 'approved' ? 'Avis validé ✅' : 'Avis refusé',
    message:
      status === 'approved'
        ? 'Votre avis a été approuvé par la modération et est disponible pour l\'entreprise.'
        : `Votre avis a été refusé par l'équipe de modération. Motif: ${review.rejectionReason}`,
    type: status === 'approved' ? 'review_approved' : 'system',
    entityType: 'review',
    entityId: review._id,
    io,
  });

  // When admin accepts review, notify the company and make it available in company dashboard
  if (status === 'approved') {
    const compDoc = await Company.findById(review.company);
    if (compDoc?.user) {
      await createNotification({
        recipientId: compDoc.user,
        title: 'Avis client approuvé par la modération ⭐',
        message: `L'avis client (${review.rating}/5) a été validé par l'administrateur. Vous pouvez désormais y répondre et le publier sur votre fiche publique.`,
        type: 'review_approved',
        entityType: 'review',
        entityId: review._id,
        link: '/company/reviews',
        io,
      });
    }
  }

  return success(res, { review }, `Avis ${status === 'approved' ? 'approuvé' : 'rejeté'}`);
});

/**
 * DELETE /api/v1/admin/reviews/:id
 * Admin permanently deletes a review
 */
const deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return notFound(res, 'Avis introuvable');
  }

  // Update booking to mark as not reviewed
  await Booking.findByIdAndUpdate(review.booking, { hasReview: false });

  await review.deleteOne();

  return success(res, {}, 'Avis supprimé définitivement');
});

/**
 * POST /api/v1/reviews/:id/respond
 * Company responds to an approved review
 */
const respondToReview = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return notFound(res, 'Avis introuvable');
  }

  if (review.company.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez répondre qu\'aux avis concernant votre entreprise.');
  }

  if (review.status !== 'approved') {
    return badRequest(res, 'Vous ne pouvez répondre qu\'à un avis validé par la modération.');
  }

  // Accept text, responseText, response, content, or comment to avoid any frontend mismatch
  const text = (
    req.body.text ||
    req.body.responseText ||
    req.body.response ||
    req.body.content ||
    req.body.comment ||
    ''
  ).trim();

  if (!text) {
    return badRequest(res, 'Le texte de votre réponse est obligatoire.');
  }

  review.companyResponse = {
    text,
    respondedAt: new Date(),
  };

  await review.save();

  // Notify client
  const io = req.app.get('io');
  await createNotification({
    recipientId: review.client,
    title: 'Réponse à votre avis 💬',
    message: `${company.companyName} a répondu à votre commentaire.`,
    type: 'system',
    entityType: 'review',
    entityId: review._id,
    io,
  });

  return success(res, { review }, 'Réponse ajoutée avec succès');
});

/**
 * PATCH /api/v1/reviews/:id/toggle-publish
 * Company toggles whether an approved review is published to visitor profile
 */
const togglePublishReview = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return notFound(res, 'Avis introuvable');
  }

  if (review.company.toString() !== company._id.toString()) {
    return forbidden(res, 'Vous ne pouvez modifier que les avis concernant votre entreprise.');
  }

  if (review.status !== 'approved') {
    return badRequest(res, 'Seuls les avis validés par l\'administrateur peuvent être publiés sur votre fiche publique.');
  }

  review.isPublishedToPublic = !review.isPublishedToPublic;
  await review.save();

  return success(
    res,
    { review },
    review.isPublishedToPublic
      ? 'Avis publié sur votre fiche publique visiteur !'
      : 'Avis masqué de votre fiche publique visiteur.'
  );
});

module.exports = {
  createReview,
  getCompanyReviews,
  getPublicReviews,
  getMyReviews,
  getAllReviews,
  moderateReview,
  respondToReview,
  togglePublishReview,
  deleteReview,
};
