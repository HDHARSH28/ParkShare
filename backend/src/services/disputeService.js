import Dispute from '../models/Dispute.js';
import Booking from '../models/Booking.js';
import { createNotification } from './notificationService.js';
import { calculateHostReliability } from './reliabilityService.js';

/**
 * File a new dispute against a booking
 */
export const createDispute = async (userId, data) => {
  const { bookingId, reason, description, photos = [] } = data;

  if (!bookingId || !reason || !description) {
    const error = new Error('bookingId, reason, and description are required');
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findById(bookingId)
    .populate('parkingSpace', 'title host')
    .populate('user', 'name email')
    .populate('host', 'name email');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Caller must be driver or host of the booking
  const isDriver = booking.user._id.toString() === userId.toString();
  const isHost = booking.host._id.toString() === userId.toString();

  if (!isDriver && !isHost) {
    const error = new Error('You can only file disputes for your own bookings');
    error.statusCode = 403;
    throw error;
  }

  const dispute = await Dispute.create({
    booking: booking._id,
    user: booking.user._id,
    host: booking.host._id,
    parkingSpace: booking.parkingSpace._id,
    reason,
    description,
    photos,
    status: 'OPEN',
  });

  // Mark booking status as DISPUTED if it was not already COMPLETED or CANCELLED
  if (booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED') {
    booking.status = 'DISPUTED';
    await booking.save();
  }

  // Recalculate host reliability
  await calculateHostReliability(booking.host._id);

  // Send notifications
  await createNotification({
    userId,
    title: 'Dispute Ticket Filed',
    message: `Your dispute ticket regarding ${booking.parkingSpace?.title} (#${dispute._id.toString().slice(-6).toUpperCase()}) has been received and is under review.`,
    type: 'DISPUTE',
    link: '/disputes',
  });

  const counterpartyId = isDriver ? booking.host._id : booking.user._id;
  await createNotification({
    userId: counterpartyId,
    title: 'Dispute Raised on Reservation',
    message: `A dispute has been reported regarding booking #${booking._id.toString().slice(-6).toUpperCase()} (${reason}). Our admin team is reviewing this ticket.`,
    type: 'DISPUTE',
    link: '/disputes',
  });

  await dispute.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'host', select: 'name email phone' },
    { path: 'parkingSpace', select: 'title address city' },
  ]);

  return dispute;
};

/**
 * Get current user's disputes (as driver or host)
 */
export const getMyDisputes = async (userId) => {
  const disputes = await Dispute.find({
    $or: [{ user: userId }, { host: userId }],
  })
    .populate('parkingSpace', 'title address city photos')
    .populate('booking', 'startTime endTime totalAmount status')
    .populate('user', 'name email phone')
    .populate('host', 'name email phone')
    .sort('-createdAt');

  return disputes;
};

/**
 * Admin: Get all disputes across the platform
 */
export const getAllDisputes = async (query = {}) => {
  const { status, limit = 20, page = 1 } = query;
  const filter = {};

  if (status && status !== 'ALL') {
    filter.status = status.toUpperCase();
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [disputes, total, openCount] = await Promise.all([
    Dispute.find(filter)
      .populate('parkingSpace', 'title address city')
      .populate('booking', 'startTime endTime totalAmount status paymentStatus')
      .populate('user', 'name email phone')
      .populate('host', 'name email phone')
      .populate('resolvedBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Dispute.countDocuments(filter),
    Dispute.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
  ]);

  return {
    disputes,
    total,
    openCount,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Admin: Resolve, update, or assign refund for a dispute
 */
export const resolveDispute = async (adminId, disputeId, data) => {
  const { status, resolution = '', refundAmount = 0 } = data;

  const dispute = await Dispute.findById(disputeId)
    .populate('parkingSpace', 'title host')
    .populate('booking');

  if (!dispute) {
    const error = new Error('Dispute not found');
    error.statusCode = 404;
    throw error;
  }

  if (status) dispute.status = status;
  if (resolution) dispute.resolution = resolution;
  if (refundAmount !== undefined) dispute.refundAmount = Number(refundAmount);

  if (['RESOLVED', 'REJECTED'].includes(status)) {
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = adminId;
  }

  await dispute.save();

  // If refund is issued and booking exists, mark booking payment as REFUNDED if fully refunded
  if (dispute.refundAmount > 0 && dispute.booking) {
    const b = await Booking.findById(dispute.booking._id);
    if (b && dispute.refundAmount >= b.totalAmount) {
      b.paymentStatus = 'REFUNDED';
      await b.save();
    }
  }

  // Recalculate host reliability
  await calculateHostReliability(dispute.host);

  // Notify driver and host
  await createNotification({
    userId: dispute.user,
    title: `Dispute Status: ${dispute.status}`,
    message: `Admin resolution for dispute #${dispute._id.toString().slice(-6).toUpperCase()}: ${resolution || 'Status updated.'}${refundAmount > 0 ? ` (Refund: ₹${refundAmount})` : ''}`,
    type: 'DISPUTE',
    link: '/disputes',
  });

  await createNotification({
    userId: dispute.host,
    title: `Dispute Resolved: ${dispute.status}`,
    message: `Dispute regarding ${dispute.parkingSpace?.title} has been updated to ${dispute.status}. Resolution: ${resolution || 'Resolved by admin.'}`,
    type: 'DISPUTE',
    link: '/disputes',
  });

  await dispute.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'host', select: 'name email phone' },
    { path: 'parkingSpace', select: 'title address city' },
    { path: 'resolvedBy', select: 'name email' },
  ]);

  return dispute;
};
