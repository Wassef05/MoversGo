const { body } = require('express-validator');

const createRequestValidator = [
  // Normalization middleware before validation rules
  (req, res, next) => {
    // If incoming body fields are stringified JSON (common in multipart/form-data), parse them
    ['departure', 'arrival', 'inventory', 'options', 'departureAddress', 'arrivalAddress', 'additionalServices', 'furniture', 'appliances'].forEach((key) => {
      if (typeof req.body[key] === 'string') {
        try {
          req.body[key] = JSON.parse(req.body[key]);
        } catch {
          // not a valid JSON string, leave as is
        }
      }
    });

    // 1. Normalize departure
    if (req.body.departure && typeof req.body.departure === 'object') {
      req.body.departureAddress = req.body.departureAddress || {
        street: req.body.departure.address || req.body.departure.street || '',
        city: req.body.departure.city || '',
        governorate: req.body.departure.governorate || req.body.departure.city || 'Tunis',
        postalCode: req.body.departure.postalCode || '',
      };
      req.body.departureHousingType = req.body.departureHousingType || req.body.departure.housingType;
      req.body.departureFloor = req.body.departureFloor !== undefined ? req.body.departureFloor : req.body.departure.floor;
      req.body.departureElevator = req.body.departureElevator !== undefined ? req.body.departureElevator : (req.body.departure.hasElevator ?? req.body.departure.elevator);
    } else if (typeof req.body.departureAddress === 'string') {
      req.body.departureAddress = {
        street: req.body.departureAddress,
        city: req.body.departureCity || 'Tunis',
        governorate: req.body.departureGovernorate || req.body.departureCity || 'Tunis',
      };
    } else if (req.body.departureCity) {
      req.body.departureAddress = req.body.departureAddress || {
        street: req.body.departureAddress || '',
        city: req.body.departureCity,
        governorate: req.body.departureGovernorate || req.body.departureCity,
      };
    }

    // 2. Normalize arrival
    if (req.body.arrival && typeof req.body.arrival === 'object') {
      req.body.arrivalAddress = req.body.arrivalAddress || {
        street: req.body.arrival.address || req.body.arrival.street || '',
        city: req.body.arrival.city || '',
        governorate: req.body.arrival.governorate || req.body.arrival.city || 'Sousse',
        postalCode: req.body.arrival.postalCode || '',
      };
      req.body.arrivalHousingType = req.body.arrivalHousingType || req.body.arrival.housingType;
      req.body.arrivalFloor = req.body.arrivalFloor !== undefined ? req.body.arrivalFloor : req.body.arrival.floor;
      req.body.arrivalElevator = req.body.arrivalElevator !== undefined ? req.body.arrivalElevator : (req.body.arrival.hasElevator ?? req.body.arrival.elevator);
    } else if (typeof req.body.arrivalAddress === 'string') {
      req.body.arrivalAddress = {
        street: req.body.arrivalAddress,
        city: req.body.arrivalCity || 'Sousse',
        governorate: req.body.arrivalGovernorate || req.body.arrivalCity || 'Sousse',
      };
    } else if (req.body.arrivalCity) {
      req.body.arrivalAddress = req.body.arrivalAddress || {
        street: req.body.arrivalAddress || '',
        city: req.body.arrivalCity,
        governorate: req.body.arrivalGovernorate || req.body.arrivalCity,
      };
    }

    // 3. Normalize inventory & options
    if (req.body.inventory && typeof req.body.inventory === 'object') {
      if (req.body.inventory.estimatedVolume !== undefined) {
        req.body.estimatedVolume = req.body.inventory.estimatedVolume;
      }
      if (req.body.inventory.boxesCount !== undefined) {
        req.body.estimatedBoxes = req.body.inventory.boxesCount;
      }
      if (req.body.inventory.items && Array.isArray(req.body.inventory.items)) {
        req.body.furniture = req.body.inventory.items;
      }
    }

    if (req.body.options && typeof req.body.options === 'object') {
      if (req.body.options.desiredDate) {
        req.body.preferredDate = req.body.options.desiredDate;
      }
      if (req.body.options.flexibility) {
        req.body.flexibleDates = req.body.options.flexibility !== 'exact';
      }
    }

    next();
  },

  body('departureAddress.city')
    .trim()
    .notEmpty().withMessage('La ville de départ est obligatoire.'),

  body('departureAddress.governorate')
    .trim()
    .notEmpty().withMessage('Le gouvernorat de départ est obligatoire.'),

  body('arrivalAddress.city')
    .trim()
    .notEmpty().withMessage("La ville d'arrivée est obligatoire."),

  body('arrivalAddress.governorate')
    .trim()
    .notEmpty().withMessage("Le gouvernorat d'arrivée est obligatoire."),

  body('preferredDate')
    .optional()
    .isISO8601().withMessage('Format de date invalide.'),

  body('estimatedBoxes')
    .optional()
    .isInt({ min: 0 }).withMessage('Le nombre de cartons doit être un entier positif.'),

  body('departureFloor')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Étage invalide.'),

  body('arrivalFloor')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Étage invalide.'),
];

module.exports = { createRequestValidator };

