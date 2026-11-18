const express = require('express');
const router = express.Router();
const { submitContactMessage } = require('../controllers/contact.controller');

// Public route ONLY - POST /api/v1/contact
// Admin endpoints are handled via admin.routes.js: GET/PATCH/DELETE /api/v1/admin/contact
router.post('/', submitContactMessage);

module.exports = router;
