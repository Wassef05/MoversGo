const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Le nom de la société est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne doit pas dépasser 100 caractères'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne doit pas dépasser 1000 caractères'],
    },
    // Legal identification (Matricule fiscal tunisien)
    legalIdentifier: {
      type: String,
      trim: true,
    },
    legalStatus: {
      type: String,
      trim: true, // SARL, SUARL, etc.
    },
    licenseNumber: {
      type: String,
      trim: true, // Agrément Ministère du Transport
    },
    rneNumber: {
      type: String,
      trim: true, // Registre National des Entreprises
    },
    // Insurance
    insuranceInformation: {
      provider: String,
      coverageAmount: Number,
      policyNumber: String,
      expiryDate: Date,
    },
    // Uploaded documents (file paths)
    rneDocument: {
      filePath: String,
      originalName: String,
      uploadedAt: { type: Date, default: Date.now },
    },
    documents: [
      {
        name: { type: String, required: true },
        filePath: { type: String, required: true },
        fileType: String,
        status: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending',
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Certifications
    certifications: [
      {
        name: String,
        issuedBy: String,
        issuedAt: Date,
        expiryDate: Date,
        filePath: String,
      },
    ],
    // Service areas (governorates)
    serviceAreas: [
      {
        type: String,
      },
    ],
    // Services offered
    services: [String],
    // Fleet
    fleetSize: {
      type: Number,
      default: 0,
    },
    employeesCount: {
      type: Number,
      default: 0,
    },
    // Contact
    phone: String,
    email: String,
    website: String,
    address: {
      street: String,
      city: String,
      governorate: String,
      postalCode: String,
      latitude: Number,
      longitude: Number,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
      latitude: Number,
      longitude: Number,
      formattedAddress: String,
    },
    // Media
    logo: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    // Rating (computed from reviews)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completedMoves: {
      type: Number,
      default: 0,
    },
    // Verification
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'needs_rectification'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    rectificationNotes: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Intelligent Recommendation Settings
    recommendationSettings: {
      maxDistanceKm: {
        type: Number,
        default: 50,
      },
      preferredHousingTypes: [
        {
          type: String,
        },
      ],
      minScore: {
        type: Number,
        default: 40,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compatibility virtuals for frontend
companySchema.virtual('rating').get(function () {
  return this.averageRating;
});

companySchema.virtual('reviewsCount').get(function () {
  return this.totalReviews;
});

// Indexes
companySchema.index({ verificationStatus: 1 });
companySchema.index({ 'address.governorate': 1 });
companySchema.index({ averageRating: -1 });
companySchema.index({ featured: -1, averageRating: -1 });
companySchema.index({ location: '2dsphere' });
companySchema.index({ companyName: 'text', description: 'text' });

module.exports = mongoose.model('Company', companySchema);

