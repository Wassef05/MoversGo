const Company = require('../models/Company');
const MovingRequest = require('../models/MovingRequest');
const catchAsync = require('../utils/catchAsync');
const {
  success,
  notFound,
  badRequest,
  forbidden,
} = require('../utils/apiResponse');
const recommendationService = require('../services/recommendation.service');

/**
 * Helper: Resolve company for authenticated user
 */
const getAuthCompany = async (req) => {
  if (req.company) return req.company;
  const company = await Company.findOne({ user: req.user._id });
  return company;
};

/**
 * GET /api/v1/recommendations/company
 * Retrieve paginated & filtered smart recommendations for the authenticated company
 */
const getCompanyRecommendations = catchAsync(async (req, res) => {
  const company = await getAuthCompany(req);
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable pour cet utilisateur.');
  }

  const {
    page,
    limit,
    maxDistance,
    relevanceLevel,
    housingType,
    minScore,
    sortBy,
    search,
    governorate,
  } = req.query;

  const result = await recommendationService.getCompanyRecommendations(company._id, {
    page,
    limit,
    maxDistance,
    relevanceLevel,
    housingType,
    minScore,
    sortBy,
    search,
    governorate,
  });

  return success(
    res,
    {
      recommendations: result.items,
      pagination: result.pagination,
      companyLocation: {
        city: company.address?.city,
        governorate: company.address?.governorate,
        coordinates: company.location?.coordinates,
      },
    },
    'Déménagements recommandés récupérés avec succès'
  );
});

/**
 * GET /api/v1/recommendations/company/stats
 * Retrieve summary KPIs for company's opportunities
 */
const getCompanyRecommendationStats = catchAsync(async (req, res) => {
  const company = await getAuthCompany(req);
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable.');
  }

  const stats = await recommendationService.getCompanyRecommendationStats(company._id);
  return success(res, { stats }, 'Statistiques des opportunités recommandées');
});

/**
 * GET /api/v1/recommendations/company/map
 * Retrieve map pins (company base + recommended departures/arrivals)
 */
const getRecommendationMapData = catchAsync(async (req, res) => {
  const company = await getAuthCompany(req);
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable.');
  }

  const mapData = await recommendationService.getRecommendationMapData(company._id);
  return success(res, mapData, 'Données cartographiques des recommandations');
});

/**
 * GET /api/v1/recommendations/company/:requestId
 * Retrieve detailed score breakdown for a specific moving request
 */
const getRecommendationBreakdown = catchAsync(async (req, res) => {
  const company = await getAuthCompany(req);
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable.');
  }

  const request = await MovingRequest.findById(req.params.requestId).populate(
    'client',
    'firstName lastName'
  );

  if (!request) {
    return notFound(res, 'Demande de déménagement introuvable.');
  }

  const evaluation = recommendationService.evaluateRequestForCompany(request, company);

  return success(
    res,
    {
      request,
      recommendation: evaluation,
    },
    'Détail de la compatibilité calculé'
  );
});

/**
 * PUT /api/v1/companies/recommendation-settings
 * Update company's recommendation preferences (radius, notifications, min score)
 */
const updateRecommendationSettings = catchAsync(async (req, res) => {
  const company = await getAuthCompany(req);
  if (!company) {
    return notFound(res, 'Profil entreprise introuvable.');
  }

  const { maxDistanceKm, preferredHousingTypes, minScore, notificationsEnabled } = req.body;

  if (!company.recommendationSettings) {
    company.recommendationSettings = {};
  }

  if (maxDistanceKm !== undefined) {
    const d = parseFloat(maxDistanceKm);
    if (!isNaN(d) && d >= 5) company.recommendationSettings.maxDistanceKm = d;
  }

  if (minScore !== undefined) {
    const s = parseInt(minScore, 10);
    if (!isNaN(s) && s >= 0 && s <= 100) company.recommendationSettings.minScore = s;
  }

  if (notificationsEnabled !== undefined) {
    company.recommendationSettings.notificationsEnabled = Boolean(notificationsEnabled);
  }

  if (Array.isArray(preferredHousingTypes)) {
    company.recommendationSettings.preferredHousingTypes = preferredHousingTypes;
  }

  await company.save();

  return success(
    res,
    { recommendationSettings: company.recommendationSettings },
    'Paramètres de recommandation enregistrés'
  );
});

module.exports = {
  getCompanyRecommendations,
  getCompanyRecommendationStats,
  getRecommendationMapData,
  getRecommendationBreakdown,
  updateRecommendationSettings,
};
