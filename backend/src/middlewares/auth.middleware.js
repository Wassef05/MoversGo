const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { unauthorized } = require('../utils/apiResponse');

/**
 * Protect routes — verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Fallback to cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return unauthorized(res, 'Accès refusé. Veuillez vous connecter.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch current user (without password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return unauthorized(res, 'Utilisateur introuvable. Veuillez vous reconnecter.');
    }

    if (!user.isActive) {
      return unauthorized(res, 'Votre compte est suspendu. Contactez le support.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Session expirée. Veuillez vous reconnecter.');
    }
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Token invalide.');
    }
    return unauthorized(res, 'Authentification échouée.');
  }
};

/**
 * Optional auth — attach user if token is present, but do not block
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};

module.exports = { protect, optionalAuth };

