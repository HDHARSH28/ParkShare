import api from './api';

export const getDashboardStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getUsersList = async (params = {}) => {
  const res = await api.get('/admin/users', { params });
  return res.data;
};

export const getUserDetails = async (id) => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
};

export const toggleUserBlock = async (id, data) => {
  const res = await api.put(`/admin/users/${id}/block`, data);
  return res.data;
};

export const getHostsList = async (params = {}) => {
  const res = await api.get('/admin/hosts', { params });
  return res.data;
};

export const getAdminListings = async (params = {}) => {
  const res = await api.get('/admin/parking', { params });
  return res.data;
};

export const updateListingStatus = async (id, data) => {
  const res = await api.put(`/admin/parking/${id}/status`, data);
  return res.data;
};

export const deleteListing = async (id) => {
  const res = await api.delete(`/admin/parking/${id}`);
  return res.data;
};

export const getAdminBookings = async (params = {}) => {
  const res = await api.get('/admin/bookings', { params });
  return res.data;
};

export const getAdminPayments = async (params = {}) => {
  const res = await api.get('/admin/payments', { params });
  return res.data;
};

export const getAdminReviews = async (params = {}) => {
  const res = await api.get('/admin/reviews', { params });
  return res.data;
};

export const deleteReview = async (id) => {
  const res = await api.delete(`/admin/reviews/${id}`);
  return res.data;
};

export const getAnalyticsData = async () => {
  const res = await api.get('/admin/analytics');
  return res.data;
};
