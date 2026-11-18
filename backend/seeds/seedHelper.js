/**
 * Reusable seed function
 */
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const MovingRequest = require('../src/models/MovingRequest');
const Quote = require('../src/models/Quote');
const Booking = require('../src/models/Booking');
const Review = require('../src/models/Review');
const Notification = require('../src/models/Notification');
const Transaction = require('../src/models/Transaction');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const Payment = require('../src/models/Payment');

async function runSeed() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log(`ℹ️ Database already has ${count} users. Skipping seed.`);
    return;
  }

  console.log('🌱 Seeding initial demo data...');
  const defaultPassword = 'password123';

  const [adminUser, clientUser, clientUser2, companyUser1, companyUser2, companyUser3] = await User.create([
    {
      firstName: 'Rihem',
      lastName: 'Lazaar',
      email: 'rihemlazaar5@gmail.com',
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
      address: { street: 'Avenue Hédi Nouira, Ennasr 2', city: 'Tunis', governorate: 'Ariana', postalCode: '2037', latitude: 36.8588, longitude: 10.1585 },
      location: { type: 'Point', coordinates: [10.1585, 36.8588], latitude: 36.8588, longitude: 10.1585, formattedAddress: 'Avenue Hédi Nouira, Ennasr 2, Ariana, Tunis' },
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
      address: { street: 'Rue Habib Thameur', city: 'La Marsa', governorate: 'Tunis', postalCode: '2078', latitude: 36.8782, longitude: 10.3247 },
      location: { type: 'Point', coordinates: [10.3247, 36.8782], latitude: 36.8782, longitude: 10.3247, formattedAddress: 'Rue Habib Thameur, La Marsa, Tunis' },
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
      address: { street: 'Boulevard 14 Janvier, Sahloul', city: 'Sousse', governorate: 'Sousse', postalCode: '4054', latitude: 35.8256, longitude: 10.6369 },
      location: { type: 'Point', coordinates: [10.6369, 35.8256], latitude: 35.8256, longitude: 10.6369, formattedAddress: 'Boulevard 14 Janvier, Sahloul, Sousse' },
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
      ],
      fleetSize: 9,
      employeesCount: 24,
      phone: '+21671889220',
      email: 'contact@carthagemovers.tn',
      address: { street: 'Rue du Lac Malaren, Les Berges du Lac 2', city: 'Tunis', governorate: 'Tunis', postalCode: '1053', latitude: 36.8327, longitude: 10.2341 },
      location: { type: 'Point', coordinates: [10.2341, 36.8327], latitude: 36.8327, longitude: 10.2341, formattedAddress: 'Rue du Lac Malaren, Les Berges du Lac 2, Tunis' },
      logo: 'uploads/company-docs/1794153922658-667b525452d44ab19db53cd129400c74.jfif',
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
      description: 'Référence du déménagement dans le Sahel. Camions capitonnés récents.',
      legalIdentifier: '1692041/B/N/000',
      legalStatus: 'SUARL au capital de 40 000 DT',
      serviceAreas: ['Sousse', 'Monastir', 'Mahdia', 'Tunis'],
      services: ['Déménagement résidentiel', 'Échelle monte-meubles', 'Emballage soigné'],
      fleetSize: 6,
      employeesCount: 16,
      phone: '+21673380150',
      email: 'contact@sahelexpress.tn',
      address: { street: 'Boulevard 14 Janvier, Sahloul', city: 'Sousse', governorate: 'Sousse', postalCode: '4054', latitude: 35.8256, longitude: 10.6369 },
      location: { type: 'Point', coordinates: [10.6369, 35.8256], latitude: 35.8256, longitude: 10.6369, formattedAddress: 'Boulevard 14 Janvier, Sahloul, Sousse' },
      logo: 'uploads/company-docs/1794153922658-667b525452d44ab19db53cd129400c74.jfif',
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
      companyName: 'Ste WB Transport Express',
      description: 'Déménagements express pour particuliers et professionnels en Tunisie. Flotte moderne de camions capitonnés.',
      legalIdentifier: '1839201/C/P/000',
      legalStatus: 'SARL au capital de 50 000 DT',
      licenseNumber: 'AUT-MIN-TRANSP-2023-1102',
      serviceAreas: ['Sfax', 'Tunis', 'Sousse', 'Gabès'],
      services: ['Déménagement national', 'Monte-meuble extérieur', 'Emballage premium', 'Garde-meubles'],
      fleetSize: 5,
      employeesCount: 14,
      phone: '+21674290400',
      email: 'wb.transpot@moveflow.tn',
      address: { street: 'Route de Téniour Km 2.5', city: 'Sfax', governorate: 'Sfax', postalCode: '3002', latitude: 34.7406, longitude: 10.7603 },
      location: { type: 'Point', coordinates: [10.7603, 34.7406], latitude: 34.7406, longitude: 10.7603, formattedAddress: 'Route de Téniour Km 2.5, Sfax' },
      logo: 'uploads/company-docs/1794153922658-667b525452d44ab19db53cd129400c74.jfif',
      rneDocument: {
        filePath: 'uploads/company-docs/1794153922638-0f5f847f695d5023f0fbecf49a963440.pdf',
        originalName: 'Extrait_RNE_WB_Transport.pdf',
        uploadedAt: new Date(),
      },
      verificationStatus: 'pending',
      featured: false,
    },
  ]);

  await User.findByIdAndUpdate(companyUser1._id, {
    company: company1._id,
    profileImage: 'uploads/company-docs/1794153922658-667b525452d44ab19db53cd129400c74.jfif',
  });
  await User.findByIdAndUpdate(companyUser2._id, {
    company: company2._id,
    profileImage: 'uploads/company-docs/1794153922658-667b525452d44ab19db53cd129400c74.jfif',
  });
  await User.findByIdAndUpdate(companyUser3._id, {
    company: company3._id,
    profileImage: 'uploads/company-docs/1794153922658-667b525452d44ab19db53cd129400c74.jfif',
  });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  // Request 1: Quoted request ready for acceptance testing
  const [req1, req2] = await MovingRequest.create([
    {
      client: clientUser._id,
      departureAddress: { street: 'Avenue Hédi Nouira, Ennasr 2', city: 'Tunis', governorate: 'Ariana', postalCode: '2037' },
      departureHousingType: 'apartment',
      departureFloor: 3,
      departureElevator: false,
      arrivalAddress: { city: 'Sousse', governorate: 'Sousse', postalCode: '4000' },
      arrivalHousingType: 'apartment',
      arrivalFloor: 1,
      arrivalElevator: true,
      estimatedBoxes: 30,
      estimatedVolume: 25,
      fragileItems: true,
      preferredDate: new Date('2025-02-15'),
      flexibleDates: true,
      additionalServices: { packing: true, furnitureDisassembly: true },
      status: 'quoted',
      quotesCount: 1,
      estimatedBudget: '400-700 DT',
    },
    {
      client: clientUser2._id,
      departureAddress: { city: 'La Marsa', governorate: 'Tunis' },
      departureHousingType: 'villa',
      arrivalAddress: { city: 'Hammamet', governorate: 'Nabeul (Hammamet)' },
      arrivalHousingType: 'house',
      estimatedBoxes: 50,
      estimatedVolume: 45,
      preferredDate: new Date('2025-03-01'),
      status: 'pending',
      quotesCount: 0,
      estimatedBudget: '800-1200 DT',
    },
  ]);

  // Quote 1: Submitted quote on req1 (can be accepted by client in UI)
  const [quote1] = await Quote.create([
    {
      movingRequest: req1._id,
      company: company1._id,
      totalPrice: 650,
      priceDetails: { baseFee: 300, laborFee: 200, transportFee: 100, packingFee: 50 },
      depositAmount: 195,
      depositPercent: 30,
      includedServices: ['Emballage complet', 'Monte-charge', 'Démontage/Remontage'],
      terms: 'Acompte de 30% à la réservation.',
      validityDate: futureDate,
      proposedDate: new Date('2025-02-15'),
      estimatedDuration: '4-5 heures',
      status: 'submitted',
    },
  ]);

  // Request 3: ALREADY BOOKED déménagement between clientUser & company1
  // This provides immediate testable booking and messaging!
  const bookedReq = await MovingRequest.create({
    client: clientUser._id,
    departureAddress: { street: 'Rue du Lac, Les Berges du Lac', city: 'Tunis', governorate: 'Tunis', postalCode: '1053' },
    departureHousingType: 'apartment',
    departureFloor: 2,
    departureElevator: true,
    arrivalAddress: { street: 'Avenue Habib Bourguiba', city: 'Sfax', governorate: 'Sfax', postalCode: '3000' },
    arrivalHousingType: 'villa',
    arrivalFloor: 0,
    arrivalElevator: false,
    estimatedBoxes: 40,
    estimatedVolume: 35,
    fragileItems: true,
    preferredDate: new Date('2025-02-20'),
    flexibleDates: false,
    additionalServices: { packing: true, furnitureDisassembly: true },
    status: 'booked',
    quotesCount: 1,
    estimatedBudget: '700-1000 DT',
  });

  const bookedQuote = await Quote.create({
    movingRequest: bookedReq._id,
    company: company1._id,
    totalPrice: 850,
    priceDetails: { baseFee: 450, laborFee: 250, transportFee: 100, packingFee: 50 },
    depositAmount: 255,
    depositPercent: 30,
    includedServices: ['Transport capitonné', 'Protection mobilier', 'Montage'],
    terms: 'Acompte versé à la commande.',
    validityDate: futureDate,
    proposedDate: new Date('2025-02-20'),
    estimatedDuration: 'Journée complète',
    status: 'accepted',
    respondedAt: new Date(),
  });

  bookedReq.acceptedQuote = bookedQuote._id;
  await bookedReq.save();

  const bookedBooking = await Booking.create({
    client: clientUser._id,
    company: company1._id,
    movingRequest: bookedReq._id,
    quote: bookedQuote._id,
    scheduledDate: new Date('2025-02-20'),
    scheduledTime: '08:00',
    estimatedDuration: 'Journée complète',
    totalAmount: 850,
    depositAmount: 255,
    remainingAmount: 595,
    platformFee: 102,
    netToCompany: 748,
    paymentStatus: 'deposit_paid',
    bookingStatus: 'confirmed',
    serviceStatus: 'preparation',
    trackingSteps: [
      { step: 'Réservation confirmée', completedAt: new Date(), isDone: true },
      { step: 'Préparation du camion & équipe', isDone: false },
      { step: 'Déménagement en cours', isDone: false },
      { step: 'Déménagement terminé', isDone: false },
    ],
  });

  // Conversation between clientUser and companyUser1
  const conversation = await Conversation.create({
    participants: [clientUser._id, companyUser1._id],
    booking: bookedBooking._id,
    lastMessageAt: new Date(),
    unreadCount: new Map([[clientUser._id.toString(), 0], [companyUser1._id.toString(), 0]]),
  });

  // Initial welcome message in the conversation
  const message1 = await Message.create({
    conversation: conversation._id,
    sender: companyUser1._id,
    receiver: clientUser._id,
    content: 'Bonjour M. Ben Salem ! Nous confirmons la préparation de votre déménagement pour le 20 février. N\'hésitez pas si vous avez des questions !',
    isRead: true,
    readAt: new Date(),
  });

  const message2 = await Message.create({
    conversation: conversation._id,
    sender: clientUser._id,
    receiver: companyUser1._id,
    content: 'Bonjour ! Merci beaucoup, les cartons sont en cours de préparation.',
    isRead: true,
    readAt: new Date(),
  });

  conversation.lastMessage = message2._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await Notification.create([
    {
      recipient: clientUser._id,
      title: 'Nouveau devis reçu',
      message: 'Carthage Movers a soumis un devis de 650 DT pour votre déménagement.',
      type: 'new_quote',
      isRead: false,
      relatedEntity: { entityType: 'quote', entityId: quote1._id, link: `/client/quotes/${quote1._id}` },
    },
    {
      recipient: clientUser._id,
      title: 'Réservation confirmée 🎉',
      message: 'Votre réservation avec Carthage Movers est confirmée.',
      type: 'booking_confirmed',
      isRead: true,
      relatedEntity: { entityType: 'booking', entityId: bookedBooking._id, link: `/client/bookings/${bookedBooking._id}` },
    },
  ]);

  console.log('✅ Seed completed successfully with demo user, bookings and active conversation!');
}

module.exports = { runSeed };
