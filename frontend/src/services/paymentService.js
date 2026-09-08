import api from './api';

/**
 * Process direct in-app payment (UPI / Card / NetBanking / Spot)
 */
export const processDirectPayment = async (paymentData) => {
  const response = await api.post('/payments/process', paymentData);
  return response.data;
};

/**
 * Compatible payment aliases
 */
export const createPaymentOrder = async (bookingId) => {
  const response = await api.post('/payments/create-order', { bookingId });
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await api.post('/payments/verify', paymentData);
  return response.data;
};

/**
 * Report payment failure / cancellation to release the spot hold
 */
export const reportPaymentFailure = async ({ bookingId, reason }) => {
  const response = await api.post('/payments/fail', { bookingId, reason });
  return response.data;
};
