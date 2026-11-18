const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: [
        'new_request',
        'new_quote',
        'quote_accepted',
        'quote_rejected',
        'booking_confirmed',
        'booking_cancelled',
        'payment_received',
        'payment_completed',
        'payment_failed',
        'new_message',
        'review_submitted',
        'review_approved',
        'company_registration',
        'company_approved',
        'company_rejected',
        'company_rectification',
        'moving_reminder',
        'system',
      ],
      required: true,
    },
    // Related entity for navigation
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['request', 'quote', 'booking', 'payment', 'review', 'message', 'company', 'user'],
      },
      entityId: mongoose.Schema.Types.ObjectId,
      link: String, // Frontend route
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.virtual('link').get(function () {
  return this.relatedEntity?.link;
});

notificationSchema.virtual('entityId').get(function () {
  return this.relatedEntity?.entityId;
});

notificationSchema.virtual('entityType').get(function () {
  return this.relatedEntity?.entityType;
});

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', notificationSchema);

