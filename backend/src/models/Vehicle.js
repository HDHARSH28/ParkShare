import mongoose from 'mongoose';

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Hatchback', 'Sedan', 'SUV', 'EV'];

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: VEHICLE_TYPES,
        message: `Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}`,
      },
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate vehicle registration for the same owner
vehicleSchema.index({ owner: 1, vehicleNumber: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export { VEHICLE_TYPES };
export default Vehicle;
