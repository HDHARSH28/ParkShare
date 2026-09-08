import { PARKING_TYPES, VEHICLE_TYPES } from '../models/ParkingSpace.js';

/**
 * Validate parking space creation input
 */
export const validateCreateParking = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.push('Address is required');
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push('City is required');
  }

  if (data.latitude == null || data.latitude < -90 || data.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude == null || data.longitude < -180 || data.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (!data.parkingType || !PARKING_TYPES.includes(data.parkingType)) {
    errors.push(`Parking type must be one of: ${PARKING_TYPES.join(', ')}`);
  }

  if (data.vehicleTypes && Array.isArray(data.vehicleTypes)) {
    for (const vt of data.vehicleTypes) {
      if (!VEHICLE_TYPES.includes(vt)) {
        errors.push(`Invalid vehicle type: ${vt}`);
      }
    }
  }

  // At least one price must be set
  const hasPrice =
    (data.pricePerHour && data.pricePerHour > 0) ||
    (data.pricePerDay && data.pricePerDay > 0) ||
    (data.pricePerMonth && data.pricePerMonth > 0);

  if (!hasPrice) {
    errors.push('At least one pricing option must be set (hourly, daily, or monthly)');
  }

  return errors;
};

/**
 * Validate parking space update input
 */
export const validateUpdateParking = (data) => {
  const errors = [];

  if (data.title !== undefined && data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (data.parkingType !== undefined && !PARKING_TYPES.includes(data.parkingType)) {
    errors.push(`Parking type must be one of: ${PARKING_TYPES.join(', ')}`);
  }

  if (data.vehicleTypes && Array.isArray(data.vehicleTypes)) {
    for (const vt of data.vehicleTypes) {
      if (!VEHICLE_TYPES.includes(vt)) {
        errors.push(`Invalid vehicle type: ${vt}`);
      }
    }
  }

  if (data.status !== undefined && !['draft', 'active', 'inactive'].includes(data.status)) {
    errors.push('Status must be draft, active, or inactive');
  }

  return errors;
};
