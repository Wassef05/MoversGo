const User = require('../models/User');
const Company = require('../models/Company');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken } = require('../utils/generateToken');
const {
  success,
  paginated,
  notFound,
  badRequest,
  buildPagination,
} = require('../utils/apiResponse');
const { createNotification } = require('../services/notification.service');

/**
 * GET /api/v1/users/profile
 * Return authenticated user populated with company if company role
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return notFound(res, 'Utilisateur introuvable');
  }

  if (user.role === 'company' || user.company) {
    await user.populate('company');
  }

  return success(res, { user }, 'Profil récupéré avec succès');
});

/**
 * PUT /api/v1/users/profile
 * Update user profile details, email, password and profileImage
 */
const updateProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return notFound(res, 'Utilisateur introuvable');
  }

  const {
    firstName,
    lastName,
    phone,
    address,
    email,
    password,
    newPassword,
    currentPassword,
    profileImage,
  } = req.body;

  if (firstName !== undefined) user.firstName = firstName.trim();
  if (lastName !== undefined) user.lastName = lastName.trim();
  if (phone !== undefined) user.phone = phone.trim();

  // Email update
  if (email !== undefined && email.trim() !== '') {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== user.email) {
      const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (existingUser) {
        return badRequest(res, 'Cette adresse email est déjà utilisée par un autre compte.');
      }
      user.email = cleanEmail;
    }
  }

  // Password update
  const passToSet = (newPassword || password || '').trim();
  if (passToSet) {
    if (passToSet.length < 8) {
      return badRequest(res, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
    }

    // If current password is provided, verify it
    if (currentPassword) {
      const userWithPass = await User.findById(req.user._id).select('+password');
      const isMatch = await userWithPass.comparePassword(currentPassword);
      if (!isMatch) {
        return badRequest(res, 'Le mot de passe actuel est incorrect.');
      }
    }

    user.password = passToSet;
  }

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

    const street = addrObj.street ?? req.body.street ?? user.address?.street;
    const city = addrObj.city ?? req.body.city ?? user.address?.city;
    const governorate = addrObj.governorate ?? req.body.governorate ?? user.address?.governorate;
    const postalCode = addrObj.postalCode ?? req.body.postalCode ?? user.address?.postalCode;

    const latRaw = req.body.latitude ?? req.body.lat ?? addrObj.latitude ?? user.address?.latitude;
    const lngRaw = req.body.longitude ?? req.body.lng ?? addrObj.longitude ?? user.address?.longitude;
    const lat = latRaw !== undefined && latRaw !== '' ? parseFloat(latRaw) : undefined;
    const lng = lngRaw !== undefined && lngRaw !== '' ? parseFloat(lngRaw) : undefined;

    user.address = {
      street,
      city,
      governorate,
      postalCode,
      latitude: !isNaN(lat) ? lat : undefined,
      longitude: !isNaN(lng) ? lng : undefined,
    };

    if (!isNaN(lat) && !isNaN(lng)) {
      user.location = {
        type: 'Point',
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng,
        formattedAddress: [street, city, governorate].filter(Boolean).join(', '),
      };
    }
  }

  if (req.file) {
    user.profileImage = req.file.path.replace(/\\/g, '/');
  } else if (profileImage !== undefined) {
    user.profileImage = profileImage;
  }

  await user.save();

  if (user.role === 'company' || user.company) {
    await user.populate('company');
  }

  // Generate updated access token
  const token = generateAccessToken({ id: user._id, role: user.role });

  return success(res, { user, token }, 'Profil et paramètres mis à jour avec succès');
});

/**
 * GET /api/v1/admin/users
 * Paginated list of users with search, role, and status filters (admin only)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(500, parseInt(req.query.limit, 10) || 100));
  const { search, role, isActive } = req.query;

  const filter = {};

  if (role && role !== 'all') {
    filter.role = role;
  }

  if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (search && search.trim()) {
    const s = search.trim();
    // Search matching companies as well
    const matchingCompanies = await Company.find({
      $or: [
        { companyName: { $regex: s, $options: 'i' } },
        { legalIdentifier: { $regex: s, $options: 'i' } },
      ],
    }).select('_id');
    const compIds = matchingCompanies.map((c) => c._id);

    filter.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      ...(compIds.length > 0 ? [{ company: { $in: compIds } }] : []),
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .populate('company', 'companyName legalIdentifier verificationStatus rneDocument documents logo phone address rectificationNotes rejectionReason')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, users, pagination, 'Liste des utilisateurs récupérée avec succès');
});

/**
 * GET /api/v1/admin/users/:id
 * Full user details (admin only)
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('company');

  if (!user) {
    return notFound(res, 'Utilisateur introuvable');
  }

  return success(res, { user }, 'Détails de l\'utilisateur récupérés avec succès');
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Toggle user active status (admin only)
 */
const updateUserStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) {
    return badRequest(res, 'Le champ isActive est obligatoire (true ou false)');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return notFound(res, 'Utilisateur introuvable');
  }

  user.isActive = Boolean(isActive);
  await user.save();

  // If user is a company, keep company isActive in sync
  if (user.role === 'company' && user.company) {
    await Company.findByIdAndUpdate(user.company, { isActive: user.isActive });
  }

  // Notify user
  const io = req.app.get('io');
  await createNotification({
    recipientId: user._id,
    title: user.isActive ? 'Compte réactivé' : 'Compte suspendu',
    message: user.isActive
      ? 'Votre compte MoversGo a été réactivé.'
      : 'Votre compte MoversGo a été suspendu par un administrateur.',
    type: 'system',
    entityType: 'user',
    entityId: user._id,
    io,
  });

  return success(
    res,
    { user: { _id: user._id, email: user.email, isActive: user.isActive } },
    `Statut de l'utilisateur mis à jour: ${user.isActive ? 'Actif' : 'Suspendu'}`
  );
});

/**
 * DELETE /api/v1/admin/users/:id
 * Soft or permanent delete user (admin only)
 */
const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return notFound(res, 'Utilisateur introuvable');
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user?._id?.toString()) {
    return badRequest(res, 'Vous ne pouvez pas supprimer votre propre compte administrateur.');
  }

  if (req.query.permanent === 'true') {
    if (user.role === 'company' && user.company) {
      await Company.findByIdAndDelete(user.company);
    }
    await User.findByIdAndDelete(user._id);
    return success(res, { id: user._id }, 'Compte utilisateur supprimé définitivement avec succès');
  }

  user.isActive = false;
  await user.save();

  if (user.role === 'company' && user.company) {
    await Company.findByIdAndUpdate(user.company, { isActive: false });
  }

  return success(res, { id: user._id }, 'Compte utilisateur suspendu avec succès');
});

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};
