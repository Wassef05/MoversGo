/**
 * MoveFlow TN - Database Seed Script
 * Seeds MongoDB with realistic Tunisian demo data
 * 
 * Usage: node seeds/seed.js
 * Usage (reset): node seeds/seed.js --reset
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const MovingRequest = require('../src/models/MovingRequest');
const Quote = require('../src/models/Quote');
const Booking = require('../src/models/Booking');
const Review = require('../src/models/Review');
const Notification = require('../src/models/Notification');
const Transaction = require('../src/models/Transaction');

const reset = process.argv.includes('--reset');

async function seed() {
  console.log('🌱 MoveFlow TN Database Seeder');
  console.log('══════════════════════════════');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);

  if (reset) {
    console.log('⚠️  Resetting database...');
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      MovingRequest.deleteMany({}),
      Quote.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log('✅ Database cleared');
  }

  // ─── USERS ───────────────────────────────────────
  console.log('\n👥 Creating users...');

  const defaultPassword = 'password123';

  const [adminUser, clientUser, clientUser2, companyUser1, companyUser2, companyUser3] = await User.create([
    {
      firstName: 'Amira',
      lastName: 'Mansour',
      email: 'admin@moveflow.tn',
      password: defaultPassword,
      phone: '+21671889400',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
      address: { city: 'Tunis', governorate: 'Tunis' },
    },
    {
      firstName: 'Yassine',
      lastName: 'Ben Salem',
      email: 'client@moveflow.tn',
      password: defaultPassword,
      phone: '+21698234567',
      role: 'client',
      isEmailVerified: true,
      isActive: true,
      address: { street: 'Avenue Hédi Nouira, Ennasr 2', city: 'Tunis', governorate: 'Ariana', postalCode: '2037' },
    },
    {
      firstName: 'Salma',
      lastName: 'Jaziri',
      email: 'salma.jaziri@gnet.tn',
      password: defaultPassword,
      phone: '+21629112334',
      role: 'client',
      isEmailVerified: true,
      isActive: true,
      address: { city: 'La Marsa', governorate: 'Tunis' },
    },
    {
      firstName: 'Karim',
      lastName: 'Bouazizi',
      email: 'company@moveflow.tn',
      password: defaultPassword,
      phone: '+21671889220',
      role: 'company',
      isEmailVerified: true,
      isActive: true,
      address: { city: 'Tunis', governorate: 'Tunis' },
    },
    {
      firstName: 'Farouk',
      lastName: 'Gaddour',
      email: 'sahel.express@moveflow.tn',
      password: defaultPassword,
      phone: '+21673380150',
      role: 'company',
      isEmailVerified: true,
      isActive: true,
      address: { city: 'Sousse', governorate: 'Sousse' },
    },
    {
      firstName: 'Hassen',
      lastName: 'Sfaxi',
      email: 'sfax.trans@moveflow.tn',
      password: defaultPassword,
      phone: '+21674290400',
      role: 'company',
      isEmailVerified: true,
      isActive: true,
      address: { city: 'Sfax', governorate: 'Sfax' },
    },
  ]);

  console.log(`  ✅ Created ${6} users`);

  // ─── COMPANIES ────────────────────────────────────
  console.log('\n🏢 Creating companies...');

  const [company1, company2, company3] = await Company.create([
    {
      user: companyUser1._id,
      companyName: 'Carthage Movers & Transport Express',
      description: 'Leader du déménagement moderne en Tunisie. Spécialiste du Grand Tunis et des liaisons nationales.',
      legalIdentifier: '1584920/A/M/000',
      legalStatus: 'SARL au capital de 80 000 DT',
      licenseNumber: 'AUT-MIN-TRANSP-2021-0418',
      insuranceInformation: { provider: 'STAR Assurances Pro', coverageAmount: 200000 },
      serviceAreas: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Sousse', 'Sfax'],
      services: [
        'Déménagement appartements & Villas',
        'Monte-charge extérieur (jusqu\'au 10ème étage)',
        'Démontage & Remontage meubles',
        'Emballage vaisselle et objets de valeur',
        'Liaison Grand Tunis - Sahel - Sfax',
      ],
      fleetSize: 9,
      employeesCount: 24,
      phone: '+21671889220',
      email: 'contact@carthagemovers.tn',
      website: 'https://carthagemovers.tn',
      address: { street: 'Rue du Lac Malaren, Les Berges du Lac 2', city: 'Tunis', governorate: 'Tunis', postalCode: '1053', latitude: 36.8325, longitude: 10.2375 },
      location: { type: 'Point', coordinates: [10.2375, 36.8325], latitude: 36.8325, longitude: 10.2375, formattedAddress: 'Les Berges du Lac 2, Tunis' },
      averageRating: 4.9,
      totalReviews: 168,
      completedMoves: 412,
      verificationStatus: 'approved',
      featured: true,
      verifiedAt: new Date('2024-01-15'),
      verifiedBy: adminUser._id,
    },
    {
      user: companyUser2._id,
      companyName: 'Sahel Express Déménagement',
      description: 'Référence du déménagement dans le Sahel. Camions capitonnés récents, équipe formée.',
      legalIdentifier: '1692041/B/N/000',
      legalStatus: 'SUARL au capital de 40 000 DT',
      licenseNumber: 'AUT-MIN-TRANSP-2022-0914',
      insuranceInformation: { provider: 'COMAR Assurances', coverageAmount: 150000 },
      serviceAreas: ['Sousse', 'Monastir', 'Mahdia', 'Tunis'],
      services: [
        'Déménagement résidentiel & bureaux',
        'Échelle monte-meubles',
        'Emballage soigné',
        'Garde-meubles sécurisé',
      ],
      fleetSize: 6,
      employeesCount: 16,
      phone: '+21673380150',
      email: 'contact@sahelexpress.tn',
      address: { city: 'Sousse', governorate: 'Sousse', postalCode: '4054', latitude: 35.8256, longitude: 10.6369 },
      location: { type: 'Point', coordinates: [10.6369, 35.8256], latitude: 35.8256, longitude: 10.6369, formattedAddress: 'Boulevard 14 Janvier, Sousse' },
      averageRating: 4.8,
      totalReviews: 114,
      completedMoves: 287,
      verificationStatus: 'approved',
      featured: true,
      verifiedAt: new Date('2024-01-10'),
      verifiedBy: adminUser._id,
    },
    {
      user: companyUser3._id,
      companyName: 'Trans Sfax International',
      description: 'Spécialiste du déménagement dans le Grand Sfax et liaisons nationales.',
      legalIdentifier: '1750318/C/P/000',
      legalStatus: 'SARL au capital de 50 000 DT',
      serviceAreas: ['Sfax', 'Gabès', 'Sousse', 'Tunis'],
      services: ['Déménagement résidentiel', 'Transport industriel', 'Emballage professionnel'],
      fleetSize: 4,
      employeesCount: 12,
      phone: '+21674290400',
      email: 'contact@transsfax.tn',
      address: { city: 'Sfax', governorate: 'Sfax' },
      averageRating: 4.6,
      totalReviews: 73,
      completedMoves: 198,
      verificationStatus: 'pending',
    },
  ]);

  // Link companies to users
  await User.findByIdAndUpdate(companyUser1._id, { company: company1._id });
  await User.findByIdAndUpdate(companyUser2._id, { company: company2._id });
  await User.findByIdAndUpdate(companyUser3._id, { company: company3._id });

  console.log(`  ✅ Created 3 companies`);

  // ─── MOVING REQUESTS ─────────────────────────────
  console.log('\n📦 Creating moving requests...');

  const [req1, req2, req3] = await MovingRequest.create([
    {
      client: clientUser._id,
      departureAddress: { street: 'Avenue Hédi Nouira, Ennasr 2', city: 'Tunis', governorate: 'Ariana', postalCode: '2037' },
      departureHousingType: 'apartment',
      departureFloor: 3,
      departureElevator: false,
      departureSurface: 95,
      arrivalAddress: { city: 'Sousse', governorate: 'Sousse', postalCode: '4000' },
      arrivalHousingType: 'apartment',
      arrivalFloor: 1,
      arrivalElevator: true,
      furniture: [
        { name: 'Salon complet (canapé + table)', quantity: 1 },
        { name: 'Chambre à coucher (lit + armoire)', quantity: 2, disassemblyRequired: true },
        { name: 'Bureau et bibliothèque', quantity: 1 },
      ],
      appliances: [
        { name: 'Réfrigérateur' },
        { name: 'Machine à laver' },
        { name: 'Climatiseur' },
      ],
      estimatedBoxes: 30,
      estimatedVolume: 25,
      fragileItems: true,
      fragileItemsDescription: 'Service en porcelaine et télévision 65"',
      preferredDate: new Date('2025-02-15'),
      flexibleDates: true,
      additionalServices: { packing: true, furnitureDisassembly: true },
      status: 'quoted',
      quotesCount: 2,
      comments: 'Accès difficile au 3ème étage sans ascenseur.',
      estimatedBudget: '400-700 DT',
    },
    {
      client: clientUser2._id,
      departureAddress: { city: 'La Marsa', governorate: 'Tunis' },
      departureHousingType: 'villa',
      departureFloor: 0,
      arrivalAddress: { city: 'Hammamet', governorate: 'Nabeul (Hammamet)' },
      arrivalHousingType: 'house',
      arrivalFloor: 0,
      furniture: [
        { name: 'Salon oriental', quantity: 1 },
        { name: 'Chambres complètes', quantity: 3, disassemblyRequired: true },
      ],
      estimatedBoxes: 50,
      estimatedVolume: 45,
      fragileItems: true,
      preferredDate: new Date('2025-03-01'),
      status: 'pending',
      quotesCount: 0,
      estimatedBudget: '800-1200 DT',
    },
    {
      client: clientUser._id,
      departureAddress: { city: 'Tunis', governorate: 'Tunis', latitude: 36.8065, longitude: 10.1815 },
      departureHousingType: 'office',
      departureFloor: 2,
      arrivalAddress: { city: 'Ariana', governorate: 'Ariana', latitude: 36.8665, longitude: 10.1956 },
      arrivalHousingType: 'office',
      arrivalFloor: 0,
      estimatedBoxes: 20,
      estimatedVolume: 15,
      status: 'booked',
      quotesCount: 3,
    },
    {
      client: clientUser2._id,
      customTitle: "Déménagement d'un appartement S+2",
      departureAddress: { street: 'Route Touristique, Kantaoui', city: 'Sousse', governorate: 'Sousse', postalCode: '4089', latitude: 35.8922, longitude: 10.5986 },
      departureHousingType: 'apartment',
      departureFloor: 2,
      departureElevator: true,
      departureSurface: 85,
      arrivalAddress: { street: 'Avenue Habib Bourguiba', city: 'Monastir', governorate: 'Monastir', postalCode: '5000', latitude: 35.7779, longitude: 10.8262 },
      arrivalHousingType: 'apartment',
      arrivalFloor: 1,
      arrivalElevator: true,
      furniture: [
        { name: 'Salon complet 5 places', quantity: 1 },
        { name: 'Chambre adulte (lit king size, commode)', quantity: 1, disassemblyRequired: true },
        { name: 'Salle à manger (table + 6 chaises)', quantity: 1 },
      ],
      estimatedBoxes: 30,
      estimatedVolume: 25,
      fragileItems: true,
      fragileItemsDescription: 'Vaisselle délicate, miroirs et grand écran',
      preferredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      flexibleDates: true,
      additionalServices: { packing: true, furnitureDisassembly: true },
      comments: 'Accès dégagé, stationnement facile en bas de l\'immeuble.',
      estimatedBudget: '450-750 DT',
      status: 'pending',
      quotesCount: 1,
    },
    {
      client: clientUser._id,
      customTitle: "Transfert Bureaux & Siège Commercial",
      departureAddress: { street: 'Rue de la Bourse, Les Berges du Lac 2', city: 'Tunis', governorate: 'Tunis', latitude: 36.8325, longitude: 10.2375 },
      departureHousingType: 'office',
      departureFloor: 3,
      departureElevator: true,
      departureSurface: 180,
      arrivalAddress: { street: 'Centre Urbain Nord', city: 'Tunis', governorate: 'Tunis', latitude: 36.8485, longitude: 10.1983 },
      arrivalHousingType: 'office',
      arrivalFloor: 2,
      arrivalElevator: true,
      estimatedBoxes: 70,
      estimatedVolume: 42,
      preferredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      additionalServices: { packing: true, furnitureDisassembly: true, furnitureAssembly: true },
      comments: '12 postes de travail, armoires métalliques et salle de réunion.',
      estimatedBudget: '1200-1800 DT',
      status: 'pending',
      quotesCount: 0,
    },
  ]);

  console.log(`  ✅ Created 3 moving requests`);

  // ─── QUOTES ──────────────────────────────────────
  console.log('\n💰 Creating quotes...');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const [quote1, quote2, quote3] = await Quote.create([
    {
      movingRequest: req1._id,
      company: company1._id,
      totalPrice: 650,
      priceDetails: { baseFee: 300, laborFee: 200, transportFee: 100, packingFee: 50 },
      depositAmount: 195,
      depositPercent: 30,
      includedServices: ['Emballage complet', 'Monte-charge', 'Démontage/Remontage', 'Assurance transport'],
      terms: 'Acompte de 30% à la réservation. Solde le jour du déménagement.',
      validityDate: futureDate,
      proposedDate: new Date('2025-02-15'),
      estimatedDuration: '4-5 heures',
      status: 'submitted',
    },
    {
      movingRequest: req1._id,
      company: company2._id,
      totalPrice: 580,
      priceDetails: { baseFee: 280, laborFee: 180, transportFee: 80, packingFee: 40 },
      depositAmount: 174,
      depositPercent: 30,
      includedServices: ['Emballage standard', 'Protection meubles'],
      terms: 'Paiement total le jour J.',
      validityDate: futureDate,
      proposedDate: new Date('2025-02-15'),
      estimatedDuration: '5-6 heures',
      status: 'submitted',
    },
    {
      movingRequest: req3._id,
      company: company1._id,
      totalPrice: 850,
      priceDetails: { baseFee: 400, laborFee: 250, transportFee: 150, packingFee: 50 },
      depositAmount: 255,
      depositPercent: 30,
      includedServices: ['Service premium', 'Monte-charge', 'Emballage luxe'],
      validityDate: futureDate,
      proposedDate: new Date('2025-01-20'),
      status: 'accepted',
    },
  ]);

  // Update request acceptedQuote
  await MovingRequest.findByIdAndUpdate(req3._id, { acceptedQuote: quote3._id });

  console.log(`  ✅ Created 3 quotes`);

  // ─── BOOKINGS ────────────────────────────────────
  console.log('\n📅 Creating bookings...');

  const booking1 = await Booking.create({
    client: clientUser._id,
    company: company1._id,
    movingRequest: req3._id,
    quote: quote3._id,
    scheduledDate: new Date('2025-01-20'),
    scheduledTime: '08:00',
    estimatedDuration: '4-5 heures',
    totalAmount: 850,
    depositAmount: 255,
    remainingAmount: 595,
    platformFee: 30.6,
    netToCompany: 224.4,
    paymentStatus: 'deposit_paid',
    bookingStatus: 'confirmed',
    serviceStatus: 'preparation',
    hasReview: false,
    trackingSteps: [
      { step: 'Acompte (30%) validé & Réservation confirmée', isDone: true, completedAt: new Date() },
      { step: 'Affectation du camion et de l\'équipe', isDone: true, completedAt: new Date() },
      { step: 'Jour J : Déménagement & transport', isDone: false },
      { step: 'Fin de prestation & Contrôle qualité', isDone: false },
    ],
  });

  console.log(`  ✅ Created 1 booking`);

  // ─── REVIEWS ─────────────────────────────────────
  console.log('\n⭐ Creating reviews...');

  await Review.create([
    {
      client: clientUser2._id,
      company: company1._id,
      booking: booking1._id, // Note: technically should be a completed booking
      rating: 5,
      punctualityRating: 5,
      careRating: 5,
      professionalismRating: 5,
      valueRating: 4,
      comment: 'Équipe très professionnelle, ponctuels et soigneux avec les meubles. Je recommande vivement Carthage Movers !',
      status: 'approved',
      isVerifiedMove: true,
    },
  ]);

  console.log(`  ✅ Created 1 review`);

  // ─── NOTIFICATIONS ───────────────────────────────
  console.log('\n🔔 Creating notifications...');

  await Notification.create([
    {
      recipient: clientUser._id,
      title: 'Nouveau devis reçu',
      message: 'Carthage Movers a soumis un devis de 650 DT pour votre déménagement Tunis → Sousse.',
      type: 'new_quote',
      isRead: false,
      relatedEntity: { entityType: 'quote', entityId: quote1._id, link: `/client/quotes/${quote1._id}` },
    },
    {
      recipient: clientUser._id,
      title: 'Réservation confirmée 🎉',
      message: 'Votre déménagement avec Carthage Movers est confirmé pour le 20 Janvier.',
      type: 'booking_confirmed',
      isRead: true,
      relatedEntity: { entityType: 'booking', entityId: booking1._id, link: `/client/bookings/${booking1._id}` },
    },
    {
      recipient: companyUser1._id,
      title: 'Nouvelle demande disponible',
      message: 'Une nouvelle demande de déménagement Tunis → Sousse est disponible.',
      type: 'new_request',
      isRead: false,
      relatedEntity: { entityType: 'request', entityId: req1._id, link: `/company/requests/${req1._id}` },
    },
  ]);

  console.log(`  ✅ Created 3 notifications`);

  // ─── TRANSACTIONS ────────────────────────────────
  console.log('\n💳 Creating transactions...');

  await Transaction.create([
    {
      booking: booking1._id,
      client: clientUser._id,
      company: company1._id,
      amount: 255,
      type: 'deposit',
      platformFee: 30.6,
      platformFeeRate: 0.12,
      netToCompany: 224.4,
      paymentMethod: 'card',
      status: 'completed',
      description: 'Acompte de confirmation (30%) - Réservation #' + booking1._id,
    },
  ]);

  console.log(`  ✅ Created 1 transaction`);

  // ─── SUMMARY ─────────────────────────────────────
  console.log('\n══════════════════════════════');
  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Admin:   admin@moveflow.tn / password123');
  console.log('  Client:  client@moveflow.tn / password123');
  console.log('  Company: company@moveflow.tn / password123');
  console.log('\n🗄️  View in MongoDB Compass:');
  console.log(`  ${process.env.MONGODB_URI}`);
  console.log('══════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

