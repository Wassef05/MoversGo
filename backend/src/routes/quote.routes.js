const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize, requireApprovedCompany } = require('../middlewares/role.middleware');
const { uploadQuoteAttachments } = require('../config/multer');
const { validate } = require('../middlewares/validate.middleware');
const { createQuoteValidator } = require('../validators/quote.validator');

let quoteController;
try { quoteController = require('../controllers/quote.controller'); } catch { quoteController = {}; }

const ctrl = (name) => (req, res, next) => {
  if (quoteController[name]) return quoteController[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// Company: submit and manage quotes
router.post('/', protect, authorize('company'), requireApprovedCompany, uploadQuoteAttachments.array('attachments', 5), createQuoteValidator, validate, ctrl('createQuote'));
router.get('/company', protect, authorize('company'), ctrl('getMyQuotes'));
router.put('/:id', protect, authorize('company'), ctrl('updateQuote'));
router.delete('/:id', protect, authorize('company'), ctrl('cancelQuote'));

// Client: view and act on quotes
router.get('/client', protect, authorize('client'), ctrl('getClientQuotes'));
router.post('/:id/accept', protect, authorize('client'), ctrl('acceptQuote'));
router.post('/:id/reject', protect, authorize('client'), ctrl('rejectQuote'));

// Shared
router.get('/:id', protect, ctrl('getQuoteById'));

module.exports = router;

