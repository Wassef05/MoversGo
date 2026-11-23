const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize, requireApprovedCompany } = require('../middlewares/role.middleware');
const { uploadCompanyDocs, uploadProfile } = require('../config/multer');

let companyController;
try { companyController = require('../controllers/company.controller'); } catch { companyController = {}; }

const ctrl = (name) => (req, res, next) => {
  if (companyController[name]) return companyController[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// Public
router.get('/', optionalAuth, ctrl('getPublicCompanies'));
router.get('/me', protect, authorize('company'), ctrl('getMyCompanyProfile'));
router.get('/statistics', protect, authorize('company'), ctrl('getCompanyStats'));
router.get('/me/statistics', protect, authorize('company'), ctrl('getCompanyStats'));
router.get('/:id', optionalAuth, ctrl('getPublicCompanyById'));

// Company profile management
router.put('/me', protect, authorize('company'), ctrl('updateMyCompanyProfile'));
router.put('/recommendation-settings', protect, authorize('company'), (req, res, next) => {
  const recommendationController = require('../controllers/recommendation.controller');
  return recommendationController.updateRecommendationSettings(req, res, next);
});
router.post('/me/logo', protect, authorize('company'), uploadProfile.single('logo'), ctrl('updateCompanyLogo'));
router.post('/me/documents', protect, authorize('company'), uploadCompanyDocs.single('document'), ctrl('uploadCompanyDocument'));
router.post('/me/resubmit-rne', protect, authorize('company'), uploadCompanyDocs.fields([{ name: 'rneDocument', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), ctrl('resubmitRneDocument'));
router.delete('/me/documents/:docId', protect, authorize('company'), ctrl('deleteCompanyDocument'));

module.exports = router;

