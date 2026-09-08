const DISPUTE_REASONS = [
  'Parking occupied',
  'Wrong location',
  'Parking inaccessible',
  'Host issue',
  'Vehicle damage',
  'Payment issue',
  'Other',
];

/**
 * Validate dispute submission request
 */
export const validateCreateDispute = (data) => {
  const errors = [];

  if (!data.bookingId) {
    errors.push('bookingId is required');
  }

  if (!data.reason) {
    errors.push('reason is required');
  } else if (!DISPUTE_REASONS.includes(data.reason)) {
    errors.push(`reason must be one of: ${DISPUTE_REASONS.join(', ')}`);
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
    errors.push('description is required and must be at least 10 characters');
  }

  return errors;
};
