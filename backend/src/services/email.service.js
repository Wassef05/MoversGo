const nodemailer = require('nodemailer');

let transporter = null;
let emailEnabled = false;

/**
 * Initialize email transporter
 * Gracefully disabled if credentials are not configured
 */
const initEmailService = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email service disabled: EMAIL_USER or EMAIL_PASS not configured.');
    emailEnabled = false;
    return;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Enable immediately as transporter is initialized
  emailEnabled = true;

  transporter.verify((err) => {
    if (err) {
      console.warn('⚠️  Email transporter verification warning:', err.message);
    } else {
      console.log('✅ Email service ready');
    }
  });
};

/**
 * Send an email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    initEmailService();
  }

  if (!transporter) {
    console.log(`📧 [Email skipped - not configured] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    const sender = process.env.EMAIL_FROM || `"MoversGo" <${process.env.EMAIL_USER || 'rihemlazaar5@gmail.com'}>`;
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email send error to ${to}:`, err.message);
    return { error: err.message };
  }
};

// Email templates
const templates = {
  emailVerification: (firstName, code) => ({
    subject: `MoversGo - Vérification de votre compte (Code: ${code})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #cf0000, #9f1239); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">MoversGo</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">La 1ère plateforme de déménagement en Tunisie</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a;">Bonjour ${firstName} 👋</h2>
          <p style="color: #475569;">Merci de vous être inscrit sur MoversGo. Votre code de vérification est :</p>
          <div style="background: white; border: 2px solid #cf0000; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #cf0000;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color: #94a3b8; font-size: 12px;">Si vous n'avez pas créé ce compte, ignorez cet email.</p>
        </div>
      </div>
    `,
    text: `MoversGo - Code de vérification: ${code}`,
  }),

  passwordReset: (firstName, resetUrl) => ({
    subject: 'MoversGo - Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #cf0000, #9f1239); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">MoversGo</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a;">Bonjour ${firstName},</h2>
          <p style="color: #475569;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background: #cf0000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Ce lien expire dans <strong>1 heure</strong>.</p>
          <p style="color: #94a3b8; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      </div>
    `,
    text: `Réinitialisez votre mot de passe: ${resetUrl}`,
  }),

  bookingConfirmation: (clientName, booking) => ({
    subject: `MoversGo - Réservation confirmée 🎉`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #cf0000, #9f1239); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">MoversGo</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a;">🎉 Réservation confirmée, ${clientName}!</h2>
          <p style="color: #475569;">Votre déménagement est officiellement réservé.</p>
          <p style="color: #94a3b8; font-size: 12px;">Ref: ${booking._id}</p>
        </div>
      </div>
    `,
    text: `Réservation confirmée. Ref: ${booking._id}`,
  }),

  companyApproved: (firstName, companyName) => ({
    subject: `MoversGo - Votre entreprise "${companyName}" est validée ✅`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #cf0000, #9f1239); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">MoversGo</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a;">Félicitations ${firstName}! ✅</h2>
          <p style="color: #475569;"><strong>${companyName}</strong> a été validée et peut maintenant accéder aux demandes de déménagement sur MoversGo.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.FRONTEND_URL}/company/dashboard" style="background: #cf0000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
              Accéder à mon tableau de bord
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Votre entreprise ${companyName} est validée sur MoversGo.`,
  }),

  adminNewCompanyRegistration: (companyName, managerName, matriculeFiscal, email, phone) => ({
    subject: `MoversGo - 🔔 Nouvelle entreprise en attente de validation (${companyName})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">MoversGo — Administration</h1>
          <p style="color: #94a3b8; margin: 8px 0 0;">Nouvelle demande d'adhésion transporteur</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px;">Entreprise à valider : <strong>${companyName}</strong></h2>
          <p style="color: #475569; font-size: 14px;">Une nouvelle entreprise de déménagement vient de valider son email et attend l'audit de son dossier légal (Extrait RNE) :</p>
          <ul style="color: #334155; font-size: 14px; line-height: 1.8; list-style-type: none; padding-left: 0;">
            <li>🏢 <strong>Raison sociale :</strong> ${companyName}</li>
            <li>👤 <strong>Gérant :</strong> ${managerName}</li>
            <li>📄 <strong>Matricule fiscal :</strong> ${matriculeFiscal || 'Non renseigné'}</li>
            <li>✉️ <strong>Email pro :</strong> ${email}</li>
            <li>📞 <strong>Téléphone :</strong> ${phone || 'Non renseigné'}</li>
          </ul>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.FRONTEND_URL}/admin/companies/pending" style="background: #cf0000; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Examiner le dossier & l'extrait RNE
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Nouvelle entreprise en attente: ${companyName} (Gérant: ${managerName}, Matricule: ${matriculeFiscal}, Email: ${email}, Téléphone: ${phone})`,
  }),

  companyRectificationRequested: (firstName, companyName, notes) => ({
    subject: `MoversGo - ⚠️ Rectification requise pour votre dossier d'adhésion ("${companyName}")`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">MoversGo</h1>
          <p style="color: #fef3c7; margin: 6px 0 0;">Audit du dossier d'agrément transporteur</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px;">Bonjour ${firstName},</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            L'administration de MoversGo Tunisie a examiné le dossier d'adhésion de votre société <strong>${companyName}</strong>.
            Des rectifications ou pièces justificatives complémentaires sont nécessaires avant la validation de votre agrément.
          </p>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #92400e; font-weight: 700; margin: 0 0 6px 0; font-size: 13px;">Remarques & Rectifications demandées par l'administration :</p>
            <p style="color: #78350f; font-size: 14px; margin: 0; white-space: pre-wrap; line-height: 1.5;">${notes}</p>
          </div>

          <p style="color: #475569; font-size: 13px; line-height: 1.5;">
            Veuillez vous connecter à votre espace transporteur sur MoversGo pour téléverser votre extrait RNE conforme ou actualiser vos coordonnées.
          </p>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/register/company?rectify=true" style="background: #0f172a; color: white; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
              Accéder à mon espace & Rectifier
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 25px; border-top: 1px solid #e2e8f0; pt-4">
            Direction de la Régulation MoversGo Tunisie • Contact assistance : rihemlazaar5@gmail.com
          </p>
        </div>
      </div>
    `,
    text: `MoversGo - Rectification requise pour ${companyName} : ${notes}. Connectez-vous sur ${process.env.FRONTEND_URL}/login pour rectifier votre dossier.`,
  }),

  newMovingRequestForCompany: (companyName, request, directUrl, dashboardUrl) => {
    const departure = request.departureAddress || {};
    const arrival = request.arrivalAddress || {};
    const depCity = departure.city || 'Non précisé';
    const depGov = departure.governorate || '';
    const arrCity = arrival.city || 'Non précisé';
    const arrGov = arrival.governorate || '';

    const dateStr = request.preferredDate
      ? new Date(request.preferredDate).toLocaleDateString('fr-TN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      : 'Date à convenir';

    const volumeStr = request.estimatedVolume ? `${request.estimatedVolume} m³` : 'Non précisé';
    const boxesStr = request.estimatedBoxes ? `${request.estimatedBoxes} cartons` : null;
    const budgetStr = request.estimatedBudget ? `${request.estimatedBudget} TND` : null;

    const services = [];
    if (request.additionalServices?.furnitureDisassembly || request.additionalServices?.furnitureAssembly) {
      services.push('Démontage / Montage meubles');
    }
    if (request.additionalServices?.packing) services.push('Emballage professionnel');
    if (request.additionalServices?.truckLift) services.push('Monte-meubles');
    if (request.additionalServices?.storage) services.push('Garde-meubles');

    const depDetails = [
      request.departureHousingType,
      typeof request.departureFloor === 'number' ? `Étage ${request.departureFloor}` : null,
      request.departureElevator ? 'Avec ascenseur' : (request.departureFloor > 0 ? 'Sans ascenseur' : null),
    ].filter(Boolean).join(' • ');

    const arrDetails = [
      request.arrivalHousingType,
      typeof request.arrivalFloor === 'number' ? `Étage ${request.arrivalFloor}` : null,
      request.arrivalElevator ? 'Avec ascenseur' : (request.arrivalFloor > 0 ? 'Sans ascenseur' : null),
    ].filter(Boolean).join(' • ');

    return {
      subject: `MoversGo - 📦 Nouvelle demande : de ${depCity} vers ${arrCity} (${depGov})`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #cf0000, #9f1239); padding: 32px 24px; text-align: center; color: white;">
            <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
              Avis aux Déménageurs Agréés
            </span>
            <h1 style="margin: 14px 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Nouveau Déménagement Publié 📦</h1>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Une opportunité de mission correspond à votre zone d'activité</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 24px;">
            <p style="color: #0f172a; font-size: 15px; margin: 0 0 16px;">
              Bonjour <strong>${companyName}</strong> 👋,
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Un client vient de publier une nouvelle demande de déménagement sur <strong>MoversGo Tunisie</strong>.
              Consultez ci-dessous les coordonnées et caractéristiques du projet pour soumettre votre devis en priorité.
            </p>

            <!-- Route Card -->
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <div style="display: table; width: 100%;">
                <!-- Departure -->
                <div style="display: table-cell; width: 45%; vertical-align: top;">
                  <span style="display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px;">DÉPART</span>
                  <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${depCity}</div>
                  <div style="font-size: 12px; color: #64748b;">${depGov}</div>
                  ${depDetails ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${depDetails}</div>` : ''}
                </div>

                <!-- Arrow -->
                <div style="display: table-cell; width: 10%; text-align: center; vertical-align: middle; font-size: 20px; color: #cf0000;">
                  ➔
                </div>

                <!-- Arrival -->
                <div style="display: table-cell; width: 45%; vertical-align: top; text-align: right;">
                  <span style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px;">ARRIVÉE</span>
                  <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${arrCity}</div>
                  <div style="font-size: 12px; color: #64748b;">${arrGov}</div>
                  ${arrDetails ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${arrDetails}</div>` : ''}
                </div>
              </div>
            </div>

            <!-- Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; width: 40%;">📅 Date prévue</td>
                  <td style="padding: 10px 0; color: #0f172a; font-weight: 700; text-align: right;">
                    ${dateStr} ${request.flexibleDates ? '<span style="color: #059669; font-size: 11px; font-weight: 600;">(Dates flexibles)</span>' : ''}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">📦 Volume estimé</td>
                  <td style="padding: 10px 0; color: #0f172a; font-weight: 700; text-align: right;">
                    ${volumeStr} ${boxesStr ? `• ${boxesStr}` : ''}
                  </td>
                </tr>
                ${budgetStr ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">💵 Budget indicatif client</td>
                  <td style="padding: 10px 0; color: #cf0000; font-weight: 800; text-align: right;">${budgetStr}</td>
                </tr>` : ''}
                ${services.length > 0 ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">🛠️ Services requis</td>
                  <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">
                    ${services.join(', ')}
                  </td>
                </tr>` : ''}
                ${request.comments ? `
                <tr>
                  <td style="padding: 10px 0; color: #64748b; vertical-align: top;">💬 Précisions client</td>
                  <td style="padding: 10px 0; color: #334155; font-style: italic; text-align: right;">« ${request.comments} »</td>
                </tr>` : ''}
              </tbody>
            </table>

            <!-- Call to action button -->
            <div style="text-align: center; margin: 30px 0 16px;">
              <a href="${directUrl}" style="background: #cf0000; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(207,0,0,0.35);">
                Voir la demande & Déposer mon devis →
              </a>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${dashboardUrl}" style="color: #64748b; font-size: 12px; text-decoration: underline;">
                Accéder directement à mon tableau de bord entreprise
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; margin: 0; text-align: center;">
              Conseil : Les déménageurs répondant dans les 2 premières heures ont 3 fois plus de chances de remporter la mission !
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            MoversGo Tunisie • Registre National des Entreprises (RNE) Transport Agréé<br />
            Pour toute assistance : support@moversgo.tn • Tel : +216 71 000 000
          </div>
        </div>
      `,
      text: `MoversGo - Nouveau déménagement de ${depCity} vers ${arrCity} (${depGov}). Date: ${dateStr}. Volume: ${volumeStr}. Déposer un devis: ${directUrl}`,
    };
  },

  /**
   * Quote accepted notification email sent to moving company
   */
  quoteAcceptedForCompany: ({
    companyName,
    clientName,
    bookingId,
    totalPrice,
    depositAmount,
    depCity,
    arrCity,
    scheduledDate,
  }) => {
    const bookingRef = String(bookingId).slice(-6).toUpperCase();
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/company/bookings/${bookingId}`;

    return {
      subject: `MoversGo - 🚀 Félicitations ! Votre devis a été accepté (#${bookingRef})`,
      html: `
        <div style="font-family: 'Segoe UI', Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #800020, #4a0013); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 600;">Confirmation Officielle d'Acceptation de Devis</p>
          </div>

          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
              🎉 Nouveau Déménagement Confirmé
            </div>

            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
              Excellente nouvelle pour ${companyName} !
            </h2>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Le client <strong>${clientName}</strong> a officiellement accepté votre proposition commerciale. La réservation <strong>#${bookingRef}</strong> est désormais validée sur MoversGo.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Itinéraire :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${depCity} ➔ ${arrCity}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Date prévue :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${scheduledDate || 'À convenir'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Montant Total de la prestation (TTC) :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #800020; text-align: right; font-size: 15px;">${totalPrice} TND</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Acompte convenu (séquestre) :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #047857; text-align: right;">${depositAmount} TND</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${dashboardUrl}" style="background: #800020; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(128,0,32,0.35);">
                Accéder au dossier de réservation →
              </a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; margin: 0; text-align: center;">
              Dès que le client aura consigné son acompte, vous pourrez apposer votre signature numérique sur la facture officielle pour démarrer l'intervention.
            </p>
          </div>

          <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
            MoversGo Tunisie • Plateforme de mise en relation de transporteurs agréés RNE
          </div>
        </div>
      `,
      text: `MoversGo - Devis accepté par ${clientName} (${depCity} vers ${arrCity}). Montant : ${totalPrice} TND. Acompte : ${depositAmount} TND. Consulter la réservation : ${dashboardUrl}`,
    };
  },

  /**
   * Payment receipt email sent to client after deposit is settled
   */
  paymentReceiptForClient: ({
    clientName,
    companyName,
    bookingId,
    paymentRef,
    depositAmount,
    remainingAmount,
    totalPrice,
    depCity,
    arrCity,
    paymentMethod = 'Carte Bancaire Virtuelle',
  }) => {
    const bookingRef = String(bookingId).slice(-6).toUpperCase();
    const bookingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/bookings/${bookingId}`;

    return {
      subject: `MoversGo - 🧾 Reçu officiel de paiement d'acompte (#${paymentRef})`,
      html: `
        <div style="font-family: 'Segoe UI', Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #047857, #065f46); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 600;">Reçu Officiel de Paiement • Compte Séquestre Sécurisé</p>
          </div>

          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
              ✅ Paiement d'acompte consigné avec succès
            </div>

            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
              Merci ${clientName} ! Votre paiement est confirmé.
            </h2>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Nous confirmons la bonne consignation de votre acompte de <strong>${depositAmount} TND</strong> sur le compte séquestre MoversGo pour votre déménagement avec <strong>${companyName}</strong>.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Réf. Transaction :</td>
                  <td style="padding: 8px 0; font-family: monospace; font-weight: 700; color: #0f172a; text-align: right;">${paymentRef}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Réf. Réservation :</td>
                  <td style="padding: 8px 0; font-family: monospace; font-weight: 700; color: #0f172a; text-align: right;">#${bookingRef}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Itinéraire :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${depCity} ➔ ${arrCity}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Moyen de règlement :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${paymentMethod}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Montant Total TTC :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${totalPrice} TND</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #047857; font-weight: 700;">Acompte Consigné (Payé) :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #047857; text-align: right; font-size: 15px;">${depositAmount} TND</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #b45309; font-weight: 700;">Solde restant à régler sur place :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #b45309; text-align: right; font-size: 15px;">${remainingAmount} TND</td>
                </tr>
              </table>
            </div>

            <!-- Prochaine étape : Signature Facture -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <h4 style="color: #1e40af; margin: 0 0 6px; font-size: 13px; font-weight: 700;">
                📝 Prochaine étape : Signature de la Facture & Décharge
              </h4>
              <p style="color: #1e3a8a; font-size: 12px; line-height: 1.5; margin: 0;">
                L'entreprise <strong>${companyName}</strong> a été notifiée et va apposer sa signature numérique officielle sur votre facture. Dès que l'entreprise aura signé, vous recevrez une notification en direct pour consulter la facture et signer votre décharge.
              </p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${bookingUrl}" style="background: #0f172a; color: #ffffff; padding: 13px 26px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                Suivre mon déménagement en direct →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">
              Garantie Séquestre MoversGo : Vos fonds restent protégés jusqu'à la fin de la mission.
            </p>
          </div>
        </div>
      `,
      text: `MoversGo - Reçu d'acompte de ${depositAmount} TND validé (Réf: ${paymentRef}). Solde restant: ${remainingAmount} TND. Suivre la réservation : ${bookingUrl}`,
    };
  },

  /**
   * Deposit received notification email sent to moving company to sign invoice
   */
  depositReceivedForCompany: ({
    companyName,
    clientName,
    bookingId,
    paymentRef,
    depositAmount,
    totalPrice,
    remainingAmount,
    depCity,
    arrCity,
    scheduledDate,
  }) => {
    const bookingRef = String(bookingId).slice(-6).toUpperCase();
    const invoiceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/company/bookings/${bookingId}`;

    return {
      subject: `MoversGo - 💳 Acompte consigné par le client ! Veuillez signer la facture (#${bookingRef})`,
      html: `
        <div style="font-family: 'Segoe UI', Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #047857, #065f46); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 600;">Séquestre Garanti • Acompte Consigné</p>
          </div>

          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; margin-bottom: 16px;">
              ✅ Acompte Sécurisé en Séquestre
            </div>

            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
              Bonjour ${companyName}, l'acompte de ${depositAmount} TND a été consigné !
            </h2>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Le client <strong>${clientName}</strong> a consigné avec succès l'acompte de son déménagement. Les fonds sont désormais protégés sur le compte séquestre MoversGo.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Réf. Paiement :</td>
                  <td style="padding: 8px 0; font-family: monospace; font-weight: 700; color: #0f172a; text-align: right;">${paymentRef}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Itinéraire :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${depCity} ➔ ${arrCity}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Date prévue :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${scheduledDate || 'À convenir'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b;">Acompte Consigné :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #047857; text-align: right; font-size: 15px;">${depositAmount} TND</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Solde Restant à percevoir à la livraison :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #800020; text-align: right;">${remainingAmount} TND</td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #92400e;">
                ✍️ Action requise : La facture officielle a été débloquée. Veuillez apposer votre signature numérique pour la valider et la transmettre au client.
              </p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${invoiceUrl}" style="background: #047857; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(4,120,87,0.35);">
                Consulter et Signer la Facture Numérique →
              </a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; margin: 0; text-align: center;">
              Dès votre signature enregistrée, le client pourra consulter la facture officielle et émarger sa décharge numérique.
            </p>
          </div>

          <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
            MoversGo Tunisie • Garantie de paiement séquestre certifiée
          </div>
        </div>
      `,
      text: `MoversGo - L'acompte de ${depositAmount} TND a été consigné par ${clientName}. Veuillez signer numériquement la facture : ${invoiceUrl}`,
    };
  },

  /**
   * Invoice signed by company notification email sent to client
   */
  invoiceSignedForClient: ({
    clientName,
    companyName,
    bookingId,
    invoiceNumber,
  }) => {
    const bookingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/bookings/${bookingId}`;

    return {
      subject: `MoversGo - ✍️ Facture officielle #${invoiceNumber} signée par votre déménageur`,
      html: `
        <div style="font-family: 'Segoe UI', Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #1e40af, #1e3a8a); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 600;">Facture Finale Disponible & Prête pour Décharge</p>
          </div>

          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
              Bonjour ${clientName},
            </h2>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              L'entreprise <strong>${companyName}</strong> a apposé sa signature numérique officielle et son cachet de transporteur sur votre facture <strong>#${invoiceNumber}</strong>.
            </p>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Vous pouvez maintenant <strong>consulter la facture complète</strong> et signer votre <strong>bon de décharge</strong> directement en ligne. Une fois votre signature enregistrée, la facture finale sera validée et téléchargeable avec la double signature officielle.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${bookingUrl}" style="background: #047857; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(4,120,87,0.35);">
                Consulter la facture & Signer ma décharge →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">
              MoversGo Tunisie • Traçabilité et transparence totale des échanges contractuels
            </p>
          </div>
        </div>
      `,
      text: `MoversGo - Votre facture #${invoiceNumber} a été signée par ${companyName}. Vous pouvez la consulter et signer votre décharge : ${bookingUrl}`,
    };
  },

  /**
   * Invoice fully signed notification sent to company
   */
  invoiceFullySignedForCompany: ({
    companyName,
    clientName,
    bookingId,
    invoiceNumber,
  }) => {
    const bookingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/company/bookings/${bookingId}`;

    return {
      subject: `MoversGo - ✅ Décharge signée par le client pour la facture #${invoiceNumber}`,
      html: `
        <div style="font-family: 'Segoe UI', Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #047857, #065f46); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 600;">Facture Finale 100% Signée & Validée</p>
          </div>

          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
              Bonjour ${companyName},
            </h2>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Le client <strong>${clientName}</strong> a signé électroniquement la décharge de livraison pour la facture <strong>#${invoiceNumber}</strong>.
            </p>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              La facture finale comporte désormais les deux signatures numériques (Entreprise & Client) avec horodatage et empreinte cryptographique certifiée.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${bookingUrl}" style="background: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                Voir la facture finalisée et signée →
              </a>
            </div>
          </div>
        </div>
      `,
      text: `MoversGo - Le client ${clientName} a signé la décharge pour la facture #${invoiceNumber}. Document 100% signé : ${bookingUrl}`,
    };
  },

  /**
   * Moving reminder email sent to client
   */
  movingReminderForClient: ({
    clientName,
    companyName,
    companyPhone,
    scheduledDate,
    scheduledTime,
    countdownText,
    pickupAddress,
    departureAddress,
    deliveryAddress,
    arrivalAddress,
    bookingId,
    volume,
    remindersCount = 1,
  }) => {
    const bookingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/bookings/${bookingId}`;
    const depObj = departureAddress || pickupAddress || {};
    const depCity = depObj.city || depObj.governorate || 'Départ';
    const depAddr = depObj.street || depObj.address ? `${depObj.street || depObj.address}, ${depCity}` : depCity;
    const arrObj = arrivalAddress || deliveryAddress || {};
    const arrCity = arrObj.city || arrObj.governorate || 'Arrivée';
    const arrAddr = arrObj.street || arrObj.address ? `${arrObj.street || arrObj.address}, ${arrCity}` : arrCity;

    return {
      subject: `MoversGo - 🚛 Rappel : Votre déménagement approche (${countdownText})`,
      html: `
        <div style="font-family: 'Segoe UI', Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #800020, #9f1239); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">MoversGo Tunisie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 600;">Rappel d'Intervention & Conseils Déménagement</p>
          </div>

          <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: inline-block; background: #fff1f2; color: #800020; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; border: 1px solid #fecdd3; margin-bottom: 16px;">
              ⏰ Échéance : ${countdownText}
            </div>

            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
              Bonjour ${clientName}, votre déménagement approche !
            </h2>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              L'entreprise <strong>${companyName}</strong> finalise les préparatifs logistiques de votre tournée. Voici un récapitulatif essentiel pour assurer une journée fluide et sereine.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📅 Date prévue :</td>
                  <td style="padding: 8px 0; font-weight: 800; color: #800020; text-align: right; font-size: 14px;">${scheduledDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">⏰ Heure estimée :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">vers ${scheduledTime}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🚛 Déménageur :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${companyName}</td>
                </tr>
                ${companyPhone ? `
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📞 Contact direct :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #047857; text-align: right;">${companyPhone}</td>
                </tr>` : ''}
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📍 Adresse départ :</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${depAddr}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🏁 Adresse arrivée :</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${arrAddr}</td>
                </tr>
                ${volume ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📦 Volume estimé :</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">~ ${volume} m³</td>
                </tr>` : ''}
              </table>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <h3 style="color: #166534; font-size: 14px; font-weight: 800; margin: 0 0 10px;">
                📋 Checklist Recommandée pour le Jour J :
              </h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                <li><strong>Stationnement :</strong> Réservez l'emplacement devant votre domicile pour le camion de déménagement.</li>
                <li><strong>Accès immeuble :</strong> Prévenez le syndic / gardien et facilitez l'accès aux escaliers ou ascenseur.</li>
                <li><strong>Cartons :</strong> Vérifiez que tous vos cartons sont scellés et clairement étiquetés par pièce.</li>
                <li><strong>Électroménager :</strong> Débranchez et dégivrez votre réfrigérateur au préalable.</li>
                <li><strong>Objets de valeur :</strong> Gardez vos papiers essentiels, bijoux et clés avec vous en main propre.</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${bookingUrl}" style="background: #800020; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(128,0,32,0.35);">
                Suivre mon Déménagement en Direct →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">
              MoversGo Tunisie • Votre partenaire de confiance pour un déménagement réussi
            </p>
          </div>
        </div>
      `,
      text: `MoversGo - Rappel : Votre déménagement avec ${companyName} est prévu le ${scheduledDate} vers ${scheduledTime}. Suivi en ligne : ${bookingUrl}`,
    };
  },
};

/**
 * Send contact form confirmation email to user
 */
const sendContactConfirmation = async ({ name, email, subject }) => {
  return sendEmail({
    to: email,
    subject: 'Votre message a bien été reçu — MoversGo Tunisie',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #800020; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MoversGo Tunisie</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #800020;">Bonjour ${name},</h2>
          <p>Nous avons bien reçu votre message concernant : <strong>"${subject || 'Demande générale'}"</strong>.</p>
          <p>Notre équipe de coordinateurs logistiques vous répondra dans les <strong>24 heures ouvrables</strong>.</p>
          <div style="background: white; border-left: 4px solid #800020; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">En attendant, vous pouvez consulter notre <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/faq" style="color: #800020;">FAQ</a> ou nous appeler directement.</p>
          </div>
          <p style="color: #999; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
        </div>
        <div style="background: #800020; padding: 15px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">© 2024 MoversGo Tunisie — Tous droits réservés</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send ticket reply notification to user
 */
const sendTicketReplyNotification = async ({ userEmail, userName, ticketSubject, replyMessage }) => {
  return sendEmail({
    to: userEmail,
    subject: `Réponse à votre ticket — ${ticketSubject} | MoversGo Tunisie`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #800020; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MoversGo Tunisie</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #800020;">Bonjour ${userName},</h2>
          <p>Notre équipe a répondu à votre ticket : <strong>"${ticketSubject}"</strong></p>
          <div style="background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-line;">${replyMessage}</p>
          </div>
          <p>Connectez-vous à votre espace pour voir la réponse complète et continuer la conversation.</p>
        </div>
        <div style="background: #800020; padding: 15px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">© 2024 MoversGo Tunisie</p>
        </div>
      </div>
    `,
  });
};

module.exports = { initEmailService, sendEmail, templates, sendContactConfirmation, sendTicketReplyNotification };

