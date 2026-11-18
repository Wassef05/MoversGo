const mongoose = require('mongoose');

/**
 * Transaction - Platform commission tracking
 */
const transactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['deposit', 'final_payment', 'refund', 'commission_payout'],
      required: true,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    platformFeeRate: {
      type: Number,
      default: 0.12,
    },
    netToCompany: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    description: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

transactionSchema.index({ booking: 1 });
transactionSchema.index({ client: 1 });
transactionSchema.index({ company: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtuals for frontend backward compatibility
transactionSchema.virtual('clientName').get(function () {
  if (this.client && typeof this.client === 'object') {
    return `${this.client.firstName || ''} ${this.client.lastName || ''}`.trim() || 'Client';
  }
  return 'Client';
});

transactionSchema.virtual('companyName').get(function () {
  if (this.company && typeof this.company === 'object') {
    return this.company.companyName || this.company.commercialName || this.company.legalName || 'Entreprise';
  }
  return 'Entreprise';
});

transactionSchema.virtual('date').get(function () {
  return this.createdAt;
});

// Generate reference before saving
transactionSchema.pre('save', function () {
  if (!this.reference) {
    this.reference = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);

