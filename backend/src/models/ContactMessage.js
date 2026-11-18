const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire.'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire."],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir une adresse email valide.'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    governorate: {
      type: String,
      trim: true,
      default: 'Tunis',
    },
    subject: {
      type: String,
      required: [true, 'Le sujet est obligatoire.'],
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: [true, 'Le message est obligatoire.'],
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'replied', 'archived'],
      default: 'new',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ governorate: 1 });
contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
