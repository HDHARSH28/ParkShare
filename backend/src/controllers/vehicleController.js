import {
  createVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from '../services/vehicleService.js';
import { validateCreateVehicle } from '../validators/vehicleValidator.js';

/**
 * @desc    Add a vehicle
 * @route   POST /api/vehicles
 * @access  Private
 */
export const addVehicle = async (req, res, next) => {
  try {
    const errors = validateCreateVehicle(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + errors.join(', '),
        errors,
      });
    }

    const { vehicleNumber, vehicleType, model, color, image } = req.body;

    const vehicle = await createVehicle(req.user.id, {
      vehicleNumber,
      vehicleType,
      model,
      color,
      image,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's vehicles
 * @route   GET /api/vehicles
 * @access  Private
 */
export const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await getMyVehicles(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: { vehicles },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
export const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await getVehicleById(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private
 */
export const editVehicle = async (req, res, next) => {
  try {
    const vehicle = await updateVehicle(req.params.id, req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private
 */
export const removeVehicle = async (req, res, next) => {
  try {
    await deleteVehicle(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
