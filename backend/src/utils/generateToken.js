const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generate a signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate a random 6-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure reset token
 */
const generateResetToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  generateVerificationCode,
  generateResetToken,
};

