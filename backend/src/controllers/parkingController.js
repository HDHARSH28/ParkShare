import {
  createParkingSpace,
  getAllParkingSpaces,
  getParkingSpaceById,
  updateParkingSpace,
  deleteParkingSpace,
  getMyListings,
  setLeavingHomeSchedule,
  getNearbyParkingSpaces,
} from '../services/parkingService.js';
import { validateCreateParking, validateUpdateParking } from '../validators/parkingValidator.js';

/**
 * @desc    Create a new parking space
 * @route   POST /api/parking
 * @access  Private (HOST only)
 */
export const createParking = async (req, res, next) => {
  try {
    const errors = validateCreateParking(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const parking = await createParkingSpace(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Parking space created successfully',
      data: { parking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all parking spaces (with search/filter/sort/pagination)
 * @route   GET /api/parking
 * @access  Public
 */
export const getAllParking = async (req, res, next) => {
  try {
    const result = await getAllParkingSpaces(req.query);

    res.status(200).json({
      success: true,
      message: 'Parking spaces retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get parking space by ID
 * @route   GET /api/parking/:id
 * @access  Public
 */
export const getParkingById = async (req, res, next) => {
  try {
    const parking = await getParkingSpaceById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Parking space retrieved',
      data: { parking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a parking space
 * @route   PUT /api/parking/:id
 * @access  Private (HOST, owner only)
 */
export const updateParking = async (req, res, next) => {
  try {
    const errors = validateUpdateParking(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const parking = await updateParkingSpace(req.params.id, req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Parking space updated successfully',
      data: { parking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a parking space
 * @route   DELETE /api/parking/:id
 * @access  Private (HOST, owner only)
 */
export const deleteParking = async (req, res, next) => {
  try {
    await deleteParkingSpace(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Parking space deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my parking listings
 * @route   GET /api/parking/my-listings
 * @access  Private (HOST only)
 */
export const myListings = async (req, res, next) => {
  try {
    const parkingSpaces = await getMyListings(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Your listings retrieved',
      data: { parkingSpaces },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate "I'm Leaving Home" mode
 * @route   POST /api/parking/:id/leaving-home
 * @access  Private (HOST, owner only)
 */
export const leavingHome = async (req, res, next) => {
  try {
    const parking = await setLeavingHomeSchedule(req.params.id, req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: '"I\'m Leaving Home" schedule activated successfully',
      data: { parking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby parking spaces using geospatial index
 * @route   GET /api/parking/nearby
 * @access  Public
 */
export const getNearbyParking = async (req, res, next) => {
  try {
    const spaces = await getNearbyParkingSpaces(req.query);

    res.status(200).json({
      success: true,
      message: 'Nearby parking spaces retrieved',
      data: { parkingSpaces: spaces },
    });
  } catch (error) {
    next(error);
  }
};

