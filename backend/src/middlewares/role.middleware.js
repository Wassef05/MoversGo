const { forbidden } = require('../utils/apiResponse');

/**
 * Restrict access to specific roles
 * Usage: authorize('admin'), authorize('client', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentification requise.');
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(
        res,
        `Accès refusé. Cette action requiert le rôle: ${roles.join(' ou ')}.`
      );
    }
    next();
  };
};

/**
 * Ensure company accounts are approved before accessing business features
 */
const requireApprovedCompany = async (req, res, next) => {
  if (req.user.role !== 'company') return next();

  const Company = require('../models/Company');
  const company = await Company.findOne({ user: req.user._id });

  if (!company) {
    return forbidden(res, 'Profil entreprise introuvable.');
  }

  if (company.verificationStatus !== 'approved') {
    return forbidden(
      res,
      `Votre entreprise est en attente de validation (statut: ${company.verificationStatus}). Vous ne pouvez pas effectuer cette action.`
    );
  }

  req.company = company;
  next();
};

module.exports = { authorize, requireApprovedCompany };

