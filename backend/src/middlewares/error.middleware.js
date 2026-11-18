const { error: apiError } = require('../utils/apiResponse');

/**
 * Global error handler middleware
 * Must be registered LAST in Express app
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur serveur interne';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = [err.errors[key].message];
      return acc;
    }, {});
    return apiError(res, 'Données invalides', 400, errors);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Identifiant invalide: ${err.value}`;
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `La valeur "${value}" est déjà utilisée pour le champ "${field}".`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Fichier trop volumineux';
  }

  return apiError(res, message, statusCode);
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
  return apiError(res, `Route introuvable: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = { errorHandler, notFoundHandler };

