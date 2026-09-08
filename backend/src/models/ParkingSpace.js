import mongoose from 'mongoose';

const PARKING_TYPES = [
  'Home Driveway',
  'Garage',
  'Apartment',
  'Society',
  'Private Plot',
  'Commercial',
];

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Hatchback', 'Sedan', 'SUV', 'EV'];

const parkingSpaceSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    parkingType: {
      type: String,
      required: [true, 'Parking type is required'],
      enum: {
        values: PARKING_TYPES,
        message: `Parking type must be one of: ${PARKING_TYPES.join(', ')}`,
      },
    },
    vehicleTypes: {
      type: [String],
      enum: {
        values: VEHICLE_TYPES,
        message: `Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`,
      },
      default: ['Hatchback', 'Sedan'],
    },
    covered: {
      type: Boolean,
      default: false,
    },
    security: {
      type: Boolean,
      default: false,
    },
    cctv: {
      type: Boolean,
      default: false,
    },
    evCharging: {
      type: Boolean,
      default: false,
    },
    gateAccess: {
      type: Boolean,
      default: false,
    },
    pricePerHour: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    pricePerDay: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    pricePerMonth: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    photos: {
      type: [String],
      default: [],
    },
    rules: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'inactive', 'rejected', 'flagged'],
        message: 'Status must be draft, active, inactive, rejected, or flagged',
      },
      default: 'draft',
    },
    adminComment: {
      type: String,
      default: '',
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    availability: {
      days: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
      startTime: {
        type: String,
        default: '08:00',
      },
      endTime: {
        type: String,
        default: '18:00',
      },
    },
    leavingHomeSchedule: [
      {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        startTime: { type: String, required: true }, // "09:00"
        endTime: { type: String, required: true }, // "18:00"
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure GeoJSON location is always in sync with latitude and longitude
parkingSpaceSchema.pre('save', function (next) {
  if (this.longitude !== undefined && this.latitude !== undefined) {
    this.location = {
      type: 'Point',
      coordinates: [Number(this.longitude), Number(this.latitude)],
    };
  }
  next();
});

// Indexes for text search, geospatial queries, and operational filtering
parkingSpaceSchema.index({ title: 'text', description: 'text', address: 'text', city: 'text' });
parkingSpaceSchema.index({ location: '2dsphere' });
parkingSpaceSchema.index({ latitude: 1, longitude: 1 });
parkingSpaceSchema.index({ host: 1, status: 1 });
parkingSpaceSchema.index({ city: 1, pricePerHour: 1 });
parkingSpaceSchema.index({ status: 1 });

const ParkingSpace = mongoose.model('ParkingSpace', parkingSpaceSchema);

export { PARKING_TYPES, VEHICLE_TYPES };
export default ParkingSpace;
