const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    movingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MovingRequest',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // Price breakdown
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    depositAmount: {
      type: Number,
      default: 0, // Acompte (% of total)
    },
    depositPercent: {
      type: Number,
      default: 30, // Default 30%
    },
    // Included services
    includedServices: [String],
    excludedServices: [String],
    // Terms and conditions
    terms: {
      type: String,
      maxlength: 2000,
    },
    // Validity
    validityDate: {
      type: Date,
      required: true,
    },
    // Proposed moving date
    proposedDate: Date,
    estimatedDuration: String, // "3-4 heures"
    // Attachments (quote document, etc.)
    attachments: [
      {
        filePath: String,
        fileName: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, maxlength: 1000 },
    // Status
    status: {
      type: String,
      enum: ['submitted', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled'],
      default: 'submitted',
    },
    viewedAt: Date,
    respondedAt: Date,
    rejectionReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Prevent duplicate active quotes from same company for same request
quoteSchema.index(
  { movingRequest: 1, company: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $nin: ['rejected', 'expired', 'cancelled'] },
    },
  }
);

quoteSchema.index({ movingRequest: 1 });
quoteSchema.index({ company: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ validityDate: 1 });

// Virtual to check if quote is expired
quoteSchema.virtual('isExpired').get(function () {
  return this.status === 'expired' || (this.validityDate && new Date(this.validityDate) < new Date());
});

// Compatibility virtuals for frontend
quoteSchema.virtual('requestId').get(function () {
  return this.movingRequest?._id ? this.movingRequest._id.toString() : (this.movingRequest ? this.movingRequest.toString() : null);
});

quoteSchema.virtual('companyId').get(function () {
  return this.company?._id ? this.company._id.toString() : (this.company ? this.company.toString() : null);
});

quoteSchema.virtual('companyName').get(function () {
  return this.company?.companyName || null;
});

quoteSchema.virtual('pricing').get(function () {
  return {
    total: this.totalPrice,
    depositRequired: this.depositAmount,
    depositPercentage: this.depositPercent,
    baseFee: this.priceDetails?.baseFee || 0,
    laborFee: this.priceDetails?.laborFee || 0,
    transportFee: this.priceDetails?.transportFee || 0,
    packingFee: this.priceDetails?.packingFee || 0,
    truckLiftFee: this.priceDetails?.truckLiftFee || 0,
    storageFee: this.priceDetails?.storageFee || 0,
    otherFees: this.priceDetails?.otherFees || 0,
  };
});

quoteSchema.virtual('validUntil').get(function () {
  return this.validityDate;
});

module.exports = mongoose.model('Quote', quoteSchema);

