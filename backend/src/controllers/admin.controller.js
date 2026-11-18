const User = require('../models/User');
const Company = require('../models/Company');
const MovingRequest = require('../models/MovingRequest');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const {
  success,
  paginated,
  notFound,
  buildPagination,
} = require('../utils/apiResponse');

/**
 * GET /api/v1/admin/dashboard
 * Aggregated platform metrics and KPIs
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    userStatsRaw,
    requestStatsRaw,
    quoteStatsRaw,
    bookingStatsRaw,
    revenueStatsRaw,
    monthlyRevenueRaw,
    recentPendingCompanies,
  ] = await Promise.all([
    // 1. Users by role
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),

    // 2. Moving Requests by status
    MovingRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // 3. Quotes by status
    Quote.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // 4. Bookings by bookingStatus
    Booking.aggregate([
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 },
        },
      },
    ]),

    // 5. Total revenue & platform commissions (completed transactions)
    Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPlatformFees: { $sum: '$platformFee' },
          totalNetToCompanies: { $sum: '$netToCompany' },
          completedTransactionsCount: { $sum: 1 },
        },
      },
    ]),

    // 6. Monthly revenue for the last 6 months
    Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          platformFees: { $sum: '$platformFee' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]),

    // 7. Count of pending companies requiring validation
    Company.countDocuments({ verificationStatus: { $in: ['pending', 'under_review'] } }),
  ]);

  // Format users by role
  const users = { client: 0, company: 0, admin: 0, total: 0 };
  userStatsRaw.forEach((item) => {
    if (item._id && users[item._id] !== undefined) {
      users[item._id] = item.count;
    }
    users.total += item.count;
  });

  // Format requests by status
  const requests = {
    pending: 0,
    quoted: 0,
    booked: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };
  requestStatsRaw.forEach((item) => {
    if (item._id && requests[item._id] !== undefined) {
      requests[item._id] = item.count;
    }
    requests.total += item.count;
  });

  // Conversion rate (booked/in_progress/completed requests / total requests)
  const convertedCount = requests.booked + requests.in_progress + requests.completed;
  const conversionRate =
    requests.total > 0
      ? Math.round((convertedCount / requests.total) * 10000) / 100
      : 0;

  // Format quotes by status
  const quotes = {
    submitted: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    cancelled: 0,
    total: 0,
  };
  quoteStatsRaw.forEach((item) => {
    if (item._id && quotes[item._id] !== undefined) {
      quotes[item._id] = item.count;
    }
    quotes.total += item.count;
  });

  // Format bookings
  const bookings = { confirmed: 0, cancelled: 0, disputed: 0, total: 0 };
  bookingStatsRaw.forEach((item) => {
    if (item._id && bookings[item._id] !== undefined) {
      bookings[item._id] = item.count;
    }
    bookings.total += item.count;
  });

  // Financials
  const rev = revenueStatsRaw[0] || {
    totalRevenue: 0,
    totalPlatformFees: 0,
    totalNetToCompanies: 0,
    completedTransactionsCount: 0,
  };

  const monthlyRevenue = monthlyRevenueRaw.map((m) => ({
    year: m._id.year,
    month: m._id.month,
    revenue: Math.round(m.revenue * 100) / 100,
    platformFees: Math.round(m.platformFees * 100) / 100,
    transactions: m.count,
  }));

  return success(
    res,
    {
      stats: {
        users,
        requests,
        quotes,
        bookings,
        financials: {
          totalRevenue: Math.round(rev.totalRevenue * 100) / 100,
          totalPlatformFees: Math.round(rev.totalPlatformFees * 100) / 100,
          totalNetToCompanies: Math.round(rev.totalNetToCompanies * 100) / 100,
          completedTransactions: rev.completedTransactionsCount,
        },
        monthlyRevenue,
        conversionRate,
        pendingCompaniesCount: recentPendingCompanies,
      },
    },
    'Statistiques du tableau de bord administrateur'
  );
});

/**
 * GET /api/v1/admin/transactions
 * Paginated transactions list for admin auditing
 */
const getTransactions = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const { status, type, dateFrom, dateTo, search } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  if (search && search.trim()) {
    filter.reference = { $regex: search.trim(), $options: 'i' };
  }

  const total = await Transaction.countDocuments(filter);
  const transactions = await Transaction.find(filter)
    .populate('client', 'firstName lastName email phone')
    .populate('company', 'companyName logo phone')
    .populate({
      path: 'booking',
      select: 'scheduledDate totalAmount serviceStatus',
      populate: { path: 'movingRequest', select: 'departureAddress arrivalAddress' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pagination = buildPagination(page, limit, total);
  return paginated(res, transactions, pagination, 'Transactions financières');
});

/**
 * GET /api/v1/company/statistics (or /api/v1/companies/statistics)
 * Key performance metrics for the authenticated company
 */
const getCompanyStats = catchAsync(async (req, res) => {
  const company = req.company || (await Company.findOne({ user: req.user._id }));
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable');
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalQuotes,
    acceptedQuotes,
    rejectedQuotes,
    pendingQuotes,
    monthlyBookingsRaw,
    revenueStatsRaw,
  ] = await Promise.all([
    Quote.countDocuments({ company: company._id }),
    Quote.countDocuments({ company: company._id, status: 'accepted' }),
    Quote.countDocuments({ company: company._id, status: 'rejected' }),
    Quote.countDocuments({ company: company._id, status: { $in: ['submitted', 'viewed'] } }),

    // Monthly bookings
    Booking.aggregate([
      {
        $match: {
          company: company._id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$netToCompany' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]),

    // Total net revenue
    Transaction.aggregate([
      {
        $match: {
          company: company._id,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$netToCompany' },
        },
      },
    ]),
  ]);

  const monthlyBookings = monthlyBookingsRaw.map((b) => ({
    year: b._id.year,
    month: b._id.month,
    bookingsCount: b.count,
    revenue: Math.round((b.totalRevenue || 0) * 100) / 100,
  }));

  const totalEarned = revenueStatsRaw[0]?.totalEarned || 0;

  return success(
    res,
    {
      statistics: {
        totalQuotes,
        acceptedQuotes,
        rejectedQuotes,
        pendingQuotes,
        quoteAcceptanceRate:
          totalQuotes > 0
            ? Math.round((acceptedQuotes / totalQuotes) * 10000) / 100
            : 0,
        completedMoves: company.completedMoves || 0,
        averageRating: company.averageRating || 0,
        totalReviews: company.totalReviews || 0,
        totalEarned: Math.round(totalEarned * 100) / 100,
        monthlyBookings,
      },
    },
    'Statistiques de votre entreprise'
  );
});

module.exports = {
  getDashboardStats,
  getTransactions,
  getCompanyStats,
};
