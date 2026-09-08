import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';
import { createNotification } from './notificationService.js';

/**
 * Submit a review for a completed booking
 */
export const createReview = async (userId, data) => {
  const {
    bookingId,
    rating,
    safetyRating = 5,
    cleanlinessRating = 5,
    locationRating = 5,
    comment = '',
  } = data;

  if (!bookingId || !rating) {
    const error = new Error('bookingId and rating are required');
    error.statusCode = 400;
    throw error;
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    const error = new Error('Rating must be a number between 1 and 5');
    error.statusCode = 400;
    throw error;
  }

  // Find booking
  const booking = await Booking.findById(bookingId).populate('parkingSpace', 'title host');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate ownership
  if (booking.user.toString() !== userId.toString()) {
    const error = new Error('You can only review your own bookings');
    error.statusCode = 403;
    throw error;
  }

  // Validate completion
  if (booking.status !== 'COMPLETED') {
    const error = new Error(
      `Only completed bookings can be reviewed. Current status is ${booking.status}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate review
  const existingReview = await Review.findOne({ booking: booking._id });
  if (existingReview) {
    const error = new Error('You have already submitted a review for this booking');
    error.statusCode = 400;
    throw error;
  }

  // Create review
  const review = await Review.create({
    user: userId,
    host: booking.host,
    parkingSpace: booking.parkingSpace._id,
    booking: booking._id,
    rating: numRating,
    safetyRating: Number(safetyRating) || 5,
    cleanlinessRating: Number(cleanlinessRating) || 5,
    locationRating: Number(locationRating) || 5,
    comment,
  });

  // Recalculate average rating & total reviews for parking space
  const allReviews = await Review.find({ parkingSpace: booking.parkingSpace._id });
  const totalReviews = allReviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  await ParkingSpace.findByIdAndUpdate(booking.parkingSpace._id, {
    rating: avgRating,
    totalReviews,
  });

  // Send notification to host
  await createNotification({
    userId: booking.host,
    title: 'New Rating & Review Received ⭐',
    message: `A driver rated ${booking.parkingSpace?.title || 'your parking spot'} ${numRating} stars: "${comment.slice(0, 80)}${comment.length > 80 ? '...' : ''}"`,
    type: 'REVIEW',
    link: '/reviews',
  });

  await review.populate([
    { path: 'user', select: 'name profileImage' },
    { path: 'parkingSpace', select: 'title address city' },
  ]);

  return { review, parkingRating: avgRating, totalReviews };
};

/**
 * Get reviews for a parking space
 */
export const getParkingReviews = async (parkingSpaceId, query = {}) => {
  const { limit = 10, page = 1 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ parkingSpace: parkingSpaceId })
      .populate('user', 'name profileImage')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ parkingSpace: parkingSpaceId }),
  ]);

  return {
    reviews,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get reviews for a host's spaces
 */
export const getHostReviews = async (hostId, query = {}) => {
  const { limit = 10, page = 1 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ host: hostId })
      .populate('user', 'name profileImage')
      .populate('parkingSpace', 'title city address')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ host: hostId }),
  ]);

  return {
    reviews,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get driver's review history and pending unreviewed completed bookings
 */
export const getMyReviewsData = async (userId) => {
  const [reviewsGiven, completedBookings] = await Promise.all([
    Review.find({ user: userId })
      .populate('parkingSpace', 'title address city photos')
      .populate('host', 'name')
      .sort('-createdAt'),
    Booking.find({ user: userId, status: 'COMPLETED' })
      .populate('parkingSpace', 'title address city photos pricePerHour')
      .populate('host', 'name')
      .sort('-endTime'),
  ]);

  const reviewedBookingIds = new Set(reviewsGiven.map((r) => r.booking.toString()));
  const unreviewedBookings = completedBookings.filter(
    (b) => !reviewedBookingIds.has(b._id.toString())
  );

  return {
    reviewsGiven,
    unreviewedBookings,
  };
};
