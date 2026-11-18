const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/apiResponse');

/**
 * Run validation rules and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, err) => {
      if (!acc[err.path]) acc[err.path] = [];
      acc[err.path].push(err.msg);
      return acc;
    }, {});
    return badRequest(res, 'Données invalides. Veuillez corriger les erreurs.', formattedErrors);
  }
  next();
};

module.exports = { validate };

