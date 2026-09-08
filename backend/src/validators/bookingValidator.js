/**
 * Validate booking creation request
 */
export const validateCreateBooking = (data) => {
  const errors = [];

  if (!data.parkingSpaceId) {
    errors.push('parkingSpaceId is required');
  }

  if (!data.vehicleId) {
    errors.push('vehicleId is required');
  }

  if (!data.startTime) {
    errors.push('startTime is required');
  } else if (isNaN(new Date(data.startTime).getTime())) {
    errors.push('startTime must be a valid ISO date/time string');
  }

  if (!data.endTime) {
    errors.push('endTime is required');
  } else if (isNaN(new Date(data.endTime).getTime())) {
    errors.push('endTime must be a valid ISO date/time string');
  }

  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    if (end <= start) {
      errors.push('endTime must be strictly after startTime');
    }
  }

  return errors;
};
