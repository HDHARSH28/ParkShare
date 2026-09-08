import api from './api';

export const createDispute = async (data) => {
  const res = await api.post('/disputes', data);
  return res.data;
};

export const getMyDisputes = async () => {
  const res = await api.get('/disputes/my');
  return res.data;
};

export const getAllDisputes = async (params = {}) => {
  const res = await api.get('/disputes', { params });
  return res.data;
};

export const resolveDispute = async (id, data) => {
  const res = await api.put(`/disputes/${id}/resolve`, data);
  return res.data;
};
