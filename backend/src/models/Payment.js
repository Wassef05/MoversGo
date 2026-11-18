const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
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
    currency: {
      type: String,
      default: 'TND',
    },
    paymentType: {
      type: String,
      enum: ['deposit', 'final_payment', 'refund', 'commission'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'cash', 'konnect', 'flouci', 'other'],
      required: true,
    },
    // Payment provider reference
    provider: {
      type: String,
      enum: ['konnect', 'flouci', 'gpg', 'manual', 'test'],
      default: 'test',
    },
    transactionReference: {
      type: String,
      default: null,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false, // Don't expose in queries
    },
    // Status
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    // Platform commission
    platformFee: {
      type: Number,
      default: 0,
    },
    platformFeeRate: {
      type: Number,
      default: 0.12, // 12%
    },
    netToCompany: {
      type: Number,
      default: 0,
    },
    // Timestamps
    paidAt: Date,
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processing', 'completed'],
      default: 'none',
    },
    refundedAt: Date,
    refundAmount: { type: Number, default: 0 },
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ company: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

