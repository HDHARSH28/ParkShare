import { VEHICLE_TYPES } from '../models/Vehicle.js';

/**
 * Validate vehicle creation request
 */
export const validateCreateVehicle = (data) => {
  const errors = [];

  if (!data.vehicleNumber || typeof data.vehicleNumber !== 'string' || !data.vehicleNumber.trim()) {
    errors.push('vehicleNumber is required');
  } else if (data.vehicleNumber.trim().length < 4 || data.vehicleNumber.trim().length > 20) {
    errors.push('vehicleNumber must be between 4 and 20 characters');
  }

  if (!data.vehicleType) {
    errors.push('vehicleType is required');
  } else if (!VEHICLE_TYPES.includes(data.vehicleType)) {
    errors.push(`vehicleType must be one of: ${VEHICLE_TYPES.join(', ')}`);
  }

  return errors;
};
