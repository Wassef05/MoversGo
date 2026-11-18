/**
 * Standardized API Response helpers
 */

const success = (res, data = {}, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data = {}, message = 'Créé avec succès') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const paginated = (res, data, pagination, message = 'Succès') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const error = (res, message = 'Erreur serveur', statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message,
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const notFound = (res, message = 'Ressource introuvable') => {
  return res.status(404).json({
    success: false,
    message,
  });
};

const forbidden = (res, message = 'Accès refusé') => {
  return res.status(403).json({
    success: false,
    message,
  });
};

const unauthorized = (res, message = 'Authentification requise') => {
  return res.status(401).json({
    success: false,
    message,
  });
};

const badRequest = (res, message = 'Requête invalide', errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(400).json(body);
};

/**
 * Build pagination metadata
 */
const buildPagination = (page, limit, total) => ({
  page: parseInt(page),
  limit: parseInt(limit),
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = {
  success,
  created,
  paginated,
  error,
  notFound,
  forbidden,
  unauthorized,
  badRequest,
  buildPagination,
};

