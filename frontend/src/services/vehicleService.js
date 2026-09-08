import api from './api';

export const addVehicle = async (data) => {
  const response = await api.post('/vehicles', data);
  return response.data;
};

export const getVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const getVehicleById = async (id) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

export const updateVehicle = async (id, data) => {
  const response = await api.put(`/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};
