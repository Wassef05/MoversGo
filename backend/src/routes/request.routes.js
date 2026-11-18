const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize, requireApprovedCompany } = require('../middlewares/role.middleware');
const { uploadRequestPhotos } = require('../config/multer');
const { validate } = require('../middlewares/validate.middleware');
const { createRequestValidator } = require('../validators/request.validator');

let requestController;
try { requestController = require('../controllers/request.controller'); } catch { requestController = {}; }

const ctrl = (name) => (req, res, next) => {
  if (requestController[name]) return requestController[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// Client routes
router.post('/', protect, authorize('client'), uploadRequestPhotos.array('photos', 10), createRequestValidator, validate, ctrl('createRequest'));
router.get('/my', protect, authorize('client', 'admin'), ctrl('getMyRequests'));

// Company: view available requests
router.get('/available', protect, authorize('company'), requireApprovedCompany, ctrl('getAvailableRequests'));
router.post('/:id/view', protect, authorize('company'), requireApprovedCompany, ctrl('markRequestViewed'));

// Public exploration routes for companies and visitors
router.get('/public', ctrl('getPublicRequests'));
router.get('/public/:id', ctrl('getPublicRequestById'));

// Shared
router.get('/:id', protect, ctrl('getRequestById'));
router.put('/:id', protect, authorize('client'), uploadRequestPhotos.array('photos', 10), ctrl('updateRequest'));
router.delete('/:id', protect, authorize('client', 'admin'), ctrl('deleteRequest'));

module.exports = router;

