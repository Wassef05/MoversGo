/**
 * Automated test script for MoversGo Recommendation Engine
 */
const {
  calculateHaversineDistance,
  evaluateRequestForCompany,
} = require('../src/services/recommendation.service');

console.log('🧪 Starting MoversGo Recommendation Engine Automated Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// Company in Sousse (Sahel Express Déménagement)
const companySousse = {
  _id: 'comp_sousse_01',
  companyName: 'Sahel Express Déménagement',
  services: [
    'Déménagement résidentiel',
    'Déménagement bureaux',
    'Échelle monte-meubles',
    'Emballage soigné',
    'Démontage & Remontage',
  ],
  serviceAreas: ['Sousse', 'Monastir', 'Mahdia'],
  fleetSize: 6,
  employeesCount: 16,
  address: { city: 'Sousse', governorate: 'Sousse', latitude: 35.8256, longitude: 10.6369 },
  location: { type: 'Point', coordinates: [10.6369, 35.8256], latitude: 35.8256, longitude: 10.6369 },
  recommendationSettings: { maxDistanceKm: 50, minScore: 40, notificationsEnabled: true },
};

// Company specialized strictly in freight/industrial transport
const companyFreightOnly = {
  _id: 'comp_freight_01',
  companyName: 'Fret Express Tunisie',
  services: ['Transport de marchandises', 'Fret industriel', 'Transport lourd'],
  serviceAreas: ['Tunis', 'Sfax'],
  fleetSize: 5,
  employeesCount: 10,
  address: { city: 'Sousse', governorate: 'Sousse', latitude: 35.8256, longitude: 10.6369 },
  location: { type: 'Point', coordinates: [10.6369, 35.8256], latitude: 35.8256, longitude: 10.6369 },
};

// Scenario 1 & 4: Move from Sousse to Monastir (residential apartment, 25m³, packing + disassembly)
const reqSousseToMonastir = {
  _id: 'req_01',
  title: "Déménagement d'un appartement",
  departureAddress: { city: 'Sousse', governorate: 'Sousse', latitude: 35.8256, longitude: 10.6369 },
  departureHousingType: 'apartment',
  arrivalAddress: { city: 'Monastir', governorate: 'Monastir', latitude: 35.7779, longitude: 10.8262 },
  arrivalHousingType: 'apartment',
  estimatedVolume: 25,
  additionalServices: { packing: true, furnitureDisassembly: true },
  status: 'pending',
  quotesCount: 0,
  preferredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
};

const eval1 = evaluateRequestForCompany(reqSousseToMonastir, companySousse);
console.log('Scenario 1 (Sousse -> Monastir):', {
  score: eval1.score,
  relevance: eval1.relevanceLevel,
  distance: eval1.distanceKm,
  geoScore: eval1.breakdown.geo.score,
  serviceScore: eval1.breakdown.service.score,
});

assert(eval1.distanceKm <= 20, 'Distance between Sousse and Monastir should be <= 20 km');
assert(eval1.score >= 85, 'Nearby matching move should score >= 85% (Excellent)');
assert(eval1.relevanceLevel === 'excellent', 'Relevance level should be excellent');

// Scenario 2: Distant move from Bizerte to Tunis
const reqBizerteToTunis = {
  _id: 'req_02',
  title: 'Déménagement Bizerte → Tunis',
  departureAddress: { city: 'Bizerte', governorate: 'Bizerte', latitude: 37.2744, longitude: 9.8739 },
  departureHousingType: 'apartment',
  arrivalAddress: { city: 'Tunis', governorate: 'Tunis', latitude: 36.8065, longitude: 10.1815 },
  estimatedVolume: 20,
  status: 'pending',
  quotesCount: 1,
  preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

const eval2 = evaluateRequestForCompany(reqBizerteToTunis, companySousse);
console.log('Scenario 2 (Distant Bizerte -> Tunis):', {
  score: eval2.score,
  distance: eval2.distanceKm,
  geoScore: eval2.breakdown.geo.score,
});

assert(eval2.distanceKm > 100, 'Distance from Sousse to Bizerte should be > 100 km');
assert(eval2.score < eval1.score, 'Distant move must score lower than nearby move');
assert(eval2.breakdown.geo.score <= 35, 'Geo score for distant move should be <= 35');

// Scenario 3: Freight-only company evaluating a residential move
const eval3 = evaluateRequestForCompany(reqSousseToMonastir, companyFreightOnly);
console.log('Scenario 3 (Freight company vs Residential move):', {
  score: eval3.score,
  isMajorMismatch: eval3.isMajorMismatch,
  serviceScore: eval3.breakdown.service.score,
});

assert(eval3.isMajorMismatch === true, 'Freight company on residential move must flag major mismatch');
assert(eval3.score <= 35, 'Major service mismatch must strictly cap overall score <= 35%');

// Scenario 8: Fallback when GPS coordinates are omitted (city only)
const reqNoGPS = {
  _id: 'req_04',
  departureAddress: { city: 'Sousse', governorate: 'Sousse' },
  arrivalAddress: { city: 'Monastir', governorate: 'Monastir' },
  departureHousingType: 'apartment',
  estimatedVolume: 15,
  status: 'pending',
  quotesCount: 0,
};

const eval8 = evaluateRequestForCompany(reqNoGPS, companySousse);
console.log('Scenario 8 (No GPS, city dictionary lookup):', {
  score: eval8.score,
  distance: eval8.distanceKm,
});

assert(eval8.distanceKm !== null, 'Distance should be resolved via city fallback dictionary');
assert(eval8.score >= 80, 'Score should be high even with city text matching');

console.log(`\n🏁 Test Results: ${passedTests}/${totalTests} tests passed.\n`);
