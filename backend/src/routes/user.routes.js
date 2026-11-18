const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadProfile } = require('../config/multer');

// Controllers loaded lazily to handle case where subagent hasn't created them yet
let userController;
try {
  userController = require('../controllers/user.controller');
} catch {
  // Controller not yet created - placeholder
  userController = {};
}

// Profile image upload middleware (safe for both JSON and multipart/form-data)
const profileUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return uploadProfile.single('profileImage')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || "Erreur de téléversement de l'image de profil" });
      }
      next();
    });
  }
  next();
};

// User profile routes (authenticated)
router.get('/profile', protect, (req, res, next) => {
  if (userController.getProfile) return userController.getProfile(req, res, next);
  res.json({ success: true, data: { user: req.user } });
});

router.put('/profile', protect, profileUpload, (req, res, next) => {
  if (userController.updateProfile) return userController.updateProfile(req, res, next);
  next();
});

// Admin routes
router.get('/', protect, authorize('admin'), (req, res, next) => {
  if (userController.getAllUsers) return userController.getAllUsers(req, res, next);
  next();
});

router.get('/:id', protect, authorize('admin'), (req, res, next) => {
  if (userController.getUserById) return userController.getUserById(req, res, next);
  next();
});

router.patch('/:id/status', protect, authorize('admin'), (req, res, next) => {
  if (userController.updateUserStatus) return userController.updateUserStatus(req, res, next);
  next();
});

// Block / unblock user (self-service, any role)
router.post('/block/:targetId', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const targetId = req.params.targetId;
    if (targetId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous bloquer vous-même.' });
    }
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: targetId } });
    res.json({ success: true, message: 'Utilisateur bloqué.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/block/:targetId', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: req.params.targetId } });
    res.json({ success: true, message: 'Utilisateur débloqué.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/block/list', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('blockedUsers', '_id firstName lastName');
    res.json({ success: true, data: { blockedUsers: user?.blockedUsers || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

