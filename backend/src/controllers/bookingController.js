import {
  createBooking,
  getMyBookings,
  getHostBookings,
  getBookingById,
  cancelBooking,
  getParkingAvailability,
  checkInBooking,
  checkOutBooking,
} from '../services/bookingService.js';
import { calculateBookingPrice } from '../services/pricingService.js';
import ParkingSpace from '../models/ParkingSpace.js';
import { validateCreateBooking } from '../validators/bookingValidator.js';

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
export const makeBooking = async (req, res, next) => {
  try {
    const errors = validateCreateBooking(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + errors.join(', '),
        errors,
      });
    }

    const booking = await createBooking(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Parking spot booked successfully!',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get driver's own bookings
 * @route   GET /api/bookings/my
 * @access  Private
 */
export const myBookings = async (req, res, next) => {
  try {
    const result = await getMyBookings(req.user.id, req.query);

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: Array.isArray(result) ? { bookings: result } : result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get host's incoming bookings
 * @route   GET /api/bookings/host
 * @access  Private (HOST only)
 */
export const hostBookings = async (req, res, next) => {
  try {
    const result = await getHostBookings(req.user.id, req.query);

    res.status(200).json({
      success: true,
      message: 'Host bookings retrieved successfully',
      data: Array.isArray(result) ? { bookings: result } : result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking details by ID
 * @route   GET /api/bookings/:id
 * @access  Private (Driver or Host)
 */
export const getBooking = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Driver or Host)
 */
export const cancel = async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get parking availability & booked intervals for a date
 * @route   GET /api/bookings/availability/:parkingId
 * @access  Public
 */
export const availability = async (req, res, next) => {
  try {
    const data = await getParkingAvailability(req.params.parkingId, req.query.date);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate instant price quote before booking
 * @route   POST /api/bookings/quote
 * @access  Public
 */
export const calculateQuote = async (req, res, next) => {
  try {
    const { parkingSpaceId, startTime, endTime } = req.body;

    if (!parkingSpaceId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'parkingSpaceId, startTime, and endTime are required',
      });
    }

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Parking space not found',
      });
    }

    const quote = calculateBookingPrice({
      pricePerHour: parkingSpace.pricePerHour || 0,
      pricePerDay: parkingSpace.pricePerDay || 0,
      startTime,
      endTime,
    });

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check-in driver upon scanning QR pass
 * @route   POST /api/bookings/check-in
 * @access  Private (Host or Admin)
 */
export const checkIn = async (req, res, next) => {
  try {
    const booking = await checkInBooking(req.user._id || req.user.id, req.body, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Check-in successful! Booking is now ACTIVE.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check-out driver upon scanning QR pass
 * @route   POST /api/bookings/check-out
 * @access  Private (Host or Admin)
 */
export const checkOut = async (req, res, next) => {
  try {
    const booking = await checkOutBooking(req.user._id || req.user.id, req.body, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Check-out successful! Booking is now COMPLETED.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

