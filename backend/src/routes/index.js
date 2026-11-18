const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/companies', require('./company.routes'));
router.use('/recommendations', require('./recommendation.routes'));
router.use('/moving-requests', require('./request.routes'));
router.use('/quotes', require('./quote.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/conversations', require('./message.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/support', require('./support.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;

