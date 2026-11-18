const User = require('../models/User');
const Company = require('../models/Company');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateVerificationCode, generateResetToken } = require('../utils/generateToken');
const { success, created, error: apiError, badRequest, unauthorized } = require('../utils/apiResponse');
const { sendEmail, templates } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * POST /api/v1/auth/register
 * Register a new client or company account
 */
const register = catchAsync(async (req, res) => {
  const {
    email,
    password,
    phone,
    role = 'client',
    companyName,
    governorate,
  } = req.body;
  const firstName = req.body.firstName || req.body.managerFirstName;
  const lastName = req.body.lastName || req.body.managerLastName;

  // Check email uniqueness
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return badRequest(res, 'Un compte existe déjà avec cette adresse email.');
  }

  // Validate role
  if (!['client', 'company'].includes(role)) {
    return badRequest(res, 'Rôle invalide. Les valeurs autorisées sont: client, company.');
  }

  // Generate email verification token
  const verificationCode = generateVerificationCode();
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const latNum = parseFloat(req.body.latitude || req.body.lat);
  const lngNum = parseFloat(req.body.longitude || req.body.lng);
  const hasCoords = !isNaN(latNum) && !isNaN(lngNum);

  const addressData = {
    street: req.body.street || req.body.address || undefined,
    city: req.body.city || governorate || 'Tunis',
    governorate: governorate || req.body.city || 'Tunis',
    postalCode: req.body.postalCode || undefined,
    latitude: hasCoords ? latNum : undefined,
    longitude: hasCoords ? lngNum : undefined,
  };

  const locationData = hasCoords
    ? {
      type: 'Point',
      coordinates: [lngNum, latNum],
      latitude: latNum,
      longitude: lngNum,
      formattedAddress: [addressData.street, addressData.city, addressData.governorate].filter(Boolean).join(', '),
    }
    : undefined;

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone,
    role,
    address: addressData,
    location: locationData,
    emailVerificationToken: verificationCode,
    emailVerificationExpires: verificationExpires,
    isEmailVerified: false, // Always require email verification
  });

  // If registering as company, create company profile
  let company = null;
  if (role === 'company') {
    const documents = [];
    let rneDocument = null;
    const rneFile = req.file || req.files?.rneDocument?.[0];
    if (rneFile) {
      const filePath = rneFile.path.replace(/\\/g, '/');
      rneDocument = {
        filePath,
        originalName: rneFile.originalname,
        uploadedAt: new Date(),
      };
      documents.push({
        name: 'Extrait RNE (3 derniers mois)',
        filePath,
        fileType: rneFile.mimetype,
        status: 'pending',
        uploadedAt: new Date(),
      });
    }

    const logoFile = req.files?.logo?.[0];
    let logoPath = null;
    if (logoFile) {
      logoPath = logoFile.path.replace(/\\/g, '/');
    }

    company = await Company.create({
      user: user._id,
      companyName: companyName || `Entreprise de ${firstName} ${lastName}`,
      legalIdentifier: req.body.matriculeFiscal || req.body.siret || req.body.legalIdentifier,
      licenseNumber: req.body.licenseNumber,
      phone: phone || req.body.companyPhone,
      email: email.toLowerCase(),
      logo: logoPath,
      address: addressData,
      location: locationData,
      documents,
      rneDocument,
      verificationStatus: 'pending',
    });

    // Link company to user
    await User.findByIdAndUpdate(user._id, {
      company: company._id,
      ...(logoPath && { profileImage: logoPath }),
    });
    user.company = company._id;
  }

  // Send verification email
  if (!user.isEmailVerified) {
    console.log(`\n==============================================`);
    console.log(`🔑 [EMAIL VERIFICATION CODE]`);
    console.log(`To: ${email}`);
    console.log(`Code: ${verificationCode}`);
    console.log(`==============================================\n`);
    const emailTemplate = templates.emailVerification(firstName, verificationCode);
    await sendEmail({ to: email, ...emailTemplate });
  }

  // Generate access token
  const token = generateAccessToken({ id: user._id, role: user.role });

  // Build safe response (no password, no tokens)
  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    profileImage: user.profileImage,
    address: user.address,
    location: user.location,
    company: company
      ? {
        _id: company._id,
        companyName: company.companyName,
        verificationStatus: company.verificationStatus,
        logo: company.logo,
        address: company.address,
        location: company.location,
      }
      : null,
    createdAt: user.createdAt,
  };

  return created(res, { user: userResponse, token }, 'Compte créé avec succès. Bienvenue sur MoversGo !');
});

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password, role: expectedRole } = req.body;

  if (!email || !password) {
    return badRequest(res, "L'email et le mot de passe sont obligatoires.");
  }

  // Find user and explicitly include password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return unauthorized(res, 'Adresse email ou mot de passe incorrect.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return unauthorized(res, 'Adresse email ou mot de passe incorrect.');
  }

  // Check account status
  if (!user.isActive) {
    return unauthorized(res, 'Votre compte est suspendu. Veuillez contacter le support.');
  }

  // STRICT ROLE SEPARATION CHECK
  // 1. If admin tries to log in through client or company portal
  if (user.role === 'admin' && expectedRole && expectedRole !== 'admin') {
    return unauthorized(
      res,
      "Ce compte est un compte privée. Les administrateurs doivent impérativement se connecter via l'interface d'administration sécurisée."
    );
  }

  // 2. If client tries to log in on company or admin portal
  if (user.role === 'client' && expectedRole && expectedRole !== 'client') {
    if (expectedRole === 'admin') {
      return unauthorized(res, "Accès refusé : Ce compte n'a pas les privilèges administrateur.");
    }
    return unauthorized(
      res,
      "Ce compte n'est pas un compte d'entreprise!. Veuillez vous connecter dans l'Espace Client."
    );
  }

  // 3. If company tries to log in on client or admin portal
  if (user.role === 'company' && expectedRole && expectedRole !== 'company') {
    if (expectedRole === 'admin') {
      return unauthorized(res, "Accès refusé : Ce compte n'a pas les privilèges administrateur.");
    }
    return unauthorized(
      res,
      "Ce compte est un compte entreprise / déménageur. Veuillez vous connecter dans l'Espace Déménageur."
    );
  }

  // 4. If admin portal was requested (expectedRole === 'admin') and user is not admin
  if (expectedRole === 'admin' && user.role !== 'admin') {
    return unauthorized(
      res,
      "Accès refusé : Cet espace est strictement réservé aux administrateurs autorisés."
    );
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  // Populate company if user is a company
  let companyData = null;
  if (user.role === 'company') {
    companyData = await Company.findOne({ user: user._id }).select(
      'companyName verificationStatus averageRating totalReviews logo address location'
    );
  }

  // Generate token
  const token = generateAccessToken({ id: user._id, role: user.role });

  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    address: user.address,
    location: user.location,
    company: companyData,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };

  return success(res, { user: userResponse, token }, 'Connexion réussie. Bienvenue !');
});

/**
 * POST /api/v1/auth/google
 * Google Sign-In & Sign-Up strictly for client role
 */
const googleAuth = catchAsync(async (req, res) => {
  const { credential, email: bodyEmail, firstName: bodyFirstName, lastName: bodyLastName, googleId: bodyGoogleId, profileImage: bodyProfileImage } = req.body;

  let googleUser = null;

  // 1. Try decoding JWT credential if passed from Google Identity Services
  if (credential) {
    try {
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        googleUser = {
          email: decoded.email.toLowerCase().trim(),
          firstName: decoded.given_name || decoded.name?.split(' ')[0] || 'Client',
          lastName: decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || '',
          googleId: decoded.sub,
          profileImage: decoded.picture || null,
          emailVerified: decoded.email_verified,
        };
      }
    } catch (e) {
      console.warn("Failed to decode Google credential token:", e.message);
    }
  }

  // 2. Direct payload fallback
  if (!googleUser && bodyEmail) {
    googleUser = {
      email: bodyEmail.toLowerCase().trim(),
      firstName: bodyFirstName?.trim() || 'Client',
      lastName: bodyLastName?.trim() || '',
      googleId: bodyGoogleId || `google_${Date.now()}`,
      profileImage: bodyProfileImage || null,
      emailVerified: true,
    };
  }

  if (!googleUser || !googleUser.email) {
    return badRequest(res, "Informations de compte Google invalides ou incomplètes.");
  }

  // Check if user already exists
  let user = await User.findOne({
    $or: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
  });

  let isNewUser = false;

  if (user) {
    // STRICT ROLE VERIFICATION: Google sign-in/up is CLIENT ONLY
    if (user.role !== 'client') {
      return unauthorized(
        res,
        "Ce compte Google est associé à un profil " +
        (user.role === 'admin' ? "administrateur" : "entreprise") +
        ". La connexion Google est strictement réservée aux clients particuliers."
      );
    }

    if (!user.isActive) {
      return unauthorized(res, "Votre compte est suspendu. Veuillez contacter le support.");
    }

    // If existing client user has NOT verified their email yet, generate and resend code
    if (!user.isEmailVerified) {
      const verificationCode = generateVerificationCode();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.emailVerificationToken = verificationCode;
      user.emailVerificationExpires = verificationExpires;

      console.log(`\n==============================================`);
      console.log(`🔑 [CONNEXION GOOGLE - EMAIL NON VÉRIFIÉ - NOUVEAU CODE]`);
      console.log(`Destinataire : ${user.email}`);
      console.log(`Code de vérification : ${verificationCode}`);
      console.log(`==============================================\n`);

      const emailTemplate = templates.emailVerification(user.firstName, verificationCode);
      await sendEmail({ to: user.email, ...emailTemplate });
    }

    let needsSave = false;
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
      needsSave = true;
    }
    if (!user.profileImage && googleUser.profileImage) {
      user.profileImage = googleUser.profileImage;
      needsSave = true;
    }
    user.lastLogin = new Date();
    await user.save();
  } else {
    // Create NEW client user with email verification
    isNewUser = true;
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user = await User.create({
      firstName: googleUser.firstName,
      lastName: googleUser.lastName || 'Particulier',
      email: googleUser.email,
      password: randomPassword,
      role: 'client', // STRICTLY client!
      authProvider: 'google',
      googleId: googleUser.googleId,
      profileImage: googleUser.profileImage,
      emailVerificationToken: verificationCode,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false, // Must be verified by email code!
      lastLogin: new Date(),
    });

    // Send verification email to the user's real Google email address
    console.log(`\n==============================================`);
    console.log(`🔑 [NOUVELLE INSCRIPTION GOOGLE - CODE DE VÉRIFICATION]`);
    console.log(`Destinataire : ${user.email}`);
    console.log(`Code de vérification : ${verificationCode}`);
    console.log(`==============================================\n`);

    const emailTemplate = templates.emailVerification(user.firstName, verificationCode);
    await sendEmail({ to: user.email, ...emailTemplate });
  }

  const token = generateAccessToken({ id: user._id, role: user.role });

  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    address: user.address,
    location: user.location,
    company: null,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };

  const responseMessage = isNewUser
    ? "Compte client créé avec succès via Google ! Un code de vérification à 6 chiffres a été envoyé à votre adresse email."
    : user.isEmailVerified
      ? "Connexion Google réussie. Bienvenue sur MoversGo !"
      : "Veuillez valider votre adresse email avec le code de vérification envoyé.";

  return success(res, { user: userResponse, token, isNewUser }, responseMessage);
});

/**
 * POST /api/v1/auth/google/init
 * Step 1: Detect Google account, generate and send 6-digit verification code immediately
 */
const googleInit = catchAsync(async (req, res) => {
  const { credential, email: bodyEmail, firstName: bodyFirstName, lastName: bodyLastName, googleId: bodyGoogleId, profileImage: bodyProfileImage } = req.body;

  let googleUser = null;

  if (credential) {
    try {
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        googleUser = {
          email: decoded.email.toLowerCase().trim(),
          firstName: decoded.given_name || decoded.name?.split(' ')[0] || 'Client',
          lastName: decoded.family_name || decoded.name?.split(' ').slice(1).join(' ') || '',
          googleId: decoded.sub,
          profileImage: decoded.picture || null,
        };
      }
    } catch (e) {
      console.warn("Failed to decode Google credential:", e.message);
    }
  }

  if (!googleUser && bodyEmail) {
    const rawEmail = bodyEmail.toLowerCase().trim();
    let derivedFirstName = bodyFirstName?.trim();
    let derivedLastName = bodyLastName?.trim();

    if (!derivedFirstName) {
      const namePart = rawEmail.split('@')[0];
      const parts = namePart.split(/[._-]/);
      derivedFirstName = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1) || 'Client';
      derivedLastName = parts[1] ? parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1) : '';
    }

    googleUser = {
      email: rawEmail,
      firstName: derivedFirstName,
      lastName: derivedLastName || '',
      googleId: bodyGoogleId || `google_${Date.now()}`,
      profileImage: bodyProfileImage || null,
    };
  }

  if (!googleUser || !googleUser.email) {
    return badRequest(res, "Adresse email Google manquante ou invalide.");
  }

  // Check if account already exists
  let user = await User.findOne({
    $or: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
  });

  if (user) {
    if (user.role !== 'client') {
      return unauthorized(
        res,
        "Ce compte est associé à un profil " +
        (user.role === 'admin' ? "administrateur" : "entreprise") +
        ". Veuillez vous connecter dans votre espace dédié."
      );
    }

    if (!user.isActive) {
      return unauthorized(res, "Votre compte est suspendu. Veuillez contacter le support.");
    }

    // If client is already fully verified
    if (user.isEmailVerified) {
      const token = generateAccessToken({ id: user._id, role: user.role });
      return success(res, {
        alreadyRegistered: true,
        isEmailVerified: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      }, "Ce compte Google est déjà inscrit et vérifié sur MoversGo.");
    }

    // Registered but not verified yet: resend code
    const verificationCode = generateVerificationCode();
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(`\n==============================================`);
    console.log(`🔑 [CODE DE VÉRIFICATION EMAIL GOOGLE - CLIENT EXISTANT]`);
    console.log(`Destinataire : ${user.email}`);
    console.log(`Code : ${verificationCode}`);
    console.log(`==============================================\n`);

    const emailTemplate = templates.emailVerification(user.firstName, verificationCode);
    await sendEmail({ to: user.email, ...emailTemplate });

    return success(res, {
      alreadyRegistered: true,
      isEmailVerified: false,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }, "Code de vérification renvoyé à votre adresse email Google.");
  }

  // New client registration: generate code and create initial record
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const verificationCode = generateVerificationCode();
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  user = await User.create({
    firstName: googleUser.firstName,
    lastName: googleUser.lastName || 'Client',
    email: googleUser.email,
    password: randomPassword,
    role: 'client',
    authProvider: 'google',
    googleId: googleUser.googleId,
    profileImage: googleUser.profileImage,
    emailVerificationToken: verificationCode,
    emailVerificationExpires: verificationExpires,
    isEmailVerified: false,
  });

  console.log(`\n==============================================`);
  console.log(`🔑 [INSCRIPTION GOOGLE - CODE DE VÉRIFICATION ENVOYÉ]`);
  console.log(`Destinataire : ${user.email}`);
  console.log(`Code : ${verificationCode}`);
  console.log(`==============================================\n`);

  const emailTemplate = templates.emailVerification(user.firstName, verificationCode);
  await sendEmail({ to: user.email, ...emailTemplate });

  return success(res, {
    alreadyRegistered: false,
    isEmailVerified: false,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    googleId: googleUser.googleId,
    profileImage: googleUser.profileImage,
  }, "Code de vérification envoyé avec succès à votre adresse email Google.");
});

/**
 * POST /api/v1/auth/google/verify-code
 * Step 2: Validate 6-digit code received on the Google account
 */
const googleVerifyCode = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  const cleanEmail = (email || '').toString().trim().toLowerCase();
  const cleanCode = (code || '').toString().trim();

  if (!cleanEmail || !cleanCode) {
    return badRequest(res, "L'adresse email et le code de vérification sont obligatoires.");
  }

  const user = await User.findOne({
    email: cleanEmail,
    role: 'client',
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return badRequest(res, "Compte introuvable pour cette adresse email.");
  }

  if (user.isEmailVerified) {
    return success(res, { verified: true, email: user.email }, "Email déjà vérifié.");
  }

  if (!user.emailVerificationToken || user.emailVerificationToken !== cleanCode) {
    return badRequest(res, "Code de vérification incorrect. Veuillez vérifier votre boîte mail.");
  }

  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    return badRequest(res, "Ce code de vérification a expiré. Veuillez en demander un nouveau.");
  }

  // Mark verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const token = generateAccessToken({ id: user._id, role: user.role });

  return success(res, {
    verified: true,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    token,
  }, "Compte Google vérifié avec succès ! Veuillez maintenant renseigner votre localisation.");
});

/**
 * POST /api/v1/auth/google/complete
 * Step 3: Complete registration with Localisation & Coordonnées
 */
const googleCompleteRegistration = catchAsync(async (req, res) => {
  const {
    email,
    phone,
    governorate,
    city,
    street,
    latitude,
    longitude,
    password,
    firstName,
    lastName,
  } = req.body;

  const cleanEmail = (email || '').toString().trim().toLowerCase();
  if (!cleanEmail) {
    return badRequest(res, "L'adresse email est obligatoire.");
  }

  const user = await User.findOne({ email: cleanEmail, role: 'client' });
  if (!user) {
    return badRequest(res, "Utilisateur introuvable.");
  }

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const hasCoords = !isNaN(latNum) && !isNaN(lngNum);

  const addressData = {
    street: street || undefined,
    city: city || governorate || 'Tunis',
    governorate: governorate || 'Tunis',
    latitude: hasCoords ? latNum : undefined,
    longitude: hasCoords ? lngNum : undefined,
  };

  const locationData = hasCoords
    ? {
      type: 'Point',
      coordinates: [lngNum, latNum],
      latitude: latNum,
      longitude: lngNum,
      formattedAddress: [addressData.street, addressData.city, addressData.governorate].filter(Boolean).join(', '),
    }
    : undefined;

  if (firstName?.trim()) user.firstName = firstName.trim();
  if (lastName?.trim()) user.lastName = lastName.trim();
  if (phone?.trim()) user.phone = phone.trim();
  user.address = addressData;
  if (locationData) user.location = locationData;
  if (password && password.length >= 8) {
    user.password = password;
  }
  user.isEmailVerified = true;
  user.lastLogin = new Date();
  await user.save();

  const token = generateAccessToken({ id: user._id, role: user.role });

  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    address: user.address,
    location: user.location,
    company: null,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };

  return success(res, { user: userResponse, token }, "Inscription finalisée avec succès ! Bienvenue sur MoversGo.");
});

/**
 * GET /api/v1/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  let companyData = null;
  if (user.role === 'company') {
    companyData = await Company.findOne({ user: user._id }).select(
      'companyName verificationStatus rejectionReason rectificationNotes rneDocument averageRating totalReviews logo coverImage address location services serviceAreas completedMoves'
    );
  }

  return success(res, {
    user: { ...user.toJSON(), company: companyData },
  });
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  res.clearCookie('accessToken');
  return success(res, {}, 'Déconnexion réussie.');
});

/**
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = catchAsync(async (req, res) => {
  const { code, email } = req.body;
  const cleanCode = (code || '').toString().trim();
  const searchEmail = (email || '').toString().trim().toLowerCase();

  let user = null;

  // 1. If JWT token provided in Authorization header, check that user first
  if (req.headers.authorization?.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) {
        user = await User.findById(decoded.id).select(
          '+emailVerificationToken +emailVerificationExpires'
        );
      }
    } catch { }
  }

  // 2. If not found by token, look up by email with flexible dot matching (especially for Gmail)
  if (!user && searchEmail) {
    const withoutDots = searchEmail.includes('@gmail.com')
      ? searchEmail.replace(/\.(?=.*@gmail\.com)/g, '')
      : searchEmail;

    user = await User.findOne({
      $or: [
        { email: searchEmail },
        { email: withoutDots },
        { email: searchEmail.replace(/@googlemail\.com$/, '@gmail.com') },
        { email: new RegExp(`^${searchEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    }).select('+emailVerificationToken +emailVerificationExpires');
  }

  // 3. Fallback: if not found by email, look up directly by the 6-digit code!
  if (!user && cleanCode) {
    user = await User.findOne({
      emailVerificationToken: cleanCode,
      isEmailVerified: false,
    }).select('+emailVerificationToken +emailVerificationExpires');
  }

  if (!user) {
    return badRequest(res, 'Utilisateur introuvable. Veuillez vérifier votre adresse email.');
  }

  if (user.isEmailVerified) {
    const newToken = generateAccessToken({ id: user._id, role: user.role });
    return success(
      res,
      {
        role: user.role,
        isCompanyPending: user.role === 'company',
        token: newToken,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: true,
        },
      },
      'Email déjà vérifié.'
    );
  }

  if (user.emailVerificationToken !== cleanCode) {
    return badRequest(res, 'Code de vérification incorrect.');
  }

  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    return badRequest(res, 'Code de vérification expiré. Veuillez en demander un nouveau.');
  }

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
  });

  // If company, notify admins that a company verified email and awaits administrative approval
  if (user.role === 'company') {
    try {
      const company = await Company.findOne({ user: user._id });
      if (company) {
        const admins = await User.find({ role: 'admin' });
        const io = req.app.get('io');
        for (const admin of admins) {
          await createNotification({
            recipientId: admin._id,
            title: 'Nouvelle entreprise à valider 🏢',
            message: `L'entreprise "${company.companyName}" (Gérant: ${user.firstName} ${user.lastName}) a vérifié son email et attend la validation de son extrait RNE.`,
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
            `${user.firstName} ${user.lastName}`,
            company.legalIdentifier,
            user.email,
            user.phone || company.phone
          );
          await sendEmail({ to: adminEmail, ...emailTemplate });
        }
      }
    } catch (notifErr) {
      console.warn('Admin notification error on company email verification:', notifErr.message);
    }
  }

  const newToken = generateAccessToken({ id: user._id, role: user.role });

  return success(
    res,
    {
      role: user.role,
      isCompanyPending: user.role === 'company',
      token: newToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: true,
        isActive: user.isActive,
      },
    },
    'Email vérifié avec succès !'
  );
});

/**
 * POST /api/v1/auth/resend-verification
 */
const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;
  const searchEmail = (email || '').toString().trim().toLowerCase();

  let user = null;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) {
        user = await User.findById(decoded.id).select('+emailVerificationToken +emailVerificationExpires');
      }
    } catch { }
  }

  if (!user && searchEmail) {
    const withoutDots = searchEmail.includes('@gmail.com')
      ? searchEmail.replace(/\.(?=.*@gmail\.com)/g, '')
      : searchEmail;

    user = await User.findOne({
      $or: [
        { email: searchEmail },
        { email: withoutDots },
        { email: searchEmail.replace(/@googlemail\.com$/, '@gmail.com') },
      ],
    }).select('+emailVerificationToken +emailVerificationExpires');
  }

  if (!user) {
    return badRequest(
      res,
      `Aucun compte n'a été trouvé avec l'adresse "${searchEmail || email}". Veuillez vous inscrire d'abord sur la plateforme.`
    );
  }

  if (user.isEmailVerified) {
    return success(res, {}, 'Email déjà vérifié.');
  }

  const code = generateVerificationCode();
  await User.findByIdAndUpdate(user._id, {
    emailVerificationToken: code,
    emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
  });

  console.log(`\n==============================================`);
  console.log(`🔑 [RESEND EMAIL VERIFICATION CODE]`);
  console.log(`To: ${user.email}`);
  console.log(`Code: ${code}`);
  console.log(`==============================================\n`);

  const emailTemplate = templates.emailVerification(user.firstName, code);
  await sendEmail({ to: user.email, ...emailTemplate });

  return success(res, { email: user.email }, 'Un nouveau code de vérification vous a été envoyé par email.');
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) {
    return success(res, {}, 'Si cet email est enregistré, vous recevrez les instructions.');
  }

  const resetToken = generateResetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
    passwordResetExpires: resetExpires,
  });

  const adminFlag = user.role === 'admin' ? '&admin=true' : '';
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}${adminFlag}`;

  console.log(`\n==============================================`);
  console.log(`🔑 [PASSWORD RESET LINK]`);
  console.log(`To: ${email}`);
  console.log(`URL: ${resetUrl}`);
  console.log(`==============================================\n`);

  const emailTemplate = templates.passwordReset(user.firstName, resetUrl);
  sendEmail({ to: email, ...emailTemplate }).catch(() => { });

  return success(res, {}, 'Si cet email est enregistré, vous recevrez les instructions.');
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, email, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: email?.toLowerCase(),
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return badRequest(res, 'Token invalide ou expiré. Veuillez recommencer.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const newToken = generateAccessToken({ id: user._id, role: user.role });

  return success(res, { token: newToken }, 'Mot de passe réinitialisé avec succès.');
});

/**
 * PUT /api/v1/auth/change-password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return badRequest(res, 'Mot de passe actuel incorrect.');
  }

  user.password = newPassword;
  await user.save();

  const token = generateAccessToken({ id: user._id, role: user.role });

  return success(res, { token }, 'Mot de passe modifié avec succès.');
});

module.exports = {
  register,
  login,
  googleAuth,
  googleInit,
  googleVerifyCode,
  googleCompleteRegistration,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};

