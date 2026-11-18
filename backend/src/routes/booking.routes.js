const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize, requireApprovedCompany } = require('../middlewares/role.middleware');

let bookingController;
try { bookingController = require('../controllers/booking.controller'); } catch { bookingController = {}; }

const ctrl = (name) => (req, res, next) => {
  if (bookingController[name]) return bookingController[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// Client bookings
router.get('/my', protect, authorize('client'), ctrl('getMyBookings'));
router.post('/:id/pay-deposit', protect, authorize('client'), ctrl('payDeposit'));

// Company bookings
router.get('/company', protect, authorize('company'), requireApprovedCompany, ctrl('getCompanyBookings'));
router.patch('/:id/status', protect, authorize('company'), requireApprovedCompany, ctrl('updateServiceStatus'));
router.post('/:id/request-payment', protect, authorize('company'), requireApprovedCompany, ctrl('requestDepositPayment'));
router.post('/:id/confirm-cash-deposit', protect, authorize('company'), requireApprovedCompany, ctrl('confirmCashDeposit'));
router.post('/:id/remind', protect, authorize('company', 'admin'), requireApprovedCompany, ctrl('sendMovingReminder'));

// Shared
router.get('/:id/invoice', protect, ctrl('getBookingInvoice'));
router.post('/:id/invoice/sign', protect, authorize('company', 'admin'), ctrl('signInvoice'));
router.post('/:id/invoice/sign-client', protect, authorize('client'), ctrl('signClientInvoice'));
router.get('/:id', protect, ctrl('getBookingById'));
router.post('/:id/cancel', protect, ctrl('cancelBooking'));

module.exports = router;

