const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ['payment', 'booking', 'company', 'technical', 'account', 'dispute', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'],
      default: 'open',
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Related booking/request for context
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    // Message thread
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 2000,
        },
        attachments: [String],
        sentAt: {
          type: Date,
          default: Date.now,
        },
        isAdminMessage: {
          type: Boolean,
          default: false,
        },
      },
    ],
    resolvedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

supportTicketSchema.index({ user: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: -1 });
supportTicketSchema.index({ assignedAdmin: 1 });
supportTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

