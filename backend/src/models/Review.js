const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // One review per booking
    },
    // Ratings (1-5)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    punctualityRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    careRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalismRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Un commentaire est obligatoire'],
      minlength: [10, 'Le commentaire doit contenir au moins 10 caractères'],
      maxlength: [1000, 'Le commentaire ne doit pas dépasser 1000 caractères'],
    },
    // Moderation
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: Date,
    rejectionReason: String,
    // Company response
    companyResponse: {
      text: String,
      respondedAt: Date,
    },
    // Public visibility toggled by company for visitor interface
    isPublishedToPublic: {
      type: Boolean,
      default: false,
    },
    // Verification
    isVerifiedMove: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for frontend backward compatibility
reviewSchema.virtual('clientName').get(function () {
  if (this.client && typeof this.client === 'object') {
    return `${this.client.firstName || ''} ${this.client.lastName || ''}`.trim() || 'Client';
  }
  return 'Client';
});

reviewSchema.virtual('clientAvatar').get(function () {
  const name = this.client && typeof this.client === 'object'
    ? `${this.client.firstName || ''} ${this.client.lastName || ''}`.trim()
    : 'Client';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Client')}&background=cf0000&color=fff`;
});

reviewSchema.virtual('companyName').get(function () {
  if (this.company && typeof this.company === 'object') {
    return this.company.companyName || this.company.commercialName || this.company.legalName || 'Entreprise';
  }
  return 'Entreprise';
});

reviewSchema.virtual('bookingReference').get(function () {
  if (this.booking && typeof this.booking === 'object') {
    return this.booking.reference || (this.booking._id ? String(this.booking._id).slice(-6) : 'DEM-001');
  }
  return this.booking ? String(this.booking).slice(-6) : 'DEM-001';
});

reviewSchema.virtual('title').get(function () {
  return this.comment ? (this.comment.slice(0, 35) + (this.comment.length > 35 ? '...' : '')) : 'Prestation de déménagement';
});

reviewSchema.virtual('date').get(function () {
  return this.createdAt;
});

reviewSchema.index({ company: 1, status: 1 });
reviewSchema.index({ client: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: -1 });

// After saving a review, update company's average rating
reviewSchema.post('save', async function () {
  await updateCompanyRating(this.company);
});

reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) await updateCompanyRating(doc.company);
});

async function updateCompanyRating(companyId) {
  const Review = mongoose.model('Review');
  const Company = mongoose.model('Company');

  const stats = await Review.aggregate([
    { $match: { company: companyId, status: 'approved' } },
    {
      $group: {
        _id: '$company',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Company.findByIdAndUpdate(companyId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }
}

module.exports = mongoose.model('Review', reviewSchema);

