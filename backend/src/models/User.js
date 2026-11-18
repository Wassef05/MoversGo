const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le prénom ne doit pas dépasser 50 caractères'],
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le nom ne doit pas dépasser 50 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false, // Never return password in queries by default
    },
    phone: {
      type: String,
      trim: true,
      set: (v) => (v ? v.replace(/[\s.-]/g, '') : undefined),
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(\+?\d{1,4})?[1-9]\d{6,14}$/.test(v);
        },
        message: 'Numéro de téléphone invalide',
      },
    },
    role: {
      type: String,
      enum: ['client', 'company', 'admin'],
      default: 'client',
    },
    profileImage: {
      type: String,
      default: null,
    },
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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // For company users, reference to their company profile
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    // Blocked users list
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  }
);

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);

