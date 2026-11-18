const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const {
  success,
  created,
  paginated,
  notFound,
  badRequest,
  buildPagination,
} = require('../utils/apiResponse');
const { createNotification } = require('../services/notification.service');
const { sendContactConfirmation, sendEmail } = require('../services/email.service');

/**
 * POST /api/v1/contact
 * Public endpoint to submit a contact message
 */
const submitContactMessage = catchAsync(async (req, res) => {
  const { name, email, phone, governorate, subject, message } = req.body;

  if (!name || !name.trim()) {
    return badRequest(res, 'Le nom complet est obligatoire.');
  }
  if (!email || !email.trim()) {
    return badRequest(res, "L'adresse email est obligatoire.");
  }
  if (!message || !message.trim()) {
    return badRequest(res, 'Le message est obligatoire.');
  }

  const contactMessage = await ContactMessage.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    governorate: governorate ? governorate.trim() : 'Tunis',
    subject: subject ? subject.trim() : 'Demande générale',
    message: message.trim(),
    status: 'new',
  });

  // Send email confirmation to user
  try {
    await sendContactConfirmation({
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
    });
  } catch (emailErr) {
    console.warn('Could not send contact confirmation email:', emailErr.message);
  }

  // Notify admins in real-time
  try {
    const io = req.app.get('io');
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        title: 'Nouveau message de contact 📩',
        message: `${name.trim()} (${governorate || 'Tunis'}): ${subject || 'Demande générale'}`,
        type: 'system',
        entityType: 'user',
        entityId: contactMessage._id,
        link: `/admin/support?tab=contact`,
        io,
      });
    }
  } catch (notifyErr) {
    console.warn('Could not notify admins of contact message:', notifyErr.message);
  }

  // Send confirmation email to the user
  try {
    const { sendContactConfirmation } = require('../services/email.service');
    await sendContactConfirmation({
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
    });
  } catch (emailErr) {
    console.warn('Could not send confirmation email:', emailErr.message);
  }

  return created(
    res,
    { contactMessage },
    'Votre message a été transmis avec succès à nos coordinateurs logistiques.'
  );
});

/**
 * GET /api/v1/admin/contact
 * Admin lists all received contact requests with filters
 */
const getAllContactMessages = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status, governorate, search } = req.query;

  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (governorate && governorate !== 'all') {
    filter.governorate = governorate;
  }
  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { subject: { $regex: s, $options: 'i' } },
      { message: { $regex: s, $options: 'i' } },
    ];
  }

  const total = await ContactMessage.countDocuments(filter);
  const messages = await ContactMessage.find(filter)
    .populate('repliedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, messages, pagination, 'Messages de contact');
});

/**
 * GET /api/v1/admin/contact/:id
 * Admin views single contact message
 */
const getContactMessageById = catchAsync(async (req, res) => {
  const contactMessage = await ContactMessage.findById(req.params.id).populate(
    'repliedBy',
    'firstName lastName email'
  );
  if (!contactMessage) {
    return notFound(res, 'Message de contact introuvable.');
  }
  return success(res, { contactMessage }, 'Détail du message');
});

/**
 * PATCH /api/v1/admin/contact/:id
 * Admin updates status and notes of a contact message
 */
const updateContactMessageStatus = catchAsync(async (req, res) => {
  const { status, adminNotes } = req.body;
  const contactMessage = await ContactMessage.findById(req.params.id);

  if (!contactMessage) {
    return notFound(res, 'Message de contact introuvable.');
  }

  if (status) {
    const allowed = ['new', 'in_progress', 'replied', 'archived'];
    if (!allowed.includes(status)) {
      return badRequest(res, `Statut invalide. Valeurs autorisées: ${allowed.join(', ')}`);
    }
    contactMessage.status = status;
    if (status === 'replied') {
      contactMessage.repliedAt = new Date();
      contactMessage.repliedBy = req.user._id;
    }
  }

  if (adminNotes !== undefined) {
    contactMessage.adminNotes = adminNotes;
  }

  await contactMessage.save();
  return success(res, { contactMessage }, 'Statut du message mis à jour avec succès.');
});

/**
 * DELETE /api/v1/admin/contact/:id
 * Admin deletes a contact message
 */
const deleteContactMessage = catchAsync(async (req, res) => {
  const contactMessage = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!contactMessage) {
    return notFound(res, 'Message de contact introuvable.');
  }
  return success(res, null, 'Message de contact supprimé avec succès.');
});

/**
 * POST /api/v1/admin/contact/:id/reply
 * Admin sends a direct email reply to the contact message sender
 */
const replyToContactMessage = catchAsync(async (req, res) => {
  const { replyMessage, adminNotes } = req.body;

  if (!replyMessage || !replyMessage.trim()) {
    return badRequest(res, 'Le contenu de la réponse est obligatoire.');
  }

  const contactMessage = await ContactMessage.findById(req.params.id);
  if (!contactMessage) {
    return notFound(res, 'Message de contact introuvable.');
  }

  // Send reply email to the contact
  try {
    await sendEmail({
      to: contactMessage.email,
      subject: `Réponse MoversGo : ${contactMessage.subject || 'Votre demande'}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #800020, #4a0012); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Support & Assistance Logistique</p>
          </div>
          <div style="background: #f8fafc; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 8px;">Bonjour ${contactMessage.name},</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">En réponse à votre message concernant : <strong>"${contactMessage.subject || 'Demande générale'}"</strong></p>
            <div style="background: white; border-left: 4px solid #800020; border-radius: 8px; padding: 20px; margin: 0 0 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
              <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.7; white-space: pre-line;">${replyMessage.trim()}</p>
            </div>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
              <p style="margin: 0; color: #9f1239; font-size: 12px;">
                📌 <strong>Votre message original :</strong> « ${contactMessage.message.substring(0, 200)}${contactMessage.message.length > 200 ? '...' : ''} »
              </p>
            </div>
            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              © 2024 MoversGo Tunisie — Plateforme de déménagement agréé en Tunisie<br/>
              Cet email est une réponse officielle à votre demande. Ne pas répondre directement à cet email.
            </p>
          </div>
        </div>
      `,
      text: `MoversGo Tunisie - Réponse à votre message :\n\n${replyMessage.trim()}\n\n---\nVotre message : ${contactMessage.message}`,
    });
  } catch (emailErr) {
    console.warn('Could not send reply email:', emailErr.message);
  }

  // Update status to replied
  contactMessage.status = 'replied';
  contactMessage.repliedAt = new Date();
  contactMessage.repliedBy = req.user._id;
  if (adminNotes) contactMessage.adminNotes = adminNotes;

  // Store reply in adminNotes if no dedicated field
  const replyRecord = `[${new Date().toLocaleString('fr-TN')}] Admin (${req.user.firstName} ${req.user.lastName}): ${replyMessage.trim()}`;
  contactMessage.adminNotes = contactMessage.adminNotes
    ? `${contactMessage.adminNotes}\n\n${replyRecord}`
    : replyRecord;

  await contactMessage.save();

  return success(res, { contactMessage }, `Réponse envoyée avec succès à ${contactMessage.email}`);
});

module.exports = {
  submitContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  deleteContactMessage,
  replyToContactMessage,
};
