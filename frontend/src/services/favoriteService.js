import api from './api';

export const toggleFavorite = async (parkingId) => {
  const res = await api.post(`/favorites/${parkingId}/toggle`);
  return res.data;
};

export const getMyFavorites = async () => {
  const res = await api.get('/favorites');
  return res.data;
};

export const checkIsFavorite = async (parkingId) => {
  const res = await api.get(`/favorites/${parkingId}/check`);
  return res.data;
};
