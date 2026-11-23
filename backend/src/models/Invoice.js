const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
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
    movingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MovingRequest',
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    companySnapshot: {
      companyName: String,
      logo: String,
      legalIdentifier: String,
      rneNumber: String,
      phone: String,
      email: String,
      address: {
        street: String,
        city: String,
        governorate: String,
        postalCode: String,
      },
    },
    clientSnapshot: {
      fullName: String,
      phone: String,
      email: String,
      departureAddress: {
        street: String,
        city: String,
        governorate: String,
        floor: Number,
        hasElevator: Boolean,
        housingType: String,
      },
      arrivalAddress: {
        street: String,
        city: String,
        governorate: String,
        floor: Number,
        hasElevator: Boolean,
        housingType: String,
      },
    },
    movingDate: Date,
    movingTime: String,
    estimatedVolume: Number,

    // Line items breakdown
    lineItems: [
      {
        description: String,
        amount: Number,
      },
    ],
    excludedServices: [String],

    // Totals
    totalTTC: {
      type: Number,
      required: true,
    },
    depositPaidTTC: {
      type: Number,
      default: 0,
    },
    remainingBalanceTTC: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: 'deposit_paid',
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },

    // Platform commission breakdown
    depositCommissionRate: {
      type: Number,
      default: 0.02,
    },
    depositCommissionAmount: {
      type: Number,
      default: 0,
    },
    depositNetToCompany: {
      type: Number,
      default: 0,
    },

    // Status of double digital signatures
    status: {
      type: String,
      enum: ['awaiting_company_signature', 'awaiting_client_signature', 'fully_signed'],
      default: 'awaiting_company_signature',
    },

    // 1. Company official authorization & signature
    isSignedByCompany: {
      type: Boolean,
      default: false,
    },
    isCustomSigned: {
      type: Boolean,
      default: false,
    },
    companySignatureImage: String,
    companySignerName: String,
    companySignedAt: Date,
    signedAt: Date,
    signatureHash: String,
    companyStampText: {
      type: String,
      default: 'Certifié Conforme - Bon pour Transport et Facturation MoversGo',
    },

    // 2. Client delivery acceptance & discharge digital signature
    isSignedByClient: {
      type: Boolean,
      default: false,
    },
    clientSignatureImage: String,
    clientSignerName: String,
    clientSignedAt: Date,
    clientDischargeText: {
      type: String,
      default: 'Bon pour décharge et réception sans réserve de la facture et des prestations de déménagement',
    },

    // Final state when both parties have signed
    isFullySigned: {
      type: Boolean,
      default: false,
    },
    fullySignedAt: Date,

    notes: String,
  },
  { timestamps: true }
);

invoiceSchema.index({ client: 1 });
invoiceSchema.index({ company: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

