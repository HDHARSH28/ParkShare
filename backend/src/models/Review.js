import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true, // Strictly prevents multiple reviews for the same booking
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    safetyRating: {
      type: Number,
      min: [1, 'Safety rating must be at least 1'],
      max: [5, 'Safety rating cannot exceed 5'],
      default: 5,
    },
    cleanlinessRating: {
      type: Number,
      min: [1, 'Cleanliness rating must be at least 1'],
      max: [5, 'Cleanliness rating cannot exceed 5'],
      default: 5,
    },
    locationRating: {
      type: Number,
      min: [1, 'Location rating must be at least 1'],
      max: [5, 'Location rating cannot exceed 5'],
      default: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by parkingSpace or host
reviewSchema.index({ parkingSpace: 1, createdAt: -1 });
reviewSchema.index({ host: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
