const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { uploadCompanyDocs } = require('../config/multer');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');

// File upload middleware for registration (company RNE document and optional logo)
const registrationUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return uploadCompanyDocs.fields([
      { name: 'rneDocument', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ])(req, res, next);
  }
  next();
};

// Public routes
router.post('/register', registrationUpload, registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/google', authController.googleAuth);
router.post('/google/init', authController.googleInit);
router.post('/google/verify-code', authController.googleVerifyCode);
router.post('/google/complete', authController.googleCompleteRegistration);
router.post('/logout', authController.logout);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, changePasswordValidator, validate, authController.changePassword);

module.exports = router;

