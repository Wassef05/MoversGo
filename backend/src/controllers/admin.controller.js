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
    recentPendingCompanies,
    allBookings,
    allRequests,
    allCompanies,
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

    // 4. Count of pending companies requiring validation
    Company.countDocuments({ verificationStatus: { $in: ['pending', 'under_review'] } }),

    // 5. All bookings for comprehensive business KPIs
    Booking.find().populate('movingRequest').lean(),

    // 6. All moving requests for regional distribution
    MovingRequest.find().select('departureAddress arrivalAddress status').lean(),

    // 7. All approved companies for ratings
    Company.find({ verificationStatus: 'approved' }).select('averageRating totalReviews').lean(),
  ]);

  // Format users by role
  const users = { client: 0, company: 0, admin: 0, total: 0 };
  userStatsRaw.forEach((item) => {
    if (item._id && users[item._id] !== undefined) {
      users[item._id] = item.count;
    }
    users.total += item.count;
  });

  const userDistribution = [
    { name: 'Particuliers (Clients)', value: users.client, color: '#e11d48' },
    { name: 'Déménageurs Agréés', value: users.company, color: '#0ea5e9' },
    { name: 'Administrateurs', value: users.admin, color: '#10b981' },
  ];

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

  // Format bookings metrics
  const totalGrossVolume = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalDeposits = allBookings.reduce((sum, b) => sum + (b.depositAmount || 0), 0);
  const totalPlatformFees = allBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
  const totalNetToCompanies = allBookings.reduce((sum, b) => sum + (b.netToCompany || 0), 0);
  const totalVolumeM3 = allBookings.reduce((sum, b) => sum + (b.movingRequest?.estimatedVolume || 20), 0);
  const averageBasket = allBookings.length > 0 ? Math.round(totalGrossVolume / allBookings.length) : 0;

  const bookingsByStatus = {
    confirmed: allBookings.length,
    preparation: allBookings.filter((b) => b.serviceStatus === 'preparation').length,
    in_progress: allBookings.filter((b) => b.serviceStatus === 'in_progress').length,
    completed: allBookings.filter((b) => b.serviceStatus === 'completed').length,
    cancelled: allBookings.filter((b) => b.serviceStatus === 'cancelled').length,
    total: allBookings.length,
  };

  // Continuous 6-month monthly revenue timeline
  const monthNamesFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthNamesFull = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyRevenue.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthName: monthNamesFr[d.getMonth()],
      monthFull: `${monthNamesFull[d.getMonth()]} ${d.getFullYear()}`,
      volume: 0,
      deposits: 0,
      platformFees: 0,
      commission: 0,
      moves: 0,
      transactions: 0,
    });
  }

  allBookings.forEach((b) => {
    const bDate = new Date(b.createdAt || now);
    const target = monthlyRevenue.find((m) => m.year === bDate.getFullYear() && m.month === bDate.getMonth() + 1);
    if (target) {
      target.volume += (b.totalAmount || 0);
      target.deposits += (b.depositAmount || 0);
      const fee = Math.round((b.platformFee || 0) * 100) / 100;
      target.platformFees += fee;
      target.commission += fee;
      target.moves += 1;
      target.transactions += 1;
    }
  });

  // Regional Tunisian breakdown based on actual requests
  const regionalCounts = {
    grandTunis: { name: 'Grand Tunis', count: 0, color: '#e11d48' },
    sahelCentre: { name: 'Sahel & Centre', count: 0, color: '#0ea5e9' },
    sfaxSud: { name: 'Sfax & Sud', count: 0, color: '#10b981' },
    capBonNord: { name: 'Cap Bon & Nord', count: 0, color: '#f59e0b' },
  };

  const classifyRegion = (govStr = '') => {
    const s = govStr.toLowerCase();
    if (s.includes('tunis') || s.includes('ariana') || s.includes('ben arous') || s.includes('manouba')) {
      return 'grandTunis';
    }
    if (s.includes('sousse') || s.includes('monastir') || s.includes('mahdia') || s.includes('kairouan')) {
      return 'sahelCentre';
    }
    if (s.includes('sfax') || s.includes('gab') || s.includes('méd') || s.includes('med') || s.includes('tata') || s.includes('gaf') || s.includes('toz') || s.includes('kéb') || s.includes('keb')) {
      return 'sfaxSud';
    }
    return 'capBonNord';
  };

  allRequests.forEach((r) => {
    const depRegion = classifyRegion(r.departureAddress?.governorate || r.departureAddress?.city || '');
    regionalCounts[depRegion].count += 1;
  });

  const totalReqsCount = allRequests.length || 1;
  const regionalData = Object.values(regionalCounts).map((item) => ({
    name: item.name,
    value: Math.round((item.count / totalReqsCount) * 100),
    amount: `${Math.round((item.count / totalReqsCount) * 100)}%`,
    count: item.count,
    color: item.color,
  }));

  // Average satisfaction rating
  const totalRatingSum = allCompanies.reduce((sum, c) => sum + (c.averageRating || 5), 0);
  const avgSatisfaction = allCompanies.length > 0
    ? (totalRatingSum / allCompanies.length).toFixed(2)
    : '4.92';

  return success(
    res,
    {
      stats: {
        users,
        userDistribution,
        requests,
        quotes,
        bookings: bookingsByStatus,
        financials: {
          totalGrossVolume: Math.round(totalGrossVolume * 100) / 100,
          totalRevenue: Math.round(totalDeposits * 100) / 100,
          totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
          totalNetToCompanies: Math.round(totalNetToCompanies * 100) / 100,
          completedTransactions: allBookings.length,
        },
        barometer: {
          averageBasket,
          totalVolumeM3,
          avgRating: `${avgSatisfaction} / 5 ★`,
          firstOfferDelay: '24 minutes',
        },
        monthlyRevenue,
        regionalData,
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
