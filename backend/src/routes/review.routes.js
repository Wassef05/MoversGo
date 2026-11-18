const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  createReview,
  getMyReviews,
  getCompanyReviews,
  getPublicReviews,
  respondToReview,
  togglePublishReview,
  getAllReviews,
  moderateReview,
  deleteReview,
} = require('../controllers/review.controller');

// Public
router.get('/public', getPublicReviews);
router.get('/company/:companyId', getCompanyReviews);

// Protected Client
router.post('/', protect, authorize('client'), createReview);
router.get('/my', protect, authorize('client'), getMyReviews);
router.post('/:id/respond', protect, authorize('company'), respondToReview);
router.patch('/:id/toggle-publish', protect, authorize('company'), togglePublishReview);

// Admin
router.get('/', protect, authorize('admin'), getAllReviews);
router.patch('/:id/moderate', protect, authorize('admin'), moderateReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
