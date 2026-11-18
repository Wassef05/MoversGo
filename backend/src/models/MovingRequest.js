const mongoose = require('mongoose');

const movingRequestSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customTitle: {
      type: String,
      trim: true,
    },
    // Departure info
    departureAddress: {
      street: String,
      city: { type: String, required: true },
      governorate: { type: String, required: true },
      postalCode: String,
      latitude: Number,
      longitude: Number,
    },
    departureLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
    departureHousingType: {
      type: String,
      default: 'apartment',
    },
    departureFloor: { type: Number, default: 0 },
    departureElevator: { type: Boolean, default: false },
    departureSurface: { type: Number }, // m²
    departureRooms: { type: Number },

    // Arrival info
    arrivalAddress: {
      street: String,
      city: { type: String, required: true },
      governorate: { type: String, required: true },
      postalCode: String,
      latitude: Number,
      longitude: Number,
    },
    arrivalLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
    arrivalHousingType: {
      type: String,
      default: 'apartment',
    },
    arrivalFloor: { type: Number, default: 0 },
    arrivalElevator: { type: Boolean, default: false },
    arrivalSurface: { type: Number },
    arrivalRooms: { type: Number },

    // Inventory
    furniture: [
      {
        name: String,
        quantity: { type: Number, default: 1 },
        disassemblyRequired: { type: Boolean, default: false },
        notes: String,
      },
    ],
    appliances: [
      {
        name: String,
        quantity: { type: Number, default: 1 },
        notes: String,
      },
    ],
    estimatedBoxes: { type: Number, default: 0 },
    estimatedVolume: { type: Number, default: 0 }, // m³
    fragileItems: { type: Boolean, default: false },
    fragileItemsDescription: String,
    heavyItems: { type: Boolean, default: false },

    // Photos of items/rooms
    photos: [
      {
        filePath: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Date preferences
    preferredDate: { type: Date },
    flexibleDates: { type: Boolean, default: false },
    alternativeDates: [Date],

    // Additional services
    additionalServices: {
      packing: { type: Boolean, default: false },
      unpacking: { type: Boolean, default: false },
      furnitureAssembly: { type: Boolean, default: false },
      furnitureDisassembly: { type: Boolean, default: false },
      cleaning: { type: Boolean, default: false },
      storage: { type: Boolean, default: false },
      piano: { type: Boolean, default: false },
      truckLift: { type: Boolean, default: false },
    },

    comments: { type: String, maxlength: 1000 },
    estimatedBudget: {
      type: String, // "sous 300 DT", "300-600 DT", etc.
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'quoted', 'booked', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Tracking
    quotesCount: { type: Number, default: 0 },
    acceptedQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null,
    },

    // Moderation
    isVisible: { type: Boolean, default: true }, // Admin can hide
    viewedBy: [
      {
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
        viewedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: title
movingRequestSchema.virtual('title').get(function () {
  if (this.customTitle) return this.customTitle;
  return `Déménagement ${this.departureAddress?.city || ''} → ${this.arrivalAddress?.city || ''}`;
});

// Compatibility virtuals for frontend
movingRequestSchema.virtual('clientId').get(function () {
  return this.client?._id ? this.client._id.toString() : (this.client ? this.client.toString() : null);
});

movingRequestSchema.virtual('departure').get(function () {
  return {
    street: this.departureAddress?.street,
    city: this.departureAddress?.city,
    governorate: this.departureAddress?.governorate,
    postalCode: this.departureAddress?.postalCode,
    housingType: this.departureHousingType,
    floor: this.departureFloor,
    elevator: this.departureElevator,
    surface: this.departureSurface,
    rooms: this.departureRooms,
  };
});

movingRequestSchema.virtual('arrival').get(function () {
  return {
    street: this.arrivalAddress?.street,
    city: this.arrivalAddress?.city,
    governorate: this.arrivalAddress?.governorate,
    postalCode: this.arrivalAddress?.postalCode,
    housingType: this.arrivalHousingType,
    floor: this.arrivalFloor,
    elevator: this.arrivalElevator,
    surface: this.arrivalSurface,
    rooms: this.arrivalRooms,
  };
});

movingRequestSchema.virtual('inventory').get(function () {
  return {
    furniture: this.furniture || [],
    appliances: this.appliances || [],
    estimatedBoxes: this.estimatedBoxes || 0,
    estimatedVolume: this.estimatedVolume || 0,
    fragileItems: this.fragileItems || false,
  };
});

movingRequestSchema.virtual('desiredDate').get(function () {
  return this.preferredDate;
});

// Reference dictionary for Tunisian coordinates fallback
const TUNISIAN_REGIONS_COORDS = {
  'tunis': [10.1815, 36.8065],
  'ariana': [10.1956, 36.8665],
  'ben arous': [10.2228, 36.7531],
  'manouba': [10.0982, 36.8080],
  'nabeul': [10.7376, 36.4561],
  'zaghouan': [10.1429, 36.4029],
  'bizerte': [9.8739, 37.2744],
  'beja': [9.1844, 36.7256],
  'béja': [9.1844, 36.7256],
  'jendouba': [8.7802, 36.5011],
  'le kef': [8.7049, 36.1822],
  'kef': [8.7049, 36.1822],
  'siliana': [9.3708, 36.0849],
  'sousse': [10.6369, 35.8256],
  'monastir': [10.8262, 35.7779],
  'mahdia': [11.0622, 35.5047],
  'sfax': [10.7603, 34.7406],
  'kairouan': [10.0963, 35.6781],
  'kasserine': [8.8365, 35.1676],
  'sidi bouzid': [9.4849, 35.0382],
  'gabes': [10.1017, 33.8815],
  'gabès': [10.1017, 33.8815],
  'medenine': [10.4959, 33.3549],
  'médenine': [10.4959, 33.3549],
  'tataouine': [10.4518, 32.9297],
  'gafsa': [8.7842, 34.4250],
  'tozeur': [8.1335, 33.9197],
  'kebili': [8.9715, 33.7044],
  'kébili': [8.9715, 33.7044],
  'hammamet': [10.6167, 36.4000],
  'la marsa': [10.3247, 36.8783],
  'carthage': [10.3247, 36.8528],
  'gammarth': [10.2917, 36.9194],
  'djerba': [10.8575, 33.8076],
};

function resolveCoords(city, gov, lat, lng) {
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    return [parseFloat(lng), parseFloat(lat)];
  }
  const cleanCity = (city || '').toLowerCase().trim();
  const cleanGov = (gov || '').toLowerCase().trim();
  if (TUNISIAN_REGIONS_COORDS[cleanCity]) return TUNISIAN_REGIONS_COORDS[cleanCity];
  if (TUNISIAN_REGIONS_COORDS[cleanGov]) return TUNISIAN_REGIONS_COORDS[cleanGov];
  for (const [key, coords] of Object.entries(TUNISIAN_REGIONS_COORDS)) {
    if (cleanCity.includes(key) || cleanGov.includes(key)) {
      return coords;
    }
  }
  return undefined;
}

// Pre-save hook: automatically sync GeoJSON Point locations from addresses
movingRequestSchema.pre('save', function (next) {
  // Sync departure location
  const depCoords = resolveCoords(
    this.departureAddress?.city,
    this.departureAddress?.governorate,
    this.departureAddress?.latitude,
    this.departureAddress?.longitude
  );
  if (depCoords) {
    this.departureLocation = {
      type: 'Point',
      coordinates: depCoords,
    };
    if (this.departureAddress) {
      if (this.departureAddress.longitude === undefined || isNaN(this.departureAddress.longitude)) {
        this.departureAddress.longitude = depCoords[0];
      }
      if (this.departureAddress.latitude === undefined || isNaN(this.departureAddress.latitude)) {
        this.departureAddress.latitude = depCoords[1];
      }
    }
  }

  // Sync arrival location
  const arrCoords = resolveCoords(
    this.arrivalAddress?.city,
    this.arrivalAddress?.governorate,
    this.arrivalAddress?.latitude,
    this.arrivalAddress?.longitude
  );
  if (arrCoords) {
    this.arrivalLocation = {
      type: 'Point',
      coordinates: arrCoords,
    };
    if (this.arrivalAddress) {
      if (this.arrivalAddress.longitude === undefined || isNaN(this.arrivalAddress.longitude)) {
        this.arrivalAddress.longitude = arrCoords[0];
      }
      if (this.arrivalAddress.latitude === undefined || isNaN(this.arrivalAddress.latitude)) {
        this.arrivalAddress.latitude = arrCoords[1];
      }
    }
  }

  if (typeof next === 'function') next();
});

// Indexes
movingRequestSchema.index({ client: 1 });
movingRequestSchema.index({ status: 1 });
movingRequestSchema.index({ 'departureAddress.governorate': 1 });
movingRequestSchema.index({ 'arrivalAddress.governorate': 1 });
movingRequestSchema.index({ departureLocation: '2dsphere' });
movingRequestSchema.index({ preferredDate: 1 });
movingRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MovingRequest', movingRequestSchema);

