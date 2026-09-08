import crypto from 'crypto';
import QRCode from 'qrcode';
import Booking from '../models/Booking.js';
import { createNotification } from './notificationService.js';

/**
 * Process direct in-app payment and issue secure QR pass
 * Supports: UPI, CARD, NETBANKING, CASH_AT_SPOT, DIRECT
 */
export const processDirectPayment = async (
  userId,
  { bookingId, paymentMethod = 'UPI', transactionId }
) => {
  if (!bookingId) {
    const error = new Error('bookingId is required');
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate('parkingSpace', 'title address city host')
    .populate('vehicle', 'vehicleNumber model vehicleType color')
    .populate('host', 'name email phone');

  if (!booking) {
    const error = new Error('Booking not found or does not belong to you');
    error.statusCode = 404;
    throw error;
  }

  if (booking.paymentStatus === 'PAID') {
    const error = new Error('This booking has already been paid');
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'CANCELLED') {
    const error = new Error('Cannot process payment for a cancelled booking');
    error.statusCode = 400;
    throw error;
  }

  // Ensure no other booking was already CONFIRMED & PAID for this overlapping slot
  const conflictingBooking = await Booking.findOne({
    _id: { $ne: booking._id },
    parkingSpace: booking.parkingSpace._id || booking.parkingSpace,
    status: { $in: ['CONFIRMED', 'ACTIVE'] },
    paymentStatus: 'PAID',
    startTime: { $lt: booking.endTime },
    endTime: { $gt: booking.startTime },
  });

  if (conflictingBooking) {
    const error = new Error('This time slot has already been booked and paid for by another driver.');
    error.statusCode = 400;
    throw error;
  }

  // Generate unique transaction reference
  const txnRef =
    transactionId ||
    `PAY_${paymentMethod.toUpperCase()}_${Date.now().toString(36).toUpperCase()}_${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

  // Generate cryptographically secure QR token (no passwords, no sensitive data)
  const qrToken = `QRPASS_${crypto.randomBytes(16).toString('hex').toUpperCase()}`;

  // Safe QR payload containing non-sensitive booking identifiers
  const qrPayload = JSON.stringify({
    bookingId: booking._id.toString(),
    token: qrToken,
    code: `PARK-${booking._id.toString().slice(-6).toUpperCase()}`,
    issuedAt: new Date().toISOString(),
  });

  // Generate QR code data URL (PNG)
  const qrCodeImage = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
  });

  // Update booking state
  booking.paymentStatus = 'PAID';
  booking.status = 'CONFIRMED';
  booking.paymentMethod = paymentMethod;
  booking.transactionId = txnRef;
  booking.razorpayPaymentId = txnRef; // preserved for backwards compatibility with any existing queries
  booking.razorpayOrderId = `ORD_${booking._id.toString().slice(-8).toUpperCase()}`;
  booking.qrToken = qrToken;
  booking.qrCode = qrCodeImage;

  await booking.save();

  // Dispatch payment success & booking confirmation notifications
  await Promise.all([
    createNotification({
      userId: booking.user,
      title: 'Payment Confirmed & QR Pass Issued 🎉',
      message: `Your payment of ₹${booking.totalAmount} for ${
        booking.parkingSpace?.title || 'parking'
      } is confirmed. Your QR pass is ready!`,
      type: 'PAYMENT_SUCCESS',
      link: `/booking/${booking._id}/qr`,
    }),
    createNotification({
      userId: booking.host?._id || booking.host,
      title: 'New Confirmed Reservation! 🚗',
      message: `A driver has reserved and paid for ${
        booking.parkingSpace?.title || 'your parking spot'
      }.`,
      type: 'BOOKING_CONFIRMATION',
      link: '/host/bookings',
    }),
  ]);

  return booking;
};

/**
 * Handle payment failure or user cancellation:
 * Sets paymentStatus to 'FAILED' and status to 'CANCELLED', immediately releasing the held slot.
 */
export const handlePaymentFailure = async (
  userId,
  { bookingId, reason = 'Payment failed or cancelled by user' }
) => {
  if (!bookingId) {
    const error = new Error('bookingId is required');
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate(
    'parkingSpace',
    'title'
  );

  if (!booking) {
    const error = new Error('Booking not found or does not belong to you');
    error.statusCode = 404;
    throw error;
  }

  if (booking.paymentStatus === 'PAID') {
    const error = new Error('Cannot cancel an already paid booking via payment failure');
    error.statusCode = 400;
    throw error;
  }

  booking.paymentStatus = 'FAILED';
  booking.status = 'CANCELLED';
  await booking.save();

  // Create notification for driver
  await createNotification({
    userId,
    title: 'Booking Cancelled & Slot Released',
    message: `Your payment was not completed (${reason}). The reserved time slot has been freed.`,
    type: 'BOOKING_CANCELLED',
    link: '/parking',
  });

  return booking;
};

/**
 * Backward compatibility alias for createPaymentOrder
 */
export const createPaymentOrder = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate(
    'parkingSpace',
    'title address city pricePerHour'
  );

  if (!booking) {
    const error = new Error('Booking not found or does not belong to you');
    error.statusCode = 404;
    throw error;
  }

  const orderId = `order_${booking._id.toString().slice(-8)}_${Date.now().toString(36)}`;
  booking.razorpayOrderId = orderId;
  await booking.save();

  return {
    orderId,
    amount: Math.round(booking.totalAmount * 100),
    currency: 'INR',
    booking: {
      _id: booking._id,
      totalAmount: booking.totalAmount,
      parkingSpace: booking.parkingSpace,
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
    },
  };
};

/**
 * Backward compatibility alias for verifyPayment
 */
export const verifyPayment = async (
  userId,
  { bookingId, paymentMethod = 'UPI', transactionId, razorpayPaymentId }
) => {
  return processDirectPayment(userId, {
    bookingId,
    paymentMethod,
    transactionId: transactionId || razorpayPaymentId,
  });
};
