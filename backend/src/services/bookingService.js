import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';
import Vehicle from '../models/Vehicle.js';
import { calculateBookingPrice } from './pricingService.js';
import { createNotification } from './notificationService.js';
import { calculateHostReliability } from './reliabilityService.js';

// Reservation hold TTL for unpaid pending bookings: 10 minutes
export const PENDING_HOLD_TTL_MS = 10 * 60 * 1000;

/**
 * Create a new booking with strict overlap prevention
 */
export const createBooking = async (userId, data) => {
  const { parkingSpaceId, vehicleId, startTime, endTime } = data;

  if (!parkingSpaceId || !vehicleId || !startTime || !endTime) {
    const error = new Error('Parking space, vehicle, start time, and end time are required');
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const error = new Error('Invalid date/time format');
    error.statusCode = 400;
    throw error;
  }

  if (end.getTime() <= start.getTime()) {
    const error = new Error('End time must be after start time');
    error.statusCode = 400;
    throw error;
  }

  // Prevent bookings in the past (allow 10-minute clock drift margin)
  if (start.getTime() < Date.now() - 10 * 60 * 1000) {
    const error = new Error('Cannot book a parking slot in the past');
    error.statusCode = 400;
    throw error;
  }

  // Find Parking Space
  const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
  if (!parkingSpace) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  if (parkingSpace.status !== 'active') {
    const error = new Error('This parking space is currently not active for bookings');
    error.statusCode = 400;
    throw error;
  }

  // Prevent host from booking their own spot
  if (parkingSpace.host.toString() === userId.toString()) {
    const error = new Error('You cannot book your own parking space');
    error.statusCode = 400;
    throw error;
  }

  // Find and validate vehicle ownership
  const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
  if (!vehicle) {
    const error = new Error('Selected vehicle not found or does not belong to you');
    error.statusCode = 404;
    throw error;
  }

  // Check vehicle type compatibility with spot
  if (
    parkingSpace.vehicleTypes &&
    parkingSpace.vehicleTypes.length > 0 &&
    !parkingSpace.vehicleTypes.includes(vehicle.vehicleType)
  ) {
    const error = new Error(
      `This spot does not support ${vehicle.vehicleType}. Supported types: ${parkingSpace.vehicleTypes.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // =========================================================================
  // CRITICAL: BACKEND DOUBLE BOOKING OVERLAP PREVENTION
  // A spot is ONLY blocked if an existing booking is CONFIRMED & PAID.
  // If a booking is PENDING (unpaid), it does NOT block the time slot!
  // =========================================================================
  const existingOverlap = await Booking.findOne({
    parkingSpace: parkingSpace._id,
    status: { $in: ['CONFIRMED', 'ACTIVE'] },
    paymentStatus: 'PAID',
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

  if (existingOverlap) {
    const overlapStart = new Date(existingOverlap.startTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const overlapEnd = new Date(existingOverlap.endTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const error = new Error(
      `Slot conflict: Spot is already booked between ${overlapStart} and ${overlapEnd}. Please choose a different time.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Calculate pricing breakdown
  const pricing = calculateBookingPrice({
    pricePerHour: parkingSpace.pricePerHour || 0,
    pricePerDay: parkingSpace.pricePerDay || 0,
    startTime: start,
    endTime: end,
  });

  // Generate unique QR code token
  const qrCode = `PARK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Clean up any stale/superseded PENDING bookings by this user for this spot
  await Booking.updateMany(
    {
      user: userId,
      parkingSpace: parkingSpace._id,
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
    { status: 'CANCELLED', cancellationReason: 'Replaced by new booking attempt' }
  );

  // Create booking
  const booking = await Booking.create({
    user: userId,
    host: parkingSpace.host,
    parkingSpace: parkingSpace._id,
    vehicle: vehicle._id,
    startTime: start,
    endTime: end,
    duration: pricing.billedHours,
    basePrice: pricing.basePrice,
    platformFee: pricing.platformFee,
    tax: pricing.tax,
    totalAmount: pricing.totalAmount,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    qrCode: '',
  });

  // Populate references for immediate frontend usage
  await booking.populate([
    { path: 'parkingSpace', select: 'title address city photos pricePerHour parkingType' },
    { path: 'vehicle', select: 'model vehicleNumber vehicleType color' },
    { path: 'host', select: 'name email phone profileImage' },
    { path: 'user', select: 'name email phone' },
  ]);

  return booking;
};

/**
 * Get driver's own bookings with optional pagination
 */
export const getMyBookings = async (userId, query = {}) => {
  const filter = { user: userId };
  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }

  const page = query.page ? parseInt(query.page, 10) : null;
  const limit = query.limit ? parseInt(query.limit, 10) : 20;

  if (page) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('parkingSpace', 'title address city photos parkingType pricePerHour')
        .populate('vehicle', 'model vehicleNumber vehicleType color')
        .populate('host', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const bookings = await Booking.find(filter)
    .populate('parkingSpace', 'title address city photos parkingType pricePerHour')
    .populate('vehicle', 'model vehicleNumber vehicleType color')
    .populate('host', 'name email phone')
    .sort('-createdAt');

  return bookings;
};

/**
 * Get host's incoming bookings for their listed spots with optional pagination
 */
export const getHostBookings = async (hostId, query = {}) => {
  const filter = { host: hostId };
  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }
  if (query.parkingSpaceId) {
    filter.parkingSpace = query.parkingSpaceId;
  }

  const page = query.page ? parseInt(query.page, 10) : null;
  const limit = query.limit ? parseInt(query.limit, 10) : 20;

  if (page) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('parkingSpace', 'title address city photos parkingType')
        .populate('vehicle', 'model vehicleNumber vehicleType color')
        .populate('user', 'name email phone')
        .sort('-startTime')
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const bookings = await Booking.find(filter)
    .populate('parkingSpace', 'title address city photos parkingType')
    .populate('vehicle', 'model vehicleNumber vehicleType color')
    .populate('user', 'name email phone')
    .sort('-startTime');

  return bookings;
};

/**
 * Get booking by ID (accessible by driver, host, or admin)
 */
export const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId)
    .populate('parkingSpace', 'title address city photos parkingType pricePerHour pricePerDay rules')
    .populate('vehicle', 'model vehicleNumber vehicleType color')
    .populate('host', 'name email phone reliabilityScore')
    .populate('user', 'name email phone');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwnerDriver = booking.user._id.toString() === userId.toString();
  const isOwnerHost = booking.host._id.toString() === userId.toString();
  const isAdmin = userRole === 'ADMIN';

  if (!isOwnerDriver && !isOwnerHost && !isAdmin) {
    const error = new Error('Not authorized to view this booking');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwnerDriver = booking.user.toString() === userId.toString();
  const isOwnerHost = booking.host.toString() === userId.toString();
  const isAdmin = userRole === 'ADMIN';

  if (!isOwnerDriver && !isOwnerHost && !isAdmin) {
    const error = new Error('Not authorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(booking.status)) {
    const error = new Error(`Cannot cancel a booking that is already ${booking.status}`);
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'CANCELLED';
  await booking.save();

  // Recalculate host reliability
  await calculateHostReliability(booking.host);

  // Send notifications
  await Promise.all([
    createNotification({
      userId: booking.user,
      title: 'Booking Cancelled',
      message: 'Your parking slot reservation has been cancelled.',
      type: 'CANCELLATION',
      link: '/bookings',
    }),
    createNotification({
      userId: booking.host,
      title: 'Reservation Cancelled',
      message: 'A driver has cancelled a reservation for your parking spot.',
      type: 'CANCELLATION',
      link: '/host/bookings',
    }),
  ]);

  return booking;
};

/**
 * Get booked slots and availability for a specific parking space on a date
 */
export const getParkingAvailability = async (parkingSpaceId, dateStr) => {
  const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
  if (!parkingSpace) {
    const error = new Error('Parking space not found');
    error.statusCode = 404;
    throw error;
  }

  let startOfDay, endOfDay, formattedDate;
  if (dateStr && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
    formattedDate = dateStr;
  } else {
    const now = dateStr ? new Date(dateStr) : new Date();
    startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    formattedDate = `${startOfDay.getFullYear()}-${String(startOfDay.getMonth() + 1).padStart(2, '0')}-${String(startOfDay.getDate()).padStart(2, '0')}`;
  }

  // Only CONFIRMED and ACTIVE bookings with paymentStatus === 'PAID' are considered booked!
  // An unpaid / pending booking does NOT show as booked!
  const bookings = await Booking.find({
    parkingSpace: parkingSpaceId,
    status: { $in: ['CONFIRMED', 'ACTIVE'] },
    paymentStatus: 'PAID',
    startTime: { $lt: endOfDay },
    endTime: { $gt: startOfDay },
  }).select('startTime endTime status paymentStatus');

  return {
    date: formattedDate,
    operatingSchedule: parkingSpace.availability,
    leavingHomeSchedule: parkingSpace.leavingHomeSchedule?.filter(
      (s) => s.isActive && s.date === formattedDate
    ),
    bookedSlots: bookings.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      paymentStatus: b.paymentStatus,
    })),
  };
};

/**
 * Helper to resolve booking from QR scan payload or manual input
 */
export const findBookingByScanData = async (scanData) => {
  const { bookingId, qrToken, code, qrData } = scanData || {};
  let targetId = bookingId;
  let targetToken = qrToken;

  if (qrData) {
    if (typeof qrData === 'string') {
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.bookingId) targetId = parsed.bookingId;
        if (parsed.token) targetToken = parsed.token;
      } catch {
        const trimmed = qrData.trim();
        if (trimmed.startsWith('QRPASS_')) {
          targetToken = trimmed;
        } else if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
          targetId = trimmed;
        }
      }
    } else if (typeof qrData === 'object') {
      if (qrData.bookingId) targetId = qrData.bookingId;
      if (qrData.token) targetToken = qrData.token;
    }
  }

  // Build query
  const orConditions = [];
  if (targetId && /^[0-9a-fA-F]{24}$/.test(targetId)) {
    orConditions.push({ _id: targetId });
  }
  if (targetToken) {
    orConditions.push({ qrToken: targetToken });
  }
  if (code && typeof code === 'string') {
    const cleanCode = code.replace(/^PARK-/, '').trim();
    if (cleanCode.length >= 4) {
      orConditions.push({ _id: { $regex: cleanCode + '$', $options: 'i' } });
    }
  }

  if (orConditions.length === 0) {
    const error = new Error('Invalid QR code or booking identifier provided');
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findOne({ $or: orConditions })
    .populate('parkingSpace', 'title address city host pricePerHour')
    .populate('vehicle', 'model vehicleNumber vehicleType color')
    .populate('user', 'name email phone')
    .populate('host', 'name email phone');

  if (!booking) {
    const error = new Error('No booking found matching the scanned QR pass or code');
    error.statusCode = 404;
    throw error;
  }

  return booking;
};

/**
 * Host Check-In validation & execution
 */
export const checkInBooking = async (hostId, scanData, userRole) => {
  const booking = await findBookingByScanData(scanData);

  // Validate Host authorization
  const isHost = booking.host._id.toString() === hostId.toString();
  const isAdmin = userRole === 'ADMIN';
  if (!isHost && !isAdmin) {
    const error = new Error('You are not authorized to check in bookings for this parking spot');
    error.statusCode = 403;
    throw error;
  }

  // Validate Payment successful
  if (booking.paymentStatus !== 'PAID') {
    const error = new Error('Cannot check in: Payment has not been completed for this booking');
    error.statusCode = 400;
    throw error;
  }

  // Validate not cancelled
  if (booking.status === 'CANCELLED') {
    const error = new Error('Cannot check in: Booking has been cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Validate not already checked in or completed
  if (booking.status === 'ACTIVE') {
    const error = new Error(
      `Booking is already checked in at ${new Date(booking.checkInTime).toLocaleTimeString('en-IN')}`
    );
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'COMPLETED') {
    const error = new Error('Booking has already completed check-out');
    error.statusCode = 400;
    throw error;
  }

  // Validate date / time window
  const now = Date.now();
  const startTime = new Date(booking.startTime).getTime();
  const endTime = new Date(booking.endTime).getTime();

  // Allow check in from 2 hours before start time
  if (now < startTime - 2 * 60 * 60 * 1000) {
    const error = new Error(
      `Check-in is too early. Booking slot starts at ${new Date(booking.startTime).toLocaleString('en-IN')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if booking slot has already passed
  if (now > endTime + 2 * 60 * 60 * 1000) {
    const error = new Error(
      `Booking slot expired on ${new Date(booking.endTime).toLocaleString('en-IN')}`
    );
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'ACTIVE';
  booking.checkInTime = new Date();
  await booking.save();

  // Notify driver
  await createNotification({
    userId: booking.user._id,
    title: 'Vehicle Checked In 🟢',
    message: `You have successfully checked in at ${booking.parkingSpace?.title || 'your spot'}. Have a great stay!`,
    type: 'CHECK_IN',
    link: `/bookings/${booking._id}`,
  });

  return booking;
};

/**
 * Host Check-Out validation & execution
 */
export const checkOutBooking = async (hostId, scanData, userRole) => {
  const booking = await findBookingByScanData(scanData);

  // Validate Host authorization
  const isHost = booking.host._id.toString() === hostId.toString();
  const isAdmin = userRole === 'ADMIN';
  if (!isHost && !isAdmin) {
    const error = new Error('You are not authorized to check out bookings for this parking spot');
    error.statusCode = 403;
    throw error;
  }

  // Validate booking is ACTIVE
  if (booking.status !== 'ACTIVE') {
    if (booking.status === 'COMPLETED') {
      const error = new Error(
        `Booking was already checked out at ${new Date(booking.checkOutTime).toLocaleTimeString('en-IN')}`
      );
      error.statusCode = 400;
      throw error;
    }
    if (booking.status === 'CANCELLED') {
      const error = new Error('Cannot check out a cancelled booking');
      error.statusCode = 400;
      throw error;
    }
    if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
      const error = new Error('Booking has not been checked in yet. Please perform check-in first.');
      error.statusCode = 400;
      throw error;
    }
    const error = new Error(`Cannot check out: Booking status is currently ${booking.status}`);
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'COMPLETED';
  booking.checkOutTime = new Date();
  await booking.save();

  // Recalculate host reliability
  await calculateHostReliability(booking.host._id);

  // Notify driver
  await createNotification({
    userId: booking.user._id,
    title: 'Vehicle Checked Out 🏁',
    message: `You have completed your parking at ${booking.parkingSpace?.title || 'the spot'}. Click here to leave a review!`,
    type: 'CHECK_OUT',
    link: '/reviews',
  });

  return booking;
};

