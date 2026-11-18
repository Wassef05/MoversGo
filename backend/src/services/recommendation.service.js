const mongoose = require('mongoose');
const MovingRequest = require('../models/MovingRequest');
const Company = require('../models/Company');

// Standard fallback coordinates for Tunisian cities & governorates
const TUNISIAN_REGIONS_COORDS = {
  'tunis': [10.1815, 36.8065],
  'ariana': [10.1956, 36.8665],
  'ben arous': [10.2228, 36.7531],
  'manouba': [10.0982, 36.8080],
  'nabeul': [10.7376, 36.4561],
  'zaghouan': [10.1429, 36.4029],
  'bizerte': [9.8739, 37.2744],
  'beja': [9.1844, 36.7256],
  'béja': [9.1844, 36.7256],
  'jendouba': [8.7802, 36.5011],
  'le kef': [8.7049, 36.1822],
  'kef': [8.7049, 36.1822],
  'siliana': [9.3708, 36.0849],
  'sousse': [10.6369, 35.8256],
  'monastir': [10.8262, 35.7779],
  'mahdia': [11.0622, 35.5047],
  'sfax': [10.7603, 34.7406],
  'kairouan': [10.0963, 35.6781],
  'kasserine': [8.8365, 35.1676],
  'sidi bouzid': [9.4849, 35.0382],
  'gabes': [10.1017, 33.8815],
  'gabès': [10.1017, 33.8815],
  'medenine': [10.4959, 33.3549],
  'médenine': [10.4959, 33.3549],
  'tataouine': [10.4518, 32.9297],
  'gafsa': [8.7842, 34.4250],
  'tozeur': [8.1335, 33.9197],
  'kebili': [8.9715, 33.7044],
  'kébili': [8.9715, 33.7044],
  'hammamet': [10.6167, 36.4000],
  'la marsa': [10.3247, 36.8783],
  'carthage': [10.3247, 36.8528],
  'gammarth': [10.2917, 36.9194],
  'djerba': [10.8575, 33.8076],
};

/**
 * Resolve coordinates for a location (object or city/gov)
 * Returns [latitude, longitude]
 */
function resolveLatLng(locObj, city, gov) {
  if (locObj) {
    if (locObj.latitude !== undefined && locObj.longitude !== undefined && !isNaN(locObj.latitude) && !isNaN(locObj.longitude)) {
      return [parseFloat(locObj.latitude), parseFloat(locObj.longitude)];
    }
    if (Array.isArray(locObj.coordinates) && locObj.coordinates.length >= 2) {
      // GeoJSON coordinates are [longitude, latitude]
      return [parseFloat(locObj.coordinates[1]), parseFloat(locObj.coordinates[0])];
    }
  }

  const cleanCity = (city || '').toLowerCase().trim();
  const cleanGov = (gov || '').toLowerCase().trim();

  if (TUNISIAN_REGIONS_COORDS[cleanCity]) {
    const [lng, lat] = TUNISIAN_REGIONS_COORDS[cleanCity];
    return [lat, lng];
  }
  if (TUNISIAN_REGIONS_COORDS[cleanGov]) {
    const [lng, lat] = TUNISIAN_REGIONS_COORDS[cleanGov];
    return [lat, lng];
  }
  for (const [key, coords] of Object.entries(TUNISIAN_REGIONS_COORDS)) {
    if (cleanCity.includes(key) || cleanGov.includes(key)) {
      return [coords[1], coords[0]];
    }
  }
  return null;
}

/**
 * Calculate Haversine distance in kilometers between two GPS points
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Evaluate single MovingRequest against a Company profile
 * Returns detailed match breakdown and composite score (0-100)
 */
function evaluateRequestForCompany(request, company) {
  // 1. Company coordinates
  const compLatLng = resolveLatLng(
    company.location || company.address,
    company.address?.city,
    company.address?.governorate
  );

  // 2. Request departure & arrival coordinates
  const depLatLng = resolveLatLng(
    request.departureLocation || request.departureAddress,
    request.departureAddress?.city,
    request.departureAddress?.governorate
  );

  const arrLatLng = resolveLatLng(
    request.arrivalLocation || request.arrivalAddress,
    request.arrivalAddress?.city,
    request.arrivalAddress?.governorate
  );

  // ─── A. GEOGRAPHIC MATCHING (Pondération: 40%) ───
  let distanceKm = null;
  let geoScore = 50; // default baseline if coordinates cannot be computed
  let geoDetails = '';

  if (compLatLng && depLatLng) {
    distanceKm = calculateHaversineDistance(
      compLatLng[0],
      compLatLng[1],
      depLatLng[0],
      depLatLng[1]
    );

    if (distanceKm <= 10) {
      geoScore = 100;
      geoDetails = `Proximité immédiate (${distanceKm} km)`;
    } else if (distanceKm <= 25) {
      geoScore = 90;
      geoDetails = `Très proche (${distanceKm} km)`;
    } else if (distanceKm <= 50) {
      geoScore = 75;
      geoDetails = `Même agglomération / zone proche (${distanceKm} km)`;
    } else if (distanceKm <= 100) {
      geoScore = 55;
      geoDetails = `Zone régionale (${distanceKm} km)`;
    } else if (distanceKm <= 200) {
      geoScore = 35;
      geoDetails = `Trajet inter-régional (${distanceKm} km)`;
    } else {
      geoScore = 15;
      geoDetails = `Longue distance (${distanceKm} km)`;
    }
  } else {
    // Fallback based on governorate text matching
    const compGov = (company.address?.governorate || '').toLowerCase();
    const depGov = (request.departureAddress?.governorate || '').toLowerCase();
    const serviceAreas = (company.serviceAreas || []).map((s) => s.toLowerCase());

    if (compGov && depGov && compGov === depGov) {
      distanceKm = 15.0;
      geoScore = 85;
      geoDetails = `Même gouvernorat (${request.departureAddress?.governorate})`;
    } else if (serviceAreas.includes(depGov)) {
      distanceKm = 35.0;
      geoScore = 70;
      geoDetails = `Dans votre zone d'intervention déclarée (${request.departureAddress?.governorate})`;
    } else {
      distanceKm = 120.0;
      geoScore = 30;
      geoDetails = `Hors zone déclarée`;
    }
  }

  // Bonus: If arrival governorate matches company base or service areas (empty return trip optimization)
  const arrGov = (request.arrivalAddress?.governorate || '').toLowerCase();
  const compGov = (company.address?.governorate || '').toLowerCase();
  const serviceAreas = (company.serviceAreas || []).map((s) => s.toLowerCase());
  let returnTripBonus = 0;
  if (arrGov && (arrGov === compGov || serviceAreas.includes(arrGov))) {
    returnTripBonus = 5;
    geoScore = Math.min(100, geoScore + returnTripBonus);
  }

  // ─── B. SERVICE MATCHING (Pondération: 30%) ───
  let serviceScore = 0;
  const matchedServices = [];
  const missingServices = [];
  let isMajorMismatch = false;

  const compServicesText = (company.services || []).join(' ').toLowerCase();
  const reqHousing = (request.departureHousingType || '').toLowerCase();
  const reqComments = (request.comments || '').toLowerCase();
  const reqTitle = (request.title || request.customTitle || '').toLowerCase();

  const isOfficeMove =
    reqHousing.includes('office') ||
    reqHousing.includes('bureau') ||
    reqComments.includes('bureau') ||
    reqComments.includes('entreprise') ||
    reqTitle.includes('bureau') ||
    reqTitle.includes('entreprise');

  const isFreightOnly =
    compServicesText.includes('fret') ||
    compServicesText.includes('marchandise') ||
    compServicesText.includes('industriel');

  const hasResidential =
    compServicesText.includes('résidentiel') ||
    compServicesText.includes('residentiel') ||
    compServicesText.includes('appartement') ||
    compServicesText.includes('villa') ||
    compServicesText.includes('particulier') ||
    compServicesText.includes('déménagement');

  const hasOfficeService =
    compServicesText.includes('bureau') ||
    compServicesText.includes('entreprise') ||
    compServicesText.includes('professionnel') ||
    compServicesText.includes('commercial');

  // Verify primary category
  if (isOfficeMove) {
    if (hasOfficeService) {
      serviceScore += 60;
      matchedServices.push('Déménagement de bureaux & entreprises');
    } else {
      isMajorMismatch = true;
      missingServices.push('Déménagement de bureaux');
    }
  } else {
    // Standard residential move
    if (hasResidential || company.services?.length === 0) {
      serviceScore += 60;
      matchedServices.push('Déménagement résidentiel');
    } else if (isFreightOnly) {
      isMajorMismatch = true;
      missingServices.push('Déménagement résidentiel (Société spécialisée fret)');
    } else {
      serviceScore += 45;
    }
  }

  // Verify additional services
  const addServices = request.additionalServices || {};

  if (addServices.packing) {
    if (
      compServicesText.includes('emballage') ||
      compServicesText.includes('carton') ||
      compServicesText.includes('protection')
    ) {
      serviceScore += 10;
      matchedServices.push('Emballage & Protection');
    } else {
      missingServices.push('Emballage');
    }
  }

  if (addServices.furnitureDisassembly || addServices.furnitureAssembly) {
    if (
      compServicesText.includes('démontage') ||
      compServicesText.includes('demontage') ||
      compServicesText.includes('remontage') ||
      compServicesText.includes('montage')
    ) {
      serviceScore += 10;
      matchedServices.push('Démontage / Remontage de meubles');
    } else {
      missingServices.push('Démontage de meubles');
    }
  }

  if (addServices.truckLift) {
    if (
      compServicesText.includes('monte-charge') ||
      compServicesText.includes('monte-meubles') ||
      compServicesText.includes('monte meubles') ||
      compServicesText.includes('élévateur') ||
      compServicesText.includes('échelle')
    ) {
      serviceScore += 15;
      matchedServices.push('Monte-charge / Monte-meubles');
    } else {
      missingServices.push('Monte-charge extérieur');
    }
  }

  if (addServices.storage) {
    if (
      compServicesText.includes('garde-meuble') ||
      compServicesText.includes('garde-meubles') ||
      compServicesText.includes('stockage')
    ) {
      serviceScore += 10;
      matchedServices.push('Garde-meubles');
    } else {
      missingServices.push('Garde-meubles');
    }
  }

  if (request.fragileItems || request.heavyItems) {
    if (
      compServicesText.includes('objets d\'art') ||
      compServicesText.includes('piano') ||
      compServicesText.includes('valeur') ||
      compServicesText.includes('soigné')
    ) {
      serviceScore += 5;
      matchedServices.push('Objets fragiles ou lourds');
    }
  }

  serviceScore = Math.min(100, Math.max(0, serviceScore));

  // ─── C. CAPACITY MATCHING (Pondération: 20%) ───
  let capacityScore = 80; // Baseline
  let capacityDetails = 'Capacité standard adaptée';
  const volume = parseFloat(request.estimatedVolume) || 0;
  const fleetSize = company.fleetSize || 0;
  const employeesCount = company.employeesCount || 0;

  if (volume > 35) {
    if (fleetSize >= 3 || employeesCount >= 6) {
      capacityScore = 100;
      capacityDetails = `Grand volume (${volume} m³) parfaitement supporté par votre flotte`;
    } else if (fleetSize >= 1 || employeesCount >= 2) {
      capacityScore = 70;
      capacityDetails = `Grand volume (${volume} m³) – Nécessite plusieurs tournées ou équipes`;
    } else {
      capacityScore = 55;
      capacityDetails = `Volume élevé par rapport aux moyens déclarés`;
    }
  } else if (volume >= 15) {
    if (fleetSize >= 1 || employeesCount >= 2) {
      capacityScore = 100;
      capacityDetails = `Volume moyen (${volume} m³) idéal pour votre équipement`;
    } else {
      capacityScore = 80;
    }
  } else if (volume > 0) {
    capacityScore = 100;
    capacityDetails = `Petit volume (${volume} m³) facilement gérable`;
  }

  // Penalty if heavy items or high floor without elevator and low employee count
  if ((request.heavyItems || (request.departureFloor >= 3 && !request.departureElevator)) && employeesCount > 0 && employeesCount < 3) {
    capacityScore = Math.max(40, capacityScore - 20);
    capacityDetails += ' • Manutention lourde sans ascenseur';
  }

  // ─── D. AVAILABILITY & FRESHNESS (Pondération: 10%) ───
  let availabilityScore = 80;
  let availabilityDetails = '';

  // Quotes competition
  const quotesCount = request.quotesCount || 0;
  if (quotesCount === 0) {
    availabilityScore = 100;
    availabilityDetails = 'Nouvelle opportunité exclusive (0 devis émis)';
  } else if (quotesCount <= 2) {
    availabilityScore = 90;
    availabilityDetails = `Faible concurrence (${quotesCount} devis émis)`;
  } else if (quotesCount <= 4) {
    availabilityScore = 75;
    availabilityDetails = `Concurrence modérée (${quotesCount} devis émis)`;
  } else {
    availabilityScore = 50;
    availabilityDetails = `Forte concurrence (${quotesCount} devis déjà soumis)`;
  }

  // Preferred date feasibility
  if (request.preferredDate) {
    const moveDate = new Date(request.preferredDate);
    const now = new Date();
    const diffDays = Math.ceil((moveDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      availabilityScore = 20; // Date in the past
    } else if (diffDays <= 2) {
      availabilityDetails += ' • Déménagement très urgent (< 48h)';
    } else if (diffDays >= 7 && diffDays <= 30) {
      availabilityScore = Math.min(100, availabilityScore + 10);
      availabilityDetails += ' • Période idéale de planification';
    }
  }

  // ─── FINAL COMPOSITE SCORE (0 to 100) ───
  let finalScore = Math.round(
    geoScore * 0.40 +
    serviceScore * 0.30 +
    capacityScore * 0.20 +
    availabilityScore * 0.10
  );

  // Critical Gate: High geographical proximity CANNOT compensate for major service incompatibility
  if (isMajorMismatch) {
    finalScore = Math.min(35, finalScore);
  }

  let relevanceLevel = 'medium';
  if (finalScore >= 85) {
    relevanceLevel = 'excellent';
  } else if (finalScore >= 70) {
    relevanceLevel = 'good';
  } else if (finalScore >= 50) {
    relevanceLevel = 'medium';
  } else {
    relevanceLevel = 'low';
  }

  return {
    score: finalScore,
    relevanceLevel,
    distanceKm: distanceKm !== null ? distanceKm : null,
    isMajorMismatch,
    breakdown: {
      geo: {
        score: geoScore,
        weight: 40,
        distanceKm,
        details: geoDetails,
        returnTripBonus: returnTripBonus > 0,
      },
      service: {
        score: serviceScore,
        weight: 30,
        matchedServices,
        missingServices,
        isMajorMismatch,
      },
      capacity: {
        score: capacityScore,
        weight: 20,
        details: capacityDetails,
      },
      availability: {
        score: availabilityScore,
        weight: 10,
        details: availabilityDetails,
        quotesCount,
      },
    },
    coordinates: {
      departure: depLatLng ? { lat: depLatLng[0], lng: depLatLng[1] } : null,
      arrival: arrLatLng ? { lat: arrLatLng[0], lng: arrLatLng[1] } : null,
      company: compLatLng ? { lat: compLatLng[0], lng: compLatLng[1] } : null,
    },
  };
}

/**
 * Get scored recommendations for an authenticated company
 */
async function getCompanyRecommendations(companyId, filters = {}) {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Entreprise introuvable');
  }

  const {
    page = 1,
    limit = 12,
    maxDistance,
    relevanceLevel,
    housingType,
    minScore,
    sortBy = 'score', // 'score' | 'distance' | 'date' | 'recent'
    search,
    governorate,
  } = filters;

  // Active requests only: pending or quoted, visible, no accepted quote
  const query = {
    status: { $in: ['pending', 'quoted'] },
    isVisible: true,
    acceptedQuote: null,
  };

  if (housingType && housingType !== 'all') {
    query.departureHousingType = housingType;
  }

  if (governorate && governorate !== 'all') {
    query.$or = [
      { 'departureAddress.governorate': { $regex: governorate, $options: 'i' } },
      { 'departureAddress.city': { $regex: governorate, $options: 'i' } },
    ];
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      ...(query.$or || []),
      { customTitle: { $regex: s, $options: 'i' } },
      { 'departureAddress.city': { $regex: s, $options: 'i' } },
      { 'arrivalAddress.city': { $regex: s, $options: 'i' } },
      { 'departureAddress.governorate': { $regex: s, $options: 'i' } },
      { 'arrivalAddress.governorate': { $regex: s, $options: 'i' } },
    ];
  }

  // Fetch all active candidate requests
  const candidateRequests = await MovingRequest.find(query)
    .populate('client', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

  // Evaluate & score each candidate
  const companyMaxDist = maxDistance ? parseFloat(maxDistance) : (company.recommendationSettings?.maxDistanceKm || 150);
  const minRequiredScore = minScore ? parseInt(minScore, 10) : (company.recommendationSettings?.minScore || 35);

  let evaluated = candidateRequests.map((req) => {
    const evaluation = evaluateRequestForCompany(req, company);
    return {
      ...req,
      recommendation: evaluation,
      score: evaluation.score,
      relevanceLevel: evaluation.relevanceLevel,
      distanceKm: evaluation.distanceKm,
    };
  });

  // Apply filters
  if (maxDistance && maxDistance !== 'all' && !isNaN(companyMaxDist)) {
    evaluated = evaluated.filter(
      (item) => item.distanceKm === null || item.distanceKm <= companyMaxDist
    );
  }

  if (relevanceLevel && relevanceLevel !== 'all') {
    evaluated = evaluated.filter((item) => item.relevanceLevel === relevanceLevel);
  }

  if (minRequiredScore > 0) {
    evaluated = evaluated.filter((item) => item.score >= minRequiredScore);
  }

  // Sorting
  if (sortBy === 'distance') {
    evaluated.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else if (sortBy === 'date') {
    evaluated.sort((a, b) => new Date(a.preferredDate || '2099') - new Date(b.preferredDate || '2099'));
  } else if (sortBy === 'recent') {
    evaluated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    // Default: by score descending, with distance as tie-breaker
    evaluated.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
    });
  }

  const total = evaluated.length;
  const numPage = Math.max(1, parseInt(page, 10));
  const numLimit = Math.max(1, parseInt(limit, 10));
  const paginatedItems = evaluated.slice((numPage - 1) * numLimit, numPage * numLimit);

  return {
    items: paginatedItems,
    pagination: {
      total,
      page: numPage,
      limit: numLimit,
      pages: Math.ceil(total / numLimit) || 1,
    },
  };
}

/**
 * Get summary KPIs for company recommendations
 */
async function getCompanyRecommendationStats(companyId) {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Entreprise introuvable');
  }

  const candidateRequests = await MovingRequest.find({
    status: { $in: ['pending', 'quoted'] },
    isVisible: true,
    acceptedQuote: null,
  }).lean();

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  let totalRecommended = 0;
  let newOpportunities = 0;
  let nearbyCount = 0; // <= 25 km
  let perfectServiceMatches = 0; // service score >= 90%
  let totalScoreSum = 0;

  for (const req of candidateRequests) {
    const evaluation = evaluateRequestForCompany(req, company);
    if (evaluation.score >= 40) {
      totalRecommended++;
      totalScoreSum += evaluation.score;

      if (new Date(req.createdAt) >= twoDaysAgo) {
        newOpportunities++;
      }
      if (evaluation.distanceKm !== null && evaluation.distanceKm <= 25) {
        nearbyCount++;
      }
      if (evaluation.breakdown.service.score >= 90) {
        perfectServiceMatches++;
      }
    }
  }

  const averageScore = totalRecommended > 0 ? Math.round(totalScoreSum / totalRecommended) : 0;

  return {
    totalRecommended,
    newOpportunities,
    nearbyCount,
    perfectServiceMatches,
    averageScore,
  };
}

/**
 * Get map data for company recommendations
 */
async function getRecommendationMapData(companyId) {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Entreprise introuvable');
  }

  const candidateRequests = await MovingRequest.find({
    status: { $in: ['pending', 'quoted'] },
    isVisible: true,
    acceptedQuote: null,
  })
    .populate('client', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const compLatLng = resolveLatLng(
    company.location || company.address,
    company.address?.city,
    company.address?.governorate
  );

  const markers = [];

  for (const req of candidateRequests) {
    const evaluation = evaluateRequestForCompany(req, company);
    if (evaluation.score >= 35 && evaluation.coordinates.departure) {
      markers.push({
        id: req._id,
        title: req.title || `Déménagement ${req.departureAddress?.city} → ${req.arrivalAddress?.city}`,
        departure: {
          lat: evaluation.coordinates.departure.lat,
          lng: evaluation.coordinates.departure.lng,
          city: req.departureAddress?.city,
          governorate: req.departureAddress?.governorate,
          housingType: req.departureHousingType,
        },
        arrival: evaluation.coordinates.arrival
          ? {
              lat: evaluation.coordinates.arrival.lat,
              lng: evaluation.coordinates.arrival.lng,
              city: req.arrivalAddress?.city,
              governorate: req.arrivalAddress?.governorate,
            }
          : null,
        distanceKm: evaluation.distanceKm,
        score: evaluation.score,
        relevanceLevel: evaluation.relevanceLevel,
        volume: req.estimatedVolume || 0,
        estimatedBudget: req.estimatedBudget || null,
        preferredDate: req.preferredDate || null,
      });
    }
  }

  return {
    company: {
      id: company._id,
      name: company.companyName,
      coordinates: compLatLng ? { lat: compLatLng[0], lng: compLatLng[1] } : null,
      city: company.address?.city,
      governorate: company.address?.governorate,
    },
    markers,
  };
}

/**
 * Find matching companies to notify when a new MovingRequest is published
 */
async function findMatchingCompaniesForRequest(request, minScore = 60) {
  // Find approved active companies
  let companies = await Company.find({
    verificationStatus: 'approved',
    isActive: true,
  }).populate('user', 'email firstName lastName phone');

  if (companies.length === 0) {
    companies = await Company.find({ isActive: true }).populate('user', 'email firstName lastName phone');
  }

  const matches = [];

  for (const comp of companies) {
    if (!comp.user) continue;

    // Check company preference for notifications
    if (comp.recommendationSettings && comp.recommendationSettings.notificationsEnabled === false) {
      continue;
    }

    const evaluation = evaluateRequestForCompany(request, comp);
    const threshold = comp.recommendationSettings?.minScore || minScore;

    if (evaluation.score >= threshold && !evaluation.isMajorMismatch) {
      matches.push({
        company: comp,
        user: comp.user,
        score: evaluation.score,
        distanceKm: evaluation.distanceKm,
        relevanceLevel: evaluation.relevanceLevel,
      });
    }
  }

  // Sort descending by score
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

module.exports = {
  calculateHaversineDistance,
  evaluateRequestForCompany,
  getCompanyRecommendations,
  getCompanyRecommendationStats,
  getRecommendationMapData,
  findMatchingCompaniesForRequest,
};
