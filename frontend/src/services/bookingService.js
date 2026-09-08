import api from './api';

export const createBooking = async (data) => {
  const response = await api.post('/bookings', data);
  return response.data;
};

export const getMyBookings = async (params = {}) => {
  const response = await api.get('/bookings/my', { params });
  return response.data;
};

export const getHostBookings = async (params = {}) => {
  const response = await api.get('/bookings/host', { params });
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/cancel`);
  return response.data;
};

export const getParkingAvailability = async (parkingId, date) => {
  const response = await api.get(`/bookings/availability/${parkingId}`, {
    params: { date },
  });
  return response.data;
};

export const getBookingQuote = async (data) => {
  const response = await api.post('/bookings/quote', data);
  return response.data;
};

export const setLeavingHome = async (parkingId, data) => {
  const response = await api.post(`/parking/${parkingId}/leaving-home`, data);
  return response.data;
};

export const checkInBooking = async (data) => {
  const response = await api.post('/bookings/check-in', data);
  return response.data;
};

export const checkOutBooking = async (data) => {
  const response = await api.post('/bookings/check-out', data);
  return response.data;
};
