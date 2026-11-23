const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
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
    movingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MovingRequest',
      required: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: true,
    },
    // Scheduled date/time
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String, // "08:00"
      default: '08:00',
    },
    estimatedDuration: String,

    // Financial
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositPercent: {
      type: Number,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    netToCompany: {
      type: Number,
      default: 0,
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ['deposit_pending', 'deposit_paid', 'fully_paid', 'refunded', 'partially_refunded'],
      default: 'deposit_pending',
    },

    // Booking status
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'disputed'],
      default: 'confirmed',
    },

    // Service progress
    serviceStatus: {
      type: String,
      enum: ['preparation', 'in_progress', 'completed', 'cancelled'],
      default: 'preparation',
    },

    // Tracking steps
    trackingSteps: [
      {
        step: String,
        completedAt: Date,
        note: String,
        isDone: { type: Boolean, default: false },
      },
    ],

    // Cancellation
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: Date,

    // Review
    hasReview: { type: Boolean, default: false },

    // Notes
    clientNotes: String,
    companyNotes: String,

    // Payment request signal from company to client
    paymentRequested: { type: Boolean, default: false },
    paymentRequestedAt: Date,
    requestedPaymentMode: {
      type: String,
      enum: ['virement', 'espece'],
      default: 'virement',
    },
    depositPaidAt: Date,

    // Reminders
    lastReminderSentAt: Date,
    remindersCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compatibility virtuals for frontend
bookingSchema.virtual('clientId').get(function () {
  return this.client?._id ? this.client._id.toString() : (this.client ? this.client.toString() : null);
});

bookingSchema.virtual('companyId').get(function () {
  return this.company?._id ? this.company._id.toString() : (this.company ? this.company.toString() : null);
});

bookingSchema.virtual('companyName').get(function () {
  return this.company?.companyName || null;
});

bookingSchema.virtual('clientName').get(function () {
  if (!this.client) return null;
  return `${this.client.firstName || ''} ${this.client.lastName || ''}`.trim();
});

bookingSchema.virtual('requestId').get(function () {
  return this.movingRequest?._id ? this.movingRequest._id.toString() : (this.movingRequest ? this.movingRequest.toString() : null);
});

bookingSchema.virtual('quoteId').get(function () {
  return this.quote?._id ? this.quote._id.toString() : (this.quote ? this.quote.toString() : null);
});

bookingSchema.virtual('status').get(function () {
  return this.bookingStatus;
});

bookingSchema.virtual('depositPaid').get(function () {
  return this.depositAmount;
});

bookingSchema.virtual('remainingBalance').get(function () {
  return this.remainingAmount;
});

bookingSchema.virtual('movingDate').get(function () {
  return this.scheduledDate;
});

bookingSchema.virtual('movingTime').get(function () {
  return this.scheduledTime;
});

bookingSchema.virtual('paidAt').get(function () {
  return this.createdAt;
});

// Virtual depositPercentage
bookingSchema.virtual('depositPercentage').get(function () {
  if (this.depositPercent && Number(this.depositPercent) > 0) return Number(this.depositPercent);
  if (this.totalAmount > 0 && this.depositAmount > 0) {
    return Math.round((this.depositAmount / this.totalAmount) * 100);
  }
  return 30;
});

bookingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    if ((ret.depositPercent == null || ret.depositPercent <= 0) && ret.totalAmount > 0 && ret.depositAmount > 0) {
      ret.depositPercent = Math.round((ret.depositAmount / ret.totalAmount) * 100);
    }
    return ret;
  },
});

bookingSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    if ((ret.depositPercent == null || ret.depositPercent <= 0) && ret.totalAmount > 0 && ret.depositAmount > 0) {
      ret.depositPercent = Math.round((ret.depositAmount / ret.totalAmount) * 100);
    }
    return ret;
  },
});

bookingSchema.index({ client: 1 });
bookingSchema.index({ company: 1 });
bookingSchema.index({ movingRequest: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ serviceStatus: 1 });
bookingSchema.index({ scheduledDate: 1 });

// Auto-compute depositPercent from depositAmount and totalAmount if missing
bookingSchema.pre('save', function (next) {
  if (this.totalAmount > 0 && this.depositAmount > 0 && (!this.depositPercent || this.depositPercent <= 0)) {
    this.depositPercent = Math.round((this.depositAmount / this.totalAmount) * 100);
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);

