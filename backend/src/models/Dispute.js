import mongoose from 'mongoose';

const DISPUTE_REASONS = [
  'Parking occupied',
  'Wrong location',
  'Parking inaccessible',
  'Host issue',
  'Vehicle damage',
  'Payment issue',
  'Other',
];

const DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

const disputeSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host is required'],
      index: true,
    },
    parkingSpace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpace',
      required: [true, 'Parking space is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: {
        values: DISPUTE_REASONS,
        message: `Reason must be one of: ${DISPUTE_REASONS.join(', ')}`,
      },
      required: [true, 'Dispute reason is required'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    photos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: DISPUTE_STATUSES,
        message: `Status must be one of: ${DISPUTE_STATUSES.join(', ')}`,
      },
      default: 'OPEN',
      index: true,
    },
    resolution: {
      type: String,
      default: '',
      trim: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

disputeSchema.index({ status: 1, createdAt: -1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

export { DISPUTE_REASONS, DISPUTE_STATUSES };
export default Dispute;
