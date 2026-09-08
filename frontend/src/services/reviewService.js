import api from './api';

export const createReview = async (data) => {
  const res = await api.post('/reviews', data);
  return res.data;
};

export const getParkingReviews = async (parkingId, params = {}) => {
  const res = await api.get(`/reviews/parking/${parkingId}`, { params });
  return res.data;
};

export const getHostReviews = async (hostId, params = {}) => {
  const res = await api.get(`/reviews/host/${hostId}`, { params });
  return res.data;
};

export const getMyReviews = async () => {
  const res = await api.get('/reviews/my');
  return res.data;
};
