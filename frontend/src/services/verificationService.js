import api from './api';

export const submitVerification = async (data) => {
  const res = await api.post('/verifications', data);
  return res.data;
};

export const getMyVerification = async () => {
  const res = await api.get('/verifications/me');
  return res.data;
};

export const getAllVerifications = async (params = {}) => {
  const res = await api.get('/verifications', { params });
  return res.data;
};

export const reviewVerification = async (id, data) => {
  const res = await api.put(`/verifications/${id}/review`, data);
  return res.data;
};
