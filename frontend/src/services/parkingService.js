import api from './api';

export const createParking = async (data) => {
  const response = await api.post('/parking', data);
  return response.data;
};

export const getAllParking = async (params = {}) => {
  const response = await api.get('/parking', { params });
  return response.data;
};

export const getParkingById = async (id) => {
  const response = await api.get(`/parking/${id}`);
  return response.data;
};

export const updateParking = async (id, data) => {
  const response = await api.put(`/parking/${id}`, data);
  return response.data;
};

export const deleteParking = async (id) => {
  const response = await api.delete(`/parking/${id}`);
  return response.data;
};

export const getMyListings = async () => {
  const response = await api.get('/parking/my-listings');
  return response.data;
};
