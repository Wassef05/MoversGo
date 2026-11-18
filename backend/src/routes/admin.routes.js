const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

let adminController;
try { adminController = require('../controllers/admin.controller'); } catch { adminController = {}; }
let userController;
try { userController = require('../controllers/user.controller'); } catch { userController = {}; }
let companyController;
try { companyController = require('../controllers/company.controller'); } catch { companyController = {}; }
let requestController;
try { requestController = require('../controllers/request.controller'); } catch { requestController = {}; }
let quoteController;
try { quoteController = require('../controllers/quote.controller'); } catch { quoteController = {}; }
let bookingController;
try { bookingController = require('../controllers/booking.controller'); } catch { bookingController = {}; }
let reviewController;
try { reviewController = require('../controllers/review.controller'); } catch { reviewController = {}; }
let supportController;
try { supportController = require('../controllers/support.controller'); } catch { supportController = {}; }
let contactController;
try { contactController = require('../controllers/contact.controller'); } catch { contactController = {}; }

const ctrl = (controller, name) => (req, res, next) => {
  if (controller[name]) return controller[name](req, res, next);
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', ctrl(adminController, 'getDashboardStats'));

// Users
router.get('/users', ctrl(userController, 'getAllUsers'));
router.get('/users/:id', ctrl(userController, 'getUserById'));
router.patch('/users/:id/status', ctrl(userController, 'updateUserStatus'));
router.delete('/users/:id', ctrl(userController, 'deleteUser'));

// Companies
router.get('/companies', ctrl(companyController, 'getAllCompanies'));
router.get('/companies/pending', ctrl(companyController, 'getPendingCompanies'));
router.patch('/companies/:id/approve', ctrl(companyController, 'approveCompany'));
router.patch('/companies/:id/reject', ctrl(companyController, 'rejectCompany'));
router.patch('/companies/:id/rectify', ctrl(companyController, 'requestCompanyRectification'));
router.patch('/companies/:id/suspend', ctrl(companyController, 'suspendCompany'));

// Requests
router.get('/requests', ctrl(requestController, 'getAllRequests'));

// Quotes
router.get('/quotes', ctrl(quoteController, 'getAllQuotes'));

// Bookings
router.get('/bookings', ctrl(bookingController, 'getAllBookings'));

// Reviews
router.get('/reviews', ctrl(reviewController, 'getAllReviews'));
router.patch('/reviews/:id/moderate', ctrl(reviewController, 'moderateReview'));
router.delete('/reviews/:id', ctrl(reviewController, 'deleteReview'));

// Support
router.get('/support', ctrl(supportController, 'getAllTickets'));
router.get('/support/:id', ctrl(supportController, 'getTicketById'));
router.post('/support/:id/messages', ctrl(supportController, 'addMessage'));
router.patch('/support/:id/status', ctrl(supportController, 'updateTicketStatus'));

// Contact Messages
router.get('/contact', ctrl(contactController, 'getAllContactMessages'));
router.get('/contact/:id', ctrl(contactController, 'getContactMessageById'));
router.post('/contact/:id/reply', ctrl(contactController, 'replyToContactMessage'));
router.patch('/contact/:id', ctrl(contactController, 'updateContactMessageStatus'));
router.delete('/contact/:id', ctrl(contactController, 'deleteContactMessage'));

// Transactions
router.get('/transactions', ctrl(adminController, 'getTransactions'));

module.exports = router;


