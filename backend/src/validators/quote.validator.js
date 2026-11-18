const { body } = require('express-validator');

const createQuoteValidator = [
  // Normalization middleware before validation rules
  (req, res, next) => {
    // 1. Normalize movingRequest ID
    if (!req.body.movingRequest) {
      req.body.movingRequest = req.body.requestId || req.body.movingRequestId;
    }

    // 2. Normalize pricing / totalPrice
    if (req.body.totalPrice === undefined && req.body.pricing) {
      if (typeof req.body.pricing.total === 'number') {
        req.body.totalPrice = req.body.pricing.total;
      }
    }

    // 3. Normalize validity date
    if (!req.body.validityDate && req.body.validUntil) {
      req.body.validityDate = req.body.validUntil;
    }

    // 4. Default validity date to +14 days if missing
    if (!req.body.validityDate) {
      req.body.validityDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    }

    // 5. Normalize pricing details
    if (!req.body.priceDetails && req.body.pricing && typeof req.body.pricing === 'object') {
      const details = [];
      if (req.body.pricing.transport) details.push({ label: 'Transport & Véhicule', amount: req.body.pricing.transport });
      if (req.body.pricing.packaging) details.push({ label: 'Prestation emballage', amount: req.body.pricing.packaging });
      if (req.body.pricing.disassembly) details.push({ label: 'Démontage / Remontage', amount: req.body.pricing.disassembly });
      if (req.body.pricing.furnitureLift) details.push({ label: 'Monte-meuble', amount: req.body.pricing.furnitureLift });
      if (req.body.pricing.insuranceFee) details.push({ label: 'Assurance complémentaire', amount: req.body.pricing.insuranceFee });
      req.body.priceDetails = details;
    }

    next();
  },

  body('movingRequest')
    .notEmpty().withMessage('La demande de déménagement est obligatoire.')
    .isMongoId().withMessage('Identifiant de demande invalide.'),

  body('totalPrice')
    .notEmpty().withMessage('Le prix total est obligatoire.')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif.'),

  body('validityDate')
    .notEmpty().withMessage('La date de validité est obligatoire.')
    .isISO8601().withMessage('Format de date invalide.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date de validité doit être dans le futur.');
      }
      return true;
    }),

  body('depositPercent')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Le pourcentage doit être entre 0 et 100.'),

  body('includedServices')
    .optional()
    .isArray().withMessage('Les services inclus doivent être un tableau.'),
];

module.exports = { createQuoteValidator };

