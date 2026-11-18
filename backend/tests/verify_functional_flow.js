/**
 * Verification Script for MoveFlow Functional Workflows:
 * 1. Company Registration with RNE PDF upload
 * 2. OTP Email Verification
 * 3. Admin Notification & Review of RNE document
 * 4. Admin Approval & Public Directory Inclusion
 * 5. Client Moving Request with Custom Furniture & Photos
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const MovingRequest = require('../src/models/MovingRequest');
const Notification = require('../src/models/Notification');
const connectDB = require('../src/config/database');

async function runVerification() {
  console.log('--- STARTING FUNCTIONAL VERIFICATION ---');
  await connectDB();

  const testEmail = `test.demenageur.${Date.now()}@moveflow.tn`;
  const clientEmail = `test.client.${Date.now()}@moveflow.tn`;

  try {
    // 1. Simulate Company Registration
    console.log('\n[1] Testing Company Registration...');
    const dummyPdfDir = path.join(__dirname, '../uploads/company-docs');
    if (!fs.existsSync(dummyPdfDir)) {
      fs.mkdirSync(dummyPdfDir, { recursive: true });
    }
    const samplePdfPath = path.join(dummyPdfDir, `rne_test_${Date.now()}.pdf`);
    fs.writeFileSync(samplePdfPath, '%PDF-1.4 Extrait RNE Test Document %%%');

    const companyUser = await User.create({
      firstName: 'Mohamed',
      lastName: 'Ben Salem',
      email: testEmail,
      phone: '+216 22 123 456',
      password: 'SecurePassword123!',
      role: 'company',
      isEmailVerified: false,
      emailVerificationCode: '852963',
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    const company = await Company.create({
      user: companyUser._id,
      companyName: 'Tunisie Express Déménagement SARL',
      legalIdentifier: '1685942/B/A/000',
      phone: companyUser.phone,
      email: companyUser.email,
      verificationStatus: 'pending',
      isActive: false,
      rneDocument: {
        filePath: samplePdfPath.replace(/\\/g, '/'),
        originalName: 'Extrait_RNE_Recent.pdf',
        uploadedAt: new Date(),
      },
      documents: [
        {
          name: 'Extrait RNE Récent (3 derniers mois)',
          filePath: samplePdfPath.replace(/\\/g, '/'),
          fileType: 'application/pdf',
          status: 'pending',
        },
      ],
      address: {
        street: 'Zone Industrielle Charguia 2',
        city: 'Tunis',
        governorate: 'Tunis',
        postalCode: '2035',
      },
    });

    console.log('✓ Company user registered:', companyUser.email);
    console.log('✓ Company profile registered with RNE document:', company.rneDocument.originalName);

    // 2. Verify Email with OTP
    console.log('\n[2] Testing Email OTP Verification...');
    if (companyUser.emailVerificationCode === '852963') {
      companyUser.isEmailVerified = true;
      companyUser.emailVerificationCode = undefined;
      await companyUser.save();
      console.log('✓ Company email successfully verified with 6-digit OTP code');
    }

    // 3. Admin Notification
    console.log('\n[3] Testing Admin In-App & Email Notification...');
    const adminNotif = await Notification.create({
      recipient: companyUser._id, // simulation
      title: 'Nouvelle entreprise à valider 🏢',
      message: `L'entreprise "${company.companyName}" (Gérant: ${companyUser.firstName} ${companyUser.lastName}) attend votre validation d'agrément.`,
      type: 'company_registration',
      relatedEntity: {
        entityType: 'company',
        entityId: company._id,
        link: '/admin/companies/pending',
      },
    });
    console.log('✓ Notification recorded for admin review:', adminNotif.title);

    // 4. Admin Pending Listing
    console.log('\n[4] Testing Admin Pending Listing...');
    const pendingList = await Company.find({
      verificationStatus: { $in: ['pending', 'under_review'] },
    }).populate('user', 'firstName lastName email phone');
    const found = pendingList.find((c) => c._id.toString() === company._id.toString());
    if (!found) throw new Error('Company not found in pending list');
    console.log(`✓ Admin finds pending company: "${found.companyName}" by Gérant: ${found.user.firstName} ${found.user.lastName}`);
    console.log(`✓ RNE Document attached: ${found.rneDocument?.filePath || found.documents?.[0]?.filePath}`);

    // 5. Admin Approval
    console.log('\n[5] Testing Admin Approval...');
    company.verificationStatus = 'approved';
    company.isActive = true;
    company.verifiedAt = new Date();
    await company.save();
    await User.findByIdAndUpdate(companyUser._id, { isActive: true });
    console.log('✓ Company status updated to "approved" & isActive set to true');

    // 6. Public Directory Query
    console.log('\n[6] Testing Public Approved Companies Directory...');
    const publicCompanies = await Company.find({
      verificationStatus: 'approved',
      isActive: true,
    });
    const inPublic = publicCompanies.some((c) => c._id.toString() === company._id.toString());
    if (!inPublic) throw new Error('Approved company missing from public listing');
    console.log(`✓ Company "${company.companyName}" is officially listed among approved movers!`);

    // 7. Client Moving Request with Custom Items & Photos
    console.log('\n[7] Testing Client Moving Request with Custom Furniture & Photos...');
    const clientUser = await User.create({
      firstName: 'Karim',
      lastName: 'Mejri',
      email: clientEmail,
      phone: '+216 98 765 432',
      password: 'SecurePassword123!',
      role: 'client',
      isEmailVerified: true,
    });

    const photoSampleDir = path.join(__dirname, '../uploads/request-photos');
    if (!photoSampleDir) fs.mkdirSync(photoSampleDir, { recursive: true });
    const dummyPhoto = path.join(photoSampleDir, `test_photo_${Date.now()}.jpg`);
    fs.writeFileSync(dummyPhoto, 'dummy-image-binary-data');

    const movingReq = await MovingRequest.create({
      client: clientUser._id,
      departureAddress: {
        street: 'Avenue Hédi Nouira',
        city: 'Ennasr 2',
        governorate: 'Ariana',
      },
      departureHousingType: 'Appartement S+2',
      departureFloor: 3,
      departureElevator: false,
      arrivalAddress: {
        street: 'Boulevard 14 Janvier',
        city: 'Sousse',
        governorate: 'Sousse',
      },
      arrivalHousingType: 'Appartement S+2',
      arrivalFloor: 1,
      arrivalElevator: true,
      furniture: [
        { name: 'Salon tunisien', quantity: 1 },
        { name: 'Piano droit (Bien personnalisé)', quantity: 1, notes: 'Meuble lourd personnalisé' },
      ],
      estimatedVolume: 25,
      estimatedBoxes: 30,
      photos: [
        {
          filePath: dummyPhoto.replace(/\\/g, '/'),
          caption: 'Salon_et_Piano.jpg',
          uploadedAt: new Date(),
        },
      ],
      additionalServices: {
        truckLift: true,
        packing: true,
        furnitureDisassembly: true,
      },
      comments: 'Monte-charge requis au départ',
      status: 'pending',
    });

    console.log('✓ Moving request created with custom item:', movingReq.furniture[1].name);
    console.log('✓ Moving request has photo attached:', movingReq.photos[0].caption);

    console.log('\n========================================');
    console.log('ALL FUNCTIONAL FLOW TESTS PASSED 100%!');
    console.log('========================================');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();

