const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const recommendationController = require('../controllers/recommendation.controller');

// All recommendation endpoints require company authentication
router.use(protect);
router.use(authorize('company'));

router.get('/company', recommendationController.getCompanyRecommendations);
router.get('/company/stats', recommendationController.getCompanyRecommendationStats);
router.get('/company/map', recommendationController.getRecommendationMapData);
router.get('/company/:requestId', recommendationController.getRecommendationBreakdown);
router.put('/settings', recommendationController.updateRecommendationSettings);

module.exports = router;
